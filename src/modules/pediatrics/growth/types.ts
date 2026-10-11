/**
 * Types and interfaces for Pediatric Growth Tracking & LMS Calculations.
 * Conforms to WHO Child Growth Standards (0–5 years).
 */

export type Sex = "male" | "female";

export type GrowthIndicator = "wfa" | "lhfa" | "hcfa" | "bfa";

export type GrowthClassification =
  | "severely low"
  | "low"
  | "normal"
  | "high"
  | "severely high";

export interface GrowthEvaluation {
  indicator: GrowthIndicator;
  value: number;
  ageDays: number;
  ageMonths: number;
  isCorrectedAge: boolean;
  zScore: number;
  percentile: number;
  median: number;
  classification: GrowthClassification;
  classificationLabel: {
    ar: string;
    en: string;
  };
}

export interface GrowthMeasurementInput {
  patientId: string;
  sex: Sex;
  birthDate: string | Date;
  measurementDate?: string | Date;
  gestationalAgeWeeks?: number;
  weightKg?: number;
  heightCm?: number;
  headCircumferenceCm?: number;
  useCorrectedAge?: boolean;
}

export interface ChildGrowthProfile {
  patientId: string;
  sex: Sex;
  chronologicalAgeDays: number;
  chronologicalAgeMonths: number;
  correctedAgeDays?: number;
  correctedAgeMonths?: number;
  isPremature: boolean;
  computedBmi?: number;
  evaluations: {
    weightForAge?: GrowthEvaluation;
    heightForAge?: GrowthEvaluation;
    headCircumferenceForAge?: GrowthEvaluation;
    bmiForAge?: GrowthEvaluation;
  };
}

export interface GrowthCurvePoint {
  ageMonths: number;
  sdNeg3: number;
  sdNeg2: number;
  sdNeg1: number;
  median: number;
  sdPos1: number;
  sdPos2: number;
  sdPos3: number;
  patientValue?: number;
}
