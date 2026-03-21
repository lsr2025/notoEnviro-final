'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BottomNav } from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';
import { getLogs } from '@/lib/offline-db';

const ROLE_TIER_LABELS: Record<number, string> = {
  1: '👔 Executive',
  2: '📊 District Coordinator',
  3: '👨‍💼 Field Supervisor',
  4: '🌿 Eco-Worker',
  5: '📋 M&E / Funder',
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ totalLogged: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initProfile = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push('/');
          return;
        }

        // Get user profile by employee_id derived from auth email
        const employeeId = (session.user.email || '').split('@')[0].toUpperCase();
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('employee_id', employeeId)
          .maybeSingle();

        if (profile) {
          setUser(profile);

          // Get logs for stats
          const logs = await getLogs(profile.id);
          setStats({
            totalLogged: logs.length,
            streak: calculateStreak(logs),
          });
        }
      } catch (err) {
        console.error('Profile init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initProfile();
  }, [router]);

  const calculateStreak = (logs: any[]) => {
    if (logs.length === 0) return 0;

    const sorted = logs.sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
    let streakCount = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const log of sorted) {
      const logDate = new Date(log.log_date);
      logDate.setHours(0, 0, 0, 0);

      const diffTime = currentDate.getTime() - logDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === streakCount) {
        streakCount++;
      } else {
        break;
      }
    }

    return Math.max(0, streakCount - 1);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = 'auth-token=; path=/; max-age=0';
    router.push('/');
  };

  if (loading) {
    return (
      <main className="bg-dark min-h-screen flex items-center justify-center">
        <p className="text-gray-300">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="bg-dark min-h-screen pb-24">
      <div className="px-4 pt-6">
        <h1 className="text-3xl font-bold text-teal mb-6">My Profile</h1>

        {/* Profile Card */}
        <div className="bg-navy rounded-lg p-6 border border-teal/30 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{user.full_name}</h2>
              <p className="text-teal font-semibold mb-1">{user.employee_id}</p>
              <p className="text-gray-400 text-sm">{ROLE_TIER_LABELS[user.role_tier]}</p>
            </div>
            <div className="text-4xl">🌿</div>
          </div>

          <div className="border-t border-gray-700 pt-4 space-y-2">
            <div>
              <p className="text-gray-400 text-xs">Work Location</p>
              <p className="text-white font-semibold">{user.site_name}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Email</p>
              <p className="text-white font-semibold text-sm">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-6">
          <h3 className="text-white font-bold text-lg mb-3">Your Statistics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-navy rounded-lg p-4 border border-env-green">
              <p className="text-gray-400 text-xs font-semibold mb-1">Activity Logs</p>
              <p className="text-3xl font-bold text-env-green">{stats.totalLogged}</p>
              <p className="text-gray-400 text-xs mt-1">submitted</p>
            </div>
            <div className="bg-navy rounded-lg p-4 border border-gold">
              <p className="text-gray-400 text-xs font-semibold mb-1">Current Streak</p>
              <p className="text-3xl font-bold text-gold">{stats.streak}</p>
              <p className="text-gray-400 text-xs mt-1">consecutive days</p>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-navy rounded-lg p-4 border border-gray-700 mb-6">
          <h3 className="text-white font-bold mb-3">App Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Version</span>
              <span className="text-white">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Programme</span>
              <span className="text-white">Workstream B | Msinsi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Data Storage</span>
              <span className="text-env-green">Offline-First ✓</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
