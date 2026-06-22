'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Activity, Users, Percent, MapPin } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { STREAM_LABELS, type ProgrammeStream } from '@/lib/roles';
import type { MapSite } from '@/components/CommandMap';

// Leaflet must never render on the server.
const CommandMap = dynamic(() => import('@/components/CommandMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-3xl bg-gray-100 animate-pulse" />,
});

export interface CommandSite {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  isHeadOffice: boolean;
  reports: number;
  participants: number;
  attendance: number | null;
  streams: Record<ProgrammeStream, number>; // reports per stream
}

type StreamFilter = 'all' | ProgrammeStream;

export default function CommandCentreClient({ sites }: { sites: CommandSite[] }) {
  const [stream, setStream] = useState<StreamFilter>('all');
  const [metric, setMetric] = useState<'reports' | 'participants'>('reports');

  // Sites with valid coordinates, recomputed for the active stream filter.
  const mapSites: MapSite[] = useMemo(() => {
    return sites
      .filter((s) => s.lat != null && s.lng != null)
      .map((s) => {
        const reports = stream === 'all' ? s.reports : s.streams[stream] ?? 0;
        // Scale participant-days by the stream's share of this site's reports.
        const share = s.reports > 0 ? reports / s.reports : 0;
        return {
          id: s.id,
          name: s.name,
          lat: s.lat as number,
          lng: s.lng as number,
          isHeadOffice: s.isHeadOffice,
          reports,
          participants: Math.round(s.participants * share),
          attendance: s.attendance,
        };
      })
      .filter((s) => s.reports > 0);
  }, [sites, stream]);

  // KPI tiles reflect the active filter.
  const kpis = useMemo(() => {
    const ops = sites.filter((s) => !s.isHeadOffice);
    const totalReports = mapSites.reduce((a, s) => a + s.reports, 0);
    const totalParticipants = mapSites.reduce((a, s) => a + s.participants, 0);
    const active = mapSites.filter((s) => !s.isHeadOffice).length;
    const most = [...mapSites].sort((a, b) => b.reports - a.reports)[0];
    // Weighted overall attendance across sites that have it.
    const withAtt = ops.filter((s) => s.attendance != null);
    const overall = withAtt.length
      ? withAtt.reduce((a, s) => a + (s.attendance as number), 0) / withAtt.length
      : null;
    return {
      totalReports,
      totalParticipants,
      activeSites: active,
      mostActive: most?.name ?? '—',
      overall,
    };
  }, [sites, mapSites]);

  const chips: { key: StreamFilter; label: string }[] = [
    { key: 'all', label: 'All activity' },
    { key: 'aip', label: STREAM_LABELS.aip },
    { key: 'environmental', label: STREAM_LABELS.environmental },
    { key: 'eco_tourism', label: STREAM_LABELS.eco_tourism },
  ];

  return (
    <div className="space-y-6">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Activities" value={kpis.totalReports.toLocaleString()} subtitle="Field reports logged" icon={Activity} color="blue" />
        <StatCard title="Active Participants" value={kpis.totalParticipants.toLocaleString()} subtitle="Participant-days" icon={Users} color="emerald" />
        <StatCard title="Overall Attendance" value={kpis.overall == null ? '—' : `${Math.round(kpis.overall * 100)}%`} subtitle="Across sites" icon={Percent} color="teal" />
        <StatCard title="Most Active Site" value={kpis.mostActive.replace(/ Dam$| Wetlands$/, '')} subtitle={`${kpis.activeSites} sites active`} icon={MapPin} color="purple" />
      </div>

      {/* Controls + map */}
      <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <button
                key={c.key}
                onClick={() => setStream(c.key)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  stream === c.key ? 'bg-yami-blue text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">View</span>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as 'reports' | 'participants')}
              className="text-sm font-medium border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-yami-blue/30"
            >
              <option value="reports">Activity Heatmap</option>
              <option value="participants">Participant Density</option>
            </select>
          </div>
        </div>

        <div className="h-[460px] md:h-[560px] w-full overflow-hidden rounded-3xl">
          {mapSites.length ? (
            <CommandMap sites={mapSites} metric={metric} />
          ) : (
            <div className="h-full w-full rounded-3xl bg-gray-50 flex items-center justify-center text-sm text-gray-400">
              No mapped activity in this view yet.
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-xs text-gray-500">
          <span className="font-bold uppercase tracking-wider text-gray-400">Activity Density</span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#2A7CC7', opacity: 0.35, border: '2px solid #2A7CC7' }} />
            <span className="inline-block w-5 h-5 rounded-full" style={{ background: '#2A7CC7', opacity: 0.35, border: '2px solid #2A7CC7' }} />
            Bubble size = relative intensity
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#1B2B4B', opacity: 0.35, border: '2px solid #1B2B4B' }} />
            Head Office
          </span>
        </div>
      </div>
    </div>
  );
}
