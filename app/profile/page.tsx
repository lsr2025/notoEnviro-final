import { createClient } from '@/lib/supabase-server';
import { ROLE_LABELS, STREAM_LABELS, displayTitle } from '@/lib/roles';
import { requireProfile } from '@/lib/auth';
import LogoutButton from '@/app/components/LogoutButton';
import ChangePasswordCard from '@/components/ChangePasswordCard';
import { Leaf } from 'lucide-react';

export default async function ProfilePage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: site } = profile.home_site_id
    ? await supabase.from('sites').select('name').eq('id', profile.home_site_id).maybeSingle()
    : { data: null };

  return (
    <main className="p-6 md:p-8 lg:p-10 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Profile</h1>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
            <p className="text-yami-blue font-semibold mt-1">{profile.employee_id}</p>
            <p className="text-gray-900 text-sm font-semibold mt-1">{displayTitle(profile)}</p>
            {profile.job_title && profile.job_title !== ROLE_LABELS[profile.role] && (
              <p className="text-gray-400 text-xs mt-0.5">Access level: {ROLE_LABELS[profile.role]}</p>
            )}
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Leaf className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        <dl className="border-t border-gray-100 pt-5 space-y-4">
          <div>
            <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest">Home Site</dt>
            <dd className="text-gray-900 font-semibold mt-1">{site?.name || '—'}</dd>
          </div>
          {profile.stream && (
            <div>
              <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest">Programme Stream</dt>
              <dd className="text-gray-900 font-semibold mt-1">{STREAM_LABELS[profile.stream]}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest">Programme</dt>
            <dd className="text-gray-900 font-semibold mt-1">Workstream B · Msinsi</dd>
          </div>
        </dl>
      </div>

      <ChangePasswordCard />

      <LogoutButton />
    </main>
  );
}
