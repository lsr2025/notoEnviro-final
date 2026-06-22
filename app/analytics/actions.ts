'use server';

import { generateText } from 'ai';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase-server';
import { requireProfile } from '@/lib/auth';
import { getAnalytics } from '@/lib/analytics';
import { IS_MANAGEMENT } from '@/lib/roles';
import { resolveModel, modelLabel } from '@/lib/ai';

// Direct to Anthropic when ANTHROPIC_API_KEY is set, else via Vercel AI Gateway.
const MODEL = resolveModel(process.env.AI_BRIEFING_MODEL);
const MODEL_LABEL = modelLabel(process.env.AI_BRIEFING_MODEL);

export async function generateBriefing(): Promise<{ ok: boolean; error?: string }> {
  const profile = await requireProfile();
  if (!IS_MANAGEMENT.includes(profile.role)) return { ok: false, error: 'Not authorised.' };

  const supabase = await createClient();
  const a = await getAnalytics();
  const { data: rows } = await supabase
    .from('field_reports')
    .select('challenges_risks, support_required, attendance_concerns, brief_update')
    .order('report_date', { ascending: false })
    .limit(150);
  const sample = (k: string) =>
    (rows ?? []).map((r: any) => r[k]).filter((v: any) => v && String(v).trim().length > 4).slice(0, 30);

  const context = {
    kpis: a.kpis,
    streams: a.byStream,
    sites: a.bySite.map((s) => ({ site: s.name, reports: s.reports, attendancePct: s.attendance == null ? null : Math.round(s.attendance * 100), incidents: s.incidents, lastReport: s.lastReport })),
    sitesNotReporting: a.silentSites.map((s) => s.name),
    topChallengeTerms: a.challenges.map((c) => c.label),
    topSupportTerms: a.support.map((c) => c.label),
    challengeSamples: sample('challenges_risks'),
    supportSamples: sample('support_required'),
    attendanceSamples: sample('attendance_concerns'),
  };

  const prompt =
    `You are an M&E analyst for the Msinsi / NotoEnviro environmental programme (Workstream B: eco-workers across 12 KwaZulu-Natal dam sites, streams Environmental / Eco-Tourism / AIP). ` +
    `Write a sharp executive briefing for leadership based ONLY on the data below. ` +
    `Use markdown with exactly these bold section headers and nothing before them: ` +
    `**Summary** (2–3 sentences), **Recurring challenges**, **Support needs**, **Attendance & absenteeism**, **Sites needing attention**, **Recommended actions** (2–4 bullets). ` +
    `Reference specific sites and numbers. Be concise and concrete; no preamble, no fluff.\n\nDATA:\n` +
    JSON.stringify(context);

  try {
    const { text } = await generateText({ model: MODEL, prompt, maxOutputTokens: 1000, temperature: 0.3 });
    const { error } = await supabase.from('programme_insights').insert({
      scope: 'programme', briefing: text, model: MODEL_LABEL, reports_count: a.kpis.reports, generated_by: profile.id,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath('/analytics');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'AI generation failed.' };
  }
}
