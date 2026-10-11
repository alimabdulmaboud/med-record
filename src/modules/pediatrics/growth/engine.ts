/**
 * Pediatric Growth Engine — WHO Child Growth Standards (LMS Method)
 * 
 * Rules:
 * - AGENTS.md Rule #7: No invented medical data. Official LMS data files only.
 * - AGENTS.md Rule #9: Pure module with unit tests, no database access.
 */

import {
  weightForAge,
  heightForAge,
  headCircumferenceForAge,
  bmiForAge,
  bmi,
  ageInDays,
  correctedAgeInDays,
  classify,
  valueAtZScore,
  lmsToZScore,
  zScoreToPercentile,
} from "who-growth-standards";

import {
  Sex,
  GrowthIndicator,
  GrowthClassification,
  GrowthEvaluation,
  GrowthMeasurementInput,
  ChildGrowthProfile,
  GrowthCurvePoint,
} from "./types";

export const CLASSIFICATION_LABELS: Record<
  GrowthClassification,
  { ar: string; en: string }
> = {
  "severely low": {
    ar: "منخفض بشدة (< -3 انحراف معياري)",
    en: "Severely Low (< -3 SD)",
  },
  low: {
    ar: "منخفض (-3 إلى -2 انحراف معياري)",
    en: "Low (-3 to -2 SD)",
  },
  normal: {
    ar: "طبيعي (-2 إلى +2 انحراف معياري)",
    en: "Normal (-2 to +2 SD)",
  },
  high: {
    ar: "مرتفع (+2 إلى +3 انحراف معياري)",
    en: "High (+2 to +3 SD)",
  },
  "severely high": {
    ar: "مرتفع بشدة (> +3 انحراف معياري)",
    en: "Severely High (> +3 SD)",
  },
};

/**
 * Calculates whole days between birth and evaluation dates using UTC.
 */
export function calculateAgeDays(
  birthDate: string | Date,
  evaluationDate?: string | Date
): number {
  const bDate = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const eDate = evaluationDate
    ? typeof evaluationDate === "string"
      ? new Date(evaluationDate)
      : evaluationDate
    : new Date();

  return ageInDays(bDate, eDate);
}

/**
 * Computes corrected age for preterm infants (< 37 gestational weeks).
 * Subtracts missing weeks to 40-week term.
 */
export function calculateCorrectedAgeDays(
  chronologicalAgeDays: number,
  gestationalAgeWeeks: number
): number {
  if (gestationalAgeWeeks >= 37) {
    return chronologicalAgeDays;
  }
  return correctedAgeInDays(chronologicalAgeDays, gestationalAgeWeeks);
}

/**
 * Evaluates child growth against WHO Child Growth Standards.
 */
export function evaluateChildGrowth(
  input: GrowthMeasurementInput
): ChildGrowthProfile {
  const chronoDays = calculateAgeDays(input.birthDate, input.measurementDate);
  const chronoMonths = Number((chronoDays / 30.4375).toFixed(1));

  const isPremature =
    typeof input.gestationalAgeWeeks === "number" &&
    input.gestationalAgeWeeks > 0 &&
    input.gestationalAgeWeeks < 37;

  let effectiveAgeDays = chronoDays;
  let correctedDays: number | undefined;
  let correctedMonths: number | undefined;

  if (isPremature && input.useCorrectedAge && input.gestationalAgeWeeks) {
    correctedDays = calculateCorrectedAgeDays(
      chronoDays,
      input.gestationalAgeWeeks
    );
    correctedMonths = Number((correctedDays / 30.4375).toFixed(1));
    effectiveAgeDays = Math.max(0, correctedDays);
  }

  const isCorrected = Boolean(
    isPremature && input.useCorrectedAge && correctedDays !== undefined
  );

  const evaluations: ChildGrowthProfile["evaluations"] = {};

  // 1. Weight-for-age
  if (typeof input.weightKg === "number" && input.weightKg > 0) {
    try {
      const res = weightForAge(input.weightKg, {
        sex: input.sex,
        ageDays: effectiveAgeDays,
        clamp: true,
      });
      const cls = classify(res.zScore);
      evaluations.weightForAge = {
        indicator: "wfa",
        value: input.weightKg,
        ageDays: effectiveAgeDays,
        ageMonths: Number((effectiveAgeDays / 30.4375).toFixed(1)),
        isCorrectedAge: isCorrected,
        zScore: Number(res.zScore.toFixed(2)),
        percentile: Number(res.percentile.toFixed(1)),
        median: Number(res.median.toFixed(2)),
        classification: cls,
        classificationLabel: CLASSIFICATION_LABELS[cls],
      };
    } catch {
      // Out of bounds / invalid value ignored safely
    }
  }

  // 2. Length/height-for-age
  if (typeof input.heightCm === "number" && input.heightCm > 0) {
    try {
      const res = heightForAge(input.heightCm, {
        sex: input.sex,
        ageDays: effectiveAgeDays,
        clamp: true,
      });
      const cls = classify(res.zScore);
      evaluations.heightForAge = {
        indicator: "lhfa",
        value: input.heightCm,
        ageDays: effectiveAgeDays,
        ageMonths: Number((effectiveAgeDays / 30.4375).toFixed(1)),
        isCorrectedAge: isCorrected,
        zScore: Number(res.zScore.toFixed(2)),
        percentile: Number(res.percentile.toFixed(1)),
        median: Number(res.median.toFixed(2)),
        classification: cls,
        classificationLabel: CLASSIFICATION_LABELS[cls],
      };
    } catch {
      // Ignore
    }
  }

  // 3. Head circumference-for-age
  if (
    typeof input.headCircumferenceCm === "number" &&
    input.headCircumferenceCm > 0
  ) {
    try {
      const res = headCircumferenceForAge(input.headCircumferenceCm, {
        sex: input.sex,
        ageDays: effectiveAgeDays,
        clamp: true,
      });
      const cls = classify(res.zScore);
      evaluations.headCircumferenceForAge = {
        indicator: "hcfa",
        value: input.headCircumferenceCm,
        ageDays: effectiveAgeDays,
        ageMonths: Number((effectiveAgeDays / 30.4375).toFixed(1)),
        isCorrectedAge: isCorrected,
        zScore: Number(res.zScore.toFixed(2)),
        percentile: Number(res.percentile.toFixed(1)),
        median: Number(res.median.toFixed(2)),
        classification: cls,
        classificationLabel: CLASSIFICATION_LABELS[cls],
      };
    } catch {
      // Ignore
    }
  }

  // 4. BMI-for-age
  let computedBmiValue: number | undefined;
  if (
    typeof input.weightKg === "number" &&
    typeof input.heightCm === "number" &&
    input.weightKg > 0 &&
    input.heightCm > 0
  ) {
    computedBmiValue = Number(bmi(input.weightKg, input.heightCm).toFixed(2));
    try {
      const res = bmiForAge(computedBmiValue, {
        sex: input.sex,
        ageDays: effectiveAgeDays,
        clamp: true,
      });
      const cls = classify(res.zScore);
      evaluations.bmiForAge = {
        indicator: "bfa",
        value: computedBmiValue,
        ageDays: effectiveAgeDays,
        ageMonths: Number((effectiveAgeDays / 30.4375).toFixed(1)),
        isCorrectedAge: isCorrected,
        zScore: Number(res.zScore.toFixed(2)),
        percentile: Number(res.percentile.toFixed(1)),
        median: Number(res.median.toFixed(2)),
        classification: cls,
        classificationLabel: CLASSIFICATION_LABELS[cls],
      };
    } catch {
      // Ignore
    }
  }

  return {
    patientId: input.patientId,
    sex: input.sex,
    chronologicalAgeDays: chronoDays,
    chronologicalAgeMonths: chronoMonths,
    correctedAgeDays: correctedDays,
    correctedAgeMonths: correctedMonths,
    isPremature,
    computedBmi: computedBmiValue,
    evaluations,
  };
}

/**
 * Generates official WHO growth reference curve lines (from 0 to 60 months)
 * at standard deviation boundaries: -3, -2, -1, 0 (median), +1, +2, +3 SD.
 */
export function generateGrowthCurves(
  indicator: GrowthIndicator,
  sex: Sex,
  patientPoints: Array<{ ageMonths: number; value: number }> = []
): GrowthCurvePoint[] {
  const points: GrowthCurvePoint[] = [];

  // Generate reference points every 2 months up to 24m, and every 3 months up to 60m
  const monthSteps = [
    0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60,
  ];

  for (const m of monthSteps) {
    const days = Math.round(m * 30.4375);
    try {
      const sdNeg3 = Number(valueAtZScore(indicator, sex, -3, days, { clamp: true }).toFixed(2));
      const sdNeg2 = Number(valueAtZScore(indicator, sex, -2, days, { clamp: true }).toFixed(2));
      const sdNeg1 = Number(valueAtZScore(indicator, sex, -1, days, { clamp: true }).toFixed(2));
      const median = Number(valueAtZScore(indicator, sex, 0, days, { clamp: true }).toFixed(2));
      const sdPos1 = Number(valueAtZScore(indicator, sex, 1, days, { clamp: true }).toFixed(2));
      const sdPos2 = Number(valueAtZScore(indicator, sex, 2, days, { clamp: true }).toFixed(2));
      const sdPos3 = Number(valueAtZScore(indicator, sex, 3, days, { clamp: true }).toFixed(2));

      // Check if patient has a measurement close to this age month (within ±1 month)
      const matchingPt = patientPoints.find(
        (p) => Math.abs(p.ageMonths - m) < 1.0
      );

      points.push({
        ageMonths: m,
        sdNeg3,
        sdNeg2,
        sdNeg1,
        median,
        sdPos1,
        sdPos2,
        sdPos3,
        patientValue: matchingPt ? matchingPt.value : undefined,
      });
    } catch {
      // Skip out-of-range
    }
  }

  return points;
}

// Re-export pure LMS helper methods
export {
  lmsToZScore,
  zScoreToPercentile,
  valueAtZScore,
  bmi,
  classify,
};
