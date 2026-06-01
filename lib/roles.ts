// Single source of truth for the consolidated NotoEnviro role model (spec §2).
// Client-safe: pure types + constants only. Server-only helpers live in lib/auth.ts.
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

export const PROFILE_COLUMNS =
  'id, employee_id, full_name, role, job_title, home_site_id, stream, must_change_password';
