import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Users, ClipboardList, Map, Briefcase, Plus } from "lucide-react"
import StatCard from "@/components/StatCard"
import { STREAM_LABELS, CAN_CREATE_REPORTS, displayTitle } from "@/lib/roles"
import { requireProfile } from "@/lib/auth"

export default async function DashboardPage() {
  const profile = await requireProfile()
  const supabase = await createClient()

  // All counts run under the user's session, so RLS scopes them to what the
  // role is allowed to see (own site+stream for supervisors, assigned sites
  // for DCs, everything for ops/exec).
  const [sitesRes, staffRes, reportsRes] = await Promise.all([
    supabase.from('sites').select('id', { count: 'exact', head: true }),
    supabase.from('app_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('field_reports').select('id', { count: 'exact', head: true }),
  ])

  const { data: recentReports } = await supabase
    .from('field_reports')
    .select('id, report_date, stream, brief_update, participants_present, sites (name), app_profiles!field_reports_supervisor_id_fkey (full_name)')
    .order('report_date', { ascending: false })
    .limit(8)

  const canCreate = CAN_CREATE_REPORTS.includes(profile.role)

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-[1400px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Welcome back, <span className="text-yami-blue font-semibold">{profile.full_name}</span> · {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {canCreate && (
          <Link href="/report/new" className="flex items-center gap-2 px-5 py-2.5 bg-yami-blue hover:bg-yami-blue/90 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-yami-blue/20">
            <Plus className="w-4 h-4" />
            New Field Report
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Sites" value={sitesRes.count || 0} subtitle="Dam & wetland sites" icon={Map} color="emerald" />
        <StatCard title="Staff in view" value={staffRes.count || 0} subtitle="Within your access" icon={Users} color="blue" />
        <StatCard title="Field Reports" value={reportsRes.count || 0} subtitle="Within your access" icon={ClipboardList} color="purple" />
        <StatCard
          title="My Role"
          value={displayTitle(profile)}
          subtitle={profile.stream ? STREAM_LABELS[profile.stream] : profile.employee_id}
          icon={Briefcase}
          color="amber"
        />
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Recent Field Reports</h2>
            <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">Latest submissions</p>
          </div>
        </div>

        {recentReports && recentReports.length > 0 ? (
          <div className="overflow-x-auto -mx-6 md:-mx-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left py-4 px-6 md:px-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="text-left py-4 px-6 md:px-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Supervisor</th>
                  <th className="text-left py-4 px-6 md:px-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Site</th>
                  <th className="text-left py-4 px-6 md:px-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Stream</th>
                  <th className="text-right py-4 px-6 md:px-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Present</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentReports.map((r: any) => (
                  <tr key={r.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-5 px-6 md:px-8 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {new Date(r.report_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-5 px-6 md:px-8 text-sm font-bold text-gray-900">{r.app_profiles?.full_name || '—'}</td>
                    <td className="py-5 px-6 md:px-8 text-sm font-medium text-gray-600">{r.sites?.name || '—'}</td>
                    <td className="py-5 px-6 md:px-8">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                        {STREAM_LABELS[r.stream as keyof typeof STREAM_LABELS] || r.stream}
                      </span>
                    </td>
                    <td className="py-5 px-6 md:px-8 text-right text-sm font-semibold text-gray-900">{r.participants_present ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-gray-900 font-bold">No field reports yet</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
              Submitted field reports will appear here once supervisors start reporting.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
