'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BottomNav } from '@/components/BottomNav';
import { AttendanceCard } from '@/components/AttendanceCard';
import { DamSiteCard } from '@/components/DamSiteCard';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';
import { DAM_SITES, getDamSitesWithoutSupervisor } from '@/lib/dam-sites';
import { getPendingCount } from '@/lib/offline-db';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [todayLogged, setTodayLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const initDashboard = async () => {
      try {
        // Check session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push('/');
          return;
        }

        // Get user profile by employee_id derived from auth email
        const employeeId = (session.user.email || '').split('@')[0].toUpperCase();
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('employee_id', employeeId)
          .maybeSingle();

        if (profileError) {
          setError(`Profile error: ${profileError.message}`);
          return;
        }

        if (!profile) {
          setError(`No profile found for ${employeeId}. Contact your supervisor.`);
          return;
        }

        setUser(profile);

        // Check if today's log exists (only if profile loaded)
        const today = new Date().toISOString().split('T')[0];
        const { data: todayLog } = await supabase
          .from('activity_logs')
          .select('id')
          .eq('worker_id', profile.id)
          .eq('log_date', today)
          .maybeSingle();

        setTodayLogged(!!todayLog);

        // Get pending count
        try {
          const pending = await getPendingCount();
          setPendingCount(pending);
        } catch {
          // offline-db not critical
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, [router]);

  if (loading) {
    return (
      <main className="bg-dark min-h-screen flex items-center justify-center">
        <p className="text-gray-300">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="bg-dark min-h-screen flex items-center justify-center px-4">
        <div className="bg-navy rounded-lg p-6 border border-red-500/50 max-w-sm w-full">
          <p className="text-red-400 text-sm font-semibold mb-2">Could not load dashboard</p>
          <p className="text-gray-300 text-sm mb-4">{error}</p>
          <button
            onClick={() => { setError(''); setLoading(true); window.location.reload(); }}
            className="w-full bg-teal text-white py-2 rounded-lg text-sm font-semibold"
          >
            Retry
          </button>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="w-full mt-2 bg-gray-700 text-gray-300 py-2 rounded-lg text-sm"
          >
            Sign Out
          </button>
        </div>
      </main>
    );
  }

  if (!user) return null;

  // Eco-Worker View (Tier 4)
  if (user.role_tier === 4) {
    return (
      <main className="bg-dark min-h-screen pb-24">
        <div className="px-4 pt-6">
          {/* Greeting */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">
              Good morning, {user.full_name}
            </h1>
            <p className="text-gray-400 text-sm">
              {new Date().toLocaleDateString('en-ZA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Dam Site */}
          <div className="bg-navy rounded-lg p-4 mb-6 border border-teal/30">
            <p className="text-gray-400 text-sm mb-1">Your Work Location</p>
            <h2 className="text-2xl font-bold text-teal">{user.site_name}</h2>
          </div>

          {/* Status */}
          <div className="bg-navy rounded-lg p-4 mb-6 border-l-4 border-env-green">
            <div className="flex items-center justify-between">
              <p className="text-gray-300">Today's Log Status</p>
              {todayLogged ? (
                <span className="text-env-green font-bold text-lg">✓ Submitted</span>
              ) : (
                <span className="text-yellow-500 font-bold text-lg">⚠ Not logged</span>
              )}
            </div>
          </div>

          {/* Offline Queue */}
          {pendingCount > 0 && (
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-3 mb-6">
              <p className="text-blue-300 text-sm">
                📡 {pendingCount} activity log(s) waiting to sync
              </p>
            </div>
          )}

          {/* Primary CTA */}
          <Link href="/log/new" className="block mb-4">
            <button className="w-full bg-env-green hover:bg-emerald-600 text-dark font-bold py-4 rounded-lg text-lg transition-colors">
              🌿 Log Today's Activity
            </button>
          </Link>

          {/* Secondary CTA */}
          <Link href="/history">
            <button className="w-full bg-teal hover:bg-teal/80 text-white font-bold py-3 rounded-lg transition-colors">
              📋 View My History
            </button>
          </Link>
        </div>
        <BottomNav />
      </main>
    );
  }

  // Supervisor View (Tier 3)
  if (user.role_tier === 3) {
    return (
      <main className="bg-dark min-h-screen pb-24">
        <div className="px-4 pt-6">
          <h1 className="text-3xl font-bold text-teal mb-6">{user.site_name}</h1>

          <AttendanceCard attendance={75} presentCount={45} totalCount={60} siteLabel="Today's Attendance" />

          {/* Recent Logs */}
          <div className="mb-6">
            <h2 className="text-white font-bold text-lg mb-3">Recent Activity</h2>
            <div className="bg-navy rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start border-b border-gray-700 pb-3">
                <div>
                  <p className="text-white font-semibold">Vegetation Clearing</p>
                  <p className="text-gray-400 text-sm">John Dlamini • 8 hours</p>
                </div>
                <span className="text-env-green">✓</span>
              </div>
              <div className="flex justify-between items-start border-b border-gray-700 pb-3">
                <div>
                  <p className="text-white font-semibold">Litter Removal</p>
                  <p className="text-gray-400 text-sm">Thembi Mthembu • 8 hours</p>
                </div>
                <span className="text-env-green">✓</span>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-semibold">Water Quality Check</p>
                  <p className="text-gray-400 text-sm">Sipho Nkosi • 6 hours</p>
                </div>
                <span className="text-env-green">✓</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <button className="w-full bg-gold hover:bg-yellow-600 text-dark font-bold py-3 rounded-lg transition-colors">
            📥 Download Report
          </button>
        </div>
        <BottomNav />
      </main>
    );
  }

  // Coordinator View (Tier 2)
  if (user.role_tier === 2) {
    const noSupervisorSites = getDamSitesWithoutSupervisor();

    return (
      <main className="bg-dark min-h-screen pb-24">
        <div className="px-4 pt-6">
          <h1 className="text-3xl font-bold text-teal mb-2">Programme Overview</h1>
          <p className="text-gray-400 mb-6">13 dam sites | 469 eco-workers</p>

          {/* Warnings */}
          {noSupervisorSites.length > 0 && (
            <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 font-semibold mb-2">⚠ Attention Required</p>
              <p className="text-yellow-300 text-sm">
                {noSupervisorSites.map(s => s.name).join(' and ')} have no field supervisor assigned.
              </p>
            </div>
          )}

          {/* Dam Sites Grid */}
          <div className="grid gap-4 mb-4">
            {DAM_SITES.map(site => (
              <DamSiteCard
                key={site.id}
                site={site}
                attendance={Math.floor(Math.random() * 40) + 60}
                presentCount={Math.floor(site.worker_count * 0.75)}
              />
            ))}
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  return null;
}
