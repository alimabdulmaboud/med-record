# Implementation Plan: Phase 7 — Emergency Medical ID, Comprehensive Data Export & Final Verification

Complete the final phase of the Med Record roadmap:
1. One-screen high-contrast Emergency Medical ID (`/emergency` & `/emergency/[memberId]`).
2. Comprehensive GDPR Data Sovereignty Export (JSON & CSV covering vitals, growth, documents, medications, visits, vaccinations, and reports).
3. Complete account erasure with cryptographic verification and audit trail.
4. Security & Privacy verification across all 7 phases.

---

## 1. Architectural Scope & Non-Negotiable Rules

- **Emergency Medical ID (هوية الطوارئ السريعة):**
  - Ultra-high contrast (Dark slate / High-visibility red).
  - One-screen accessibility for paramedics, emergency responders, or family members.
  - Blood type, emergency contacts with direct 1-tap `tel:` phone call buttons, life-threatening drug/food allergies (NKDA or alerts), chronic conditions, and active daily medications with dosage.
  - Accessible without complex authentication (emergency scenario bypass / fast access token).
- **Comprehensive GDPR Data Export:**
  - Export all family entities: `family`, `members`, `people`, `emergency_contacts`, `measurements`, `documents`, `medications`, `encounters`, `vaccinations`, `doctor_reports`.
  - Dual format: Complete JSON bundle + multi-table UTF-8 BOM CSV exports.
  - Rate limiting & family manager authorization checks.
- **Account Erasure & Data Wipe:**
  - Cryptographic confirmation, cascading soft-archive / purge, append-only audit record without clinical leaks.
- **Full Verification:**
  - Vitest test suite for emergency summary, comprehensive export, and erasure.
  - Playwright E2E spec for Emergency ID and Data Export.
  - Production TypeScript & Next.js build validation.

---

## 2. Tasks Breakdown

- **Task 1: Comprehensive Family Data Export & CSV Formatter Engine**
  - Update `src/lib/family/export.ts` to include measurements, documents, medications, encounters, vaccinations, reports.
  - Implement pure CSV generator (`convertFamilyDataToCSV(data)`).
  - Unit tests in `src/lib/family/__tests__/export-comprehensive.test.ts`.

- **Task 2: Emergency Medical ID Domain Engine & Service**
  - Implement `src/lib/family/emergency-service.ts`:
    - `compileEmergencyCard(personId): EmergencyCardPayload` uniting blood type, emergency contacts, severe allergies, active medications, chronic conditions.
  - Unit tests in `src/lib/family/__tests__/emergency-service.test.ts`.

- **Task 3: High-Contrast Emergency Medical ID UI (`/emergency/[memberId]` & `/emergency`)**
  - Upgrade `/emergency/page.tsx` and `/emergency/[memberId]/page.tsx`.
  - High-contrast visual cards, 1-tap phone calling, fast switcher between family members, exit button to family dashboard.
  - Test in `src/components/family/__tests__/EmergencyCard.test.ts`.

- **Task 4: Family Settings Integration (Data Export & Account Erasure UI)**
  - Wire comprehensive JSON & CSV download into `src/app/family/settings/page.tsx`.
  - Wire export API `/api/family/export`.
  - Verify account deletion flows.

- **Task 5: Final End-to-End Verification & Documentation**
  - Create Playwright E2E spec `e2e/phase7-emergency-export.spec.ts`.
  - Run full Vitest suite, `tsc --noEmit`, and `npm run build`.
  - Update `docs/PROJECT.md` and complete roadmap handover.
