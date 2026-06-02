import { redirect } from 'next/navigation';
import { Users2, LogIn, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';
import { requireProfile } from '@/lib/auth';
import { IS_MANAGEMENT, ROLE_LABELS } from '@/lib/roles';

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);
const label = (r: string) => (ROLE_LABELS as any)[r] ?? r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function Bar({ value, total, tone = 'blue' }: { value: number; total: number; tone?: 'blue' | 'emerald' }) {
  const p = pct(value, total);
  const c = tone === 'emerald' ? 'bg-emerald-500' : 'bg-yami-blue';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full ${c} rounded-full`} style={{ width: `${p}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-20 text-right tabular-nums">{value}/{total} · {p}%</span>
    </div>
  );
}

function SystemCard({ title, subtitle, data, showChanged }: { title: string; subtitle: string; data: any; showChanged?: boolean }) {
  if (!data) return null;
  const roles = (data.by_role ?? []) as { role: string; total: number; logged_in: number }[];
  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm ring-1 ring-gray-100">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">{subtitle}</p>

      <div className="grid grid-cols-3 gap-3 my-5">
        <div className="bg-yami-bg rounded-2xl p-4"><Users2 className="w-4 h-4 text-gray-400 mb-1" /><p className="text-2xl font-bold text-gray-900">{data.total}</p><p className="text-[11px] text-gray-500 font-medium">staff</p></div>
        <div className="bg-blue-50 rounded-2xl p-4"><LogIn className="w-4 h-4 text-yami-blue mb-1" /><p className="text-2xl font-bold text-gray-900">{data.logged_in}</p><p className="text-[11px] text-gray-500 font-medium">logged in ({pct(data.logged_in, data.total)}%)</p></div>
        {showChanged && <div className="bg-emerald-50 rounded-2xl p-4"><KeyRound className="w-4 h-4 text-emerald-500 mb-1" /><p className="text-2xl font-bold text-gray-900">{data.changed_pw}</p><p className="text-[11px] text-gray-500 font-medium">set own password</p></div>}
      </div>

      <div className="space-y-3">
        {roles.map((r) => (
          <div key={r.role}>
            <div className="flex justify-between text-sm mb-1"><span className="font-semibold text-gray-700">{label(r.role)}</span></div>
            <Bar value={r.logged_in} total={r.total} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AdoptionPage() {
  const profile = await requireProfile();
  if (!IS_MANAGEMENT.includes(profile.role)) redirect('/dashboard');

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('adoption_stats');

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-[1100px] mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Adoption</h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">How many staff have logged in and set their own password — across both programmes.</p>
      </div>
      {error ? (
        <div className="bg-white rounded-3xl p-10 text-center text-sm text-gray-500 shadow-sm ring-1 ring-gray-100">Couldn’t load adoption stats: {error.message}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SystemCard title="NotoEnviro" subtitle="Workstream B · field reports" data={(data as any)?.notoenviro} showChanged />
          <SystemCard title="Spaza / NotoTrack" subtitle="Workstream A · shop profiling" data={(data as any)?.spaza} />
        </div>
      )}
    </div>
  );
}
