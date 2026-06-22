'use client';

import { useMemo, useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import { STREAM_LABELS, type ProgrammeStream } from '@/lib/roles';

export interface ReportRowLite {
  d: string;            // report_date YYYY-MM-DD
  st: ProgrammeStream;  // stream
  site: string;         // site name
  sup: string;          // supervisor id
  p: number | null;     // present
  s: number | null;     // scheduled
  ab: number | null;    // absentees
  inc: boolean;         // incident
}

type Granularity = 'month' | 'week';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Monday of the ISO week containing date d (returns YYYY-MM-DD).
function weekStart(d: string): string {
  const dt = new Date(d + 'T00:00:00');
  const day = (dt.getDay() + 6) % 7; // Mon=0
  dt.setDate(dt.getDate() - day);
  return dt.toISOString().slice(0, 10);
}
function periodKey(d: string, g: Granularity): string {
  return g === 'month' ? d.slice(0, 7) : weekStart(d);
}
function periodLabel(key: string, g: Granularity): string {
  if (g === 'month') {
    const [y, m] = key.split('-');
    return `${MONTHS[+m - 1]} ${y}`;
  }
  const dt = new Date(key + 'T00:00:00');
  return `Week of ${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

const pct = (n: number | null) => (n == null ? '—' : `${Math.round(n * 100)}%`);

export default function ReportsClient({ rows }: { rows: ReportRowLite[] }) {
  const [g, setG] = useState<Granularity>('month');

  // Distinct periods, newest first.
  const periods = useMemo(() => {
    const keys = Array.from(new Set(rows.map((r) => periodKey(r.d, g)))).sort().reverse();
    return keys;
  }, [rows, g]);

  const [period, setPeriod] = useState<string>('all');
  // Reset selection when granularity changes and current period no longer exists.
  const activePeriod = period !== 'all' && periods.includes(period) ? period : 'all';

  const scoped = useMemo(
    () => (activePeriod === 'all' ? rows : rows.filter((r) => periodKey(r.d, g) === activePeriod)),
    [rows, g, activePeriod]
  );

  const stats = useMemo(() => computeStats(scoped), [scoped]);

  function exportCSV() {
    const lines: string[] = [];
    lines.push('Workstream B – Eco-Tourism & Environmental Services');
    lines.push('YMS x Msinsi Holdings | IDC Social Employment Fund');
    lines.push(`Period,${activePeriod === 'all' ? 'All time' : periodLabel(activePeriod, g)}`);
    lines.push('');
    lines.push('Metric,Value');
    lines.push(`Total field reports,${stats.reports}`);
    lines.push(`Sites reporting,${stats.sitesReporting}`);
    lines.push(`Supervisors reporting,${stats.supervisors}`);
    lines.push(`Participant-days (present),${stats.present}`);
    lines.push(`Avg present per report,${stats.avgPresent}`);
    lines.push(`Attendance rate,${pct(stats.attendance)}`);
    lines.push(`Avg absentees per report,${stats.avgAbsent}`);
    lines.push(`Incidents,${stats.incidents}`);
    lines.push('');
    lines.push('Stream,Reports');
    for (const s of stats.streams) lines.push(`${STREAM_LABELS[s.key]},${s.value}`);
    lines.push('');
    lines.push('Site,Reports,Participant-days,Attendance,Incidents');
    for (const s of stats.bySite) lines.push(`${s.name},${s.reports},${s.present},${pct(s.attendance)},${s.incidents}`);

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workstream-b-report-${activePeriod === 'all' ? 'all-time' : activePeriod}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm ring-1 ring-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-gray-100 p-1">
            {(['month', 'week'] as Granularity[]).map((opt) => (
              <button
                key={opt}
                onClick={() => { setG(opt); setPeriod('all'); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors ${
                  g === opt ? 'bg-white text-yami-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt === 'month' ? 'Monthly' : 'Weekly'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={activePeriod}
              onChange={(e) => setPeriod(e.target.value)}
              className="text-sm font-medium border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-yami-blue/30"
            >
              <option value="all">All time</option>
              {periods.map((k) => (
                <option key={k} value={k}>{periodLabel(k, g)}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-env-green hover:bg-env-green/90 text-white rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-env-green/20"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Report sheet */}
      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm ring-1 ring-gray-100">
        <div className="border-b border-gray-100 pb-5 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Workstream B – Eco-Tourism &amp; Environmental Services</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">YMS × Msinsi Holdings · IDC Social Employment Fund</p>
          <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest font-bold">
            {activePeriod === 'all' ? 'All time' : periodLabel(activePeriod, g)} · {stats.reports.toLocaleString()} reports
          </p>
        </div>

        {stats.reports === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No reports in this period.</div>
        ) : (
          <div className="space-y-8">
            <Section title="Participation Overview">
              <Metric label="Total Field Reports" value={stats.reports.toLocaleString()} />
              <Metric label="Sites Reporting" value={stats.sitesReporting} />
              <Metric label="Supervisors Reporting" value={stats.supervisors} />
              <Metric label="Participant-days" value={stats.present.toLocaleString()} />
              <Metric label="Avg Present / Report" value={stats.avgPresent} />
              <Metric label="Attendance Rate" value={pct(stats.attendance)} highlight={stats.attendance != null && stats.attendance >= 0.85} />
              <Metric label="Avg Absentees / Report" value={stats.avgAbsent} />
            </Section>

            <Section title="Activities by Stream">
              {stats.streams.map((s) => (
                <Metric key={s.key} label={STREAM_LABELS[s.key]} value={s.value.toLocaleString()} />
              ))}
            </Section>

            <Section title="Incidents & Safety">
              <Metric label="Incidents Flagged" value={stats.incidents} />
              <Metric label="Incident Rate" value={stats.reports ? `${Math.round((stats.incidents / stats.reports) * 100)}%` : '—'} />
            </Section>

            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Per-site Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      {['Site', 'Reports', 'Participant-days', 'Attendance', 'Incidents'].map((h) => (
                        <th key={h} className="py-3 pr-6 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats.bySite.map((s) => (
                      <tr key={s.name}>
                        <td className="py-3 pr-6 text-sm font-bold text-gray-900">{s.name}</td>
                        <td className="py-3 pr-6 text-sm text-gray-700">{s.reports}</td>
                        <td className="py-3 pr-6 text-sm text-gray-700">{s.present.toLocaleString()}</td>
                        <td className="py-3 pr-6 text-sm font-semibold text-gray-900">{pct(s.attendance)}</td>
                        <td className="py-3 pr-6 text-sm">
                          {s.incidents > 0 ? <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold">{s.incidents}</span> : <span className="text-gray-300">0</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function computeStats(rows: ReportRowLite[]) {
  let present = 0, scheduled = 0, absent = 0, absentN = 0, presentN = 0, incidents = 0;
  const sites = new Set<string>();
  const sups = new Set<string>();
  const streamMap: Record<ProgrammeStream, number> = { environmental: 0, eco_tourism: 0, aip: 0 };
  const siteMap = new Map<string, { reports: number; present: number; scheduled: number; incidents: number }>();

  for (const r of rows) {
    if (r.p != null) { present += r.p; presentN++; }
    scheduled += r.s ?? 0;
    if (r.ab != null) { absent += r.ab; absentN++; }
    if (r.inc) incidents++;
    sites.add(r.site);
    sups.add(r.sup);
    if (r.st in streamMap) streamMap[r.st]++;
    const a = siteMap.get(r.site) ?? { reports: 0, present: 0, scheduled: 0, incidents: 0 };
    a.reports++; a.present += r.p ?? 0; a.scheduled += r.s ?? 0; if (r.inc) a.incidents++;
    siteMap.set(r.site, a);
  }

  return {
    reports: rows.length,
    present,
    avgPresent: presentN ? Math.round(present / presentN) : 0,
    attendance: scheduled > 0 ? present / scheduled : null,
    avgAbsent: absentN ? Math.round(absent / absentN) : 0,
    incidents,
    sitesReporting: sites.size,
    supervisors: sups.size,
    streams: (Object.keys(STREAM_LABELS) as ProgrammeStream[])
      .map((k) => ({ key: k, value: streamMap[k] }))
      .filter((s) => s.value > 0),
    bySite: [...siteMap.entries()]
      .map(([name, a]) => ({ name, reports: a.reports, present: a.present, attendance: a.scheduled > 0 ? a.present / a.scheduled : null, incidents: a.incidents }))
      .sort((x, y) => y.reports - x.reports),
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{children}</div>
    </div>
  );
}
function Metric({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ring-1 ${highlight ? 'bg-emerald-50 ring-emerald-100' : 'bg-gray-50 ring-gray-100'}`}>
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold mt-1 tracking-tight ${highlight ? 'text-emerald-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
