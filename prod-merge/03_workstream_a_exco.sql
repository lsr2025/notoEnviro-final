-- =============================================================================
-- PROD MERGE 03 — EXCO dual accounts on Workstream A (spaza / NotoTrack)
-- Gives the 8 EXCO/EA people the SAME username on the A app, with Executive
-- access in A's own model. A resolves the current user via
--   public.users.id = auth.users.id  and reads users.role_tier (1 = Executive).
-- So each account = a @nototrack.co.za auth user whose id == its public.users row.
--
-- ADDITIVE / RECONCILE ONLY. Touches ONLY the 8 EXCO/EA ids and the
-- @nototrack.co.za domain. Never modifies any other A account or any spaza data.
-- DO NOT RUN until reviewed & approved.
-- =============================================================================
begin;
create extension if not exists pgcrypto with schema extensions;

create or replace function public.seed_a_exco(p_employee_id text, p_full_name text, p_password text)
returns uuid language plpgsql security definer set search_path = public, auth, extensions as $$
declare
  v_uid uuid;
  v_email text := lower(p_employee_id) || '@nototrack.co.za';
begin
  if v_email not like '%@nototrack.co.za' then
    raise exception 'GUARD: seed_a_exco refuses non-Workstream-A email %', v_email;
  end if;

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

  -- A's user record, keyed to the auth uid. On conflict keep the existing id
  -- (EXCO-001 already matches); only refresh the executive fields.
  insert into public.users (id, employee_id, full_name, role, role_tier, workstream, is_active, email, created_at)
  values (v_uid, p_employee_id, p_full_name, 'Executive', 1, 'both', true, v_email, now())
  on conflict (employee_id) do update set
    full_name = excluded.full_name, role = 'Executive', role_tier = 1,
    workstream = 'both', is_active = true;
  return v_uid;
end $$;

select public.seed_a_exco('YMS-EXCO-001','Fundi Madlala','YMS@2026!');        -- was generic "Executive User"
select public.seed_a_exco('YMS-EXCO-002','Mpume Madlala','YMS@2026!');
select public.seed_a_exco('YMS-EXCO-003','Nokukhanya Kamanga','YMS@2026!');
select public.seed_a_exco('YMS-EXCO-004','Lebohang Ntuli','YMS@2026!');
select public.seed_a_exco('YMS-EXCO-005','Lonathemba Radebe','YMS@2026!');
select public.seed_a_exco('YMS-EXCO-006','Nokuphila Maphumulo','YMS@2026!');
select public.seed_a_exco('YMS-EXCO-007','Tholi Ncibane','YMS@2026!');
select public.seed_a_exco('YMS-EA-001','Oara Gombela','YMS@2026!');

-- Verification (expect 8 rows, all role_tier=1 / workstream='both', each with a
-- @nototrack auth user whose id == users.id). Review before COMMIT.
do $$
declare n int;
begin
  select count(*) into n
  from public.users u
  where (u.employee_id like 'YMS-EXCO-%' or u.employee_id like 'YMS-EA-%')
    and u.role_tier = 1 and u.workstream = 'both'
    and exists (select 1 from auth.users a
                where a.email = lower(u.employee_id)||'@nototrack.co.za' and a.id = u.id);
  raise notice 'A-side EXCO accounts correctly provisioned: %', n;
  if n <> 8 then raise exception 'A-side EXCO count/linkage mismatch — rolling back for review'; end if;
end $$;

commit;
-- Rollback: delete the 8 @nototrack EXCO/EA auth users + their users rows (additive set only).
