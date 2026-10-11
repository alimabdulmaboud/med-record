# Med — Setup and Build Prompts for Google Antigravity

Use these prompts in order. Each one is self-contained, refers to `docs/PROJECT.md`, and ends with acceptance criteria so you can tell when the step is really done.

## 0. How to set up the workspace (once)

1. Create an empty folder named `med` and open it as a workspace in Antigravity.
2. Copy into it: `AGENTS.md` (project root) and `docs/PROJECT.md`, `docs/PROMPTS.md`. Antigravity reads `AGENTS.md` at the start of a session; keep that file short (guides report a size limit of about 12,000 characters per rules file; this one is well under it). If your version only reads `GEMINI.md`, copy `AGENTS.md` to `GEMINI.md`.
3. Create a git repository and commit after every phase, so any phase can be rolled back.
4. For large steps (phases 2, 3, 7, 9) ask the agent to show a plan first and approve it before it writes code. For small steps, let it run.
5. Run prompts one at a time. Do not paste the next one until the acceptance criteria of the current one pass.
6. When something fails, use the "Fix prompt" at the end instead of retyping the problem.
7. Antigravity's interface and feature names change between versions. If a menu or mode named here is missing, use the closest equivalent.

---

## Phase 0 — Orientation (no code)

```
Read AGENTS.md and docs/PROJECT.md completely. Do not write any code yet.

Reply with:
1. A summary of the product in 10 to 15 bullets, in your own words.
2. Every contradiction, gap or ambiguity you find in the spec (especially items marked [ASSUMPTION] or [OPEN]).
3. A proposed phase plan with the order you would build in and why, keeping this rule: roles, permissions and invitations come before any medical screen.
4. The 5 riskiest parts of the build.

Wait for my answers before doing anything else.
```

Acceptance: you agree with the summary and have answered the gaps (or accepted the assumptions).

---

## Phase 1 — Project scaffold

```
Create the project scaffold described in docs/PROJECT.md section 14:
- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui.
- Supabase local development with the Supabase CLI: a supabase/ folder with migrations, config and seed. Add .env.example (no real secrets).
- Arabic-first RTL layout: html dir="rtl" lang="ar", an Arabic font (Tajawal or Cairo), and a simple i18n layer where Arabic is the default locale and all user-facing strings live in message files, not inline in components.
- Folder structure: src/modules/core, src/modules/pediatrics, src/modules/nutrition, plus a module registry file (src/modules/registry.ts) where each module declares its id, name and the clinic setting that enables it.
- Tooling: ESLint, Prettier, Vitest, Playwright, a CI-friendly "npm run check" that runs lint, type-check and unit tests.
- A README with exact commands to install, start Supabase locally, run migrations, seed, start the app and run tests.

Do not build any feature screens yet. Show me the plan first, then implement.
```

Acceptance: `npm run check` passes; the app starts and shows an empty RTL Arabic page; Supabase runs locally; the module registry exists with three entries (core, pediatrics, nutrition).

---

## Phase 2 — Roles, tenancy and security foundation

```
Implement the security foundation in Supabase/Postgres. Read docs/PROJECT.md sections 3, 11 and 12 first.

Create migrations for: clinics, profiles, user_roles (roles: platform_admin, clinic_owner, doctor, receptionist), invitations, audit_log (append-only).

Requirements:
- Every table that belongs to a clinic has clinic_id. Soft delete columns archived_at and archived_by where relevant.
- SQL helper functions: current_clinic_id(), has_role(role), is_platform_admin(). Use SECURITY DEFINER carefully with a fixed search_path.
- Row Level Security enabled on every table, default deny. Policies per role as in section 3.
- Disable public sign-ups at the auth level. Accounts may only be created through the invitation flow (built in the next phase).
- audit_log: insert-only for application code, no update or delete for anyone.
- Seed: one platform_admin, two clinics (a pediatrics clinic and a nutrition clinic), and for each clinic one owner, one doctor and one receptionist, all with documented dev-only passwords.

Write automated database tests proving:
1. A user from clinic A cannot read or write anything of clinic B.
2. A receptionist cannot read tables classified as clinical (create an empty list in code of "clinical tables" that later phases append to, and have the test iterate over it).
3. platform_admin cannot read any table in that clinical list.
4. Nobody can update or delete audit_log rows.

Show me the plan and the schema diagram first, then implement.
```

Acceptance: all four test groups pass; sign-up is disabled; seed works; no table without RLS (a test fails if any public table has RLS off).

---

## Phase 3 — Authentication and invitations

```
Implement invitation-only authentication.

- Login page: email + password only. No Google or other social login, no public sign-up page.
- platform_admin can invite a clinic_owner for a clinic. clinic_owner can invite doctor and receptionist for their own clinic. platform_admin can also invite staff for any clinic. One user can hold multiple roles in the same clinic.
- Invitation: unique token link, expiry (default 7 days), statuses (pending, accepted, expired, revoked). Actions: send, resend, revoke. Email sending can use Supabase's invite email; if not configured locally, show the invite link in the UI for dev and log it.
- Accept-invite page: sets name and password, creates profile and roles from the invitation, then signs in and redirects by role.
- Users can be archived and restored (never hard-deleted). Archived users cannot sign in.
- Session timeout (default 30 minutes idle) and a "sign out everywhere" option.
- Every invitation, acceptance, role change, archive and restore writes to audit_log.

Write tests: expired and revoked tokens fail; accepting twice fails; an owner cannot invite into another clinic; a receptionist cannot invite anyone; archived users cannot log in.
```

Acceptance: you can invite yourself as owner of the seeded clinic, accept, and log in; all tests pass.

---

## Phase 4 — Platform admin console

```
Build the platform_admin console at /admin. It must never show medical content.

Screens:
1. Clinics: list, create, edit name, suspend/unsuspend, archive/restore. Suspended clinics cannot sign in.
2. Users: list across clinics with role and status; archive/restore; resend or revoke invitations.
3. Invitations: list with status; invite a clinic owner for a clinic.
4. Audit log viewer: filter by clinic, actor, action, date. Only admin-level actions are visible here, never clinical views.

Show counts only (e.g. number of users per clinic), never patient names or clinical data. Add a visible banner on the console: "هذه اللوحة لا تعرض أي بيانات طبية".

Add a Playwright test that logs in as platform_admin and verifies no route under /admin can display patient or visit data.
```

Acceptance: you can create a clinic, invite its owner, suspend it, archive it and restore it; tests pass.

---

## Phase 5 — Clinic settings

```
Build the clinic settings page for clinic_owner (read-only view for others).

Settings with validation and defaults (docs/PROJECT.md sections 6 and 9):
- Clinic name, logo upload, address, phone, doctors' display names and titles for the letterhead.
- Consultation price (per visit type: new, follow-up, quick consult).
- Enabled modules (pediatrics, nutrition) using the module registry.
- Queue: arrive_before_minutes (15), skip_alert_minutes (60), urgent_enabled (false), urgent_fee_multiplier (3), end_of_day_time.
- When enabling urgent_enabled, show a confirmation that states the clinic is responsible for this practice, and log the activation with the user and time.
- Growth chart standard and vaccination schedule template are chosen in the pediatrics module later.

Settings changes are audit logged with before/after values.
```

Acceptance: settings persist; invalid values are rejected; enabling urgent requires the confirmation and appears in the audit log.

---

## Phase 6 — Patients and guardians

```
Build patient and guardian management for reception and doctors. Read docs/PROJECT.md section 11 first.

Model: patients and guardians are separate tables linked through patient_guardians. A guardian phone number is NOT unique and may be shared by siblings. Patients do not have logins.

Features:
- Register a patient with a guardian in one flow. If the guardian phone already exists, show the existing guardian and let the user attach the new patient to it (siblings).
- Search by name or phone with fast results; if several matches, show them for selection.
- Duplicate warning before creating a patient with the same name + date of birth + guardian.
- Edit, archive, restore. No hard delete.
- Receptionist sees demographics, guardian contact and booking info only. Doctors also see clinical history (added later).
- Adult patients (e.g. nutrition clinic) can be their own contact: allow a guardian record of type "self".
- Age is calculated from date of birth and shown in months for under 2 years, years and months for under 5, years afterwards.

Add tests for sibling linking, duplicate warning, search by partial phone, archive/restore, and RLS (receptionist cannot read clinical tables).
```

Acceptance: you can register two siblings under one phone and find both by that phone; tests pass.

---

## Phase 7 — Appointments and the queue engine

```
Implement appointments and the queue engine. This is the heart of the product. Read docs/PROJECT.md sections 5, 6 and 8 carefully.

Build the ordering logic as a PURE TypeScript module (no database access) with exhaustive unit tests, then connect it to the database through SQL functions or server actions.

States: booked, waiting, in_consultation, completed, left, no_show, cancelled. Every transition stores a timestamp and actor in queue_events.

Rules (all values come from clinic settings):
- Order by arrival time.
- Booked patients must be present arrive_before_minutes before the appointment; otherwise they are placed at the end of the patients waiting at the time they arrive.
- Critical priority goes to the front immediately.
- Paid urgent (only when enabled): placed right after the patient currently in consultation; price multiplied; reason and approver required; logged.
- Manual reorder requires a reason; logged.
- Skip detection: a waiting patient is "skipped" when a later arrival was called first. If skipped for skip_alert_minutes, create an alert for reception. Reception can snooze (still waiting) or mark left.
- End-of-day job (scheduled): all entries not in a terminal state become left with auto_closed = true.

Unit tests must include at least these scenarios:
1. Booked 17:00, arrives 17:10 (late) while a walk-in who arrived 16:50 is waiting: walk-in first, then the booked patient.
2. Booked 17:00, arrives 16:40: keeps booking priority by arrival order.
3. Critical patient arrives after five people waiting: goes first.
4. Urgent paid when disabled: rejected. When enabled: placed after the current consultation, price tripled, event logged.
5. Skip alert fires after 60 minutes and not before; snooze delays the next alert.
6. End-of-day closes waiting patients as left with auto_closed true and does not touch completed ones.
7. Manual reorder without reason is rejected.

Show me the plan first. After implementing, list any rule you had to interpret and how.
```

Acceptance: all seven scenarios are green; the engine has no dependency on the database; every transition appears in queue_events.

---

## Phase 8 — Reception dashboard

```
Build the reception dashboard at /reception.

- Live queue (Supabase Realtime) showing patient name, guardian phone, doctor, state, arrival time and waiting time, with the order the engine computes.
- One-tap actions: check in, call, mark left, mark no-show, cancel, mark paid/unpaid, set priority (critical, or urgent when enabled), reorder with reason.
- Counters: waiting now, in consultation, completed today, left today.
- Alert panel for skipped patients (snooze / mark left).
- Quick booking form (patient search or create, doctor, time) and today's appointment list.
- Receptionist never sees clinical content; the screen must contain none.
- Connection-status banner. Large tap targets, usable on a tablet.

Add Playwright tests for check-in, calling the next patient, a skip alert flow, and for realtime update between two browser sessions.
```

Acceptance: two browsers (reception and doctor) stay in sync; every action is one or two taps.

---

## Phase 9 — Doctor dashboard and the core visit

```
Build the doctor dashboard and the core visit record. Read docs/PROJECT.md sections 7.1 and 12.

- Doctor sees their queue, number waiting and how long, and a "call next" action that moves the patient to in_consultation.
- Opening a patient shows a timeline of previous visits, allergies in a prominent banner, chronic conditions, current medications and measurement charts.
- Visit form: complaint, measurements (weight, height, temperature, pulse, blood pressure, oxygen), diagnosis (free text + clinic-editable common diagnoses), prescription items, lab requests and typed results, notes, follow-up date. Support saved templates for visits and repeated prescriptions.
- Completing the visit moves the queue entry to completed and records price and paid status.
- Opening a patient's clinical record writes an audit_log entry (who, when, which patient).
- Append all new clinical tables to the "clinical tables" list used by the RLS tests from Phase 2.

Tests: platform_admin and receptionist are denied on every clinical table; a doctor in clinic A cannot open a patient of clinic B; audit entry written when a record is opened.
```

Acceptance: a full walk-through works end to end from check-in to completed; RLS tests pass for all clinical tables.

---

## Phase 10 — Prescription printing

```
Implement the printable prescription.

- A4 and A5 layouts, RTL, with the clinic letterhead from settings (logo, clinic name, doctor name and specialty, phone, address).
- Includes patient name and age, date, prescription items (name, dose, frequency, duration, instructions), advice, next visit date.
- Use a dedicated print stylesheet and the browser print dialog. No external PDF service.
- A "Print" button on the visit screen and a "Reprint" action in history. Printing is audit logged.
- Do not change any dose or text automatically. The doctor's typed text is printed as written.
```

Acceptance: output looks correct on A4 and A5 print preview in Arabic with no cut-off text.

---

## Phase 11 — Pediatrics module

```
Implement the pediatrics module (docs/PROJECT.md section 7.2). It is enabled per clinic through the module registry; clinics without it must not see any of its screens.

1. Birth history and feeding history forms.
2. Growth tracking: weight, length/height, head circumference, BMI-for-age. Compute percentile and Z-score with the LMS method from OFFICIAL reference tables loaded as data files (WHO child growth standards and the CDC reference). The doctor chooses the standard per clinic in settings. Never invent or recall reference numbers from memory; if the official tables are not in the repo, stop and tell me exactly which files to download and where to place them, and write the loader and tests so that they work once the files exist. Draw the growth chart with the patient's points at every visit. Support corrected age for premature babies as an option.
3. Vaccinations: a clinic-editable schedule template (vaccine name, target age, dose number) that ships empty. Each patient gets a vaccination record (date, dose number, batch number, site) with due and overdue indicators. Do not hardcode any schedule from memory.
4. Simple developmental milestone checklist by age band, as editable data.
5. Structured clinical exam fields by body system, with a template.

Unit tests for the LMS calculations using a few published reference examples that I will provide, and tests that clinics without the module cannot reach its routes or data.
```

Acceptance: growth charts render from official tables; the vaccination schedule can be filled in from the Ministry's current schedule; module toggle works.

---

## Phase 12 — Nutrition module

```
Implement the nutrition module (docs/PROJECT.md section 7.3), enabled per clinic.

1. Initial assessment form: goal, weight history, previous diets, relevant conditions, supplements and medications, lifestyle.
2. Anthropometry: weight, height, BMI, waist, hip, waist-hip ratio, arm and neck circumference.
3. Body composition: manual entry (body fat %, muscle mass, water, visceral fat, BMR) with date; keep a field for attaching the device report later.
4. Energy needs: BMR formula selectable (default Mifflin-St Jeor), activity factor, target calories and macro split, all editable by the doctor. Show the formula used on the printed plan.
5. Diet history: 24-hour recall or typical day, meals per day, caffeine, eating out, disliked foods, food allergies.
6. Meal plan builder: weekly plan with meals and quantities; save as templates; duplicate a previous plan and edit; printable with clinic letterhead (reuse the print system from Phase 10).
7. Follow-up: weight, measurements and body composition over visits as charts; weekly goals and adherence notes.
8. Lab result fields for the common tests listed in the spec.
9. A doctor-only sensitive-care flag on the patient for history of disordered eating.

No food composition database in v1. Use free text and doctor-built reusable lists.
```

Acceptance: a doctor can create a plan from a template in under a minute, print it, and see weight progress across three visits on a chart.

---

## Phase 13 — Owner reports

```
Build the owner reports at /owner/reports (docs/PROJECT.md section 8). The owner sees aggregates only, never clinical content.

Reports with filters for date range, doctor and specialty:
- Patients seen per doctor
- New vs follow-up
- Waiting time: average, median, by hour and by doctor
- Left-before-seen count and rate, with auto_closed shown separately
- Appointment no-show rate
- Estimated lost revenue = left count x consultation price, labelled clearly as an estimate
- Paid vs unpaid totals
- Paid-urgent usage count and share

Compute from queue_events timestamps using SQL views. Add tests with a small fixed dataset where the expected numbers are known. Export to CSV.
```

Acceptance: numbers match the test dataset exactly; the owner can open the page on a phone.

---

## Phase 14 — Reminders (manual channel)

```
Implement reminders without a sending channel (docs/PROJECT.md section 10).

- Table reminders and a notification_channel abstraction with one implementation: manual.
- A daily Reminders screen for reception listing patients with appointments the next day and follow-ups due, each with a ready Arabic message to copy and a "reminded" button that records time and user.
- Message templates editable by the clinic, with placeholders for patient name, doctor, date and time.
- Design the interface so a WhatsApp or SMS channel can be added later without changing the screen or the table.
```

Acceptance: reception can process tomorrow's list in a few clicks; adding a new channel needs only a new class.

---

## Phase 15 — Hardening and handover

```
Prepare for real use.

1. Security review: list every table and its RLS policies in a markdown report; run the full RLS test suite; attempt cross-clinic reads through every API route and report results.
2. Data export: a clinic-level export of all clinic data in open formats (JSON and CSV), available to the owner and logged.
3. Backups and restore: document and script a tested backup and restore procedure.
4. Accessibility and Arabic quality pass on all screens (contrast, tap target size, RTL alignment, no mixed-direction glitches in numbers and dates).
5. Performance: check queue screens with 300 entries and patient search with 50,000 patients; add indexes where needed.
6. Seed realistic demo data for both clinic types (fictional names only).
7. Write docs/OPERATIONS.md: environments, secrets, deploy steps, how to add a new specialty module, and how to onboard a new clinic.

Do not remove any test to make the suite pass. Report anything you could not verify.
```

Acceptance: security report has no unexplained gaps; export and restore were actually tested; documentation exists.

---

## Fix prompt (reuse any time)

```
Something is wrong. Do not guess.

Observed: <what happened, with exact error text or screenshot>
Expected: <what should happen according to docs/PROJECT.md section X>

First reproduce it with a failing automated test. Then find the root cause and fix it. Run the full check afterwards. Tell me what the cause was, what you changed, and whether any other place has the same bug.
```

## Spec-change prompt (reuse when a decision changes)

```
A product decision changed: <describe>.

Update docs/PROJECT.md first (and AGENTS.md if a rule changed). Then list every file, migration and test that must change, show me the plan, and only then implement. Keep the changelog at the bottom of docs/PROJECT.md up to date.
```