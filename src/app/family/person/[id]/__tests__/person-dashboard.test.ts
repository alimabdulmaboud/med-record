import { describe, it, expect, beforeEach } from "vitest";
import {
  getPersonMeasurements,
  addPersonMeasurement,
  getLatestVitalsSummary,
  clearMeasurementsStore,
} from "@/lib/family/measurements-service";
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
});
