-- =============================================================================
-- PROD MERGE 02 — Workstream B accounts (493) into the new model
-- Derives the roster from the EXISTING, verified users.workstream='B' set (486)
-- plus the 8 EXCO accounts. Resets every B account to its documented temp
-- password and must_change_password=true (clean rebuild; logins are broken).
-- GUARD: the seed function refuses any non-@notoenviro.co.za email.
-- DO NOT RUN until reviewed & approved.
-- =============================================================================
begin;
create extension if not exists pgcrypto with schema extensions;

-- Find-or-create a @notoenviro.co.za auth user, (re)set its temp password, ensure
-- its identity row, and upsert the app_profile. Hard-guarded to Workstream B's domain.
create or replace function public.seed_b_staff(
  p_employee_id text, p_full_name text, p_password text, p_role noto_role,
  p_site_name text, p_stream programme_stream default null,
  p_stream_confirmed boolean default false, p_job_title text default null
) returns uuid
language plpgsql security definer set search_path = public, auth, extensions as $$
declare
  v_uid uuid; v_site uuid;
  v_email text := lower(p_employee_id) || '@notoenviro.co.za';
begin
  if v_email not like '%@notoenviro.co.za' then
    raise exception 'GUARD: seed_b_staff refuses non-Workstream-B email %', v_email;
  end if;
  select id into v_site from public.sites where name = p_site_name;
  select id into v_uid from auth.users where email = v_email;

  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
      confirmation_token, recovery_token, email_change, email_change_token_new,
      email_change_token_current, reauthentication_token, phone_change, phone_change_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      v_email, crypt(p_password, gen_salt('bf')), now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('employee_id', p_employee_id, 'full_name', p_full_name),
      false, false, '', '', '', '', '', '', '', ''
    );
  else
    -- existing account: reset to temp password and clear NULL token cols (GoTrue safety)
    update auth.users set
      encrypted_password = crypt(p_password, gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      confirmation_token = coalesce(confirmation_token,''),
      recovery_token = coalesce(recovery_token,''),
      email_change = coalesce(email_change,''),
      email_change_token_new = coalesce(email_change_token_new,''),
      email_change_token_current = coalesce(email_change_token_current,''),
      reauthentication_token = coalesce(reauthentication_token,''),
      phone_change = coalesce(phone_change,''),
      phone_change_token = coalesce(phone_change_token,''),
      updated_at = now()
    where id = v_uid;
  end if;

  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (v_uid::text, v_uid,
          jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
          'email', now(), now(), now())
  on conflict (provider, provider_id) do nothing;

  insert into public.app_profiles (id, employee_id, full_name, role, job_title, home_site_id, stream, stream_confirmed, must_change_password)
  values (v_uid, p_employee_id, p_full_name, p_role, p_job_title, v_site, p_stream, p_stream_confirmed, true)
  on conflict (id) do update set
    employee_id = excluded.employee_id, full_name = excluded.full_name, role = excluded.role,
    job_title = excluded.job_title, home_site_id = excluded.home_site_id,
    stream = excluded.stream, stream_confirmed = excluded.stream_confirmed,
    must_change_password = true;
  return v_uid;
end $$;

-- 1. Eco-workers (469), base field supervisors (14), district coordinators (2)
--    sourced from the verified users.workstream='B' set. DC-002 (Tholie) is
--    excluded here — she is provisioned as EXCO-007 below.
do $$
declare
  r record; v_role noto_role; v_pw text; v_stream programme_stream;
  sup_stream jsonb := $j${
    "YMS-M-FS-001":"aip","YMS-M-FS-002":"aip","YMS-M-FS-003":"aip","YMS-M-FS-004":"aip",
    "YMS-M-FS-005":"environmental","YMS-M-FS-006":"aip","YMS-M-FS-007":"aip",
    "YMS-M-FS-008":"eco_tourism","YMS-M-FS-009":"aip","YMS-M-FS-010":"aip",
    "YMS-M-FS-011":"aip","YMS-M-FS-012":"aip","YMS-M-FS-013":"aip","YMS-M-FS-014":"environmental"
  }$j$::jsonb;
begin
  for r in
    select employee_id, full_name, role_tier, site_name
    from public.users
    where workstream = 'B' and employee_id <> 'YMS-M-DC-002'
  loop
    if r.role_tier = 2 then
      v_role := 'district_coordinator'; v_pw := 'YMS@2026!'; v_stream := null;
      perform public.seed_b_staff(r.employee_id, r.full_name, v_pw, v_role, r.site_name, null, true, 'District Coordinator');
    elsif r.role_tier = 3 then
      v_role := 'field_supervisor'; v_pw := 'YMS@Field2026!';
      v_stream := (sup_stream->>r.employee_id)::programme_stream;
      perform public.seed_b_staff(r.employee_id, r.full_name, v_pw, v_role, r.site_name, v_stream, false, 'Field Supervisor');
    else
      perform public.seed_b_staff(r.employee_id, r.full_name, 'YMS@Field2026!', 'eco_worker', r.site_name, null, true, null);
    end if;
  end loop;
end $$;

-- 2. Promote the 7 form-identified per-stream supervisors (14 -> 21). Streams INFERRED.
update public.app_profiles set role='field_supervisor', stream='eco_tourism',   stream_confirmed=false, job_title='Field Supervisor' where employee_id='YMS-M-P-325'; -- Buyile Ntshangase (Inanda)
update public.app_profiles set role='field_supervisor', stream='aip',           stream_confirmed=false, job_title='Field Supervisor' where employee_id='YMS-M-P-334'; -- Sindisiwe Shezi (Inanda)
update public.app_profiles set role='field_supervisor', stream='environmental', stream_confirmed=false, job_title='Field Supervisor' where employee_id='YMS-M-P-312'; -- Thobelinkhosi Gcwensa (Inanda)
update public.app_profiles set role='field_supervisor', stream='environmental', stream_confirmed=false, job_title='Field Supervisor' where employee_id='YMS-M-P-279'; -- Sanele Jansa (Albert Falls)
update public.app_profiles set role='field_supervisor', stream='aip',           stream_confirmed=false, job_title='Field Supervisor' where employee_id='YMS-M-P-424'; -- Skholiwe Zondi (Nagle)
update public.app_profiles set role='field_supervisor', stream='aip',           stream_confirmed=false, job_title='Field Supervisor' where employee_id='YMS-M-P-430'; -- Vamisile Cele (Head Office?)
update public.app_profiles set role='field_supervisor', stream='environmental', stream_confirmed=false, job_title='Field Supervisor' where employee_id='YMS-M-P-394'; -- Thokozani Ngcobo (Nagle)

-- 3. EXCO cohort (8) — executive access, temp YMS@2026!, @notoenviro.co.za side.
select public.seed_b_staff('YMS-EXCO-001','Fundi Madlala','YMS@2026!','executive','Head Office',null,true,'CEO');
select public.seed_b_staff('YMS-EXCO-002','Mpume Madlala','YMS@2026!','executive','Head Office',null,true,'CFO');
select public.seed_b_staff('YMS-EXCO-003','Nokukhanya Kamanga','YMS@2026!','executive','Head Office',null,true,'Operations Manager');
select public.seed_b_staff('YMS-EXCO-004','Lebohang Ntuli','YMS@2026!','executive','Head Office',null,true,'Operations (Office of CEO)');
select public.seed_b_staff('YMS-EXCO-005','Lonathemba Radebe','YMS@2026!','executive','Head Office',null,true,'BI Lead / Founder');
select public.seed_b_staff('YMS-EXCO-006','Nokuphila Maphumulo','YMS@2026!','executive','Head Office',null,true,'HR & Admin');
select public.seed_b_staff('YMS-EXCO-007','Tholi Ncibane','YMS@2026!','executive','Head Office',null,true,'Stakeholder Relations');
select public.seed_b_staff('YMS-EA-001','Oara Gombela','YMS@2026!','executive','Head Office',null,true,'Executive Assistant');

-- 4. District-coordinator -> site assignments (PROVISIONAL 6/6 split — confirm with Lona).
insert into public.coordinator_sites (user_id, site_id)
select p.id, s.id from public.app_profiles p, public.sites s
where p.employee_id = 'YMS-M-DC-001'
  and s.name in ('Albert Falls Dam','Darvill Wetlands','EJ Smith Dam','Hazelmere Dam','Imvutshane Dam','Inanda Dam')
on conflict do nothing;
insert into public.coordinator_sites (user_id, site_id)
select p.id, s.id from public.app_profiles p, public.sites s
where p.employee_id = 'YMS-M-DC-003'
  and s.name in ('Ixopo Dam','Nagle Dam','Nungwane Dam','Spring Grove Dam','St Joseph Dam','Umzinto Dam')
on conflict do nothing;

-- 5. Verification (expect: executive=8, district_coordinator=2, field_supervisor=21,
--    eco_worker=462, total=493). Review before COMMIT.
do $$
declare n_total int; n_exec int; n_fs int; n_dc int; n_eco int;
begin
  select count(*) into n_total from public.app_profiles;
  select count(*) into n_exec  from public.app_profiles where role='executive';
  select count(*) into n_fs    from public.app_profiles where role='field_supervisor';
  select count(*) into n_dc    from public.app_profiles where role='district_coordinator';
  select count(*) into n_eco   from public.app_profiles where role='eco_worker';
  raise notice 'app_profiles total=%, exec=%, fs=%, dc=%, eco=%', n_total, n_exec, n_fs, n_dc, n_eco;
  if n_total <> 493 or n_exec <> 8 or n_fs <> 21 or n_dc <> 2 or n_eco <> 462 then
    raise exception 'SEED COUNT MISMATCH — rolling back for review';
  end if;
end $$;

commit;
-- The old role tables (users, user_roles, profiles, programme_profiles, staff) are
-- left UNTOUCHED for verification/rollback. Drop the new model to fully revert.
