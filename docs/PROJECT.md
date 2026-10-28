# Med — Clinic Management Platform (working name)

Version 0.1 · 2026-10-10 · Owner: Ali

This is the single source of truth for what we are building. Every build prompt in `docs/PROMPTS.md` refers back to this file. If code and this file disagree, this file wins until it is edited on purpose.

Items marked **[ASSUMPTION]** were not explicitly decided; they are sensible defaults and should be confirmed or changed. Items marked **[OPEN]** are unresolved decisions (collected in section 15).

---

## 1. What this is

A multi-clinic SaaS that runs the patient's path through a clinic: booking, arrival, a live waiting queue, the doctor's visit (measurements, medications, labs, notes), a printed prescription, and a short owner report. It is sold to clinics. The first two buyers are a **pediatrics clinic** and a **nutrition clinic**.

Architecture idea: **one shared core + one module per specialty**. The core covers everything every clinic needs. A specialty module adds the fields, charts and templates that specialty needs. Version 1 ships the core plus two modules (Pediatrics, Nutrition). More specialties are added later by the same pattern, not by rewriting the core.

## 2. Lessons carried over from the previous attempt (Medflow)

- Roles were not built from day one. **Roles and permissions are built first, before any medical screen.**
- There was no platform-level admin for the product owner. **A `platform_admin` role exists from the start.**
- It was not possible to delete a patient, a clinic or an employee, nor to invite an employee. **Archive/restore and invitations are built in the first phase.**
- Sign-in was open (e.g. Google). **Access is by invitation only.**

## 3. Roles and permissions

There are four roles. A user belongs to exactly one clinic (except `platform_admin`) and may hold more than one role inside that clinic (e.g. a doctor who is also the owner).

| Role | Who | Can | Cannot |
|---|---|---|---|
| `platform_admin` | Ali (product owner) | Create/suspend/archive/restore clinics; invite clinic owners (and staff on request); manage users and invitations; see clinic metadata and subscription status; read audit log of admin actions | **Read any medical content** (visit notes, diagnoses, measurements, medications, labs, nutrition plans, growth data). Decided: no clinical access for this role. |
| `clinic_owner` | Clinic owner | Manage clinic settings (queue rules, prices, letterhead); invite/archive own staff; see owner reports (aggregates) | Read clinical content **[ASSUMPTION: no, unless the same person also holds the `doctor` role]** |
| `doctor` | Physician / nutritionist | See own clinic's queue; open patient records; write visits, measurements, medications, labs, plans; print prescriptions | Manage staff; see other clinics |
| `receptionist` | Front desk | Register patients and guardians; book; check in; manage the queue; mark paid/unpaid; see waiting counts and times | Read clinical content (notes, diagnoses, meds, labs, measurements) |

Notes:
- Only demographics, booking, queue and payment-status data are visible to the receptionist.
- Cross-clinic isolation is absolute: nobody sees another clinic's data.
- Who may invite staff: owner invites own staff; `platform_admin` may also do so. **[ASSUMPTION]**

## 4. Scope

### 4.1 In scope for v1

1. Auth by invitation only (email + password via invite link). No self-signup, no Google/social login.
2. Platform admin console: clinics, users, invitations, archive/restore.
3. Clinic setup: letterhead, specialties/modules enabled, consultation price, queue settings.
4. Patients and guardians (separate entities, see section 11).
5. Appointments (with time) **and** a live walk-in queue, both in every clinic.
6. Queue engine with timestamps per state, skip alerts, critical and paid-urgent priority.
7. Reception dashboard (queue, counts, waiting time, alerts) and doctor dashboard (queue, patient history).
8. Core visit record: complaint, measurements over time with charts, medications, labs (typed results), diagnosis, notes, follow-up date.
9. Pediatrics module and Nutrition module (section 7).
10. Printable prescription with clinic letterhead; printable nutrition plan.
11. Minimal billing: consultation price + paid/unpaid.
12. Owner reports (section 8).
13. Reminders list for reception (section 10).
14. Audit log; archive instead of delete.
15. Arabic-first RTL interface.

### 4.2 Out of v1 (architecture must leave room, but do not build)

- Patient app / patient portal / patient login
- WhatsApp or SMS sending (postponed; see section 10)
- Lab integrations (results are typed in; stored as structured data so integration is possible later)
- Insurance
- Inventory / pharmacy
- Telemedicine / video
- Invoicing, taxes, receipts, debts, discounts
- Permanent (hard) deletion of anything **[OPEN]**
- Platform-admin "support access" to clinical data (would require clinic-granted, logged permission)
- Egyptian food composition database (nutrition plans use free text + small doctor-built lists in v1)
- Automatic drug-dose calculators (the doctor types the dose in v1)

### 4.3 Cheap "ready for later" decisions (do these, nothing more)

- Patient is its own table, independent of any login account.
- Lab results are stored as structured rows (name, value, unit, date), not only free text.
- Notifications go through one `notification_channel` abstraction; no channel is enabled in v1.
- Specialty modules are registered in one place (a module registry) and enabled per clinic.
- Billing fields live on the visit (price, paid flag) and can be extended later.

## 5. Patient journey and states

Every clinic uses both appointments and a walk-in queue.

States of a queue entry (each transition stores a timestamp and who did it):

| State | Arabic label | Meaning |
|---|---|---|
| `booked` | محجوز | Has an appointment, not arrived |
| `waiting` | في الانتظار | Arrived, waiting |
| `in_consultation` | داخل الكشف | With the doctor |
| `completed` | تم | Visit finished |
| `left` | مشي | Left before seeing the doctor (manual, or auto-closed at end of day) |
| `no_show` | لم يحضر | Booked, never arrived |
| `cancelled` | ملغي | Cancelled |

Terminal states: `completed`, `left`, `no_show`, `cancelled`.

Every report in section 8 is computed from these timestamps, so state changes must be reliable and cheap for the receptionist (one tap).

## 6. Queue rules (all configurable per clinic; defaults shown)

1. **Order is by arrival time.** A booked patient has priority only if present on time.
2. **Grace rule:** a booked patient must be present at least `arrive_before_minutes` (default **15**) before the appointment. If later, the patient loses booking priority: the next waiting patient is served first and the late patient is placed after them. **[ASSUMPTION]** Implementation: a late booked patient is inserted at the end of the patients currently waiting at arrival time.
3. **Critical case:** registered as `critical`, goes to the front immediately.
4. **Paid urgent (optional):** disabled by default. When a clinic enables it, an urgent patient is placed right after the patient currently in consultation and the consultation price is multiplied by `urgent_fee_multiplier` (default **3**). Every use is logged with reason and approver (doctor or owner), and shown in the owner report. Responsibility sits with the clinic and the activation screen must say so.
5. **Manual reorder:** reception can move a patient; a reason is required and logged.
6. **Skip alert:** if a waiting patient has been skipped (someone who arrived later was called first) and `skip_alert_minutes` (default **60**) pass, reception gets an alert: "this patient has not entered". Reception chooses **still waiting** (snooze, alert again later) or **left**.
7. **End of day:** any entry not in a terminal state is closed as `left` and flagged `auto_closed = true`. Reports count it as `left` but can separate auto-closed from manually recorded.

## 7. Specialty modules

The full field catalogue is in the separate document "دليل البيانات الطبية: وحدة الأطفال ووحدة التغذية" (Claude Doc). This section is the v1 cut. Every item there marked "(v1)" is in; items marked "(لاحقاً)" are out. Doctors must still confirm the list.

### 7.1 Shared core (all specialties)

- Visit: date, doctor, type (new / follow-up / quick consult), chief complaint, queue timestamps, price, paid flag.
- Measurements: weight, height, temperature, pulse, blood pressure, oxygen saturation; each dated, charted over time.
- Medical history, chronic conditions, allergies (shown prominently), current and previous medications.
- Diagnosis: free text plus a clinic-editable list of common diagnoses.
- Prescription items: name, dose, frequency, duration, instructions; saved templates for repeated prescriptions.
- Lab requests and typed results (name, value, unit, date).
- Visit notes, plan, next follow-up date; visit templates to reduce typing.

### 7.2 Pediatrics module

- Birth history: gestational age, delivery type, birth weight/length/head circumference.
- Growth: weight, length/height, **head circumference** (young children), BMI-for-age; percentile and Z-score computed from official reference tables; chart drawn at every visit. Which standard to use (e.g. WHO for young children) is a **clinic setting chosen by the doctor**. Do not invent or hardcode reference values from memory; load official LMS tables.
- Feeding history: breast/formula/mixed, formula type, start of solids, vitamin D and iron.
- Vaccinations: per-vaccine record (name, date, dose number, batch number, site). The schedule is a **template editable by the clinic**; it ships empty/placeholder and must be filled from the current official Ministry of Health schedule and any private vaccines the clinic uses. Do not hardcode ages from memory. Show due/overdue.
- Development milestones (simple checklist by age band) — basic only.
- Clinical exam as structured text fields by body system, templated.
- Common diagnoses list (asthma, recurrent respiratory infections, food allergy, anemia, etc.).

### 7.3 Nutrition module

- Initial assessment: goal (weight loss, gain, muscle, diabetes, blood pressure, pregnancy/breastfeeding, GI, sports), weight history, previous diets, relevant conditions, supplements and medications, lifestyle (sleep, activity, work, smoking).
- Anthropometry: weight, height, BMI, waist, hip, waist-hip ratio, arm and neck circumference.
- Body composition (manual entry v1): body fat %, muscle mass, water, visceral fat, BMR; attach the device report later.
- Energy needs: BMR formula and activity factor are **doctor-adjustable** (default Mifflin-St Jeor), target calories, macro split, water.
- Diet history: 24-hour recall or typical day, meals per day, snacks, caffeine, eating out, disliked foods, food allergies.
- Meal plan: weekly plan builder with meals and quantities; **saved plan templates** (most important time saver); printable with clinic letterhead.
- Follow-up: weight/measurements/body-composition over visits as charts; adherence notes; weekly goals.
- Lab fields: fasting glucose, HbA1c, lipids, thyroid, vitamin D, B12, ferritin/iron, liver and kidney function, uric acid (result fields, not free text).
- Optional doctor flag on a patient with a history of disordered eating so plans are written with care. Later, medical review needed.
- If a nutrition clinic sees children, growth charts come from the pediatrics module (clinic enables both). **[OPEN]**

## 8. Owner reports

Owner sees aggregates, not clinical content. Filter by date range, doctor, specialty.

- Patients seen per doctor.
- New vs follow-up visits.
- Waiting time: arrival to entering consultation (average, median, by hour and by doctor).
- Left-before-seen count and rate, with auto-closed shown separately.
- No-show rate for appointments.
- **Estimated lost revenue** = number of `left` patients × the clinic's consultation price (clearly labelled as an estimate).
- Paid vs unpaid totals (minimal billing only).
- Paid-urgent usage count and share.

## 9. Printing

- Prescription: A4 and A5 print layout, RTL, clinic letterhead (logo, clinic name, doctor name and specialty, phone, address), patient name and age, date, items, advice, next visit. Printed via the browser print dialog with a dedicated print stylesheet.
- Nutrition meal plan printable in the same style.

## 10. Reminders (v1)

Decision: WhatsApp is postponed. Reminders remain a must-have, so v1 delivers the **reminder engine without a sending channel**:

- A daily "Reminders" list for reception: patients with appointments tomorrow (and follow-ups due), a ready Arabic message text to copy, and a "reminded" button with timestamp.
- The `notification_channel` abstraction exists, with a `manual` channel only. WhatsApp or SMS will be plugged in later.
- Cost and channel choice are decided later **[OPEN]**.

## 11. Data model (high level)

All clinical and operational tables carry `clinic_id`. Soft delete via `archived_at` / `archived_by`. Timestamps in UTC; clinic timezone `Africa/Cairo`.

- `clinics` — name, status, settings (JSON): queue rules, prices, letterhead, enabled modules.
- `profiles` — user id, clinic id, display name.
- `user_roles` — user id, clinic id, role.
- `invitations` — email, clinic id, roles, invited by, status, expiry.
- `guardians` — name, phone(s), relation notes. Phone is **not unique**.
- `patients` — internal id, name, date of birth, sex, notes; no login.
- `patient_guardians` — links a patient to one or more guardians (siblings share a guardian).
- `appointments` — patient, doctor, scheduled time, status.
- `queue_entries` — visit/day, patient, doctor, priority type, state, arrival and per-state timestamps, order key, `auto_closed`, skip/alert data.
- `queue_events` — every transition and manual reorder: who, when, reason.
- `visits` — links queue entry to clinical record; type; price; paid.
- Clinical: `visit_notes`, `measurements`, `allergies`, `medical_history`, `prescriptions` + `prescription_items`, `lab_orders` + `lab_results`.
- Pediatrics: `birth_history`, `feeding_history`, `vaccine_templates`, `vaccinations`, `milestones`, `growth_reference_tables`.
- Nutrition: `nutrition_assessments`, `body_composition`, `energy_plans`, `diet_history`, `meal_plans`, `meal_plan_templates`.
- `reminders` — appointment, due date, channel, status.
- `audit_log` — append-only: actor, clinic, action, entity, before/after summary, timestamp.

## 12. Security and privacy requirements

1. Row Level Security on every table, keyed by clinic and role. Default deny.
2. `platform_admin` has **no** policy granting read access to clinical tables. This must be tested.
3. `receptionist` has no read access to clinical tables.
4. No self-signup; sign-ups disabled at the auth provider level; accounts are created only from valid invitations.
5. Audit log of: invitations, role changes, archive/restore, queue overrides, priority use, settings changes, and **opening a patient's clinical record**.
6. Archive instead of delete; restoring is possible; archived records are hidden from normal screens.
7. Data export for a clinic on request (open format) — legally important for contracts.
8. Strong password rules, session timeout, optional 2FA later.
9. Backups with tested restore.
10. Hosting region and legal basis for health data under Egyptian personal data protection rules to be confirmed by the owner before real patient data is loaded **[OPEN]**.

## 13. Non-functional requirements

- Arabic-first, RTL by default; English strings possible later (i18n from day one).
- Clinical numerals in Western digits by default; setting for Arabic-Indic.
- Realtime queue updates between reception and doctor screens.
- Fast reception actions: every queue transition is one tap.
- Tablet and desktop first; phone-friendly for the owner reports.
- Visible connection-status banner; offline mode not in v1.
- Accessible contrast and large tap targets at reception.

## 14. Tech stack **[ASSUMPTION]**

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui · Supabase (Postgres, Auth, Realtime, Row Level Security) · Recharts for charts · Vitest and Playwright for tests · Arabic font such as Tajawal or Cairo. Swap any of these if you prefer; keep Postgres with RLS because the permission model depends on it.

## 15. Resolved decisions (Phase 0 alignment)

1. **Permanent deletion:** Strictly soft-delete (`archived_at` / `archived_by`) in v1. No UI or API for hard deletion.
2. **Clinic owner reading clinical content:** Strictly NO, unless the same person also holds the `doctor` role.
3. **Staff invitations:** Both `clinic_owner` (own staff) and `platform_admin` (any clinic / owner) can invite. All logged.
4. **Late-arrival placement rule:** A late booked patient is inserted at the end of the patients currently waiting at the time of arrival.
5. **Reminder channel:** Ships with `manual` channel (copy-to-clipboard for reception). WhatsApp/SMS integration postponed.
6. **Support access:** Strictly no platform-admin access to clinical tables in v1.
7. **Hosting & region:** Supabase EU (Frankfurt) for v1; store UTC, presentation in Africa/Cairo.
8. **Vaccination & Growth data:** Official Egyptian MOH mandatory childhood schedule bundled as static seed template; WHO Child Growth Standards (0-5y and 5-19y) LMS tables loaded directly from official WHO data.
9. **Nutrition treating children:** No separate module required; clinics enable both `pediatrics` and `nutrition` modules. Reusable clinical growth chart component shared.
10. **Doctor field catalogue:** Core fields required, specialty fields optional/collapsible with quick-entry templates.

---

## Changelog

- 2026-10-28 — Phase 2 (Rapid Measurements & WHO Growth Engine): Postgres RLS schema for `person_measurements`, sub-10-second QuickLogModal with steppers and live abnormality evaluations (AHA/ADA), official WHO LMS growth curves for pediatric weight, height, and head circumference percentiles/Z-scores, interactive Recharts trend graphs, and complete Person Health Dashboard at `/family/person/[id]`.
- 2026-10-27 — Phase 1 (Family Space Foundation): Dual-entry portal, open-signup family space, invitation-only clinic gateway stub, Postgres RLS on `families`, `family_members`, `people`, `viewer_grants`, `consents`, `audit_log`, soft-deletes, settings, and GDPR account wipe.
- 2026-10-11 — v1.0: Full SaaS v1.0 Complete! Phase 15 Hardening and handover finished (docs/SECURITY_REPORT.md, docs/OPERATIONS.md, docs/BACKUP_RESTORE.md, open data export in JSON/CSV, 100% Arabic translation parity verified, 17 test suites and 169 unit tests passing).
- 2026-10-11 — v0.8: Phase 14 completed. Reminders module implemented with extensible NotificationChannel abstraction (manual copy-to-clipboard channel shipped, WhatsApp/SMS ready), template interpolation, and daily reception reminders workspace (/reception/reminders).
- 2026-10-11 — v0.7: Phase 13 completed. Clinic owner reports implemented (/owner/reports) with aggregate KPI cards, wait time hourly Recharts curves, doctor volume distribution, estimated lost revenue, and UTF-8 BOM CSV export (zero clinical data exposed).
- 2026-10-11 — v0.6: Phase 12 completed. Nutrition specialty module delivered with BMR (Mifflin-St Jeor / Harris-Benedict / Katch-McArdle) and TDEE energy engine, macro splits, InBody tracking, meal plan builder, and printable patient meal plan.
- 2026-10-11 — v0.5: Phase 11 completed. Pediatrics specialty module delivered with WHO Child Growth Standards (LMS percentile and Z-score calculation), premature baby corrected age, official Egyptian MOH mandatory vaccination schedule, developmental milestones checklist, and interactive Recharts growth charts.
- 2026-10-11 — v0.4: Phase 10 completed. Printable prescription implemented with A4 and A5 layouts, official clinic letterhead from settings, browser print stylesheet, reprint action in history, and audit logging for print events.
- 2026-10-11 — v0.3: Phase 9 completed. Activated 10 core clinical tables with doctor-only RLS, audit log on clinical chart open, doctor dashboard (/doctor) with vital signs charts and prescription builder, and verified with Playwright e2e test suite.
- 2026-10-10 — v0.2: Phase 0 decisions aligned and ratified (strict soft-delete, owner denied clinical access without doctor role, both owner & admin invite, late arrival placed at end of current waiting, Egyptian MOH seed + WHO LMS tables).
- 2026-10-10 — v0.1: first version from the scoping interview. WhatsApp postponed; reminders ship as a manual list. Platform admin has no access to medical content.



