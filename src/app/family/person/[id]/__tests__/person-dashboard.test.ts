import { describe, it, expect, beforeEach } from "vitest";
import {
  getPersonMeasurements,
  addPersonMeasurement,
  getLatestVitalsSummary,
  clearMeasurementsStore,
} from "@/lib/family/measurements-service";
import {
  addPersonDocument,
  getPersonDocuments,
  clearDocumentsStore,
} from "@/lib/family/documents-service";
import type { Person } from "@/types/family";

describe("Phase 2: Person Health Dashboard Integration", () => {
  const adultAhmed: Person = {
    id: "p-ahmed",
    family_id: "fam-demo",
    name: "أحمد مصطفى إبراهيم",
    birth_date: "1988-06-15",
    sex: "male",
    blood_type: "A+",
    allergies: ["بنسلين"],
    chronic_conditions: ["ارتفاع ضغط الدم"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const childSara: Person = {
    id: "p-sara",
    family_id: "fam-demo",
    name: "سارة أحمد مصطفى",
    birth_date: "2021-04-10",
    sex: "female",
    blood_type: "A+",
    allergies: [],
    chronic_conditions: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    clearMeasurementsStore();
    clearDocumentsStore();
  });

  it("aggregates dashboard vitals summary and highlights critical values", async () => {
    await addPersonMeasurement(
      {
        family_id: adultAhmed.family_id,
        person_id: adultAhmed.id,
        measurement_type: "blood_pressure",
        values: { systolic: 150, diastolic: 96 },
      },
      adultAhmed
    );

    await addPersonMeasurement(
      {
        family_id: adultAhmed.family_id,
        person_id: adultAhmed.id,
        measurement_type: "heart_rate",
        values: { heart_rate: 82 },
      },
      adultAhmed
    );

    const summary = await getLatestVitalsSummary(adultAhmed.id);
    expect(summary.latest_bp?.is_abnormal).toBe(true);
    expect(summary.latest_bp?.severity).toBe("high");
    expect(summary.latest_heart_rate?.is_abnormal).toBe(false);
    expect(summary.has_abnormal).toBe(true);
    expect(summary.abnormal_count).toBe(1);
  });

  it("handles child growth measurements with WHO percentiles on the dashboard", async () => {
    await addPersonMeasurement(
      {
        family_id: childSara.family_id,
        person_id: childSara.id,
        measurement_type: "growth_entry",
        values: { weight_kg: 17.2, height_cm: 108, head_circumference_cm: 51 },
      },
      childSara
    );

    const measurements = await getPersonMeasurements(childSara.id, { type: "growth_entry" });
    expect(measurements.length).toBe(1);
    expect(measurements[0].percentiles?.weight_for_age_percentile).toBeDefined();
    expect(measurements[0].percentiles?.height_for_age_percentile).toBeDefined();
  });

  it("retrieves medical documents and categories for person dashboard", async () => {
    await addPersonDocument({
      family_id: adultAhmed.family_id,
      person_id: adultAhmed.id,
      title: "تحليل دم شامل CBC",
      document_type: "lab_result",
      file_name: "cbc.pdf",
      file_type: "application/pdf",
      file_size_bytes: 400000,
    });

    const docs = await getPersonDocuments(adultAhmed.id);
    expect(docs.length).toBe(1);
    expect(docs[0].document_type).toBe("lab_result");
  });

  it("retrieves medications and doctor encounters on person dashboard", async () => {
    const { getPersonMedications, getPersonEncounters, createPersonMedication, createPersonEncounter } =
      await import("@/lib/family/medications-encounters-service");

    await createPersonMedication({
      family_id: adultAhmed.family_id,
      person_id: adultAhmed.id,
      name: "كونكور 5 مجم",
      dose: "5 مجم",
      frequency: "مرة يومياً",
      status: "active",
      reminder_enabled: true,
      reminder_time: "08:30",
    });

    await createPersonEncounter({
      family_id: adultAhmed.family_id,
      person_id: adultAhmed.id,
      doctor_name: "د. طارق البدري",
      specialty: "باطنة وقلب وأوعية دموية",
      diagnosis: "ضغط دم منتظم",
    });

    const meds = await getPersonMedications(adultAhmed.id);
    expect(meds).toHaveLength(1);
    expect(meds[0].name).toBe("كونكور 5 مجم");

    const encs = await getPersonEncounters(adultAhmed.id);
    expect(encs).toHaveLength(1);
    expect(encs[0].doctor_name).toBe("د. طارق البدري");
  });

  it("loads and manages child vaccination schedule according to official Egyptian MOH milestones", async () => {
    const { getPersonVaccinationsSchedule, recordVaccineAdministered } =
      await import("@/lib/family/vaccinations-service");

    const scheduleData = await getPersonVaccinationsSchedule(
      childSara.id,
      childSara.birth_date
    );

    expect(scheduleData.schedule.length).toBeGreaterThanOrEqual(10);
    expect(scheduleData.milestones.length).toBeGreaterThanOrEqual(5);

    // Record one vaccine as administered
    await recordVaccineAdministered({
      family_id: childSara.family_id,
      person_id: childSara.id,
      vaccine_code: "BCG",
      vaccine_name: "BCG (الدرن)",
      target_disease: "الدرن",
      dose_number: 1,
      age_milestone_months: 0,
      scheduled_date: childSara.birth_date,
      administered_date: childSara.birth_date,
      administered_by: "مكتب صحة النزهة",
    });

    const updated = await getPersonVaccinationsSchedule(
      childSara.id,
      childSara.birth_date
    );
    expect(updated.stats.completed).toBe(1);
    expect(updated.stats.percentage).toBeGreaterThan(0);
  });

  it("compiles, stores, and generates expiring share link for doctor reports", async () => {
    const {
      createDoctorReport,
      getPersonDoctorReports,
      generateReportShareLink,
      verifyAndAccessSharedReport,
    } = await import("@/lib/family/reports-service");

    const report = await createDoctorReport(
      {
        family_id: adultAhmed.family_id,
        person_id: adultAhmed.id,
        title: "تقرير باطنة للطبيب المعالج",
        date_range_from: "2026-01-01",
        date_range_to: "2026-10-28",
        summary_notes: "المريض يتابع بانتظام",
      },
      "usr-mgr-1",
      adultAhmed
    );

    expect(report.title).toBe("تقرير باطنة للطبيب المعالج");
    const reports = await getPersonDoctorReports(adultAhmed.id);
    expect(reports.length).toBeGreaterThanOrEqual(1);

    const share = await generateReportShareLink(
      {
        family_id: adultAhmed.family_id,
        person_id: adultAhmed.id,
        report_id: report.id,
        expires_in_hours: 72,
        pin: "1234",
      },
      "usr-mgr-1"
    );

    expect(share.access_token).toHaveLength(32);

    const accessResult = await verifyAndAccessSharedReport(share.access_token, "1234");
    expect(accessResult.success).toBe(true);
    expect(accessResult.report?.id).toBe(report.id);
    expect(accessResult.share?.access_count).toBe(1);
  });
});
