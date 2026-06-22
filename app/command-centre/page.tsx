import { redirect } from 'next/navigation';
import { Radio } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';
import { requireProfile } from '@/lib/auth';
import type { ProgrammeStream } from '@/lib/roles';
import CommandCentreClient, { type CommandSite } from '@/components/CommandCentreClient';

// GIS Command Centre — KZN map of dam sites with activity-density bubbles.
// All queries run under the caller's session (RLS-scoped).
export default async function CommandCentrePage() {
  const profile = await requireProfile();
  if (profile.role === 'eco_worker') redirect('/dashboard');

  const supabase = await createClient();
  const [{ data: sitesRaw }, { data: rowsRaw }] = await Promise.all([
    supabase.from('sites').select('id, name, latitude, longitude, is_head_office'),
    supabase.from('field_reports').select('site_id, stream, participants_present, participants_scheduled'),
  ]);

  const sites = (sitesRaw ?? []) as { id: string; name: string; latitude: number | null; longitude: number | null; is_head_office: boolean }[];
  const rows = (rowsRaw ?? []) as { site_id: string; stream: ProgrammeStream; participants_present: number | null; participants_scheduled: number | null }[];

  const emptyStreams = (): Record<ProgrammeStream, number> => ({ environmental: 0, eco_tourism: 0, aip: 0 });
  const agg = new Map<string, { reports: number; present: number; scheduled: number; streams: Record<ProgrammeStream, number> }>();
  for (const r of rows) {
    const a = agg.get(r.site_id) ?? { reports: 0, present: 0, scheduled: 0, streams: emptyStreams() };
    a.reports++;
    a.present += r.participants_present ?? 0;
    a.scheduled += r.participants_scheduled ?? 0;
    if (r.stream in a.streams) a.streams[r.stream]++;
    agg.set(r.site_id, a);
  }

  const data: CommandSite[] = sites.map((s) => {
    const a = agg.get(s.id) ?? { reports: 0, present: 0, scheduled: 0, streams: emptyStreams() };
    return {
      id: s.id,
      name: s.name,
      lat: s.latitude != null ? Number(s.latitude) : null,
      lng: s.longitude != null ? Number(s.longitude) : null,
      isHeadOffice: s.is_head_office,
      reports: a.reports,
      participants: a.present,
      attendance: a.scheduled > 0 ? a.present / a.scheduled : null,
      streams: a.streams,
    };
  });

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-[1400px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Radio className="w-6 h-6 text-yami-blue" />
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">GIS Command Centre</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          Activity across KwaZulu-Natal dam sites · Workstream B
        </p>
      </div>

      <CommandCentreClient sites={data} />
    </div>
  );
}
