'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BottomNav } from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import { DAM_SITES } from '@/lib/dam-sites';

export default function SitePage() {
  const params = useParams();
  const siteId = params.id as string;
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/');
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <main className="bg-dark min-h-screen flex items-center justify-center">
        <p className="text-gray-300">Loading...</p>
      </main>
    );
  }

  const site = DAM_SITES.find(s => s.id === siteId);

  if (!site) {
    return (
      <main className="bg-dark min-h-screen flex items-center justify-center">
        <p className="text-gray-300">Site not found</p>
      </main>
    );
  }

  return (
    <main className="bg-dark min-h-screen pb-24">
      <div className="px-4 pt-6">
        <h1 className="text-3xl font-bold text-teal mb-6">{site.name}</h1>

        <div className="bg-navy rounded-lg p-6 border border-teal/30 mb-6 space-y-4">
          <div>
            <p className="text-gray-400 text-xs font-semibold mb-1">Total Eco-Workers</p>
            <p className="text-3xl font-bold text-env-green">{site.worker_count}</p>
          </div>

          <div>
            <p className="text-gray-400 text-xs font-semibold mb-1">Field Supervisor</p>
            <p className={`font-semibold ${site.has_supervisor ? 'text-env-green' : 'text-red-500'}`}>
              {site.has_supervisor ? '✓ Assigned' : '⚠ Not Assigned'}
            </p>
          </div>

          <div>
            <p className="text-gray-400 text-xs font-semibold mb-1">GPS Coordinates</p>
            <p className="text-white font-mono text-sm">
              {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
            </p>
          </div>

          <div>
            <p className="text-gray-400 text-xs font-semibold mb-1">Province</p>
            <p className="text-white">{site.province}</p>
          </div>
        </div>

        <div className="bg-navy rounded-lg p-4 border border-yellow-500/30">
          <p className="text-yellow-300 text-sm">
            📊 Attendance rates and worker details coming soon
          </p>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
