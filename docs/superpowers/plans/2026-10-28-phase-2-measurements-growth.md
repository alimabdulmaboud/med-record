# Phase 2: Rapid Measurements & Interactive WHO Growth Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 2 of Med: an ultra-fast (< 10 seconds) Arabic-first vitals and pediatric growth tracking engine directly integrated into the family space, backed by Postgres Row-Level Security, WHO LMS growth curves, abnormal clinical value flagging, and interactive trend charts.

**Architecture:** Next.js 15 App Router with Supabase Postgres RLS. Family measurements table (`person_measurements`) linked to `people.id` and `families.id`, respecting manager (CRUD) and viewer (read-only with unrevoked unexpired grant) access. Domain engines compute official WHO LMS percentiles and Z-scores for pediatric profiles and clinical severity bands (AHA/ADA) for adults.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Recharts, Lucide Icons, `who-growth-standards`, Supabase SSR/JS, Vitest, Playwright.

**Spec Reference:** `docs/specs/2026-10-27-med-record-design.md` (Section 5 Phase 2 & Section 7).

---

## Global Constraints

- **Arabic-first RTL interface:** Natural Egyptian medical terminology (ضغط الدم، سكر صائم، محيط الرأس، النسبة المئوية للنمو) with seamless English support.
- **Strict tenant and person isolation:** All measurement queries enforce Postgres RLS via `family_id` and `person_id`. Cross-family queries return 0 rows.
- **No invented medical data:** Zero hard-coded growth curves; calculations strictly derive from official WHO LMS tables (`who-growth-standards`). Adult thresholds align with standard clinical guidelines (AHA/ADA).
- **Sub-10-second UX:** QuickLogModal supports fast numeric stepping, smart defaults, and single-tap submission on mobile devices.
- **Soft deletion:** Measurements utilize `archived_at` instead of physical deletion for data preservation.
- **Medical disclaimer:** Non-diagnostic disclaimer is always visible: "سجلي الطبي أداة توثيق ومتابعة شخصية وليست بديلاً عن الاستشارة والتشخيص الطبي المباشر".

---

## Review Focus

1. **Pediatric vs. Adult Logic Differentiation:** Logging growth for a child under 19 calculates WHO percentiles (weight-for-age, height-for-age, head circumference-for-age) based on birth date and sex; adult vitals enforce blood pressure and glucose contextual evaluation.
2. **Abnormal Value Flagging:** Critical and high values (e.g., Systolic >= 140, Fasting Glucose >= 126, SpO2 < 95%) must display prominent colored warning badges with clear medical advice.
3. **Viewer Grant Security:** A user holding a viewer grant must only view measurements for granted individuals, and cannot insert, update, or archive measurements.
4. **Resilient Local Persistence:** Support mock/offline mode seamlessly via localStorage fallback when Supabase is in offline/local mock mode.
5. **Chart Responsive Layout:** Recharts graphs must adapt cleanly to mobile viewport widths in RTL mode without clipped labels or overlapping legends.

---

### Task 1: Database Migration & RLS Security Suite for Measurements

**Files:**
- Create: `supabase/migrations/20261028110000_phase2_measurements.sql`
- Create: `src/types/measurements.ts`
- Test: `src/lib/family/__tests__/measurements-rls.test.ts`

**Interfaces:**
- Produces: `PersonMeasurement` type and `MeasurementType` union (`blood_pressure`, `blood_glucose`, `heart_rate`, `spo2`, `temperature`, `weight`, `height`, `head_circumference`, `pediatric_growth`).
- Produces: Table `public.person_measurements` with Postgres RLS:
  - SELECT allowed for manager of family OR viewer with active unrevoked grant on person.
  - INSERT / UPDATE / DELETE allowed exclusively for family managers.

- [ ] **Step 1: Write failing RLS evaluation test for person measurements**
- [ ] **Step 2: Run test to verify failure (`npx vitest run src/lib/family/__tests__/measurements-rls.test.ts`)**
- [ ] **Step 3: Define TypeScript types in `src/types/measurements.ts` and create SQL migration `supabase/migrations/20261028110000_phase2_measurements.sql`**
- [ ] **Step 4: Update RLS evaluator simulation in `src/lib/family/rls-evaluator.ts` to cover `person_measurements`**
- [ ] **Step 5: Run tests and verify they pass**
- [ ] **Step 6: Commit changes**

---

### Task 2: Family Measurements Service & Pure Domain Integration

**Files:**
- Create: `src/lib/family/measurements-service.ts`
- Test: `src/lib/family/__tests__/measurements-service.test.ts`

**Interfaces:**
- Consumes: `calculateGrowthPercentiles` from `src/lib/med-record/who-growth.ts`
- Consumes: `evaluateVitalMeasurement` from `src/lib/med-record/vitals-evaluator.ts`
- Produces:
  - `addPersonMeasurement(data: CreateMeasurementInput): Promise<PersonMeasurement>`
  - `getPersonMeasurements(personId: string, filter?: MeasurementFilter): Promise<PersonMeasurement[]>`
  - `archivePersonMeasurement(measurementId: string): Promise<boolean>`
  - `getLatestVitalsSummary(personId: string): Promise<PersonVitalsSummary>`

- [ ] **Step 1: Write failing tests for `measurements-service.ts` covering calculation, abnormal flagging, and storage**
- [ ] **Step 2: Run test to verify failure (`npx vitest run src/lib/family/__tests__/measurements-service.test.ts`)**
- [ ] **Step 3: Implement `src/lib/family/measurements-service.ts` with local fallback & live Supabase client**
- [ ] **Step 4: Run tests and verify they pass**
- [ ] **Step 5: Commit changes**

---

### Task 3: Mobile-First Quick Log Modal (< 10 seconds UX)

**Files:**
- Create: `src/components/family/QuickLogModal.tsx`
- Test: `src/components/family/__tests__/QuickLogModal.test.tsx`

**Interfaces:**
- Consumes: `addPersonMeasurement`, `Person`
- Produces: Fast modal component with quick stepper buttons (+ / -), numeric inputs, contextual tabs (ضغط الدم، السكر، النبض، الحرارة، الوزن والطول), and real-time normal/abnormal preview.

- [ ] **Step 1: Write failing test for QuickLogModal validation, tab switching, and submit payload**
- [ ] **Step 2: Run test to verify failure (`npx vitest run src/components/family/__tests__/QuickLogModal.test.tsx`)**
- [ ] **Step 3: Implement `src/components/family/QuickLogModal.tsx` with responsive RTL layout**
- [ ] **Step 4: Run tests and verify they pass**
- [ ] **Step 5: Commit changes**

---

### Task 4: Interactive Trend Charts & Pediatric WHO Curves

**Files:**
- Create: `src/components/family/MeasurementChart.tsx`
- Create: `src/components/family/GrowthChart.tsx`
- Test: `src/components/family/__tests__/charts.test.tsx`

**Interfaces:**
- Consumes: `PersonMeasurement`, `GrowthPercentilesResult`
- Produces:
  - `MeasurementChart`: Recharts line chart with normal reference bands (green/yellow/red).
  - `GrowthChart`: Recharts curves plotting WHO 3rd, 15th, 50th, 85th, and 97th percentiles with the child's recorded measurements.

- [ ] **Step 1: Write failing tests for chart data transformation and reference bands**
- [ ] **Step 2: Run test to verify failure (`npx vitest run src/components/family/__tests__/charts.test.tsx`)**
- [ ] **Step 3: Implement `MeasurementChart.tsx` and `GrowthChart.tsx`**
- [ ] **Step 4: Run tests and verify they pass**
- [ ] **Step 5: Commit changes**

---

### Task 5: Person Health Dashboard Page & Family Space Integration

**Files:**
- Create: `src/app/family/person/[id]/page.tsx`
- Modify: `src/components/family/PersonCard.tsx`
- Test: `src/app/family/person/[id]/__tests__/person-dashboard.test.tsx`

**Interfaces:**
- Consumes: `Person`, `PersonMeasurement`, `QuickLogModal`, `MeasurementChart`, `GrowthChart`
- Produces: Comprehensive person health dashboard at `/family/person/[id]` featuring vital summary cards, growth tabs for children, historical table, and quick log modal trigger.
- Updates `PersonCard.tsx` so "تسجيل قياس" opens the quick logger directly, and clicking the card navigates to `/family/person/[id]`.

- [ ] **Step 1: Write failing test for person dashboard rendering, tabs, and quick log trigger**
- [ ] **Step 2: Run test to verify failure (`npx vitest run src/app/family/person/[id]/__tests__/person-dashboard.test.tsx`)**
- [ ] **Step 3: Implement `src/app/family/person/[id]/page.tsx` and connect `PersonCard.tsx`**
- [ ] **Step 4: Run tests and verify they pass**
- [ ] **Step 5: Commit changes**

---

### Task 6: Full Verification, End-to-End Suite & Documentation

**Files:**
- Create: `e2e/phase2-measurements.spec.ts`
- Modify: `docs/PROJECT.md` (record Phase 2 completion in changelog)

- [ ] **Step 1: Write Playwright E2E test verifying measurement logging and WHO chart display**
- [ ] **Step 2: Run `npm run check` (type-check + lint + vitest suite)**
- [ ] **Step 3: Run Playwright tests (`npx playwright test e2e/phase2-measurements.spec.ts`)**
- [ ] **Step 4: Final review, update documentation, and commit**
