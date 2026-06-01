// Server-only auth helpers (imports next/headers via supabase-server).
import { redirect } from 'next/navigation';
import { createClient } from './supabase-server';
import { PROFILE_COLUMNS, type NotoProfile } from './roles';

// Returns the signed-in user's profile or redirects to login. Also enforces the
// must_change_password gate everywhere except the change-password page itself.
export async function requireProfile(opts?: { allowMustChange?: boolean }): Promise<NotoProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('app_profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .single<NotoProfile>();

  if (!profile) redirect('/');
  if (profile.must_change_password && !opts?.allowMustChange) {
    redirect('/change-password');
  }
  return profile;
}
