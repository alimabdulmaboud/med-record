import { describe, it, expect, beforeEach } from "vitest";
import {
  addPersonMeasurement,
  getPersonMeasurements,
  archivePersonMeasurement,
  getLatestVitalsSummary,
  clearMeasurementsStore,
} from "../measurements-service";
import type { Person } from "@/types/family";

describe("Phase 2: Family Measurements Service", () => {
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
    allergies: ["الفول السوداني"],
    chronic_conditions: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    clearMeasurementsStore();
  });

  describe("Adult Vitals Abnormality Evaluation", () => {
    it("flags stage 2 hypertension when systolic is 145 and diastolic is 95", async () => {
      const measurement = await addPersonMeasurement(
        {
          family_id: adultAhmed.family_id,
          person_id: adultAhmed.id,
          measurement_type: "blood_pressure",
          values: { systolic: 145, diastolic: 95 },
          recorded_at: "2026-10-28T10:00:00Z",
        },
        adultAhmed
      );

      expect(measurement.is_abnormal).toBe(true);
      expect(measurement.severity).toBe("high");
      expect(measurement.label_ar).toContain("ضغط دم مرتفع");
      expect(measurement.unit).toBe("mmHg");
    });

    it("evaluates normal blood pressure as non-abnormal", async () => {
      const measurement = await addPersonMeasurement(
        {
          family_id: adultAhmed.family_id,
          person_id: adultAhmed.id,
          measurement_type: "blood_pressure",
          values: { systolic: 118, diastolic: 76 },
          recorded_at: "2026-10-28T10:00:00Z",
        },
        adultAhmed
      );

      expect(measurement.is_abnormal).toBe(false);
      expect(measurement.severity).toBe("normal");
    });

    it("evaluates fasting blood glucose abnormal levels", async () => {
      const measurement = await addPersonMeasurement(
        {
          family_id: adultAhmed.family_id,
          person_id: adultAhmed.id,
          measurement_type: "blood_glucose",
          values: { glucose: 135, meal_context: "fasting" },
        },
        adultAhmed
      );

      expect(measurement.is_abnormal).toBe(true);
      expect(measurement.severity).toBe("high");
      expect(measurement.label_ar).toContain("سكر");
    });
  });

  describe("Pediatric Growth & WHO Standards", () => {
    it("calculates WHO LMS percentiles and Z-scores for child growth measurement", async () => {
      const measurement = await addPersonMeasurement(
        {
          family_id: childSara.family_id,
          person_id: childSara.id,
          measurement_type: "growth_entry",
          values: {
            weight_kg: 16.5,
            height_cm: 104,
            head_circumference_cm: 50,
          },
          recorded_at: "2026-10-28T10:00:00Z",
        },
        childSara
      );

      expect(measurement.percentiles).toBeDefined();
      expect(measurement.percentiles?.age_in_months).toBeGreaterThan(0);
      expect(typeof measurement.percentiles?.weight_for_age_percentile).toBe("number");
      expect(typeof measurement.percentiles?.height_for_age_percentile).toBe("number");
      expect(typeof measurement.percentiles?.weight_for_age_zscore).toBe("number");
    });
  });

  describe("Retrieval, Filtering and Soft Deletion", () => {
    it("retrieves measurements by person, filters by type, and respects soft deletion", async () => {
      const m1 = await addPersonMeasurement(
        {
          family_id: adultAhmed.family_id,
          person_id: adultAhmed.id,
          measurement_type: "blood_pressure",
          values: { systolic: 120, diastolic: 80 },
        },
        adultAhmed
      );

      const m2 = await addPersonMeasurement(
        {
          family_id: adultAhmed.family_id,
          person_id: adultAhmed.id,
          measurement_type: "heart_rate",
          values: { heart_rate: 72 },
        },
        adultAhmed
      );

      const all = await getPersonMeasurements(adultAhmed.id);
      expect(all.length).toBe(2);

      const bpOnly = await getPersonMeasurements(adultAhmed.id, { type: "blood_pressure" });
      expect(bpOnly.length).toBe(1);
      expect(bpOnly[0].id).toBe(m1.id);

      // Soft delete m1
      const archived = await archivePersonMeasurement(m1.id);
      expect(archived).toBe(true);

      const remaining = await getPersonMeasurements(adultAhmed.id);
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(m2.id);
    });

    it("generates latest vitals summary", async () => {
      await addPersonMeasurement(
        {
          family_id: adultAhmed.family_id,
          person_id: adultAhmed.id,
          measurement_type: "blood_pressure",
          values: { systolic: 142, diastolic: 92 },
        },
        adultAhmed
      );

      await addPersonMeasurement(
        {
          family_id: adultAhmed.family_id,
          person_id: adultAhmed.id,
          measurement_type: "spo2",
          values: { spo2: 98 },
        },
        adultAhmed
      );

      const summary = await getLatestVitalsSummary(adultAhmed.id);
      expect(summary.latest_bp?.values.systolic).toBe(142);
      expect(summary.latest_spo2?.values.spo2).toBe(98);
      expect(summary.has_abnormal).toBe(true);
      expect(summary.abnormal_count).toBe(1);
    });
  });
});
