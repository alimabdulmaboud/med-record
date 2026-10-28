# Phase 3: Secure Medical Document Vault Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 3 of Med: a secure medical document repository for family health records (lab results, radiology scans, prescriptions, hospital discharge summaries, vaccination certificates) with cryptographic 15-minute expiring signed URLs, category and tag filtering, drag-and-drop upload with client-side validation, and strict Postgres Row-Level Security isolation.

**Architecture:** Next.js 15 App Router with Supabase Postgres RLS. Documents table (`public.person_documents`) linked to `people.id` and `families.id`, respecting manager (full CRUD) and viewer (read-only with unrevoked unexpired grant) permissions. Cryptographic HMAC signed URLs (`/api/med-record/documents/download`) guarantee zero public CDN leakage of sensitive patient health scans.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide Icons, Supabase SSR/JS, Vitest, Playwright.

**Spec Reference:** `docs/specs/2026-10-27-med-record-design.md` (Section 5 Phase 3 & Section 7).

---

## Global Constraints

- **Arabic-first RTL interface:** Natural Egyptian terminology (تحاليل طبية، أشعة وسونار، روشتات، تقارير خروج ومستشفى، كروت تطعيم) with English toggle support.
- **Strict tenant and person isolation:** All document queries enforce Postgres RLS via `family_id` and `person_id`. Cross-family queries return 0 rows.
- **Zero public CDN URLs:** All medical document downloads enforce cryptographic signed URLs expiring in 15 minutes (900 seconds) via HMAC-SHA token verification.
- **Client-Side File Validation:** Rejects unapproved MIME types; only PDF, JPEG, PNG, and WEBP under 15MB are accepted.
- **Soft deletion:** Documents utilize `archived_at` instead of physical deletion for medical record preservation.
- **Medical privacy disclaimer:** Always visible: "سجلي الطبي أداة توثيق ومتابعة شخصية وليست بديلاً عن الاستشارة والتشخيص الطبي المباشر".

---

## Review Focus

1. **Private Storage Boundary:** No document URL points to an unprotected public bucket; accessing expired or tampered download links returns HTTP 403 Forbidden with `EXPIRED_OR_INVALID_TOKEN`.
2. **Viewer Grant Security:** A user holding a viewer grant on Person A cannot view documents of Person B, and cannot upload, modify, or archive documents.
3. **Category & Tag Multi-filtering:** Filtering by category (e.g. `lab_result`, `radiology`) and text query (e.g. `CBC`, `كوليسترول`) correctly isolates matching records.
4. **Resilient Local Persistence:** Support mock/offline mode seamlessly via localStorage fallback when Supabase is in offline/local mock mode.
5. **Dashboard Integration:** Directly accessible from `/family/person/[id]` via dedicated tab and quick-action upload trigger.

---

### Task 1: Database Migration & RLS Security Suite for Documents

**Files:**
- Create: `supabase/migrations/20261028120000_phase3_documents.sql`
- Create: `src/types/documents.ts`
- Test: `src/lib/family/__tests__/documents-rls.test.ts`

**Interfaces:**
- Produces: `PersonDocument` type and `DocumentCategory` union (`lab_result`, `radiology`, `prescription`, `hospital_report`, `vaccination_card`).
- Produces: Table `public.person_documents` with Postgres RLS:
  - SELECT allowed for manager of family OR viewer with active unrevoked grant on person.
  - INSERT / UPDATE / DELETE allowed exclusively for family managers.

- [ ] **Step 1: Write failing RLS evaluation test for person documents**
- [ ] **Step 2: Run test to verify failure (`npx vitest run src/lib/family/__tests__/documents-rls.test.ts`)**
- [ ] **Step 3: Define TypeScript types in `src/types/documents.ts` and create SQL migration `supabase/migrations/20261028120000_phase3_documents.sql`**
- [ ] **Step 4: Update RLS evaluator simulation in `src/lib/family/rls-evaluator.ts` to cover `person_documents`**
- [ ] **Step 5: Run tests and verify they pass**
- [ ] **Step 6: Commit changes**

---

### Task 2: Family Documents Service & Expiring Signed URL Generation

**Files:**
- Create: `src/lib/family/documents-service.ts`
- Test: `src/lib/family/__tests__/documents-service.test.ts`

**Interfaces:**
- Consumes: `generateExpiringSignedUrl` from `src/lib/med-record/storage.ts`
- Produces:
  - `addPersonDocument(input: CreateDocumentInput): Promise<PersonDocument>`
  - `getPersonDocuments(personId: string, filter?: DocumentFilter): Promise<PersonDocument[]>`
  - `archivePersonDocument(documentId: string): Promise<boolean>`
  - `getDocumentDownloadUrl(documentId: string): Promise<string>`
  - `seedRealisticMockDocuments(people: Person[]): Promise<void>`

- [ ] **Step 1: Write failing tests for `documents-service.ts` covering CRUD, filtering, and expiring URL generation**
- [ ] **Step 2: Run test to verify failure (`npx vitest run src/lib/family/__tests__/documents-service.test.ts`)**
- [ ] **Step 3: Implement `src/lib/family/documents-service.ts` with local fallback & signed URL generation**
- [ ] **Step 4: Run tests and verify they pass**
- [ ] **Step 5: Commit changes**

---

### Task 3: Secure Document Vault Component & Upload Modal

**Files:**
- Create: `src/components/family/DocumentVault.tsx`
- Create: `src/components/family/DocumentUploadModal.tsx`
- Test: `src/components/family/__tests__/DocumentVault.test.ts`

**Interfaces:**
- Consumes: `PersonDocument`, `DocumentCategory`, `addPersonDocument`
- Produces:
  - `DocumentVault`: List of documents with category pills, search bar, tags, secure download trigger, and delete action.
  - `DocumentUploadModal`: Drag-and-drop file upload modal with validation (PDF, JPEG, PNG, < 15MB) and metadata inputs.

- [ ] **Step 1: Write failing test for document validation, category mapping, and filtering**
- [ ] **Step 2: Run test to verify failure (`npx vitest run src/components/family/__tests__/DocumentVault.test.ts`)**
- [ ] **Step 3: Implement `DocumentUploadModal.tsx` and `DocumentVault.tsx`**
- [ ] **Step 4: Run tests and verify they pass**
- [ ] **Step 5: Commit changes**

---

### Task 4: Person Dashboard Integration & Navigation Wiring

**Files:**
- Modify: `src/app/family/person/[id]/page.tsx`
- Test: `src/app/family/person/[id]/__tests__/person-dashboard.test.ts`

**Interfaces:**
- Adds "المستندات والتحاليل الطبية" tab to person dashboard.
- Adds document count badge and "رفع مستند" quick-action button in the dashboard.
- Loads documents via `getPersonDocuments`.

- [ ] **Step 1: Write failing test in `person-dashboard.test.ts` verifying document tab retrieval**
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Update `src/app/family/person/[id]/page.tsx` with Document Vault tab and upload modal trigger**
- [ ] **Step 4: Run tests and verify they pass**
- [ ] **Step 5: Commit changes**

---

### Task 5: Full Verification, End-to-End Suite & Documentation

**Files:**
- Create: `e2e/phase3-documents.spec.ts`
- Modify: `docs/PROJECT.md` (record Phase 3 completion in changelog)

- [ ] **Step 1: Write Playwright E2E test verifying document vault display, category filter, and upload modal**
- [ ] **Step 2: Run `npm run check` (type-check + vitest suite)**
- [ ] **Step 3: Run `npm run build`**
- [ ] **Step 4: Final review, update documentation, and commit**
