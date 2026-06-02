import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ClipboardList, Users, Percent, AlertTriangle, MapPin, UserX, ChevronRight, TrendingUp } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { TrendChart, StreamDonut, SiteBars } from '@/components/charts';
import BriefingCard from '@/components/BriefingCard';
import { createClient } from '@/lib/supabase-server';
import { requireProfile } from '@/lib/auth';
import { getAnalytics } from '@/lib/analytics';
import { IS_MANAGEMENT } from '@/lib/roles';

const pct = (r: number | null) => (r == null ? '—' : `${Math.round(r * 100)}%`);

export default async function AnalyticsPage() {
  const profile = await requireProfile();
  if (profile.role === 'eco_worker') redirect('/dashboard');
  const a = await getAnalytics();

  const supabase = await createClient();
  const { data: insight } = await supabase
    .from('programme_insights')
    .select('briefing, generated_at')
    .eq('scope', 'programme')
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Programme Analytics</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            {a.kpis.reports.toLocaleString()} field reports
            {a.latestDate && <> · latest {new Date(a.latestDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}</>}
          </p>
        </div>
      </div>

      <BriefingCard
        briefing={insight?.briefing ?? null}
        generatedAt={insight?.generated_at ?? null}
        canRefresh={IS_MANAGEMENT.includes(profile.role)}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Reports" value={a.kpis.reports.toLocaleString()} subtitle="Submitted" icon={ClipboardList} color="blue" />
        <StatCard title="Avg on site" value={a.kpis.avgPresent} subtitle="Present / report" icon={Users} color="emerald" />
        <StatCard title="Attendance" value={pct(a.kpis.attendanceRate)} subtitle="Present ÷ scheduled" icon={Percent} color="teal" />
        <StatCard title="Incidents" value={a.kpis.incidents} subtitle="Flagged reports" icon={AlertTriangle} color="rose" />
        <StatCard title="Sites Active" value={`${a.kpis.sitesReporting}/${a.kpis.sitesTotal}`} subtitle="Reporting" icon={MapPin} color="purple" />
        <StatCard title="Avg absent" value={a.kpis.avgAbsent} subtitle="Per report" icon={UserX} color="amber" />
      </div>

      {/* Trend */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-yami-blue" />
          <h2 className="text-lg font-bold text-gray-900">Reporting & attendance over time</h2>
        </div>
        {a.trend.length ? <TrendChart data={a.trend} /> : <Empty />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Programme streams">
          {a.byStream.length ? <StreamDonut data={a.byStream} /> : <Empty />}
        </Card>
        <Card title="Reports by site">
          {a.bySite.length ? <SiteBars data={a.bySite} /> : <Empty />}
        </Card>
      </div>

      {/* Site table */}
      <Card title="Per-dam breakdown">
        <div className="overflow-x-auto -mx-6 md:-mx-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 text-left">
                {['Site', 'Reports', 'Avg present', 'Attendance', 'Incidents', 'Last report', ''].map((h) => (
                  <th key={h} className="py-3 px-6 md:px-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {a.bySite.map((s) => (
                <tr key={s.id} className="group hover:bg-gray-50/50 cursor-pointer">
                  <td className="py-4 px-6 md:px-8 text-sm">
                    <Link href={`/analytics/site/${s.id}`} className="font-bold text-gray-900 hover:text-yami-blue">{s.name}</Link>
                  </td>
                  <td className="py-4 px-6 md:px-8 text-sm text-gray-700">{s.reports}</td>
                  <td className="py-4 px-6 md:px-8 text-sm text-gray-700">{s.avgPresent}</td>
                  <td className="py-4 px-6 md:px-8 text-sm font-semibold text-gray-900">{pct(s.attendance)}</td>
                  <td className="py-4 px-6 md:px-8 text-sm">
                    {s.incidents > 0 ? <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-600 text-xs font-bold">{s.incidents}</span> : <span className="text-gray-300">0</span>}
                  </td>
                  <td className="py-4 px-6 md:px-8 text-xs text-gray-500">{s.lastReport ? new Date(s.lastReport).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }) : '—'}</td>
                  <td className="py-4 px-6 md:px-8 text-right">
                    <Link href={`/analytics/site/${s.id}`} aria-label={`View ${s.name}`} className="inline-flex items-center text-yami-blue font-semibold text-sm">
                      View <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recurring challenges & risks">
          <InsightChips items={a.challenges} tone="rose" />
        </Card>
        <Card title="Most-requested support">
          <InsightChips items={a.support} tone="blue" />
        </Card>
      </div>

      {IS_MANAGEMENT.includes(profile.role) && a.silentSites.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-900 text-sm">Sites not yet reporting</h3>
            <p className="text-amber-800 text-sm mt-1">{a.silentSites.map((s) => s.name).join(' · ')}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm ring-1 ring-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-5">{title}</h2>
      {children}
    </div>
  );
}
function Empty() {
  return <div className="py-16 text-center text-sm text-gray-400">No data in your view yet.</div>;
}
function InsightChips({ items, tone }: { items: { key: string; label: string; value: number }[]; tone: 'rose' | 'blue' }) {
  if (!items.length) return <Empty />;
  const cls = tone === 'rose' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700';
  const max = Math.max(...items.map((i) => i.value));
  return (
    <div className="space-y-2.5">
      {items.map((i) => (
        <div key={i.key} className="flex items-center gap-3">
          <div className="flex-1 h-7 rounded-lg bg-gray-50 relative overflow-hidden">
            <div className={`absolute inset-y-0 left-0 ${tone === 'rose' ? 'bg-rose-100' : 'bg-blue-100'}`} style={{ width: `${(i.value / max) * 100}%` }} />
            <span className="absolute inset-0 flex items-center px-3 text-sm font-medium text-gray-700">{i.label}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${cls}`}>{i.value}</span>
        </div>
      ))}
    </div>
  );
}
