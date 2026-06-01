import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ClipboardList, Users, Percent, AlertTriangle, MapPin } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { TrendChart, StreamDonut } from '@/components/charts';
import { createClient } from '@/lib/supabase-server';
import { requireProfile } from '@/lib/auth';
import { getAnalytics } from '@/lib/analytics';

const pct = (r: number | null) => (r == null ? '—' : `${Math.round(r * 100)}%`);

export default async function DamAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  if (profile.role === 'eco_worker') redirect('/dashboard');

  const supabase = await createClient();
  const { data: site } = await supabase.from('sites').select('name, code').eq('id', id).maybeSingle();
  if (!site) redirect('/analytics');

  const a = await getAnalytics({ siteId: id });

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-[1400px] mx-auto space-y-6">
      <div>
        <Link href="/analytics" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> All analytics
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mt-3">{site.name}</h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          {a.kpis.reports.toLocaleString()} reports
          {a.latestDate && <> · latest {new Date(a.latestDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}</>}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Reports" value={a.kpis.reports.toLocaleString()} subtitle="Submitted" icon={ClipboardList} color="blue" />
        <StatCard title="Avg on site" value={a.kpis.avgPresent} subtitle="Present / report" icon={Users} color="emerald" />
        <StatCard title="Attendance" value={pct(a.kpis.attendanceRate)} subtitle="Present ÷ scheduled" icon={Percent} color="teal" />
        <StatCard title="Incidents" value={a.kpis.incidents} subtitle="Flagged" icon={AlertTriangle} color="rose" />
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm ring-1 ring-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Reporting & attendance over time</h2>
        {a.trend.length ? <TrendChart data={a.trend} /> : <Empty />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Streams at this site</h2>
          {a.byStream.length ? <StreamDonut data={a.byStream} /> : <Empty />}
        </div>
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Supervisors</h2>
          {a.bySupervisor.length ? (
            <div className="space-y-1">
              {a.bySupervisor.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-semibold text-gray-900">{s.name}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">{s.reports} reports</span>
                    <span className="font-semibold text-gray-900 w-12 text-right">{pct(s.attendance)}</span>
                    {s.incidents > 0 && <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-xs font-bold">{s.incidents}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm ring-1 ring-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Recurring challenges</h2>
          <Chips items={a.challenges} />
        </div>
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-2 mb-5"><MapPin className="w-5 h-5 text-yami-blue" /><h2 className="text-lg font-bold text-gray-900">GPS-tagged reports</h2></div>
          <p className="text-4xl font-bold text-gray-900">{a.gps.length}</p>
          <p className="text-sm text-gray-500 mt-1">of {a.kpis.reports} reports carry a location</p>
        </div>
      </div>
    </div>
  );
}

function Empty() { return <div className="py-16 text-center text-sm text-gray-400">No data in your view yet.</div>; }
function Chips({ items }: { items: { key: string; label: string; value: number }[] }) {
  if (!items.length) return <Empty />;
  const max = Math.max(...items.map((i) => i.value));
  return (
    <div className="space-y-2.5">
      {items.map((i) => (
        <div key={i.key} className="flex items-center gap-3">
          <div className="flex-1 h-7 rounded-lg bg-gray-50 relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-rose-100" style={{ width: `${(i.value / max) * 100}%` }} />
            <span className="absolute inset-0 flex items-center px-3 text-sm font-medium text-gray-700">{i.label}</span>
          </div>
          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700">{i.value}</span>
        </div>
      ))}
    </div>
  );
}
