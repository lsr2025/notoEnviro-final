'use server';

import { generateText, type ModelMessage } from 'ai';
import { createClient } from '@/lib/supabase-server';
import { requireProfile } from '@/lib/auth';
import { getAnalytics } from '@/lib/analytics';
import { resolveModel } from '@/lib/ai';

// Direct to Anthropic when ANTHROPIC_API_KEY is set, else via Vercel AI Gateway.
const MODEL = resolveModel(process.env.AI_ASSISTANT_MODEL || process.env.AI_BRIEFING_MODEL);

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

// Canned prompts behind the quick-report buttons.
const QUICK: Record<string, string> = {
  participant_summary: 'Give me a participant summary: enrolment/attendance levels, how present numbers trend, and which sites have the strongest and weakest participation.',
  activity_report: 'Give me an activity report across the Environmental, Eco-Tourism and AIP streams — what is being done, volumes per stream, and notable outputs from the field updates.',
  attendance_overview: 'Give me an attendance overview: overall attendance rate, absenteeism patterns, and any sites or supervisors with attendance concerns.',
  feedback_insights: 'Summarise the field feedback: the most common challenges/risks and the most-requested support, with concrete examples.',
  full_mini_report: 'Produce a full mini executive report covering participation, activities by stream, attendance, incidents, recurring challenges, support needs, and 3 recommended actions.',
};

const LANGUAGES: Record<string, string> = {
  en: 'English',
  zu: 'isiZulu',
  xh: 'isiXhosa',
  af: 'Afrikaans',
  st: 'Sesotho',
  tn: 'Setswana',
};

export async function askAssistant(input: {
  messages: ChatMessage[];
  language: string;
  quickType?: string;
}): Promise<{ ok: boolean; text?: string; error?: string }> {
  const profile = await requireProfile();

  const a = await getAnalytics();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from('field_reports')
    .select('challenges_risks, support_required, attendance_concerns, brief_update, work_completed')
    .order('report_date', { ascending: false })
    .limit(120);
  const sample = (k: string) =>
    (rows ?? []).map((r: any) => r[k]).filter((v: any) => v && String(v).trim().length > 4).slice(0, 20);

  const context = {
    kpis: a.kpis,
    streams: a.byStream,
    sites: a.bySite.map((s) => ({ site: s.name, reports: s.reports, avgPresent: s.avgPresent, attendancePct: s.attendance == null ? null : Math.round(s.attendance * 100), incidents: s.incidents, lastReport: s.lastReport })),
    topSupervisors: a.bySupervisor.slice(0, 8).map((s) => ({ name: s.name, reports: s.reports, attendancePct: s.attendance == null ? null : Math.round(s.attendance * 100) })),
    sitesNotReporting: a.silentSites.map((s) => s.name),
    topChallengeTerms: a.challenges.map((c) => c.label),
    topSupportTerms: a.support.map((c) => c.label),
    challengeSamples: sample('challenges_risks'),
    supportSamples: sample('support_required'),
    attendanceSamples: sample('attendance_concerns'),
    workSamples: sample('work_completed'),
  };

  const lang = LANGUAGES[input.language] || 'English';
  const system =
    `You are the NotoEnviro AI Assistant for the Msinsi / Yami Mine Solutions environmental programme ` +
    `(Workstream B: eco-workers across KwaZulu-Natal dam sites; streams Environmental, Eco-Tourism, AIP; ` +
    `IDC Social Employment Fund). Answer questions for programme staff and leadership using ONLY the ` +
    `programme data provided below. Be concise, concrete, and reference specific sites and numbers. ` +
    `If the data does not contain the answer, say so plainly rather than inventing figures. ` +
    `Use markdown (short headers and bullets). IMPORTANT: write your entire response in ${lang}.\n\n` +
    `PROGRAMME DATA (JSON):\n` +
    JSON.stringify(context);

  const history: ModelMessage[] = input.messages.map((m) => ({ role: m.role, content: m.content }));
  if (input.quickType && QUICK[input.quickType]) {
    history.push({ role: 'user', content: QUICK[input.quickType] });
  }
  if (history.length === 0) {
    return { ok: false, error: 'No question provided.' };
  }

  try {
    const { text } = await generateText({ model: MODEL, system, messages: history, maxOutputTokens: 1100, temperature: 0.3 });
    return { ok: true, text };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'AI request failed.' };
  }
}
