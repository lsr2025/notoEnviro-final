-- =============================================================================
-- PROD MERGE 01 — Workstream B consolidated RBAC schema
-- Target: notoTrack SEF (rwkdcreimzpieennuwnj) — PRODUCTION
-- Idempotent. Additive only. Touches NO existing table data.
-- DO NOT RUN until reviewed & approved. Run inside a transaction.
-- =============================================================================
begin;

-- 1. Enums (prod has neither yet) ------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'programme_stream') then
    create type programme_stream as enum ('environmental', 'eco_tourism', 'aip');
  end if;
  if not exists (select 1 from pg_type where typname = 'noto_role') then
    create type noto_role as enum (
      'executive','operations_manager','district_coordinator','field_supervisor','eco_worker'
    );
  end if;
end $$;

-- 2. Reconcile existing sites table (prod already has the 13 rows) --------------
--    We do NOT recreate it; we only add the Head Office flag.
alter table public.sites add column if not exists is_head_office boolean not null default false;
update public.sites set is_head_office = true  where name = 'Head Office' and is_head_office = false;

-- 3. New B tables (do not exist in prod) ----------------------------------------
create table if not exists public.app_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  employee_id text not null unique,
  full_name text not null,
  role noto_role not null default 'eco_worker',
  job_title text,
  home_site_id uuid references public.sites(id),
  stream programme_stream,
  stream_confirmed boolean not null default false,   -- false = inferred, pending confirmation
  supervisor_id uuid references public.app_profiles(id),
  is_active boolean not null default true,
  must_change_password boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.coordinator_sites (
  user_id uuid references public.app_profiles(id) on delete cascade,
  site_id uuid references public.sites(id) on delete cascade,
  primary key (user_id, site_id)
);

create table if not exists public.field_reports (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id),
  stream programme_stream not null,
  supervisor_id uuid not null references public.app_profiles(id),
  report_date date not null,
  participants_scheduled int,
  participants_present int,
  brief_update text,
  absentees_count int,
  absentee_names text,
  absentee_reasons text,
  exact_location text,
  teams_assigned text,
  task_description text,
  work_completed text,
  tools_used text,
  incident boolean default false,
  incident_detail text,
  challenges_risks text,
  support_required text,
  attendance_concerns text,
  decisions_required text,
  additional_comments text,
  gps_lat double precision,
  gps_lng double precision,
  status text not null default 'submitted',
  approved_by uuid references public.app_profiles(id),
  created_at timestamptz default now()
);

create index if not exists app_profiles_home_site_idx  on public.app_profiles (home_site_id);
create index if not exists app_profiles_supervisor_idx  on public.app_profiles (supervisor_id);
create index if not exists field_reports_scope_idx      on public.field_reports (site_id, stream, report_date);
create index if not exists field_reports_supervisor_idx on public.field_reports (supervisor_id);

-- 4. Helper functions (SECURITY DEFINER, avoid RLS recursion) -------------------
create or replace function public.current_noto_role() returns noto_role
language sql stable security definer set search_path = public as $$
  select role from public.app_profiles where id = auth.uid()
$$;

create or replace function public.current_coordinator_site_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select site_id from public.coordinator_sites where user_id = auth.uid()
$$;

-- 5. RLS ------------------------------------------------------------------------
alter table public.app_profiles      enable row level security;
alter table public.coordinator_sites enable row level security;
alter table public.field_reports     enable row level security;
-- public.sites already has RLS enabled in prod; ensure an authenticated read policy.
drop policy if exists sites_read_authenticated on public.sites;
create policy sites_read_authenticated on public.sites
  for select to authenticated using (true);

drop policy if exists ap_self on public.app_profiles;
create policy ap_self on public.app_profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.current_noto_role() in ('operations_manager','executive')
    or (public.current_noto_role() = 'district_coordinator'
        and home_site_id in (select public.current_coordinator_site_ids()))
    or (public.current_noto_role() = 'field_supervisor' and supervisor_id = auth.uid())
  );

drop policy if exists cs_read on public.coordinator_sites;
create policy cs_read on public.coordinator_sites
  for select to authenticated
  using (user_id = auth.uid() or public.current_noto_role() in ('operations_manager','executive'));

drop policy if exists fr_supervisor_rw on public.field_reports;
create policy fr_supervisor_rw on public.field_reports
  for all to authenticated
  using (public.current_noto_role() = 'field_supervisor' and supervisor_id = auth.uid())
  with check (public.current_noto_role() = 'field_supervisor' and supervisor_id = auth.uid());

drop policy if exists fr_dc_read on public.field_reports;
create policy fr_dc_read on public.field_reports
  for select to authenticated
  using (public.current_noto_role() = 'district_coordinator'
         and site_id in (select public.current_coordinator_site_ids()));

drop policy if exists fr_ops_all on public.field_reports;
create policy fr_ops_all on public.field_reports
  for all to authenticated
  using (public.current_noto_role() in ('operations_manager','executive'))
  with check (public.current_noto_role() in ('operations_manager','executive'));

commit;
-- Rollback: drop the new tables/functions/enums (they are additive); the only
-- change to a pre-existing object is sites.is_head_office (drop column to revert).
