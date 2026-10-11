import { describe, it, expect } from "vitest";
import {
  evaluateChildGrowth,
  generateGrowthCurves,
  calculateAgeDays,
  calculateCorrectedAgeDays,
  lmsToZScore,
  zScoreToPercentile,
  bmi,
  classify,
} from "./engine";

describe("Pediatric Growth Engine — WHO Standards & LMS Calculations", () => {
  describe("Pure LMS and Statistical Functions", () => {
    it("converts measurement to z-score when L != 0", () => {
      // Example: X=10, M=10, S=0.1, L=-0.35 -> should be z = 0 (since X = M)
      const zMedian = lmsToZScore(10, -0.35, 10, 0.1);
      expect(zMedian).toBeCloseTo(0, 5);

      // Above median
      const zAbove = lmsToZScore(11, 1, 10, 0.1); // L=1 -> (1.1 - 1) / 0.1 = 1
      expect(zAbove).toBeCloseTo(1, 5);
    });

    it("converts measurement to z-score when L == 0 (logarithmic branch)", () => {
      const zLog = lmsToZScore(10, 0, 10, 0.1);
      expect(zLog).toBeCloseTo(0, 5);

      const zLogAbove = lmsToZScore(Math.E, 0, 1, 1);
      expect(zLogAbove).toBeCloseTo(1, 5);
    });

    it("converts z-score to percentile correctly", () => {
      expect(zScoreToPercentile(0)).toBeCloseTo(50, 1);
      expect(zScoreToPercentile(1.96)).toBeCloseTo(97.5, 1);
      expect(zScoreToPercentile(-1.96)).toBeCloseTo(2.5, 1);
    });

    it("calculates BMI properly (kg / m^2)", () => {
      // 12 kg, 80 cm -> 12 / (0.80 * 0.80) = 18.75
      expect(bmi(12, 80)).toBeCloseTo(18.75, 2);
    });

    it("classifies z-scores according to WHO clinical cutoffs", () => {
      expect(classify(-3.2)).toBe("severely low");
      expect(classify(-2.5)).toBe("low");
      expect(classify(0)).toBe("normal");
      expect(classify(1.5)).toBe("normal");
      expect(classify(2.5)).toBe("high");
      expect(classify(3.5)).toBe("severely high");
    });
  });

  describe("WHO Standard Benchmarks (Boys & Girls)", () => {
    it("evaluates a term newborn boy with median weight (approx 3.3 kg)", () => {
      const birth = new Date("2026-01-01T00:00:00Z");
      const evalDate = new Date("2026-01-01T00:00:00Z"); // age 0 days

      const profile = evaluateChildGrowth({
        patientId: "baby-boy-1",
        sex: "male",
        birthDate: birth,
        measurementDate: evalDate,
        gestationalAgeWeeks: 40,
        weightKg: 3.35,
        heightCm: 50.0,
        headCircumferenceCm: 34.5,
      });

      expect(profile.isPremature).toBe(false);
      expect(profile.chronologicalAgeDays).toBe(0);

      // WHO 0-day boy median weight is ~3.35 kg -> zScore should be near 0
      expect(profile.evaluations.weightForAge).toBeDefined();
      expect(profile.evaluations.weightForAge?.zScore).toBeCloseTo(0, 0.5);
      expect(profile.evaluations.weightForAge?.percentile).toBeGreaterThan(40);
      expect(profile.evaluations.weightForAge?.percentile).toBeLessThan(60);
      expect(profile.evaluations.weightForAge?.classification).toBe("normal");

      // Length and head circumference near median
      expect(profile.evaluations.heightForAge?.classification).toBe("normal");
      expect(profile.evaluations.headCircumferenceForAge?.classification).toBe("normal");
    });

    it("evaluates a 1-year-old girl (365 days) with normal metrics", () => {
      const birth = new Date("2025-01-01T00:00:00Z");
      const evalDate = new Date("2026-01-01T00:00:00Z");

      const profile = evaluateChildGrowth({
        patientId: "baby-girl-1",
        sex: "female",
        birthDate: birth,
        measurementDate: evalDate,
        gestationalAgeWeeks: 39,
        weightKg: 8.9, // WHO median 12m girl is ~8.9 kg
        heightCm: 74.0, // WHO median 12m girl is ~74 cm
      });

      expect(profile.chronologicalAgeDays).toBe(365);
      expect(profile.evaluations.weightForAge?.zScore).toBeCloseTo(0, 0.5);
      expect(profile.evaluations.weightForAge?.classification).toBe("normal");
      expect(profile.evaluations.heightForAge?.zScore).toBeCloseTo(0, 0.5);
      expect(profile.evaluations.heightForAge?.classification).toBe("normal");
    });

    it("detects severely low weight (under -3 SD)", () => {
      const birth = new Date("2025-01-01T00:00:00Z");
      const evalDate = new Date("2026-01-01T00:00:00Z"); // 1 year old

      const profile = evaluateChildGrowth({
        patientId: "malnourished-child",
        sex: "male",
        birthDate: birth,
        measurementDate: evalDate,
        weightKg: 5.5, // Well below 1-year male -3SD (~7.0 kg)
      });

      expect(profile.evaluations.weightForAge?.zScore).toBeLessThan(-3.0);
      expect(profile.evaluations.weightForAge?.classification).toBe("severely low");
      expect(profile.evaluations.weightForAge?.classificationLabel.ar).toContain("منخفض بشدة");
    });
  });

  describe("Prematurity & Corrected Age Logic", () => {
    it("does not correct age for term infants (>= 37 weeks)", () => {
      const chronoDays = 120;
      expect(calculateCorrectedAgeDays(chronoDays, 37)).toBe(120);
      expect(calculateCorrectedAgeDays(chronoDays, 40)).toBe(120);
    });

    it("corrects age for preterm infant born at 32 weeks (8 weeks premature)", () => {
      const chronoDays = 100; // ~14 weeks after birth
      // 40 - 32 = 8 weeks early = 56 days to subtract
      const corrected = calculateCorrectedAgeDays(chronoDays, 32);
      expect(corrected).toBe(100 - 56); // 44 days
    });

    it("applies corrected age during child growth evaluation when enabled", () => {
      const birth = new Date("2026-01-01T00:00:00Z");
      const evalDate = new Date("2026-04-01T00:00:00Z"); // 90 days chrono

      // Without corrected age: evaluated at 90 days
      const uncorrectedProfile = evaluateChildGrowth({
        patientId: "preterm-1",
        sex: "male",
        birthDate: birth,
        measurementDate: evalDate,
        gestationalAgeWeeks: 30, // 10 weeks early (70 days)
        weightKg: 4.5,
        useCorrectedAge: false,
      });

      // With corrected age: evaluated at 90 - 70 = 20 days
      const correctedProfile = evaluateChildGrowth({
        patientId: "preterm-1",
        sex: "male",
        birthDate: birth,
        measurementDate: evalDate,
        gestationalAgeWeeks: 30,
        weightKg: 4.5,
        useCorrectedAge: true,
      });

      expect(uncorrectedProfile.isPremature).toBe(true);
      expect(correctedProfile.isPremature).toBe(true);
      expect(correctedProfile.evaluations.weightForAge?.isCorrectedAge).toBe(true);

      // At 20 days (corrected), 4.5 kg is a much higher percentile than at 90 days (uncorrected)
      expect(correctedProfile.evaluations.weightForAge?.zScore).toBeGreaterThan(
        uncorrectedProfile.evaluations.weightForAge!.zScore
      );
    });
  });

  describe("Growth Curves Generation", () => {
    it("generates WHO standard curve points from 0 to 60 months with correct ordering", () => {
      const curves = generateGrowthCurves("wfa", "male");

      expect(curves.length).toBeGreaterThan(15);
      const birthPoint = curves[0];
      expect(birthPoint.ageMonths).toBe(0);

      // Check monotonicity of SD curves: -3SD < -2SD < -1SD < median < +1SD < +2SD < +3SD
      expect(birthPoint.sdNeg3).toBeLessThan(birthPoint.sdNeg2);
      expect(birthPoint.sdNeg2).toBeLessThan(birthPoint.sdNeg1);
      expect(birthPoint.sdNeg1).toBeLessThan(birthPoint.median);
      expect(birthPoint.median).toBeLessThan(birthPoint.sdPos1);
      expect(birthPoint.sdPos1).toBeLessThan(birthPoint.sdPos2);
      expect(birthPoint.sdPos2).toBeLessThan(birthPoint.sdPos3);

      // Check growth over time: median at 24 months should be greater than at birth
      const twoYearPoint = curves.find((c) => c.ageMonths === 24);
      expect(twoYearPoint).toBeDefined();
      expect(twoYearPoint!.median).toBeGreaterThan(birthPoint.median);
    });

    it("attaches patient points to corresponding age milestones", () => {
      const patientData = [
        { ageMonths: 0, value: 3.4 },
        { ageMonths: 6, value: 7.9 },
        { ageMonths: 12, value: 9.8 },
      ];

      const curves = generateGrowthCurves("wfa", "male", patientData);
      const point0 = curves.find((c) => c.ageMonths === 0);
      const point6 = curves.find((c) => c.ageMonths === 6);
      const point12 = curves.find((c) => c.ageMonths === 12);

      expect(point0?.patientValue).toBe(3.4);
      expect(point6?.patientValue).toBe(7.9);
      expect(point12?.patientValue).toBe(9.8);
    });
  });
});
