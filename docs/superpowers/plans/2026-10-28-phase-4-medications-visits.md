# Implementation Plan: Phase 4 — Medications Regimen & Doctor Visits Journal

Build comprehensive medication scheduling and doctor visit journal tracking for Med Record (سجلي الطبي), adhering to Egyptian clinical conventions, strict Postgres RLS, soft-deletes, append-only audit logging, pure reminder/follow-up engines, and Arabic-first RTL presentation.

---

## 1. Overview & Architectural Boundaries

- **Database Tables:** `public.person_medications` and `public.person_encounters` with foreign keys to `families(id)` and `people(id)`.
- **Row Level Security (RLS):** Default Deny. `SELECT` permitted for family `manager` or active unrevoked viewer grant on `person_id`. `INSERT`, `UPDATE`, and `DELETE` (soft-archive) strictly restricted to `manager`.
- **Privacy & Audit:** Clinical text is never logged. Modifications append audit logs (`medication_created`, `medication_status_changed`, `medication_archived`, `encounter_created`, `encounter_archived`).
- **Pure Engines:**
  - `medications-visits-helper.ts`: Dosage string formatting, 12h Arabic reminder time formatting, Egyptian specialty taxonomy, and follow-up alert status computation (Overdue, Due Today, Due Soon within 7 days).
- **UI Components:**
  - `MedicationModal.tsx` & `MedicationsList.tsx`
  - `EncounterModal.tsx` & `EncountersTimeline.tsx`
  - Integration with `/family/person/[id]` and standalone `/medications` and `/visits` pages.

---

## 2. Tasks Breakdown

- **Task 1: Database Migration & RLS Security Suite for Medications & Encounters**
  - Create `supabase/migrations/20261028130000_phase4_medications_encounters.sql`.
  - Define types in `src/types/medications-encounters.ts`.
  - Extend `src/lib/family/rls-evaluator.ts` with medications and encounters security evaluations.
  - Test all 7 security boundaries in `src/lib/family/__tests__/medications-encounters-rls.test.ts`.

- **Task 2: Pure Domain Engine & Family Medications/Encounters Service**
  - Implement `src/lib/family/medications-encounters-service.ts`.
  - Implement CRUD, status transitions (active -> paused -> completed), soft-delete, and audit logging.
  - Seed realistic Egyptian mock data (Concor, Augmentin, Lantus, pediatric Panadol, etc.).
  - Unit tests in `src/lib/family/__tests__/medications-encounters-service.test.ts`.

- **Task 3: Interactive UI Components with Arabic Presets**
  - Implement `MedicationModal.tsx` with dosage, frequency, and reminder time presets.
  - Implement `EncounterModal.tsx` with Egyptian medical specialties and follow-up date picker.
  - Implement `MedicationsList.tsx` with status filtering and quick toggle buttons.
  - Implement `EncountersTimeline.tsx` with follow-up alert badges.
  - Unit tests in `src/components/family/__tests__/MedicationsEncounters.test.ts`.

- **Task 4: Person Dashboard & Global App Navigation Integration**
  - Add "medications" and "encounters" tabs to `src/app/family/person/[id]/page.tsx`.
  - Wire up `/medications/page.tsx` and `/visits/page.tsx` to use the unified service and components.
  - Add tests in `src/app/family/person/[id]/__tests__/person-dashboard.test.ts`.

- **Task 5: Full Verification, End-to-End Suite & Documentation**
  - Create Playwright E2E spec `e2e/phase4-medications-encounters.spec.ts`.
  - Run full Vitest suite, TypeScript check (`tsc --noEmit`), and production Next.js build.
  - Update `docs/PROJECT.md` changelog.
