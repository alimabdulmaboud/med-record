import { describe, it, expect, beforeEach } from "vitest";
import {
  generateRandomToken,
  hashPin,
  compileDoctorReportData,
  createDoctorReport,
  getPersonDoctorReports,
  getDoctorReportById,
  archiveDoctorReport,
  generateReportShareLink,
  verifyAndAccessSharedReport,
  revokeReportShareLink,
  seedRealisticMockReports,
  _resetReportsStore,
} from "../reports-service";
import type { Person } from "@/types/family";
import type { PersonMeasurement } from "@/types/measurements";
import type { PersonMedication, PersonEncounter } from "@/types/medications-encounters";
import type { PersonDocument } from "@/types/documents";

describe("Phase 6: Doctor Reports & Expiring Share Links Service Tests", () => {
  beforeEach(() => {
    _resetReportsStore();
  });

  const mockAdultPerson: Person = {
    id: "p-adult-1",
    family_id: "fam-1",
    name: "محمد أحمد",
    sex: "male",
    blood_type: "unknown",
    allergies: [],
    chronic_conditions: [],
    birth_date: "1980-06-15",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockChildPerson: Person = {
    id: "p-child-1",
    family_id: "fam-1",
    name: "نور محمد",
    sex: "female",
    blood_type: "unknown",
    allergies: [],
    chronic_conditions: [],
    birth_date: "2024-01-10",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  describe("Token Generation & PIN Hashing", () => {
    it("generates a 32-character hexadecimal token", () => {
      const token1 = generateRandomToken(16);
      const token2 = generateRandomToken(16);

      expect(token1).toHaveLength(32);
      expect(token2).toHaveLength(32);
      expect(token1).not.toBe(token2);
      expect(/^[0-9a-f]{32}$/.test(token1)).toBe(true);
    });

    it("hashes PIN deterministically and distinguishes different PINs", () => {
      const hash1 = hashPin("1234");
      const hash2 = hashPin("1234");
      const hash3 = hashPin("9999");

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash1.startsWith("pin_")).toBe(true);
    });
  });

  describe("Report Compilation Engine", () => {
    const measurements: PersonMeasurement[] = [
      {
        id: "m-1",
        family_id: "fam-1",
        person_id: "p-adult-1",
        measurement_type: "blood_pressure",
        values: { systolic: 125, diastolic: 82 },
        unit: "mmHg",
        recorded_at: "2026-10-15T08:00:00Z",
        is_abnormal: false,
        created_at: "2026-10-15T08:00:00Z",
        updated_at: "2026-10-15T08:00:00Z",
      },
      {
        id: "m-2",
        family_id: "fam-1",
        person_id: "p-adult-1",
        measurement_type: "blood_glucose",
        values: { glucose: 195 },
        unit: "mg/dL",
        recorded_at: "2026-10-20T08:00:00Z",
        is_abnormal: true,
        created_at: "2026-10-20T08:00:00Z",
        updated_at: "2026-10-20T08:00:00Z",
      },
      {
        id: "m-outdated",
        family_id: "fam-1",
        person_id: "p-adult-1",
        measurement_type: "blood_pressure",
        values: { systolic: 120, diastolic: 80 },
        unit: "mmHg",
        recorded_at: "2025-01-01T08:00:00Z",
        is_abnormal: false,
        created_at: "2025-01-01T08:00:00Z",
        updated_at: "2025-01-01T08:00:00Z",
      },
    ];

    const medications: PersonMedication[] = [
      {
        id: "med-1",
        family_id: "fam-1",
        person_id: "p-adult-1",
        name: "Glucophage 1000mg",
        dose: "1000 mg",
        frequency: "twice_daily",
        start_date: "2026-10-01",
        status: "active",
        reminder_enabled: false,
        created_at: "2026-10-01T00:00:00Z",
        updated_at: "2026-10-01T00:00:00Z",
      },
      {
        id: "med-stopped",
        family_id: "fam-1",
        person_id: "p-adult-1",
        name: "Old Drug",
        dose: "10mg",
        frequency: "once_daily",
        start_date: "2025-01-01",
        status: "completed",
        reminder_enabled: false,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
    ];

    const encounters: PersonEncounter[] = [
      {
        id: "enc-1",
        family_id: "fam-1",
        person_id: "p-adult-1",
        doctor_name: "د. أسامة فاروق",
        specialty: "endocrinology",
        facility_name: "عيادة السكر والغدد الصماء",
        visit_date: "2026-10-18",
        diagnosis: "متابعة السكري من النوع الثاني",
        created_at: "2026-10-18T10:00:00Z",
        updated_at: "2026-10-18T10:00:00Z",
      },
    ];

    const documents: PersonDocument[] = [
      {
        id: "doc-1",
        family_id: "fam-1",
        person_id: "p-adult-1",
        title: "تحليل سكر تراكمي HbA1c",
        document_type: "lab_result",
        file_name: "hba1c_oct2026.pdf",
        file_type: "application/pdf",
        file_size_bytes: 120000,
        storage_path: "mock/path/doc-1.pdf",
        tags: [],
        document_date: "2026-10-16",
        created_at: "2026-10-16T12:00:00Z",
        updated_at: "2026-10-16T12:00:00Z",
      },
    ];

    it("compiles report within date range and detects abnormal vitals flag", () => {
      const compiled = compileDoctorReportData({
        person: mockAdultPerson,
        dateRange: { from: "2026-10-01", to: "2026-10-25" },
        includedSections: ["vitals", "medications", "visits", "labs"],
        measurements,
        medications,
        encounters,
        documents,
      });

      expect(compiled.person.name).toBe("محمد أحمد");
      expect(compiled.has_abnormal_vitals).toBe(true); // m-2 is abnormal
      expect(compiled.measurements).toHaveLength(2); // m-outdated is excluded
      expect(compiled.medications).toHaveLength(1); // med-stopped is excluded
      expect(compiled.encounters).toHaveLength(1);
      expect(compiled.documents).toHaveLength(1);
    });

    it("respects includedSections flags: excludes unselected sections", () => {
      const compiled = compileDoctorReportData({
        person: mockAdultPerson,
        dateRange: { from: "2026-10-01", to: "2026-10-25" },
        includedSections: ["medications"], // vitals, visits, labs excluded
        measurements,
        medications,
        encounters,
        documents,
      });

      expect(compiled.medications).toHaveLength(1);
      expect(compiled.measurements).toHaveLength(0);
      expect(compiled.encounters).toHaveLength(0);
      expect(compiled.documents).toHaveLength(0);
      expect(compiled.has_abnormal_vitals).toBe(false);
    });
  });

  describe("Reports Management & Archival", () => {
    it("creates, retrieves, and softly archives a doctor report", async () => {
      const report = await createDoctorReport(
        {
          family_id: "fam-1",
          person_id: mockAdultPerson.id,
          title: "تقرير السكري والضغط",
          date_range_from: "2026-08-01",
          date_range_to: "2026-10-28",
          summary_notes: "متابعة دورية منتظمة",
        },
        "user-mgr-1",
        mockAdultPerson
      );

      expect(report.id.startsWith("rep-")).toBe(true);
      expect(report.title).toBe("تقرير السكري والضغط");
      expect(report.archived_at).toBeNull();

      const list = await getPersonDoctorReports(mockAdultPerson.id);
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe(report.id);

      const fetched = await getDoctorReportById(report.id);
      expect(fetched?.id).toBe(report.id);

      await archiveDoctorReport(report.id, "user-mgr-1");
      const listAfterArchive = await getPersonDoctorReports(mockAdultPerson.id);
      expect(listAfterArchive).toHaveLength(0);
    });
  });

  describe("Expiring Cryptographic Share Links & Access Control", () => {
    it("creates a 72-hour expiring share link with PIN protection", async () => {
      const report = await createDoctorReport(
        {
          family_id: "fam-1",
          person_id: mockAdultPerson.id,
          date_range_from: "2026-08-01",
          date_range_to: "2026-10-28",
        },
        "user-mgr-1",
        mockAdultPerson
      );

      const share = await generateReportShareLink(
        {
          family_id: "fam-1",
          person_id: mockAdultPerson.id,
          report_id: report.id,
          expires_in_hours: 72,
          pin: "4321",
        },
        "user-mgr-1"
      );

      expect(share.access_token).toHaveLength(32);
      expect(share.pin_hash).not.toBeNull();
      expect(share.is_revoked).toBe(false);
      expect(share.access_count).toBe(0);

      // Access without PIN -> PIN_REQUIRED
      const noPinRes = await verifyAndAccessSharedReport(share.access_token);
      expect(noPinRes.success).toBe(false);
      expect(noPinRes.errorCode).toBe("PIN_REQUIRED");

      // Access with wrong PIN -> INVALID_PIN
      const wrongPinRes = await verifyAndAccessSharedReport(share.access_token, "0000");
      expect(wrongPinRes.success).toBe(false);
      expect(wrongPinRes.errorCode).toBe("INVALID_PIN");

      // Access with correct PIN -> SUCCESS, increments access count
      const validRes = await verifyAndAccessSharedReport(share.access_token, "4321");
      expect(validRes.success).toBe(true);
      expect(validRes.report?.id).toBe(report.id);
      expect(validRes.share?.access_count).toBe(1);
      expect(validRes.share?.last_accessed_at).not.toBeNull();
    });

    it("denies access if token is unknown or report share was revoked", async () => {
      const notFoundRes = await verifyAndAccessSharedReport("unknown-token-123");
      expect(notFoundRes.success).toBe(false);
      expect(notFoundRes.errorCode).toBe("NOT_FOUND");

      const report = await createDoctorReport(
        {
          family_id: "fam-1",
          person_id: mockAdultPerson.id,
          date_range_from: "2026-08-01",
          date_range_to: "2026-10-28",
        },
        "user-mgr-1",
        mockAdultPerson
      );

      const share = await generateReportShareLink(
        {
          family_id: "fam-1",
          person_id: mockAdultPerson.id,
          report_id: report.id,
          expires_in_hours: 72,
        },
        "user-mgr-1"
      );

      await revokeReportShareLink(share.id, "user-mgr-1");

      const revokedRes = await verifyAndAccessSharedReport(share.access_token);
      expect(revokedRes.success).toBe(false);
      expect(revokedRes.errorCode).toBe("REVOKED");
    });
  });

  describe("Realistic Mock Seeding", () => {
    it("seeds rich realistic reports and shares for adults and children", async () => {
      const adultSeed = await seedRealisticMockReports(mockAdultPerson, "user-mgr-1");
      expect(adultSeed.report.title).toContain("محمد أحمد");
      expect(adultSeed.share.access_token).toHaveLength(32);

      const childSeed = await seedRealisticMockReports(mockChildPerson, "user-mgr-1");
      expect(childSeed.report.title).toContain("نور محمد");
      expect(childSeed.report.report_data.vaccinations).toBeDefined();
    });
  });
});
