import { describe, it, expect } from "vitest";
import {
  validateQuickLogValues,
  getQuickLogDefaults,
} from "../quick-log-utils";
import type { Person } from "@/types/family";

describe("Phase 2: QuickLogModal Helpers (< 10s Entry)", () => {
  const adultAhmed: Person = {
    id: "p-ahmed",
    family_id: "fam-demo",
    name: "أحمد مصطفى إبراهيم",
    birth_date: "1988-06-15",
    sex: "male",
    blood_type: "A+",
    allergies: [],
    chronic_conditions: [],
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

  it("provides sensible default measurement types (growth for child, BP for adult)", () => {
    const adultDefaults = getQuickLogDefaults(adultAhmed);
    expect(adultDefaults.defaultType).toBe("blood_pressure");

    const childDefaults = getQuickLogDefaults(childSara);
    expect(childDefaults.defaultType).toBe("growth_entry");
  });

  it("validates valid blood pressure input", () => {
    const res = validateQuickLogValues("blood_pressure", {
      systolic: "135",
      diastolic: "88",
    });

    expect(res.isValid).toBe(true);
    expect(res.values?.systolic).toBe(135);
    expect(res.values?.diastolic).toBe(88);
  });

  it("rejects invalid blood pressure input", () => {
    const res = validateQuickLogValues("blood_pressure", {
      systolic: "40", // too low
      diastolic: "10",
    });

    expect(res.isValid).toBe(false);
    expect(res.errorAr).toBeDefined();
  });

  it("validates child growth entry values", () => {
    const res = validateQuickLogValues("growth_entry", {
      weight_kg: "16.8",
      height_cm: "106",
      head_circumference_cm: "50.5",
    });

    expect(res.isValid).toBe(true);
    expect(res.values?.weight_kg).toBe(16.8);
    expect(res.values?.height_cm).toBe(106);
    expect(res.values?.head_circumference_cm).toBe(50.5);
  });

  it("validates blood glucose with meal context", () => {
    const res = validateQuickLogValues("blood_glucose", {
      glucose: "115",
      meal_context: "post_prandial",
    });

    expect(res.isValid).toBe(true);
    expect(res.values?.glucose).toBe(115);
    expect(res.values?.meal_context).toBe("post_prandial");
  });
});
