import { describe, it, expect } from "vitest";
import {
  calculateBmr,
  calculateTdee,
  calculateMacros,
  calculateBmi,
  calculateWaistHipRatio,
} from "./engine";

describe("Nutrition Module — Energy & Anthropometry Calculations", () => {
  describe("BMR Calculation Formulas", () => {
    it("computes Mifflin-St Jeor BMR for a male (80 kg, 180 cm, 30 y)", () => {
      // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780 kcal
      const bmr = calculateBmr({
        formula: "mifflin_st_jeor",
        weightKg: 80,
        heightCm: 180,
        ageYears: 30,
        sex: "male",
      });
      expect(bmr).toBe(1780);
    });

    it("computes Mifflin-St Jeor BMR for a female (65 kg, 165 cm, 28 y)", () => {
      // 10*65 + 6.25*165 - 5*28 - 161 = 650 + 1031.25 - 140 - 161 = 1380.25 -> 1380 kcal
      const bmr = calculateBmr({
        formula: "mifflin_st_jeor",
        weightKg: 65,
        heightCm: 165,
        ageYears: 28,
        sex: "female",
      });
      expect(bmr).toBe(1380);
    });

    it("computes Harris-Benedict revised BMR", () => {
      const bmrMale = calculateBmr({
        formula: "harris_benedict",
        weightKg: 75,
        heightCm: 175,
        ageYears: 35,
        sex: "male",
      });
      // 88.362 + 13.397*75 + 4.799*175 - 5.677*35 = 88.362 + 1004.775 + 839.825 - 198.695 = 1734.267 -> 1734 kcal
      expect(bmrMale).toBe(1734);
    });

    it("computes Katch-McArdle BMR based on lean mass and body fat %", () => {
      // Weight 70kg, 20% body fat -> LBM = 56 kg
      // BMR = 370 + 21.6 * 56 = 370 + 1209.6 = 1579.6 -> 1580 kcal
      const bmr = calculateBmr({
        formula: "katch_mcardle",
        weightKg: 70,
        heightCm: 170,
        ageYears: 25,
        sex: "female",
        bodyFatPct: 20,
      });
      expect(bmr).toBe(1580);
    });

    it("throws error for Katch-McArdle if body fat % is missing", () => {
      expect(() =>
        calculateBmr({
          formula: "katch_mcardle",
          weightKg: 70,
          heightCm: 170,
          ageYears: 25,
          sex: "female",
        })
      ).toThrowError(/requires a valid body fat percentage/);
    });
  });

  describe("TDEE & Macronutrient Distribution", () => {
    it("computes TDEE using activity levels", () => {
      const bmr = 1500;
      expect(calculateTdee(bmr, "sedentary")).toBe(1800); // 1.2
      expect(calculateTdee(bmr, "moderate")).toBe(2325); // 1.55
      expect(calculateTdee(bmr, 1.4)).toBe(2100);
    });

    it("calculates macronutrient distribution in grams", () => {
      // Target: 2000 kcal, Split: 30% Protein (600 kcal / 4 = 150g), 40% Carbs (800 kcal / 4 = 200g), 30% Fats (600 kcal / 9 = 67g)
      const macros = calculateMacros(2000, 30, 40, 30);
      expect(macros.proteinGrams).toBe(150);
      expect(macros.carbsGrams).toBe(200);
      expect(macros.fatsGrams).toBe(67);
    });

    it("rejects invalid macro percentage totals that do not sum to 100%", () => {
      expect(() => calculateMacros(2000, 30, 40, 40)).toThrowError(
        /must sum to 100%/
      );
    });
  });

  describe("Anthropometry & Risk Ratios", () => {
    it("calculates BMI and classification", () => {
      const normal = calculateBmi(70, 175);
      expect(normal.bmi).toBe(22.9);
      expect(normal.classification).toBe("normal");

      const obese = calculateBmi(95, 170);
      expect(obese.bmi).toBe(32.9);
      expect(obese.classification).toBe("obese_1");
    });

    it("calculates Waist-to-Hip ratio (WHR) and risk", () => {
      // Male: waist 85, hip 100 -> 0.85 (low risk)
      const maleLow = calculateWaistHipRatio(85, 100, "male");
      expect(maleLow.ratio).toBe(0.85);
      expect(maleLow.risk).toBe("low");

      // Male: waist 102, hip 100 -> 1.02 (high risk)
      const maleHigh = calculateWaistHipRatio(102, 100, "male");
      expect(maleHigh.ratio).toBe(1.02);
      expect(maleHigh.risk).toBe("high");

      // Female: waist 80, hip 90 -> 0.89 (high risk > 0.85)
      const femaleHigh = calculateWaistHipRatio(80, 90, "female");
      expect(femaleHigh.ratio).toBe(0.89);
      expect(femaleHigh.risk).toBe("high");
    });
  });
});
