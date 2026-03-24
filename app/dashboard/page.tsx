import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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
  const isCoordinator = role === 'district_coordinator'
  const isSupervisor = role === 'field_supervisor' || isCoordinator

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
  const roleLabel = role === 'district_coordinator' ? 'District Coordinator' : role === 'field_supervisor' ? 'Field Supervisor' : 'Eco-Worker'

  const kpis = [
    { label: 'Active Sites', value: totalSites, sub: 'Dam & wetland sites', icon: '◎', color: '#dcfce7' },
    { label: 'Eco-Workers', value: totalWorkers, sub: 'Registered workers', icon: '◯', color: '#dbeafe' },
    { label: 'Activities Logged', value: totalActivities, sub: 'All time records', icon: '☰', color: '#fef3c7' },
    { label: 'My Role', value: roleLabel, sub: profile?.employee_code || '', icon: '▦', color: '#f3e8ff' },
  ]

  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Welcome back, {displayName} · {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="page-content">
        {/* KPI Cards */}
        <div className="kpi-grid">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="kpi-card">
              <div className="kpi-card-label">{kpi.label}</div>
              <div className="kpi-card-value" style={{ fontSize: typeof kpi.value === 'string' ? '1.1rem' : '2rem', marginTop: '0.5rem' }}>
                {kpi.value}
              </div>
              <div className="kpi-card-sub">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Link href="/log/new" className="btn btn-primary">
            ＋ Log Activity
          </Link>
          <Link href="/history" className="btn btn-secondary">
            View History
          </Link>
        </div>

        {/* Recent Activities */}
        <div className="card">
          <div className="card-title">Recent Activities</div>
          {recentActivities && recentActivities.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Worker</th>
                  <th>Site</th>
                  <th>Activity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((activity: any) => (
                  <tr key={activity.id}>
                    <td style={{ color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                      {new Date(activity.activity_date).toLocaleDateString('en-ZA')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {activity.profiles?.first_name} {activity.profiles?.last_name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
                        {activity.profiles?.employee_code}
                      </div>
                    </td>
                    <td>{activity.sites?.name || '—'}</td>
                    <td>
                      <span className="badge badge-green">
                        {activity.activity_type}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-blue">Logged</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
              <p>No activities logged yet.</p>
              <Link href="/log/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Log your first activity
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
