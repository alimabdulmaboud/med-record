/**
 * Nutrition Energy & Anthropometry Engine
 * Pure TypeScript Module with no database access (AGENTS.md Rule #9)
 */

export type BmrFormula = "mifflin_st_jeor" | "harris_benedict" | "katch_mcardle";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "very_active"
  | "extra_active";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

export const FORMULA_LABELS: Record<BmrFormula, { ar: string; en: string }> = {
  mifflin_st_jeor: {
    ar: "معادلة ميفلين-سانت جور (Mifflin-St Jeor - القياسية)",
    en: "Mifflin-St Jeor Equation (Standard)",
  },
  harris_benedict: {
    ar: "معادلة هاريس-بندكت المعدلة (Harris-Benedict Revised)",
    en: "Harris-Benedict Equation (Revised)",
  },
  katch_mcardle: {
    ar: "معادلة كاتش-ماكاردل (Katch-McArdle - تعتمد على نسبة الدهون)",
    en: "Katch-McArdle Equation (Lean Mass)",
  },
};

/**
 * Calculates Basal Metabolic Rate (BMR) in kcal/day.
 */
export function calculateBmr(params: {
  formula: BmrFormula;
  weightKg: number;
  heightCm: number;
  ageYears: number;
  sex: "male" | "female";
  bodyFatPct?: number;
}): number {
  const { formula, weightKg, heightCm, ageYears, sex, bodyFatPct } = params;

  if (formula === "katch_mcardle") {
    if (typeof bodyFatPct !== "number" || bodyFatPct < 0 || bodyFatPct > 100) {
      throw new Error(
        "Katch-McArdle formula requires a valid body fat percentage."
      );
    }
    const leanBodyMassKg = weightKg * (1 - bodyFatPct / 100);
    return Math.round(370 + 21.6 * leanBodyMassKg);
  }

  if (formula === "harris_benedict") {
    if (sex === "male") {
      return Math.round(
        88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * ageYears
      );
    } else {
      return Math.round(
        447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * ageYears
      );
    }
  }

  // Default: Mifflin-St Jeor
  if (sex === "male") {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5);
  } else {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161);
  }
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 */
export function calculateTdee(bmr: number, activityLevelOrFactor: ActivityLevel | number): number {
  const factor =
    typeof activityLevelOrFactor === "number"
      ? activityLevelOrFactor
      : ACTIVITY_MULTIPLIERS[activityLevelOrFactor];

  return Math.round(bmr * factor);
}

/**
 * Calculates macronutrient quantities in grams from target calories and percentage splits.
 */
export function calculateMacros(
  targetCalories: number,
  proteinPct: number,
  carbsPct: number,
  fatsPct: number
): {
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
} {
  const totalPct = proteinPct + carbsPct + fatsPct;
  if (Math.abs(totalPct - 100) > 1.0) {
    throw new Error(
      `Macro percentages must sum to 100% (currently ${totalPct}%).`
    );
  }

  // Protein: 4 kcal/g, Carbs: 4 kcal/g, Fats: 9 kcal/g
  const proteinGrams = Math.round((targetCalories * (proteinPct / 100)) / 4);
  const carbsGrams = Math.round((targetCalories * (carbsPct / 100)) / 4);
  const fatsGrams = Math.round((targetCalories * (fatsPct / 100)) / 9);

  return {
    proteinGrams,
    carbsGrams,
    fatsGrams,
  };
}

/**
 * Calculates Body Mass Index (BMI) and classification.
 */
export function calculateBmi(weightKg: number, heightCm: number): {
  bmi: number;
  classification: "underweight" | "normal" | "overweight" | "obese_1" | "obese_2" | "obese_3";
  labelAr: string;
} {
  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

  let classification: "underweight" | "normal" | "overweight" | "obese_1" | "obese_2" | "obese_3";
  let labelAr: string;

  if (bmi < 18.5) {
    classification = "underweight";
    labelAr = "نقص في الوزن (Underweight)";
  } else if (bmi < 25.0) {
    classification = "normal";
    labelAr = "وزن طبيعي وصحي (Normal)";
  } else if (bmi < 30.0) {
    classification = "overweight";
    labelAr = "زيادة في الوزن (Overweight)";
  } else if (bmi < 35.0) {
    classification = "obese_1";
    labelAr = "سمنة درجة أولى (Class I Obesity)";
  } else if (bmi < 40.0) {
    classification = "obese_2";
    labelAr = "سمنة درجة ثانية (Class II Obesity)";
  } else {
    classification = "obese_3";
    labelAr = "سمنة مفرطة درجة ثالثة (Class III Obesity)";
  }

  return { bmi, classification, labelAr };
}

/**
 * Calculates Waist-to-Hip Ratio (WHR) and health risk classification.
 */
export function calculateWaistHipRatio(
  waistCm: number,
  hipCm: number,
  sex: "male" | "female"
): {
  ratio: number;
  risk: "low" | "moderate" | "high";
  labelAr: string;
} {
  if (hipCm <= 0) {
    throw new Error("Hip circumference must be greater than 0.");
  }

  const ratio = Number((waistCm / hipCm).toFixed(2));
  let risk: "low" | "moderate" | "high";
  let labelAr: string;

  if (sex === "male") {
    if (ratio <= 0.9) {
      risk = "low";
      labelAr = "منخفض المخاطر (توزيع دهون صحي)";
    } else if (ratio <= 0.95) {
      risk = "moderate";
      labelAr = "متوسط المخاطر";
    } else {
      risk = "high";
      labelAr = "عالي المخاطر (سمنة حشوية أندرويدية)";
    }
  } else {
    if (ratio <= 0.8) {
      risk = "low";
      labelAr = "منخفض المخاطر (توزيع دهون صحي)";
    } else if (ratio <= 0.85) {
      risk = "moderate";
      labelAr = "متوسط المخاطر";
    } else {
      risk = "high";
      labelAr = "عالي المخاطر (سمنة حشوية)";
    }
  }

  return { ratio, risk, labelAr };
}
