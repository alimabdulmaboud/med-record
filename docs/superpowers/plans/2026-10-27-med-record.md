# Med Record (سجلي الطبي) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "Med Record" (Arabic-first, RTL, mobile-first PWA) — a family health tracker enabling parents to monitor their own and their children's vitals, WHO growth percentiles, secure medical documents, medications, vaccinations, and generate a 1–2 page Doctor Report (print/PDF + expiring share link).

**Architecture:** Next.js 15 App Router with Root Route (`/`) re-centered on Med Record. Backed by Supabase Postgres with strict RLS and private storage signed URLs, with a resilient local repository fallback for testing and offline/PWA capability. Pure business logic (WHO growth engine, HL7 FHIR/IPS report compiler, Egyptian vaccine schedule, token authorization) tested with Vitest.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Zod, who-growth-standards, Supabase SSR/JS, Vitest.

**Spec:** `docs/specs/2026-10-27-med-record-design.md`

## Global Constraints
- Arabic-first RTL interface with natural Egyptian medical terminology and seamless English toggle.
- Vitals logging UX must be achievable in under 10 seconds on mobile.
- Zero hard-coded magic reference values: WHO LMS growth curves for pediatric percentiles and Z-scores.
- Privacy & security: Tenant isolation via Postgres RLS; private storage bucket using cryptographic signed expiring URLs (never public CDN URLs).
- 100% fake realistic sample data (e.g. أحمد مصطفى, سارة, ياسين); never prompt for real health data.
- Medical disclaimer clearly visible: "سجلي الطبي أداة توثيق ومتابعة شخصية وليست بديلاً عن الاستشارة والتشخيص الطبي المباشر".

## Review Focus
1. **Pediatric vs Adult Differentiation:** Child profile requires head circumference and WHO growth percentiles; adult profile requires blood pressure bands, blood glucose contexts, and HbA1c.
2. **Abnormal Value Flagging:** High/low vitals (e.g., Systolic >= 140, Fasting Glucose >= 126, SpO2 < 95%) must be highlighted with distinct visual indicators and badges.
3. **Expiring Share Link Security:** Expired or revoked share tokens must return HTTP 410 / Revoked screen and never leak health data.
4. **Offline / Fallback Resilience:** When Supabase credentials are in development/local mode, repository fallback must provide full CRUD and document viewing without crashing.
5. **Print & PDF Layout Integrity:** Doctor Report must fit cleanly on standard A4 pages with Arabic typography (Cairo/Tajawal), no overflowing tables or cut-off charts.

---

### Task 1: Foundation, Schemas, and Types

**Files:**
- Create: `src/types/med-record.ts`
- Create: `supabase/migrations/20261027_med_record_schema.sql`
- Create: `src/lib/med-record/standards.ts`
- Test: `src/lib/med-record/__tests__/standards.test.ts`

**Interfaces:**
- Produces: TypeScript types `FamilyMember`, `Measurement`, `GrowthMeasurement`, `Medication`, `MedicalDocument`, `Encounter`, `Vaccination`, `DoctorReport`, `ReportShare`
- Produces: `mapToFHIRIPS(member: FamilyMember, reportData: DoctorReportData): FHIRBundle`

- [x] **Step 1: Write the failing test for HL7 FHIR IPS and LOINC mapping**
- [x] **Step 2: Run test to verify it fails (`npm test src/lib/med-record/__tests__/standards.test.ts`)**
- [x] **Step 3: Implement data models in `src/types/med-record.ts` and standards in `src/lib/med-record/standards.ts`**
- [x] **Step 4: Create Supabase SQL migration `supabase/migrations/20261027_med_record_schema.sql` with RLS policies**
- [x] **Step 5: Run tests and verify they pass**
- [x] **Step 6: Commit changes**

---

### Task 2: Core Domain Engines (WHO Growth, Vaccine Schedule, Vitals Evaluation)

**Files:**
- Create: `src/lib/med-record/who-growth.ts`
- Create: `src/lib/med-record/vaccine-schedule.ts`
- Create: `src/lib/med-record/vitals-evaluator.ts`
- Test: `src/lib/med-record/__tests__/who-growth.test.ts`
- Test: `src/lib/med-record/__tests__/vaccine-schedule.test.ts`
- Test: `src/lib/med-record/__tests__/vitals-evaluator.test.ts`

**Interfaces:**
- Produces: `calculateGrowthPercentiles(ageMonths: number, sex: 'male' | 'female', metrics: { weightKg?: number, heightCm?: number, headCircumferenceCm?: number }): GrowthPercentilesResult`
- Produces: `getEgyptianVaccineSchedule(birthDate: string): ScheduledVaccine[]`
- Produces: `evaluateVitalMeasurement(type: MeasurementType, values: Record<string, number | string>): VitalEvaluation`

- [x] **Step 1: Write failing tests for WHO percentiles, vaccine schedule due dates, and vitals evaluation**
- [x] **Step 2: Run tests to verify failure**
- [x] **Step 3: Implement WHO growth calculation using official LMS tables and `who-growth-standards`**
- [x] **Step 4: Implement Egyptian MOH vaccine schedule engine with due/completed/overdue status**
- [x] **Step 5: Implement adult & pediatric vitals threshold evaluator (normal/abnormal bands)**
- [x] **Step 6: Run tests to verify all pass**
- [x] **Step 7: Commit changes**

---

### Task 3: Storage & Repository Layer with Realistic Mock Seeder

**Files:**
- Create: `src/lib/med-record/storage.ts`
- Create: `src/lib/med-record/mock-data.ts`
- Create: `src/lib/med-record/repository.ts`
- Test: `src/lib/med-record/__tests__/repository.test.ts`

**Interfaces:**
- Produces: `MedRecordRepository` providing CRUD for family members, measurements, documents, medications, visits, vaccinations, and report shares.
- Produces: `generateExpiringSignedUrl(storagePath: string, expiresInSeconds: number): Promise<string>`
- Produces: `seedRealisticMockFamily(): Promise<void>`

- [x] **Step 1: Write failing tests for repository CRUD and expiring signed URL logic**
- [x] **Step 2: Run tests to verify failure**
- [x] **Step 3: Implement `storage.ts` and `mock-data.ts` with comprehensive fake Egyptian family data (Ahmed, Sara, Yassin)**
- [x] **Step 4: Implement `repository.ts` supporting both live Supabase client and resilient local storage fallback**
- [x] **Step 5: Run tests and verify all pass**
- [x] **Step 6: Commit changes**

---

### Task 4: Root Shell, Family Profile Switcher & Fast Measurement Logging (< 10s)

**Files:**
- Create: `src/components/med-record/Header.tsx`
- Create: `src/components/med-record/FamilySwitcher.tsx`
- Create: `src/components/med-record/QuickLogModal.tsx`
- Create: `src/components/med-record/EmergencyBanner.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/profiles/page.tsx`
- Test: `src/components/med-record/__tests__/QuickLogModal.test.tsx`

**Interfaces:**
- Consumes: `MedRecordRepository`, `evaluateVitalMeasurement`
- Produces: Fast quick-log modal supporting Blood Pressure, Glucose, SpO2, Pulse, Temp, Weight, Height, Head Circumference.
- Produces: Dynamic family member switcher with active profile state in React context or URL state.

- [x] **Step 1: Write failing test for QuickLogModal validation and submission**
- [x] **Step 2: Run test to verify failure**
- [x] **Step 3: Build `FamilySwitcher`, `Header`, and `QuickLogModal` with responsive RTL design**
- [x] **Step 4: Re-center `src/app/page.tsx` as Med Record Dashboard with profile summary and quick action buttons**
- [x] **Step 5: Build `src/app/profiles/page.tsx` for adding and editing parent and child profiles**
- [x] **Step 6: Run tests and verify they pass**
- [x] **Step 7: Commit changes**

---

### Task 5: Interactive Measurements & Pediatric WHO Growth Charts

**Files:**
- Create: `src/components/med-record/MeasurementChart.tsx`
- Create: `src/components/med-record/GrowthPercentileChart.tsx`
- Create: `src/app/measurements/page.tsx`
- Test: `src/components/med-record/__tests__/MeasurementChart.test.tsx`

**Interfaces:**
- Consumes: `GrowthPercentilesResult`, `Measurement`, `GrowthMeasurement`
- Produces: Responsive Recharts line curves with reference bands (Green/Yellow/Red) and WHO 3rd, 15th, 50th, 85th, 97th percentile curves.

- [x] **Step 1: Write failing test for chart data formatting and normal range classification**
- [x] **Step 2: Run test to verify failure**
- [x] **Step 3: Implement `MeasurementChart.tsx` for adult and child vitals**
- [x] **Step 4: Implement `GrowthPercentileChart.tsx` for pediatric weight, height, and head circumference**
- [x] **Step 5: Assemble `src/app/measurements/page.tsx` with date-range filters and metric tabs**
- [x] **Step 6: Run tests and verify they pass**
- [x] **Step 7: Commit changes**

---

### Task 6: Secure Medical Document Vault

**Files:**
- Create: `src/components/med-record/DocumentVault.tsx`
- Create: `src/components/med-record/DocumentUploadModal.tsx`
- Create: `src/app/documents/page.tsx`
- Create: `src/app/api/med-record/documents/signed-url/route.ts`
- Test: `src/components/med-record/__tests__/DocumentVault.test.tsx`

**Interfaces:**
- Consumes: `MedicalDocument`, `storage.ts`
- Produces: Filterable document list (Labs, Radiology, Prescriptions, Hospital Reports, Vaccines), tag search, and secure signed download links.

- [x] **Step 1: Write failing test for document upload validation and category filtering**
- [x] **Step 2: Run test to verify failure**
- [x] **Step 3: Implement upload modal with file-type validation (PDF, JPEG, PNG)**
- [x] **Step 4: Implement API route for generating 15-minute expiring signed URLs**
- [x] **Step 5: Assemble `src/app/documents/page.tsx` with search, doctor, and facility filters**
- [x] **Step 6: Run tests and verify they pass**
- [x] **Step 7: Commit changes**

---

### Task 7: Medications Regimen & Doctor Visits Journal

**Files:**
- Create: `src/components/med-record/MedicationsManager.tsx`
- Create: `src/components/med-record/VisitsLog.tsx`
- Create: `src/app/medications/page.tsx`
- Create: `src/app/visits/page.tsx`
- Test: `src/components/med-record/__tests__/MedicationsManager.test.tsx`

**Interfaces:**
- Consumes: `Medication`, `Encounter`
- Produces: Active/Paused/Past medication manager with dose and frequency; Doctor visits journal with follow-up alerts.

- [x] **Step 1: Write failing test for medication status transitions and visit logging**
- [x] **Step 2: Run test to verify failure**
- [x] **Step 3: Implement `MedicationsManager.tsx` with dosage, frequency, and reminder flags**
- [x] **Step 4: Implement `VisitsLog.tsx` with specialty dropdown, diagnosis, and follow-up reminders**
- [x] **Step 5: Assemble `src/app/medications/page.tsx` and `src/app/visits/page.tsx`**
- [x] **Step 6: Run tests and verify they pass**
- [x] **Step 7: Commit changes**

---

### Task 8: Childhood Vaccination Tracker

**Files:**
- Create: `src/components/med-record/VaccinationTracker.tsx`
- Create: `src/app/vaccinations/page.tsx`
- Test: `src/components/med-record/__tests__/VaccinationTracker.test.tsx`

**Interfaces:**
- Consumes: `getEgyptianVaccineSchedule`, `Vaccination`
- Produces: Timeline view of mandatory Egyptian MOH vaccines + optional vaccines, with status badges (Due, Completed, Overdue).

- [x] **Step 1: Write failing test for vaccination timeline and overdue calculation**
- [x] **Step 2: Run test to verify failure**
- [x] **Step 3: Implement `VaccinationTracker.tsx` with mark-as-completed, batch number entry, and date picker**
- [x] **Step 4: Assemble `src/app/vaccinations/page.tsx` with child profile auto-detection**
- [x] **Step 5: Run tests and verify they pass**
- [x] **Step 6: Commit changes**

---

### Task 9: Doctor Report Generator (Print/PDF & Expiring Share Link)

**Files:**
- Create: `src/components/med-record/DoctorReportBuilder.tsx`
- Create: `src/components/med-record/DoctorReportPrintView.tsx`
- Create: `src/components/med-record/ShareModal.tsx`
- Create: `src/app/report/page.tsx`
- Create: `src/app/share/[token]/page.tsx`
- Test: `src/lib/med-record/__tests__/report-generator.test.ts`
- Test: `src/components/med-record/__tests__/DoctorReport.test.tsx`

**Interfaces:**
- Consumes: `DoctorReport`, `ReportShare`, `mapToFHIRIPS`
- Produces: 1–2 page A4 clinical summary with abnormal flags, bilingual headers, and print CSS.
- Produces: Expiring share link with instant revoke toggle and optional 4-digit PIN.

- [x] **Step 1: Write failing test for Doctor Report snapshot generation and expiring share authorization**
- [x] **Step 2: Run test to verify failure**
- [x] **Step 3: Implement `DoctorReportBuilder.tsx` with date-range and section selection**
- [x] **Step 4: Implement `DoctorReportPrintView.tsx` with optimized A4 print layout and Cairo typography**
- [x] **Step 5: Implement `ShareModal.tsx` and the public viewer `src/app/share/[token]/page.tsx`**
- [x] **Step 6: Run tests and verify they pass**
- [x] **Step 7: Commit changes**

---

### Task 10: Emergency Summary Card, Data Sovereignty & Polish

**Files:**
- Create: `src/app/emergency/[memberId]/page.tsx`
- Create: `src/app/settings/page.tsx`
- Create: `src/components/med-record/DataExportModal.tsx`
- Create: `public/manifest.json`
- Test: `src/lib/med-record/__tests__/export.test.ts`
- Test: `e2e/med-record.spec.ts`

**Interfaces:**
- Consumes: Complete family health data
- Produces: High-contrast 1-screen Emergency Card (`/emergency/[memberId]`), JSON & CSV export, "Delete all data" handler, and PWA manifest.

- [x] **Step 1: Write failing tests for data export (JSON & CSV) and emergency summary compilation**
- [x] **Step 2: Run tests to verify failure**
- [x] **Step 3: Implement `/emergency/[memberId]/page.tsx` with one-tap emergency call triggers**
- [x] **Step 4: Implement `/settings/page.tsx` with data export, deletion, and consent disclaimer**
- [x] **Step 5: Configure PWA `manifest.json` and Arabic typography settings**
- [x] **Step 6: Write end-to-end integration test in `e2e/med-record.spec.ts`**
- [x] **Step 7: Run all tests (unit + type-check + lint) and verify clean run**
- [x] **Step 8: Final review, documentation update, and commit**
