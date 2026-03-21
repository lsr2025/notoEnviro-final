'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import { ActivityLog, User } from '@/lib/types';
import { getLogs, getMonthlyStats } from '@/lib/offline-db';

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyStats, setMonthlyStats] = useState<{ logged: Set<number> }>({ logged: new Set() });
  const [streak, setStreak] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const initHistory = async () => {
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

          // Get logs from offline DB
          const offlineLogs = await getLogs(profile.id);
          setLogs(offlineLogs.sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()));

          // Get Supabase logs
          const { data: dbLogs } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('worker_id', profile.id)
            .order('log_date', { ascending: false });

          if (dbLogs) {
            const combined = [...offlineLogs, ...dbLogs];
            const unique = Array.from(
              new Map(combined.map(l => [l.log_date, l])).values()
            ).sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
            setLogs(unique);
          }

          // Calculate monthly stats
          const stats = await getMonthlyStats(
            profile.id,
            currentMonth.getFullYear(),
            currentMonth.getMonth()
          );
          setMonthlyStats(stats);

          // Calculate streak
          calculateStreak(offlineLogs);
        }
      } catch (err) {
        console.error('History init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initHistory();
  }, [router, currentMonth]);

  const calculateStreak = (activityLogs: ActivityLog[]) => {
    if (activityLogs.length === 0) {
      setStreak(0);
      return;
    }

    const sorted = activityLogs.sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
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

    setStreak(Math.max(0, streakCount - 1));
  };

  if (loading) {
    return (
      <main className="bg-dark min-h-screen flex items-center justify-center">
        <p className="text-gray-300">Loading...</p>
      </main>
    );
  }

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  return (
    <main className="bg-dark min-h-screen pb-24">
      <div className="px-4 pt-6">
        <h1 className="text-3xl font-bold text-teal mb-6">Activity History</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-navy rounded-lg p-4 border border-teal/30">
            <p className="text-gray-400 text-xs font-semibold mb-1">Current Streak</p>
            <p className="text-3xl font-bold text-env-green">{streak}</p>
            <p className="text-gray-400 text-xs">consecutive days</p>
          </div>
          <div className="bg-navy rounded-lg p-4 border border-teal/30">
            <p className="text-gray-400 text-xs font-semibold mb-1">Total Logged</p>
            <p className="text-3xl font-bold text-gold">{logs.length}</p>
            <p className="text-gray-400 text-xs">activity logs</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
              viewMode === 'list'
                ? 'bg-env-green text-dark'
                : 'bg-navy text-gray-300'
            }`}
          >
            📋 List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
              viewMode === 'calendar'
                ? 'bg-env-green text-dark'
                : 'bg-navy text-gray-300'
            }`}
          >
            📅 Calendar
          </button>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="bg-navy rounded-lg p-4 border border-teal/30 mb-6">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="text-teal hover:text-env-green"
              >
                ←
              </button>
              <h3 className="text-white font-bold">
                {currentMonth.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="text-teal hover:text-env-green"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-gray-400 text-xs font-semibold py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`aspect-square rounded text-center text-sm font-semibold flex items-center justify-center ${
                    day === null
                      ? ''
                      : monthlyStats.logged.has(day)
                      ? 'bg-env-green text-dark'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="bg-navy rounded-lg p-6 text-center border border-gray-700">
                <p className="text-gray-400">No activity logs yet</p>
                <p className="text-gray-500 text-sm mt-1">Start logging your daily activities</p>
              </div>
            ) : (
              logs.map(log => (
                <div
                  key={log.id || log.offline_id}
                  className="bg-navy rounded-lg p-4 border border-teal/30"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-white font-semibold capitalize">
                        {ACTIVITY_TYPE_LABELS[log.activity_type as keyof typeof ACTIVITY_TYPE_LABELS] || log.activity_type}
                      </h4>
                      <p className="text-gray-400 text-sm">
                        {new Date(log.log_date).toLocaleDateString('en-ZA')}
                      </p>
                    </div>
                    <span className="text-env-green">✓</span>
                  </div>
                  {log.activity_details && (
                    <p className="text-gray-300 text-sm mb-2">{log.activity_details}</p>
                  )}
                  <p className="text-gray-400 text-xs">
                    {log.hours_worked} hours | {log.is_present ? 'Present' : 'Absent'}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  vegetation: '🌱 Vegetation Clearing',
  litter: '🗑️ Litter/Waste Removal',
  water: '💧 Water Quality Monitoring',
  erosion: '🌊 Erosion Control',
  alien: '🌿 Alien Plant Removal',
  infrastructure: '🔧 Infrastructure Maintenance',
  other: '📝 Other',
};
