# NotoEnviro™ — Project Questionnaire

**For:** lsr2025 | **From:** oluwatosindot | **Date:** 2026-05-17

> **Project:** notoEnviro-final — Eco-Worker Activity Logging PWA
> **Scope:** 469 eco-workers · 13 dam sites · KwaZulu-Natal
> **Stack:** Next.js 14 · TypeScript · Supabase · IndexedDB · TailwindCSS · Shadcn UI · TanStack Query · Recharts

Please fill in every **Answer** field below and return this file via PR or direct reply. Questions marked 🔴 **BLOCKING** must be answered before development can continue on that feature.

---

## Section A — Site & Personnel Gaps

- [ ] **Q1.** 🔴 **BLOCKING** — Who is the assigned field supervisor for **Inanda Dam**? Please provide: full name, email address, phone number, and Supabase `user_id` (if already registered). *(Code currently shows a yellow warning: no supervisor mapped to this site. All attendance approvals for Inanda are stalled until this is resolved.)*
  > **Answer:**

- [ ] **Q2.** 🔴 **BLOCKING** — Who is the assigned field supervisor for **Nagle Dam**? Same details needed: full name, email, phone, and Supabase `user_id`. *(Same yellow-warning condition as Inanda. Two dam sites are currently without an approver.)*
  > **Answer:**

- [ ] **Q3.** If no supervisor is yet appointed for either dam, should the system temporarily escalate approval authority to the regional **coordinator** for those sites, or hold submissions in a pending queue? *(This determines the interim RLS rule and UI messaging.)*
  > **Answer:**

- [ ] **Q4.** Of the 469 registered eco-workers, approximately how many are **actively logging** on a typical day? *(Needed to size IndexedDB sync batch limits and Supabase Realtime channel load.)*
  > **Answer:**

- [ ] **Q5.** Are all 13 dam sites currently **operational** (i.e., eco-workers attending and logging), or are some sites on hold / seasonal? *(Affects whether empty-site data should trigger alerts or be treated as expected.)*
  > **Answer:**

---

## Section B — M&E / Funder Analytics

- [ ] **Q6.** 🔴 **BLOCKING** — What organisation is the primary **funder/M&E body** (is it IDC, SANBI, DWS, or another entity)? *(Determines dashboard branding, report header, and data-sharing agreements.)*
  > **Answer:**

- [ ] **Q7.** What specific **KPIs and metrics** must appear on the M&E/Funder analytics dashboard? Examples to confirm or reject:
  - [ ] Total person-days worked per site per month
  - [ ] Activity-type breakdown (clearing, planting, monitoring, etc.)
  - [ ] Attendance rate vs. target headcount
  - [ ] GPS coverage heatmap per dam
  - [ ] Cost per person-day (if payroll data is available)
  - [ ] Cumulative hectares treated/restored

  *(List any additional metrics not shown above.)*
  > **Answer:**

- [ ] **Q8.** What **date range granularity** does the funder require for reports — weekly, monthly, quarterly, or all three? *(Affects Recharts axis configuration and Supabase aggregation queries.)*
  > **Answer:**

- [ ] **Q9.** Should the M&E/Funder role have **read-only access** to all 13 sites simultaneously, or only to sites associated with their funded programme? *(Critical RLS policy decision.)*
  > **Answer:**

- [ ] **Q10.** Does the funder require a **live dashboard** (real-time data via Supabase Realtime) or is a **daily/weekly snapshot** sufficient? *(Determines whether we wire Realtime subscriptions to the analytics tier or use scheduled materialized views.)*
  > **Answer:**

---

## Section C — Data Export & Reporting

- [ ] **Q11.** What **file formats** are required for management-tier data exports?
  - [ ] Excel (.xlsx)
  - [ ] PDF (formatted report)
  - [ ] CSV (raw data)
  - [ ] Other: _______________

  *(Affects which export library to integrate — SheetJS for Excel, react-pdf for PDF, or native CSV serialisation.)*
  > **Answer:**

- [ ] **Q12.** Should exported reports include **photo attachments** (as embedded images in PDF, or as a linked ZIP archive)? *(If yes, this significantly increases export payload size and storage costs.)*
  > **Answer:**

- [ ] **Q13.** Who is authorised to **trigger exports** — coordinators only, executives only, or both? Should M&E/Funders be able to self-serve exports, or must they request them through a coordinator? *(Determines export button visibility per role.)*
  > **Answer:**

- [ ] **Q14.** Is there a requirement for **scheduled/automated reports** (e.g., emailed monthly summary to management)? If yes, should these be triggered via Supabase Edge Functions + a cron job, or via an external service? *(Scope clarification — this is currently not in the build.)*
  > **Answer:**

---

## Section D — Photo Upload & Storage

- [ ] **Q15.** 🔴 **BLOCKING** — Should photo uploads use **Supabase Storage** (simplest, already in stack) or a separate provider (Cloudinary, AWS S3, etc.)? *(No photo storage integration is currently wired. This blocks the activity-details step of the 5-step logging flow.)*
  > **Answer:**

- [ ] **Q16.** What is the maximum **photo file size** allowed per upload? And is there a limit on the number of photos per activity log entry? *(Needed to set Supabase Storage bucket policies and UI validation.)*
  > **Answer:**

- [ ] **Q17.** Should photos be **uploaded immediately** when the worker has connectivity, or queued in IndexedDB and synced later (offline-first)? *(Offline photo queuing adds significant complexity — confirm whether this is required.)*
  > **Answer:**

- [ ] **Q18.** Who should be able to **view uploaded photos** — only supervisors and above, or also the worker who uploaded them? Should M&E/Funders see site photos? *(RLS policy on the storage bucket.)*
  > **Answer:**

---

## Section E — Row-Level Security (RLS) Policies

- [ ] **Q19.** **Workers** — should a worker be able to see **only their own** activity logs, or all logs from their assigned site? *(e.g., Can Worker A see Worker B's entries at the same dam?)*
  > **Answer:**

- [ ] **Q20.** **Supervisors** — should a supervisor see logs from **their assigned dam only**, or across all dams in their region? *(Determines whether `dam_id` or `region_id` is the RLS boundary for this role.)*
  > **Answer:**

- [ ] **Q21.** **Coordinators** — do coordinators manage a subset of dams (e.g., a geographic cluster), or do they have visibility across **all 13 sites**? *(If subset, please list which dams belong to each coordinator's area.)*
  > **Answer:**

- [ ] **Q22.** Should workers be able to **edit or delete** their own past log entries, or are entries locked once submitted? *(If locked, supervisors or coordinators should have correction/override privileges — confirm who.)*
  > **Answer:**

- [ ] **Q23.** Is there a **data-retention policy** — should old log entries be archived or purged after a certain period (e.g., 2 years)? *(Affects whether we need a scheduled archival Edge Function.)*
  > **Answer:**

---

## Section F — Notifications & Alerts

- [ ] **Q24.** Should supervisors receive **push notifications** when a worker under their site fails to check in by a specified time (e.g., 09:00 daily)? *(This requires Web Push / service worker configuration and a scheduled Supabase Edge Function to detect missed check-ins.)*
  > **Answer:**

- [ ] **Q25.** Should coordinators receive **alerts** when a site has zero check-ins for the day? *(Same mechanism as Q24 but scoped to coordinators.)*
  > **Answer:**

- [ ] **Q26.** Should workers receive any notifications — for example, confirmation that their daily log was approved, or a reminder if they haven't logged by a certain time? *(In-app only, or push notification?)*
  > **Answer:**

- [ ] **Q27.** What is the preferred **notification delivery channel** — Web Push (service worker), email (via Supabase Auth email / Resend), SMS (via Twilio or similar), or a combination? *(Each has different cost and complexity implications.)*
  > **Answer:**

---

## Section G — Error Monitoring & Performance

- [ ] **Q28.** Should **Sentry** (or a comparable tool such as Highlight.io or Datadog) be integrated for error monitoring and performance tracing? *(Currently no error monitoring is configured. Recommended for a 469-user field deployment.)*
  > **Answer:**

- [ ] **Q29.** Is there a **target Lighthouse / Core Web Vitals score** the PWA must meet? *(Relevant for the offline-capable service worker and IndexedDB sync performance.)*
  > **Answer:**

- [ ] **Q30.** Should the app include **offline usage analytics** (i.e., logging how long workers operate without connectivity, how many records are queued in IndexedDB before sync)? *(Useful for optimising the sync strategy and identifying connectivity dead-zones at specific dams.)*
  > **Answer:**

---

## Section H — Credentials & Environment

- [ ] **Q31.** 🔴 **BLOCKING** — What is the **Supabase project URL** (`NEXT_PUBLIC_SUPABASE_URL`) for production? *(Required to verify RLS policies and run end-to-end tests against live data.)*
  > **Answer:**

- [ ] **Q32.** 🔴 **BLOCKING** — What is the **Supabase anon key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) for production? *(Do not share the service-role key here — anon key only.)*
  > **Answer:**

- [ ] **Q33.** What is the current **production URL** of the deployed PWA (Vercel, Netlify, or custom domain)? *(Needed to validate the service worker scope, manifest, and push notification endpoint.)*
  > **Answer:**

- [ ] **Q34.** Is there a **staging/preview environment** separate from production? If yes, please share that URL and its Supabase project reference. *(Allows safe testing of RLS changes and schema migrations without affecting live data.)*
  > **Answer:**

---

## Section I — Timeline & Issues

- [ ] **Q35.** 🔴 **BLOCKING** — What is the **hard deadline** for notoEnviro-final to be production-ready? *(All blocking items above must be resolved before this date.)*
  > **Answer:**

- [ ] **Q36.** Are there any **known bugs or issues** currently reported from field workers or supervisors? Please describe each issue: what happened, which site, which device/browser, and how often. *(Field-reported issues take priority over new feature work.)*
  > **Answer:**

- [ ] **Q37.** Are there any **planned changes to the 13-dam site list** — new sites being added, or any sites being decommissioned — within the next 6 months? *(Affects schema design for `dam_sites` table and onboarding flows.)*
  > **Answer:**

- [ ] **Q38.** Is there a **user-acceptance testing (UAT) window** planned with actual eco-workers or supervisors before go-live? If yes, when and at which site(s)? *(This helps sequence QA and seed data preparation.)*
  > **Answer:**

---

## Quick Priority Guide

| Priority | Question(s) | Reason |
|----------|-------------|--------|
| 🔴 **BLOCKING — Do first** | Q1, Q2 | Two dam sites have no supervisor — attendance approvals are stalled |
| 🔴 **BLOCKING — Do first** | Q6 | Funder identity required before analytics dashboard can be built |
| 🔴 **BLOCKING — Do first** | Q15 | Photo storage provider must be chosen before activity logging step 4 can be completed |
| 🔴 **BLOCKING — Do first** | Q31, Q32 | Production Supabase credentials needed for live RLS testing |
| 🔴 **BLOCKING — Do first** | Q35 | Hard deadline must be known to prioritise remaining scope |
| 🟡 **High — Answer soon** | Q3, Q7, Q8, Q9, Q11 | Unblocks analytics and export feature builds |
| 🟡 **High — Answer soon** | Q16, Q17, Q19, Q20, Q22 | Required to finalise all RLS policies and storage rules |
| 🟢 **Normal — Can wait** | Q24–Q27 | Notifications are an enhancement; not on the critical path |
| 🟢 **Normal — Can wait** | Q28–Q30 | Monitoring setup is recommended but not launch-blocking |
| 🟢 **Normal — Can wait** | Q36–Q38 | Important for QA planning but non-blocking for build |

---

*Questionnaire generated by oluwatosindot · 2026-05-17 · notoEnviro-final*
