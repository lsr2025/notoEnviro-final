import Link from 'next/link';
import { ClipboardList, ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import { requireProfile, CAN_CREATE_REPORTS } from '@/lib/roles';

// Placeholder: the digitised Microsoft field-report form is built in Phase 2.
// Guarded here so only report-creating roles can reach it.
export default async function NewReportPage() {
  const profile = await requireProfile();
  if (!CAN_CREATE_REPORTS.includes(profile.role)) redirect('/dashboard');

  return (
    <main className="p-6 md:p-10 max-w-2xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm ring-1 ring-gray-100 text-center">
        <div className="w-16 h-16 bg-yami-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ClipboardList className="w-8 h-8 text-yami-blue" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Field Report</h1>
        <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
          The digitised Supervisor Daily/Weekly report form arrives in Phase 2. Your
          reports will be tied automatically to your site and stream.
        </p>
      </div>
    </main>
  );
}
