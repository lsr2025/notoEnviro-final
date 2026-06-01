import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { CAN_CREATE_REPORTS, IS_MANAGEMENT } from '@/lib/roles';
import { requireProfile } from '@/lib/auth';
import ReportForm from '@/components/ReportForm';

// Digitised Supervisor Daily/Weekly field report. Field supervisors file for
// their own (site, stream), auto-filled. Ops/exec may choose any site/stream.
export default async function NewReportPage() {
  const profile = await requireProfile();
  if (!CAN_CREATE_REPORTS.includes(profile.role)) redirect('/dashboard');

  const supabase = await createClient();
  const canChooseScope = IS_MANAGEMENT.includes(profile.role);

  let lockedSiteName: string | null = null;
  let sites: { id: string; name: string }[] = [];

  if (canChooseScope) {
    const { data } = await supabase.from('sites').select('id, name').order('name');
    sites = data ?? [];
  } else if (profile.home_site_id) {
    const { data } = await supabase.from('sites').select('name').eq('id', profile.home_site_id).maybeSingle();
    lockedSiteName = data?.name ?? null;
  }

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="max-w-2xl mx-auto mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mt-3">Field Report</h1>
        <p className="text-sm text-gray-500 mt-1">Daily / weekly supervisor report. Tied to your site and stream automatically.</p>
      </div>

      <ReportForm
        supervisorId={profile.id}
        lockedSiteId={canChooseScope ? null : profile.home_site_id}
        lockedSiteName={lockedSiteName}
        lockedStream={canChooseScope ? null : profile.stream}
        sites={sites}
        canChooseScope={canChooseScope}
      />
    </div>
  );
}
