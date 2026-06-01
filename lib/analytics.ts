// Server-side analytics aggregation over field_reports. All queries run under the
// caller's session, so RLS scopes the data to what their role may see.
import { createClient } from './supabase-server';
import { STREAM_LABELS, type ProgrammeStream } from './roles';

export interface ReportRow {
  site_id: string;
  stream: ProgrammeStream;
  supervisor_id: string;
  report_date: string;
  participants_scheduled: number | null;
  participants_present: number | null;
  absentees_count: number | null;
  incident: boolean | null;
  challenges_risks: string | null;
  support_required: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
}

export interface Kpis {
  reports: number;
  avgPresent: number;            // avg participants present PER report (not a cumulative sum)
  attendanceRate: number | null; // present / scheduled (0..1)
  incidents: number;
  sitesReporting: number;
  sitesTotal: number;
  avgAbsent: number;             // avg absentees per report
}
export interface TrendPoint { month: string; label: string; reports: number; attendance: number | null; participants: number }
export interface Slice { key: string; label: string; value: number }
export interface SiteRollup {
  id: string; name: string; reports: number; avgPresent: number;
  attendance: number | null; incidents: number; lastReport: string | null;
}
export interface SupervisorRollup { id: string; name: string; reports: number; attendance: number | null; incidents: number }
export interface GpsPoint { lat: number; lng: number; site: string; date: string }

export interface Analytics {
  kpis: Kpis;
  trend: TrendPoint[];
  byStream: Slice[];
  bySite: SiteRollup[];
  bySupervisor: SupervisorRollup[];
  challenges: Slice[];
  support: Slice[];
  silentSites: { id: string; name: string; lastReport: string | null }[];
  gps: GpsPoint[];
  latestDate: string | null;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const STOP = new Set('the a an and or of to in for on at is are was were be been with no none not n/a na nil nothing none. none, we our us they their them this that these those it its as by from will would there here have has had do does did can could should may might more most some any all each per day daytoday today report reports site dam team teams work working worked participants participant none.'.split(/\s+/));

function topPhrases(texts: (string | null)[], limit = 6): Slice[] {
  const counts = new Map<string, number>();
  for (const t of texts) {
    if (!t) continue;
    const clean = t.toLowerCase().replace(/[^a-z\s]/g, ' ');
    const words = clean.split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w));
    const seen = new Set<string>();
    // count bigrams + salient unigrams, once per report
    for (let i = 0; i < words.length; i++) {
      const uni = words[i];
      if (!seen.has(uni)) { counts.set(uni, (counts.get(uni) || 0) + 1); seen.add(uni); }
      if (i < words.length - 1) {
        const bi = `${words[i]} ${words[i + 1]}`;
        if (!STOP.has(words[i + 1]) && !seen.has(bi)) { counts.set(bi, (counts.get(bi) || 0) + 2); seen.add(bi); }
      }
    }
  }
  return [...counts.entries()]
    .filter(([k]) => k.includes(' ') || true)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, value]) => ({ key, label: key.replace(/\b\w/g, (c) => c.toUpperCase()), value }));
}

const rate = (present: number, scheduled: number) => (scheduled > 0 ? present / scheduled : null);

export async function getAnalytics(opts?: { siteId?: string }): Promise<Analytics> {
  const supabase = await createClient();

  let q = supabase.from('field_reports').select(
    'site_id, stream, supervisor_id, report_date, participants_scheduled, participants_present, absentees_count, incident, challenges_risks, support_required, gps_lat, gps_lng'
  );
  if (opts?.siteId) q = q.eq('site_id', opts.siteId);
  const [{ data: rowsRaw }, { data: sitesRaw }, { data: profsRaw }] = await Promise.all([
    q,
    supabase.from('sites').select('id, name, is_head_office'),
    supabase.from('app_profiles').select('id, full_name'),
  ]);

  const rows = (rowsRaw ?? []) as ReportRow[];
  const sites = (sitesRaw ?? []) as { id: string; name: string; is_head_office: boolean }[];
  const siteName = new Map(sites.map((s) => [s.id, s.name]));
  const profName = new Map((profsRaw ?? []).map((p: any) => [p.id, p.full_name]));

  // KPIs. Count denominators only over reports that actually filled the field
  // (≈7% of historical rows left participant counts blank — don't treat as 0).
  let present = 0, scheduled = 0, incidents = 0, absentees = 0, presentN = 0, absentN = 0;
  const sitesReporting = new Set<string>();
  let latestDate: string | null = null;
  for (const r of rows) {
    if (r.participants_present != null) { present += r.participants_present; presentN++; }
    scheduled += r.participants_scheduled ?? 0;
    if (r.absentees_count != null) { absentees += r.absentees_count; absentN++; }
    if (r.incident) incidents++;
    sitesReporting.add(r.site_id);
    if (!latestDate || r.report_date > latestDate) latestDate = r.report_date;
  }

  // Trend by month
  const tmap = new Map<string, { reports: number; present: number; scheduled: number; participants: number }>();
  for (const r of rows) {
    const m = r.report_date.slice(0, 7); // YYYY-MM
    const t = tmap.get(m) ?? { reports: 0, present: 0, scheduled: 0, participants: 0 };
    t.reports++; t.present += r.participants_present ?? 0; t.scheduled += r.participants_scheduled ?? 0;
    t.participants += r.participants_present ?? 0;
    tmap.set(m, t);
  }
  const trend: TrendPoint[] = [...tmap.entries()].sort().map(([month, t]) => {
    const [y, mo] = month.split('-');
    return { month, label: `${MONTHS[+mo - 1]} ${y.slice(2)}`, reports: t.reports,
      attendance: t.scheduled > 0 ? Math.round((t.present / t.scheduled) * 100) : null, participants: t.participants };
  });

  // Stream breakdown
  const smap = new Map<string, number>();
  for (const r of rows) smap.set(r.stream, (smap.get(r.stream) || 0) + 1);
  const byStream: Slice[] = (Object.keys(STREAM_LABELS) as ProgrammeStream[])
    .filter((k) => smap.has(k))
    .map((k) => ({ key: k, label: STREAM_LABELS[k], value: smap.get(k)! }));

  // Per-site rollup
  const rollupMap = new Map<string, { reports: number; present: number; presentN: number; scheduled: number; incidents: number; last: string | null }>();
  for (const r of rows) {
    const a = rollupMap.get(r.site_id) ?? { reports: 0, present: 0, presentN: 0, scheduled: 0, incidents: 0, last: null };
    a.reports++;
    if (r.participants_present != null) { a.present += r.participants_present; a.presentN++; }
    a.scheduled += r.participants_scheduled ?? 0;
    if (r.incident) a.incidents++;
    if (!a.last || r.report_date > a.last) a.last = r.report_date;
    rollupMap.set(r.site_id, a);
  }
  const bySite: SiteRollup[] = [...rollupMap.entries()].map(([id, a]) => ({
    id, name: siteName.get(id) ?? 'Unknown', reports: a.reports,
    avgPresent: a.presentN ? Math.round(a.present / a.presentN) : 0,
    attendance: rate(a.present, a.scheduled), incidents: a.incidents, lastReport: a.last,
  })).sort((x, y) => y.reports - x.reports);

  // Per-supervisor rollup
  const supMap = new Map<string, { reports: number; present: number; scheduled: number; incidents: number }>();
  for (const r of rows) {
    const a = supMap.get(r.supervisor_id) ?? { reports: 0, present: 0, scheduled: 0, incidents: 0 };
    a.reports++; a.present += r.participants_present ?? 0; a.scheduled += r.participants_scheduled ?? 0;
    if (r.incident) a.incidents++;
    supMap.set(r.supervisor_id, a);
  }
  const bySupervisor: SupervisorRollup[] = [...supMap.entries()].map(([id, a]) => ({
    id, name: profName.get(id) ?? '—', reports: a.reports, attendance: rate(a.present, a.scheduled), incidents: a.incidents,
  })).sort((x, y) => y.reports - x.reports);

  // Silent sites (operational sites with no reports in scope) — only meaningful programme-wide
  const silentSites = sites
    .filter((s) => !s.is_head_office && !sitesReporting.has(s.id))
    .map((s) => ({ id: s.id, name: s.name, lastReport: null }));

  const gps: GpsPoint[] = rows
    .filter((r) => r.gps_lat != null && r.gps_lng != null)
    .map((r) => ({ lat: r.gps_lat!, lng: r.gps_lng!, site: siteName.get(r.site_id) ?? '', date: r.report_date }));

  return {
    kpis: {
      reports: rows.length,
      avgPresent: presentN ? Math.round(present / presentN) : 0,
      attendanceRate: rate(present, scheduled), incidents,
      sitesReporting: sitesReporting.size, sitesTotal: sites.filter((s) => !s.is_head_office).length,
      avgAbsent: absentN ? Math.round(absentees / absentN) : 0,
    },
    trend, byStream, bySite, bySupervisor,
    challenges: topPhrases(rows.map((r) => r.challenges_risks)),
    support: topPhrases(rows.map((r) => r.support_required)),
    silentSites, gps, latestDate,
  };
}
