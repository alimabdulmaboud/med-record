# Implementation Plan: Phase 6 — Bilingual Doctor Report Generator (A4 Print / PDF & Expiring Share Link)

Implement the bilingual Doctor Report Generator and expiring cryptographic share links for Med Record (سجلي الطبي), adhering to International Patient Summary (IPS) standards, strict Postgres RLS, 72-hour expiring links with optional PIN, clean A4 print stylesheets, and Arabic-first presentation.

---

## 1. Overview & Architectural Boundaries

- **Bilingual IPS Architecture:** Synthesizes patient vitals (with abnormal highlights), pediatric growth Z-scores/percentiles, active medications, allergies/conditions, recent consultations, and labs into a clean 1–2 page A4 summary.
- **Database Tables:** `public.doctor_reports` and `public.report_shares` referencing `families(id)` and `people(id)`.
- **Row Level Security (RLS):** Default Deny. `SELECT` permitted for family `manager`, active viewer grant on `person_id`, or public token bearer validation. `INSERT`, `UPDATE`, and `DELETE` (soft-archive/revocation) strictly restricted to `manager`.
- **Expiring Share Links:** Cryptographically random 32-character tokens with strict expiry timestamp (default 72h), optional PIN hash verification, access count tracking, and 1-click instant revocation.
- **Print / PDF Layout:** Pure CSS `@media print` layout styled precisely for standard A4 pages with zero UI chrome, page breaks, and high-contrast clinical typography.

---

## 2. Tasks Breakdown

- **Task 1: Database Migration & RLS Security Suite for Reports & Share Links**
  - Create `supabase/migrations/20261028150000_phase6_reports.sql`.
  - Define types in `src/types/reports.ts`.
  - Extend `src/lib/family/rls-evaluator.ts` with reports and shares evaluation.
  - Test all 7 security boundaries in `src/lib/family/__tests__/reports-rls.test.ts`.

- **Task 2: Pure Domain Engine & Family Reports Service**
  - Implement `src/lib/family/reports-service.ts`.
  - Compiler function uniting vitals, growth curves, medications, encounters, documents, and vaccinations.
  - Cryptographic token generation, 72-hour expiration, PIN verification, access counting, and instant revocation.
  - Unit tests in `src/lib/family/__tests__/reports-service.test.ts`.

- **Task 3: Interactive Bilingual UI Components (A4 Print View, Report Builder & Share Modal)**
  - Implement `DoctorReportModal.tsx` for date ranges and section customization.
  - Implement `DoctorReportView.tsx` with professional A4 print stylesheet and bilingual headers.
  - Unit tests in `src/components/family/__tests__/DoctorReports.test.ts`.

- **Task 4: Dashboard Integration & Public Share Route Wiring**
  - Add "تقرير الطبيب (A4 / PDF)" action button in `/family/person/[id]/page.tsx`.
  - Connect standalone `/report/page.tsx` and public `/share/[token]/page.tsx` with unified service.
  - Update `src/app/family/person/[id]/__tests__/person-dashboard.test.ts`.

- **Task 5: Full Verification, End-to-End Suite & Documentation**
  - Create Playwright E2E spec `e2e/phase6-doctor-reports.spec.ts`.
  - Run full Vitest suite, TypeScript check (`tsc --noEmit`), and production Next.js build.
  - Update `docs/PROJECT.md` changelog.
