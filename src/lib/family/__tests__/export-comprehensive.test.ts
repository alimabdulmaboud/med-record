import { describe, it, expect, vi } from "vitest";
import {
  exportFamilyData,
  exportMeasurementsToCSV,
  exportMedicationsToCSV,
  exportEncountersToCSV,
  exportVaccinationsToCSV,
  exportComprehensiveFamilyCSV,
  UTF8_BOM,
  type FamilyExportPayload,
} from "../export";
import type { PersonMeasurement } from "@/types/measurements";
import type { PersonMedication, PersonEncounter } from "@/types/medications-encounters";
import type { PersonVaccination } from "@/types/vaccinations";

describe("Phase 7: Comprehensive Family Data Export & CSV Formatter", () => {
  const mockFamily = { id: "fam-1", name: "عائلة أحمد", created_at: "2026-01-01", updated_at: "2026-01-01" };
  const mockPeople = [
    {
      id: "p-1",
      family_id: "fam-1",
      name: "أحمد مصطفى",
      birth_date: "1988-06-15",
      sex: "male" as const,
      blood_type: "A+" as const,
      allergies: ["بنسلين"],
      chronic_conditions: ["ضغط دم"],
      created_at: "",
      updated_at: "",
    },
  ];

  const mockMeasurements: PersonMeasurement[] = [
    {
      id: "m-1",
      family_id: "fam-1",
      person_id: "p-1",
      measurement_type: "blood_pressure",
      values: { systolic: 125, diastolic: 82 },
      unit: "mmHg",
      is_abnormal: false,
      label_ar: "ضغط الدم",
      recorded_at: "2026-10-15T08:00:00Z",
      created_at: "",
      updated_at: "",
    },
  ];

  const mockMedications: PersonMedication[] = [
    {
      id: "med-1",
      family_id: "fam-1",
      person_id: "p-1",
      name: "كونكور 5 مجم",
      dose: "5 مجم",
      frequency: "مرة يومياً",
      status: "active",
      start_date: "2026-01-01",
      reminder_enabled: true,
      created_at: "",
      updated_at: "",
    },
  ];

  const mockEncounters: PersonEncounter[] = [
    {
      id: "enc-1",
      family_id: "fam-1",
      person_id: "p-1",
      visit_date: "2026-10-10",
      doctor_name: "د. طارق البدري",
      specialty: "باطنة",
      facility_name: "عيادة القلب",
      diagnosis: "ضغط دم منتظم",
      created_at: "",
      updated_at: "",
    },
  ];

  const mockVaccinations: PersonVaccination[] = [
    {
      id: "vac-1",
      family_id: "fam-1",
      person_id: "p-1",
      vaccine_code: "BCG",
      vaccine_name: "BCG (الدرن)",
      target_disease: "الدرن",
      dose_number: 1,
      status: "completed",
      age_milestone_months: 0,
      scheduled_date: "2026-01-01",
      administered_date: "2026-01-02",
      created_at: "",
      updated_at: "",
    },
  ];

  it("exports comprehensive multi-domain data via exportFamilyData", async () => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "families") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockFamily, error: null }),
              }),
            }),
          };
        }
        if (table === "people") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockPeople, error: null }),
            }),
          };
        }
        if (table === "person_measurements") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: mockMeasurements, error: null }),
            }),
          };
        }
        if (table === "person_medications") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: mockMedications, error: null }),
            }),
          };
        }
        if (table === "person_encounters") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: mockEncounters, error: null }),
            }),
          };
        }
        if (table === "person_vaccinations") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: mockVaccinations, error: null }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }),
    };

    const res = await exportFamilyData("fam-1", mockClient as any);

    expect(res.family.name).toBe("عائلة أحمد");
    expect(res.people).toHaveLength(1);
    expect(res.measurements).toHaveLength(1);
    expect(res.medications).toHaveLength(1);
    expect(res.encounters).toHaveLength(1);
    expect(res.vaccinations).toHaveLength(1);
  });

  it("generates correctly formatted domain CSVs", () => {
    const measCSV = exportMeasurementsToCSV(mockMeasurements);
    expect(measCSV).toContain("معرف القياس");
    expect(measCSV).toContain("125/82");
    expect(measCSV).toContain("ضغط الدم");

    const medCSV = exportMedicationsToCSV(mockMedications);
    expect(medCSV).toContain("كونكور 5 مجم");
    expect(medCSV).toContain("5 مجم");

    const encCSV = exportEncountersToCSV(mockEncounters);
    expect(encCSV).toContain("د. طارق البدري");
    expect(encCSV).toContain("عيادة القلب");

    const vacCSV = exportVaccinationsToCSV(mockVaccinations);
    expect(vacCSV).toContain("BCG (الدرن)");
    expect(vacCSV).toContain("completed");
  });

  it("generates comprehensive multi-section CSV with UTF-8 BOM for Excel Arabic compatibility", () => {
    const payload: FamilyExportPayload = {
      schema_version: "1.0",
      platform: "Med",
      exported_at: "2026-10-28T00:00:00Z",
      family: mockFamily,
      members: [],
      people: mockPeople,
      emergency_contacts: [
        { id: "ec-1", person_id: "p-1", name: "منى", relationship: "زوجة", phone: "01012345678", is_primary: true, created_at: "" },
      ],
      measurements: mockMeasurements,
      medications: mockMedications,
      encounters: mockEncounters,
      vaccinations: mockVaccinations,
    };

    const fullCSV = exportComprehensiveFamilyCSV(payload);

    // Verifies UTF-8 BOM is prepended
    expect(fullCSV.startsWith(UTF8_BOM)).toBe(true);

    // Verifies all sections are present
    expect(fullCSV).toContain("=== أفراد العائلة (Family Members) ===");
    expect(fullCSV).toContain("=== جهات اتصال الطوارئ (Emergency Contacts) ===");
    expect(fullCSV).toContain("=== القياسات الحيوية (Measurements & Vitals) ===");
    expect(fullCSV).toContain("=== الأدوية والعلاجات (Medications) ===");
    expect(fullCSV).toContain("=== زيارات واستشارات الأطباء (Doctor Consultations) ===");
    expect(fullCSV).toContain("=== سجل التطعيمات الوقائية (Vaccinations) ===");
  });
});
