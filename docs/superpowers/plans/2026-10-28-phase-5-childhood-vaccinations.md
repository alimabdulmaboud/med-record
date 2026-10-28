# Implementation Plan: Phase 5 — Childhood Vaccination Tracker (Egyptian MOH Schedule)

Implement the official Egyptian Ministry of Health & Population (MOH) childhood immunization tracker for Med Record (سجلي الطبي), adhering to official immunization schedules, strict Postgres RLS, soft-deletes, append-only audit logging, pure milestone calculations, and Arabic-first RTL presentation.

---

## 1. Overview & Architectural Boundaries

- **Official Data Source:** Official Egyptian MOH mandatory childhood schedule (birth, 2m, 4m, 6m, 9m, 12m, 18m) bundled without invented medical dates.
- **Database Tables:** `public.person_vaccinations` referencing `families(id)` and `people(id)`.
- **Row Level Security (RLS):** Default Deny. `SELECT` permitted for family `manager` or active viewer grant on `person_id`. `INSERT`, `UPDATE`, and `DELETE` (soft-archive) strictly restricted to `manager`.
- **Pure Engines:**
  - `vaccine-schedule.ts`: Calculates milestone dates relative to child birth date, checks 30-day grace period for overdue status.
  - `vaccination-view-helper.ts`: Groups by milestone and computes progress statistics (total, completed, pending, overdue, percentage).
- **UI Components:**
  - `VaccinationTracker.tsx` & `RecordVaccinationModal.tsx`.
  - Integration with child profile in `/family/person/[id]` and standalone `/vaccinations` route.

---

## 2. Tasks Breakdown

- **Task 1: Database Migration & RLS Security Suite for Vaccinations**
  - Create `supabase/migrations/20261028140000_phase5_vaccinations.sql`.
  - Define types in `src/types/vaccinations.ts`.
  - Extend `src/lib/family/rls-evaluator.ts` with vaccinations table evaluation.
  - Test all 7 security boundaries in `src/lib/family/__tests__/vaccinations-rls.test.ts`.

- **Task 2: Pure Domain Engine & Family Vaccinations Service**
  - Implement `src/lib/family/vaccinations-service.ts`.
  - Merge official MOH schedule with recorded database entries.
  - Support marking vaccines as completed with administered date, batch number, and health office.
  - Seed realistic Egyptian pediatric vaccination data.
  - Unit tests in `src/lib/family/__tests__/vaccinations-service.test.ts`.

- **Task 3: Interactive Arabic UI Components (VaccinationTracker & RecordVaccinationModal)**
  - Implement `RecordVaccinationModal.tsx` with date picker, health office, batch number.
  - Implement `VaccinationTracker.tsx` with milestone accordion, progress bar, and overdue highlights.
  - Unit tests in `src/components/family/__tests__/VaccinationTracker.test.ts`.

- **Task 4: Person Dashboard Integration & Navigation Wiring**
  - Integrate "التطعيمات" tab into `/family/person/[id]/page.tsx` for children.
  - Wire standalone `/vaccinations/page.tsx`.
  - Update `src/app/family/person/[id]/__tests__/person-dashboard.test.ts`.

- **Task 5: Full Verification, End-to-End Suite & Documentation**
  - Create Playwright E2E spec `e2e/phase5-vaccinations.spec.ts`.
  - Run full Vitest suite, TypeScript check (`tsc --noEmit`), and production Next.js build.
  - Update `docs/PROJECT.md` changelog.
