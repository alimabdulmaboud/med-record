/**
 * Types and interfaces for the Nutrition Module
 */

import { BmrFormula, ActivityLevel } from "./energy/engine";

export type NutritionGoal =
  | "weight_loss"
  | "weight_gain"
  | "muscle_building"
  | "diabetes_management"
  | "hypertension"
  | "pregnancy_lactation"
  | "gi_disorders"
  | "sports_nutrition"
  | "general_wellness";

export interface NutritionAssessment {
  id: string;
  clinicId: string;
  patientId: string;
  primaryGoal: NutritionGoal;
  weightHistory?: string | null;
  previousDiets?: string | null;
  lifestyleSleepHours?: number | null;
  lifestyleActivityLevel?: ActivityLevel | null;
  lifestyleWorkNature?: string | null;
  lifestyleSmoking?: "non_smoker" | "smoker" | "ex_smoker" | null;
  sensitiveEatingDisorderFlag: boolean;
  clinicalConditionsNotes?: string | null;
  supplementsMedications?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnthropometryRecord {
  id: string;
  clinicId: string;
  patientId: string;
  visitId?: string | null;
  recordedAt: string;
  weightKg: number;
  heightCm: number;
  bmi: number;
  waistCm?: number | null;
  hipCm?: number | null;
  waistHipRatio?: number | null;
  armCircCm?: number | null;
  neckCircCm?: number | null;
  notes?: string | null;
}

export interface BodyCompositionRecord {
  id: string;
  clinicId: string;
  patientId: string;
  visitId?: string | null;
  recordedAt: string;
  bodyFatPct?: number | null;
  muscleMassKg?: number | null;
  bodyWaterPct?: number | null;
  visceralFatLevel?: number | null;
  bmrDeviceKcal?: number | null;
  deviceReportAttachment?: string | null;
  notes?: string | null;
}

export interface EnergyPlan {
  id: string;
  clinicId: string;
  patientId: string;
  visitId?: string | null;
  bmrFormula: BmrFormula;
  bmrCalculated: number;
  activityFactor: number;
  tdeeKcal: number;
  targetCalories: number;
  proteinPct: number;
  carbsPct: number;
  fatsPct: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  waterLiters?: number | null;
  notes?: string | null;
  createdAt: string;
}

export interface MealItem {
  id: string;
  mealName: string; // e.g., "الإفطار", "وجبة خفيفة 1", "الغداء", "العشاء"
  timeOfDay?: string;
  items: Array<{
    foodItem: string;
    quantity: string;
    notes?: string;
  }>;
}

export interface MealPlan {
  id: string;
  clinicId: string;
  patientId: string;
  visitId?: string | null;
  planName: string;
  targetCalories?: number | null;
  meals: MealItem[];
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
}

export interface MealPlanTemplate {
  id: string;
  clinicId: string;
  doctorId?: string | null;
  templateName: string;
  category?: string | null;
  targetCalories: number;
  meals: MealItem[];
  notes?: string | null;
}

export interface DietHistory {
  id: string;
  clinicId: string;
  patientId: string;
  recallType: "24_hour_recall" | "typical_day";
  mealsPerDay: number;
  snacksPerDay: number;
  caffeineCupsDaily: number;
  eatingOutFreq?: string | null;
  dislikedFoods?: string | null;
  foodAllergies?: string | null;
  recallContent: Array<{ meal: string; items: string; time?: string }>;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FullNutritionRecord {
  patientId: string;
  assessment?: NutritionAssessment;
  anthropometryHistory: AnthropometryRecord[];
  bodyCompositionHistory: BodyCompositionRecord[];
  activeEnergyPlan?: EnergyPlan;
  dietHistory?: DietHistory;
  activeMealPlan?: MealPlan;
  mealPlanHistory: MealPlan[];
  templates: MealPlanTemplate[];
}
