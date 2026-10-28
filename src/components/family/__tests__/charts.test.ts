import { describe, it, expect } from "vitest";
import {
  transformMeasurementsToChartPoints,
  transformGrowthToWHOCurves,
} from "../chart-utils";
import type { PersonMeasurement } from "@/types/measurements";

describe("Phase 2: Chart Transformation Utilities", () => {
  it("transforms blood pressure person measurements into chronological chart points", () => {
    const measurements: PersonMeasurement[] = [
      {
        id: "m-1",
        family_id: "fam-1",
        person_id: "p-1",
        measurement_type: "blood_pressure",
        values: { systolic: 125, diastolic: 82 },
        unit: "mmHg",
        is_abnormal: false,
        recorded_at: "2026-10-27T08:00:00Z",
        created_at: "2026-10-27T08:00:00Z",
        updated_at: "2026-10-27T08:00:00Z",
      },
      {
        id: "m-2",
        family_id: "fam-1",
        person_id: "p-1",
        measurement_type: "blood_pressure",
        values: { systolic: 140, diastolic: 92 },
        unit: "mmHg",
        is_abnormal: true,
        recorded_at: "2026-10-28T08:00:00Z",
        created_at: "2026-10-28T08:00:00Z",
        updated_at: "2026-10-28T08:00:00Z",
      },
    ];

    const points = transformMeasurementsToChartPoints("blood_pressure", measurements);

    expect(points.length).toBe(2);
    expect(points[0].systolic).toBe(125);
    expect(points[0].diastolic).toBe(82);
    expect(points[0].isAbnormal).toBe(false);

    expect(points[1].systolic).toBe(140);
    expect(points[1].diastolic).toBe(92);
    expect(points[1].isAbnormal).toBe(true);
  });

  it("transforms child growth entries into WHO percentile curve points", () => {
    const growthRecords: PersonMeasurement[] = [
      {
        id: "g-1",
        family_id: "fam-1",
        person_id: "p-sara",
        measurement_type: "growth_entry",
        values: { weight_kg: 14.2, height_cm: 98, head_circumference_cm: 49.5 },
        unit: "kg / cm",
        is_abnormal: false,
        percentiles: {
          age_in_days: 1460,
          age_in_months: 48,
          weight_for_age_percentile: 50,
        },
        recorded_at: "2025-04-10T10:00:00Z",
        created_at: "2025-04-10T10:00:00Z",
        updated_at: "2025-04-10T10:00:00Z",
      },
    ];

    const curves = transformGrowthToWHOCurves("weight", "female", growthRecords);
    expect(curves.length).toBeGreaterThan(0);
    // Each curve milestone should have official WHO p3, p15, p50, p85, p97
    const sample = curves[0];
    expect(sample.p50).toBeDefined();
    expect(sample.p97).toBeGreaterThan(sample.p50!);
  });
});
