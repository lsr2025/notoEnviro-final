import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, ClipboardList, Map, Briefcase, Plus, History } from "lucide-react"
import StatCard from "@/components/StatCard"
import { cn } from "@/lib/utils"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, employee_code')
    .eq('user_id', user.id)
    .single()

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const role = userRole?.role || 'eco_worker'
  const roleLabel = role === 'district_coordinator' ? 'District Coordinator' : role === 'field_supervisor' ? 'Field Supervisor' : 'Eco-Worker'

  // Fetch stats
  const [sitesRes, workersRes, activitiesRes] = await Promise.all([
    supabase.from('sites').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('activity_logs').select('id', { count: 'exact', head: true })
  ])

  const totalSites = sitesRes.count || 0
  const totalWorkers = workersRes.count || 0
  const totalActivities = activitiesRes.count || 0

  // Recent activities
  const { data: recentActivities } = await supabase
    .from('activity_logs')
    .select(`
      id,
      activity_date,
      activity_type,
      notes,
      profiles (first_name, last_name, employee_code),
      sites (name)
    `)
    .order('activity_date', { ascending: false })
    .limit(8)

  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : 'User'

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-[1400px] mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Welcome back, <span className="text-yami-blue font-semibold">{displayName}</span> · {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/log/new" className="flex items-center gap-2 px-5 py-2.5 bg-yami-blue hover:bg-yami-blue/90 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-yami-blue/20">
            <Plus className="w-4 h-4" />
            Log Activity
          </Link>
          <Link href="/history" className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm transition-all">
            <History className="w-4 h-4" />
            View History
          </Link>
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Active Sites" value={totalSites} subtitle="Dam & wetland sites" icon={Map} color="emerald" />
        <StatCard title="Eco-Workers" value={totalWorkers} subtitle="Registered workers" icon={Users} color="blue" />
        <StatCard title="Activities Logged" value={totalActivities} subtitle="All time records" icon={ClipboardList} color="purple" />
        <StatCard title="My Role" value={roleLabel} subtitle={profile?.employee_code || ""} icon={Briefcase} color="amber" />
      </div>

      {/* Recent Activities Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Recent Activities</h2>
            <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">Latest field logs</p>
          </div>
          <Link href="/history" className="text-sm font-semibold text-yami-blue hover:underline">
            View All
          </Link>
        </div>

        {recentActivities && recentActivities.length > 0 ? (
          <div className="overflow-x-auto -mx-6 md:-mx-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left py-4 px-6 md:px-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="text-left py-4 px-6 md:px-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Worker</th>
                  <th className="text-left py-4 px-6 md:px-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Site</th>
                  <th className="text-left py-4 px-6 md:px-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Activity</th>
                  <th className="text-right py-4 px-6 md:px-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentActivities.map((activity: any) => (
                  <tr key={activity.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-5 px-6 md:px-8 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(activity.activity_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })}
                      </span>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        {new Date(activity.activity_date).getFullYear()}
                      </p>
                    </td>
                    <td className="py-5 px-6 md:px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yami-bg flex items-center justify-center text-yami-blue text-[10px] font-bold">
                          {activity.profiles?.first_name?.[0]}{activity.profiles?.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {activity.profiles?.first_name} {activity.profiles?.last_name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {activity.profiles?.employee_code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 md:px-8">
                      <span className="text-sm font-medium text-gray-600">
                        {activity.sites?.name || '—'}
                      </span>
                    </td>
                    <td className="py-5 px-6 md:px-8">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                        {activity.activity_type}
                      </span>
                    </td>
                    <td className="py-5 px-6 md:px-8 text-right">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold">
                        Logged
                      </span>
                    </td>
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
            <h3 className="text-gray-900 font-bold">No activities yet</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
              Once workers start logging their field data, they will appear here.
            </p>
            <Link href="/log/new" className="inline-flex items-center gap-2 mt-6 px-5 py-2 bg-yami-blue text-white rounded-xl font-semibold text-sm">
              <Plus className="w-4 h-4" />
              Log your first activity
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
