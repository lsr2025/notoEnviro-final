// Single source of truth for the consolidated NotoEnviro role model (spec §2).
import { redirect } from 'next/navigation';
import { createClient } from './supabase-server';

export type NotoRole =
  | 'executive'
  | 'operations_manager'
  | 'district_coordinator'
  | 'field_supervisor'
  | 'eco_worker';

export type ProgrammeStream = 'environmental' | 'eco_tourism' | 'aip';

export interface NotoProfile {
  id: string;
  employee_id: string;
  full_name: string;
  role: NotoRole;
  job_title: string | null;
  home_site_id: string | null;
  stream: ProgrammeStream | null;
  must_change_password: boolean;
}

// Org title (CEO/CFO/Founder/...) takes precedence over the generic role label.
export function displayTitle(p: Pick<NotoProfile, 'role' | 'job_title'>): string {
  return p.job_title || ROLE_LABELS[p.role];
}

export const ROLE_LABELS: Record<NotoRole, string> = {
  executive: 'Executive',
  operations_manager: 'Operations Manager',
  district_coordinator: 'District Coordinator',
  field_supervisor: 'Field Supervisor',
  eco_worker: 'Eco-Worker',
};

export const STREAM_LABELS: Record<ProgrammeStream, string> = {
  environmental: 'Environmental',
  eco_tourism: 'Eco-Tourism',
  aip: 'AIP',
};

// Roles that may create/edit field reports (spec §4).
export const CAN_CREATE_REPORTS: NotoRole[] = [
  'executive',
  'operations_manager',
  'district_coordinator',
  'field_supervisor',
];

// Roles with management visibility (more than their own record).
export const IS_MANAGEMENT: NotoRole[] = [
  'executive',
  'operations_manager',
  'district_coordinator',
];

const PROFILE_COLUMNS =
  'id, employee_id, full_name, role, job_title, home_site_id, stream, must_change_password';

// Server-side: returns the signed-in user's profile or redirects to login.
// Also enforces the must_change_password gate everywhere except the change page.
export async function requireProfile(opts?: {
  allowMustChange?: boolean;
}): Promise<NotoProfile> {
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
