import { redirect } from 'next/navigation';
import { FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase-server';
import { requireProfile } from '@/lib/auth';
import type { ProgrammeStream } from '@/lib/roles';
import ReportsClient, { type ReportRowLite } from '@/components/ReportsClient';

// Structured Workstream B report with Monthly/Weekly toggle + CSV export.
// Data is RLS-scoped to the caller's role.
export default async function ReportsPage() {
  const profile = await requireProfile();
  if (profile.role === 'eco_worker') redirect('/dashboard');

  const supabase = await createClient();
  const { data } = await supabase
    .from('field_reports')
    .select('report_date, stream, supervisor_id, participants_present, participants_scheduled, absentees_count, incident, sites (name)')
    .order('report_date', { ascending: false });

  const rows: ReportRowLite[] = ((data ?? []) as any[]).map((r) => ({
    d: r.report_date,
    st: r.stream as ProgrammeStream,
    site: r.sites?.name ?? 'Unknown',
    sup: r.supervisor_id,
    p: r.participants_present,
    s: r.participants_scheduled,
    ab: r.absentees_count,
    inc: !!r.incident,
  }));

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-[1400px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-yami-blue" />
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reports</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1 font-medium">Programme report &amp; CSV export</p>
      </div>

      <ReportsClient rows={rows} />
    </div>
  );
}
