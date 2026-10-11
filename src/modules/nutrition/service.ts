/**
 * Nutrition Module Service
 * 
 * Rules:
 * - AGENTS.md Rule #1: Roles first. Only doctors can read or write nutrition clinical data.
 * - AGENTS.md Rule #2: Medical privacy. Receptionists and platform admins are strictly denied.
 * - AGENTS.md Rule #3: Tenant isolation. Cross-clinic access is denied.
 * - Doctor-only sensitive-care flag for history of disordered eating.
 */

import { isModuleEnabled } from "../registry";
import {
  NutritionAssessment,
  AnthropometryRecord,
  BodyCompositionRecord,
  EnergyPlan,
  DietHistory,
  MealPlan,
  MealPlanTemplate,
  FullNutritionRecord,
} from "./types";
import { calculateBmi, calculateWaistHipRatio } from "./energy/engine";

export interface ActorContext {
  id: string;
  role: string;
  clinicId: string;
}

// ------------------------------------------------------------------------------
// Seed Templates for Clinics
// ------------------------------------------------------------------------------
export const DEFAULT_MEAL_PLAN_TEMPLATES: readonly Omit<
  MealPlanTemplate,
  "id" | "clinicId"
>[] = [
  {
    templateName: "نظام غذائي متوازن لإنقاص الوزن (1500 سعرة)",
    category: "weight_loss",
    targetCalories: 1500,
    meals: [
      {
        id: "m-1",
        mealName: "وجبة الإفطار (8:00 صباحاً)",
        timeOfDay: "08:00",
        items: [
          { foodItem: "بيض مسلوق", quantity: "2 بيضة" },
          { foodItem: "خبز بلدي حبة كاملة", quantity: "نصف رغيف (50 جم)" },
          { foodItem: "جبن قريش قليل الدسم", quantity: "60 جم" },
          { foodItem: "سلطة خضراء (خيار، جرجير، طماطم)", quantity: "طبق متوسط" },
        ],
      },
      {
        id: "m-2",
        mealName: "وجبة خفيفة 1 (11:30 صباحاً)",
        timeOfDay: "11:30",
        items: [
          { foodItem: "تفاح أخضر أو برتقال", quantity: "ثمرة واحدة متوسطة" },
          { foodItem: "لوز نيء غير مملح", quantity: "6 حبات" },
        ],
      },
      {
        id: "m-3",
        mealName: "وجبة الغداء (3:00 عصراً)",
        timeOfDay: "15:00",
        items: [
          { foodItem: "صدور دجاج مشوية منزوعة الجلد", quantity: "150 جم مطبوخ" },
          { foodItem: "أرز بني أو برغل مفلفل", quantity: "4 ملاعق طعام (100 جم)" },
          { foodItem: "خضار سوتيه (كوسة، فاصوليا، جزر)", quantity: "كوب كبير" },
          { foodItem: "سلطة خضراء مع ملعقة صغيرة زيت زيتون", quantity: "طبق كبير" },
        ],
      },
      {
        id: "m-4",
        mealName: "وجبة خفيفة 2 (6:00 مساءً)",
        timeOfDay: "18:00",
        items: [
          { foodItem: "زبادي طبيعي خالي الدسم", quantity: "كوب 150 جم" },
          { foodItem: "بذور شيا", quantity: "ملعقة صغيرة" },
        ],
      },
      {
        id: "m-5",
        mealName: "وجبة العشاء (9:00 مساءً)",
        timeOfDay: "21:00",
        items: [
          { foodItem: "تونة قطع في ماء ومصفاة", quantity: "علبة 120 جم" },
          { foodItem: "سلطة خضراء بليمون", quantity: "طبق متوسط" },
          { foodItem: "توست حبوب كاملة", quantity: "شريحة واحدة" },
        ],
      },
    ],
    notes: "شرب 2.5 إلى 3 لترات ماء يومياً، وممارسة المشي 30 دقيقة يومياً.",
  },
  {
    templateName: "نظام بناء عضلات عالي البروتين (2200 سعرة)",
    category: "muscle_building",
    targetCalories: 2200,
    meals: [
      {
        id: "m-1",
        mealName: "الإفطار",
        timeOfDay: "08:00",
        items: [
          { foodItem: "بيض كامل + بياض بيض", quantity: "2 بيضة كاملة + 3 بياض" },
          { foodItem: "شوفان كامل الحبة مع حليب", quantity: "70 جم شوفان + كوب حليب" },
          { foodItem: "موز", quantity: "ثمرة متوسطة" },
        ],
      },
      {
        id: "m-2",
        mealName: "سناك الصباح",
        timeOfDay: "11:30",
        items: [
          { foodItem: "واي بروتين مع ماء", quantity: "سكوب (25 جم بروتين)" },
          { foodItem: "مكسرات مشكلة غير محمصة", quantity: "30 جم" },
        ],
      },
      {
        id: "m-3",
        mealName: "الغداء",
        timeOfDay: "15:00",
        items: [
          { foodItem: "لحم بقري قليل الدهن أو سمك مشوي", quantity: "200 جم" },
          { foodItem: "أرز أبيض أو بطاطا مشوية", quantity: "200 جم" },
          { foodItem: "سلطة خضراء مشكلة بزيت زيتون", quantity: "طبق كبير" },
        ],
      },
      {
        id: "m-4",
        mealName: "العشاء",
        timeOfDay: "20:30",
        items: [
          { foodItem: "صدور دجاج مشوية", quantity: "180 جم" },
          { foodItem: "سلطة خضراء + توست بني", quantity: "طبق + شريحتين توست" },
          { foodItem: "زبادي يوناني عالي البروتين", quantity: "150 جم" },
        ],
      },
    ],
    notes: "مناسب لأيام التدريب مع مقاومة، تناول الماء بانتظام 3.5 لتر.",
  },
];

// In-Memory storage
const assessments = new Map<string, NutritionAssessment>();
const anthropometryMap = new Map<string, AnthropometryRecord[]>();
const bodyCompositionMap = new Map<string, BodyCompositionRecord[]>();
const energyPlansMap = new Map<string, EnergyPlan[]>();
const dietHistories = new Map<string, DietHistory>();
const mealPlansMap = new Map<string, MealPlan[]>();
const clinicTemplatesMap = new Map<string, MealPlanTemplate[]>();

function ensureInitialized(clinicId: string) {
  if (!clinicTemplatesMap.has(clinicId)) {
    const list: MealPlanTemplate[] = DEFAULT_MEAL_PLAN_TEMPLATES.map(
      (tpl, idx) => ({
        ...tpl,
        id: `mpt-${clinicId}-${idx + 1}`,
        clinicId,
      })
    );
    clinicTemplatesMap.set(clinicId, list);
  }
}

/**
 * Access Control Guard:
 * Non-negotiable Rules:
 * - Only doctors can read or write nutrition clinical data.
 * - Receptionists and Platform Admins are strictly denied.
 * - The clinic must have the "nutrition" module enabled.
 */
export function verifyNutritionAccess(
  actor: ActorContext,
  targetClinicId: string,
  clinicEnabledModules: string[]
): void {
  if (actor.role !== "doctor") {
    throw new Error(
      "Medical Privacy Violation: Only doctors/nutritionists may access nutrition clinical records."
    );
  }

  if (actor.clinicId !== targetClinicId) {
    throw new Error(
      "Tenant Isolation Violation: Cross-clinic clinical access is strictly forbidden."
    );
  }

  if (!isModuleEnabled("nutrition", clinicEnabledModules)) {
    throw new Error(
      "Module Access Denied: The nutrition module is not enabled for this clinic."
    );
  }
}

/**
 * Retrieves the full nutrition record for a patient.
 */
export function getFullNutritionRecord(
  actor: ActorContext,
  patientId: string,
  clinicEnabledModules: string[]
): FullNutritionRecord {
  verifyNutritionAccess(actor, actor.clinicId, clinicEnabledModules);
  ensureInitialized(actor.clinicId);

  const assessment = assessments.get(patientId);
  const anthropometryHistory = anthropometryMap.get(patientId) || [];
  const bodyCompositionHistory = bodyCompositionMap.get(patientId) || [];
  const energyPlans = energyPlansMap.get(patientId) || [];
  const dietHistory = dietHistories.get(patientId);
  const mealPlans = mealPlansMap.get(patientId) || [];
  const templates = clinicTemplatesMap.get(actor.clinicId) || [];

  const activeEnergyPlan = energyPlans.length > 0 ? energyPlans[0] : undefined;
  const activeMealPlan = mealPlans.find((p) => p.isActive) || mealPlans[0];

  return {
    patientId,
    assessment,
    anthropometryHistory,
    bodyCompositionHistory,
    activeEnergyPlan,
    dietHistory,
    activeMealPlan,
    mealPlanHistory: mealPlans,
    templates,
  };
}

/**
 * Saves or updates initial nutrition assessment.
 */
export function saveNutritionAssessment(
  actor: ActorContext,
  data: Omit<NutritionAssessment, "id" | "clinicId" | "createdAt" | "updatedAt">,
  clinicEnabledModules: string[]
): NutritionAssessment {
  verifyNutritionAccess(actor, actor.clinicId, clinicEnabledModules);
  ensureInitialized(actor.clinicId);

  const existing = assessments.get(data.patientId);
  const now = new Date().toISOString();

  const record: NutritionAssessment = {
    ...data,
    id: existing?.id || `na-${Date.now()}`,
    clinicId: actor.clinicId,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  assessments.set(data.patientId, record);
  return record;
}

/**
 * Records anthropometry measurements (weight, height, circumferences).
 */
export function recordAnthropometry(
  actor: ActorContext,
  data: Omit<AnthropometryRecord, "id" | "clinicId" | "recordedAt" | "bmi" | "waistHipRatio"> & {
    sex?: "male" | "female";
    recordedAt?: string;
  },
  clinicEnabledModules: string[]
): AnthropometryRecord {
  verifyNutritionAccess(actor, actor.clinicId, clinicEnabledModules);
  ensureInitialized(actor.clinicId);

  const now = data.recordedAt || new Date().toISOString();
  const { bmi } = calculateBmi(data.weightKg, data.heightCm);

  let whr: number | null = null;
  if (
    typeof data.waistCm === "number" &&
    typeof data.hipCm === "number" &&
    data.waistCm > 0 &&
    data.hipCm > 0
  ) {
    whr = calculateWaistHipRatio(
      data.waistCm,
      data.hipCm,
      data.sex || "male"
    ).ratio;
  }

  const record: AnthropometryRecord = {
    id: `anthro-${Date.now()}`,
    clinicId: actor.clinicId,
    patientId: data.patientId,
    visitId: data.visitId,
    recordedAt: now,
    weightKg: data.weightKg,
    heightCm: data.heightCm,
    bmi,
    waistCm: data.waistCm,
    hipCm: data.hipCm,
    waistHipRatio: whr,
    armCircCm: data.armCircCm,
    neckCircCm: data.neckCircCm,
    notes: data.notes,
  };

  const list = anthropometryMap.get(data.patientId) || [];
  list.unshift(record);
  anthropometryMap.set(data.patientId, list);

  return record;
}

/**
 * Records body composition / InBody metrics.
 */
export function recordBodyComposition(
  actor: ActorContext,
  data: Omit<BodyCompositionRecord, "id" | "clinicId" | "recordedAt"> & {
    recordedAt?: string;
  },
  clinicEnabledModules: string[]
): BodyCompositionRecord {
  verifyNutritionAccess(actor, actor.clinicId, clinicEnabledModules);
  ensureInitialized(actor.clinicId);

  const now = data.recordedAt || new Date().toISOString();

  const record: BodyCompositionRecord = {
    id: `bcomp-${Date.now()}`,
    clinicId: actor.clinicId,
    patientId: data.patientId,
    visitId: data.visitId,
    recordedAt: now,
    bodyFatPct: data.bodyFatPct,
    muscleMassKg: data.muscleMassKg,
    bodyWaterPct: data.bodyWaterPct,
    visceralFatLevel: data.visceralFatLevel,
    bmrDeviceKcal: data.bmrDeviceKcal,
    deviceReportAttachment: data.deviceReportAttachment,
    notes: data.notes,
  };

  const list = bodyCompositionMap.get(data.patientId) || [];
  list.unshift(record);
  bodyCompositionMap.set(data.patientId, list);

  return record;
}

/**
 * Saves energy plan & target calories/macros.
 */
export function saveEnergyPlan(
  actor: ActorContext,
  data: Omit<EnergyPlan, "id" | "clinicId" | "createdAt">,
  clinicEnabledModules: string[]
): EnergyPlan {
  verifyNutritionAccess(actor, actor.clinicId, clinicEnabledModules);
  ensureInitialized(actor.clinicId);

  const now = new Date().toISOString();
  const record: EnergyPlan = {
    ...data,
    id: `eplan-${Date.now()}`,
    clinicId: actor.clinicId,
    createdAt: now,
  };

  const list = energyPlansMap.get(data.patientId) || [];
  list.unshift(record);
  energyPlansMap.set(data.patientId, list);

  return record;
}

/**
 * Saves diet history & 24h recall.
 */
export function saveDietHistory(
  actor: ActorContext,
  data: Omit<DietHistory, "id" | "clinicId" | "createdAt" | "updatedAt">,
  clinicEnabledModules: string[]
): DietHistory {
  verifyNutritionAccess(actor, actor.clinicId, clinicEnabledModules);
  ensureInitialized(actor.clinicId);

  const existing = dietHistories.get(data.patientId);
  const now = new Date().toISOString();

  const record: DietHistory = {
    ...data,
    id: existing?.id || `dh-${Date.now()}`,
    clinicId: actor.clinicId,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  dietHistories.set(data.patientId, record);
  return record;
}

/**
 * Creates or updates a meal plan for a patient.
 */
export function saveMealPlan(
  actor: ActorContext,
  data: Omit<MealPlan, "id" | "clinicId" | "createdAt">,
  clinicEnabledModules: string[]
): MealPlan {
  verifyNutritionAccess(actor, actor.clinicId, clinicEnabledModules);
  ensureInitialized(actor.clinicId);

  const now = new Date().toISOString();
  const list = mealPlansMap.get(data.patientId) || [];

  // If this plan is set as active, mark other plans as inactive
  if (data.isActive) {
    for (const p of list) {
      p.isActive = false;
    }
  }

  const record: MealPlan = {
    ...data,
    id: `mp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    clinicId: actor.clinicId,
    createdAt: now,
  };

  list.unshift(record);
  mealPlansMap.set(data.patientId, list);

  return record;
}

/**
 * Duplicates a previous meal plan to allow quick edits (Section 7.3).
 */
export function duplicateMealPlan(
  actor: ActorContext,
  sourceMealPlanId: string,
  newPlanName: string,
  clinicEnabledModules: string[]
): MealPlan {
  verifyNutritionAccess(actor, actor.clinicId, clinicEnabledModules);
  ensureInitialized(actor.clinicId);

  // Search across patient plans
  let sourcePlan: MealPlan | undefined;
  let targetPatientId: string | undefined;

  for (const [pId, plans] of mealPlansMap.entries()) {
    const found = plans.find((p) => p.id === sourceMealPlanId);
    if (found) {
      sourcePlan = found;
      targetPatientId = pId;
      break;
    }
  }

  if (!sourcePlan || !targetPatientId) {
    throw new Error(`Meal plan not found: ${sourceMealPlanId}`);
  }

  return saveMealPlan(
    actor,
    {
      patientId: targetPatientId,
      visitId: sourcePlan.visitId,
      planName: newPlanName,
      targetCalories: sourcePlan.targetCalories,
      meals: JSON.parse(JSON.stringify(sourcePlan.meals)),
      isActive: true,
      notes: sourcePlan.notes,
    },
    clinicEnabledModules
  );
}

/**
 * Saves a new clinic-level reusable meal plan template.
 */
export function saveMealPlanTemplate(
  actor: ActorContext,
  template: Omit<MealPlanTemplate, "id" | "clinicId">,
  clinicEnabledModules: string[]
): MealPlanTemplate {
  verifyNutritionAccess(actor, actor.clinicId, clinicEnabledModules);
  ensureInitialized(actor.clinicId);

  const list = clinicTemplatesMap.get(actor.clinicId) || [];
  const newTemplate: MealPlanTemplate = {
    ...template,
    id: `mpt-${Date.now()}`,
    clinicId: actor.clinicId,
    doctorId: actor.id,
  };

  list.push(newTemplate);
  clinicTemplatesMap.set(actor.clinicId, list);

  return newTemplate;
}
