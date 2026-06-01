# Phase 1 — Production merge (DRAFT, not yet run)

Target prod project: **notoTrack SEF** (`rwkdcreimzpieennuwnj`) — holds real data
(967 assessments, 852 audit logs, 275 GPS pins) shared by **both** workstreams.

> Nothing here has been run against production. Built & verified on the dev sandbox
> `notoenviro-phase1-dev` (`wsxayutkjtdgmzipfjwx`). Review, then run in order, each
> file in its own transaction. Each file ends with a verification block that aborts
> on mismatch.

## Run order
1. `01_workstream_b_schema.sql` — enums, new B tables, helper fns, RLS. Additive; the
   only change to an existing object is `sites.is_head_office` (new column).
2. `02_workstream_b_seed.sql` — 493 B accounts into `app_profiles`, derived from the
   verified `users.workstream='B'` set + 8 EXCO. Resets each B account to its temp
   password and `must_change_password=true`.
3. `03_workstream_a_exco.sql` — the 8 EXCO/EA people as Executives on the spaza app
   (`@nototrack.co.za` + `public.users`, `role_tier=1`).

## What is and isn't touched
- **Created (new):** `app_profiles`, `coordinator_sites`, `field_reports`,
  `programme_stream`/`noto_role` enums, `current_noto_role()`,
  `current_coordinator_site_ids()`, `seed_b_staff()`, `seed_a_exco()`,
  `sites.is_head_office`.
- **Modified data:** `@notoenviro.co.za` auth passwords for the 493 B accounts (clean
  rebuild); the 8 EXCO/EA rows in `public.users` + their `@nototrack.co.za` auth.
- **NOT touched:** all 485 spaza (`workstream='A'` / `@nototrack`) accounts except the
  8 EXCO; spaza data (`assessments`, `shops`, `spaza_*`, `ilembe_*`, `gps_pins`,
  `form_submissions`); the old role tables (`users` B rows, `user_roles`, `profiles`,
  `programme_profiles`, `staff`) — kept for verification/rollback.
- **Guards:** `seed_b_staff` refuses any non-`@notoenviro.co.za` email; `seed_a_exco`
  refuses any non-`@nototrack.co.za` email.

## After the DB merge
- Repoint the Vercel **notoenviro** project to the `notoEnviro-final` repo (branch
  `phase1-rbac` → main) with prod env: `NEXT_PUBLIC_SUPABASE_URL` + anon key for
  `rwkdcreimzpieennuwnj`. (It currently serves the old Vite app on a different DB.)
- Temp passwords: DC/exec `YMS@2026!`, field supervisor & eco-worker `YMS@Field2026!`.

## Known caveats / still-open confirmations (resolve before or just after merge)
- **Dual-account password sync:** an exec changing their password in one app does NOT
  change it in the other (separate auth users per domain).
- **Supervisor streams are INFERRED** (`stream_confirmed=false`) for all 21 — incl.
  Albert Falls having two AIP (Khulile Duma + Wendy Zuma) and two Environmental
  (Mxolisi Zaca + Sanele Jansa); Vamisile Cele sits at Head Office; duplicate name
  "Thokozani Ngcobo" (P-354/P-394, used P-394); "Lungile Vidima" had no roster match.
- **DC→site split** is a provisional 6/6.
- Name spelling: **Tholi Ncibane** (per latest table) vs earlier **Tholie Cibane**.

## Rollback
Each file is one transaction. To fully revert: drop the new tables/functions/enums,
drop `sites.is_head_office`, delete the 8 `@nototrack` EXCO auth+users rows. The old
role tables were never modified, so the prior state is intact.
