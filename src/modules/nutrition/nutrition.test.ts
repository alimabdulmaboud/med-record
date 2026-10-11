import { describe, it, expect } from "vitest";
import {
  getFullNutritionRecord,
  saveNutritionAssessment,
  recordAnthropometry,
  recordBodyComposition,
  saveEnergyPlan,
  saveDietHistory,
  saveMealPlan,
  duplicateMealPlan,
  saveMealPlanTemplate,
  verifyNutritionAccess,
  DEFAULT_MEAL_PLAN_TEMPLATES,
} from "./service";
import { calculateBmr, calculateTdee, calculateMacros } from "./energy/engine";

describe("Nutrition Module Service & Domain Logic", () => {
  const nutritionDoctor = {
    id: "doc-nutrition-1",
    role: "doctor",
    clinicId: "clinic-2",
  };

  const clinicWithNutrition = ["nutrition"];
  const clinicWithoutNutrition = ["pediatrics"];

  describe("Medical Privacy & Module Isolation Guards", () => {
    it("denies access to receptionist", () => {
      const receptionist = {
        id: "rec-1",
        role: "receptionist",
        clinicId: "clinic-2",
      };

      expect(() =>
        verifyNutritionAccess(receptionist, "clinic-2", clinicWithNutrition)
      ).toThrowError(/Medical Privacy Violation/);
    });

    it("denies access to platform admin", () => {
      const admin = {
        id: "admin-1",
        role: "platform_admin",
        clinicId: "clinic-2",
      };

      expect(() =>
        verifyNutritionAccess(admin, "clinic-2", clinicWithNutrition)
      ).toThrowError(/Medical Privacy Violation/);
    });

    it("enforces tenant isolation: Doctor in Clinic 2 cannot access Clinic 1", () => {
      expect(() =>
        verifyNutritionAccess(nutritionDoctor, "clinic-1", clinicWithNutrition)
      ).toThrowError(/Tenant Isolation Violation/);
    });

    it("denies access if the clinic does not have the nutrition module enabled", () => {
      expect(() =>
        verifyNutritionAccess(nutritionDoctor, "clinic-2", clinicWithoutNutrition)
      ).toThrowError(/Module Access Denied/);
    });
  });

  describe("Initial Nutrition Assessment & Sensitive Care Flag", () => {
    it("saves initial assessment with doctor-only sensitive eating disorder flag", () => {
      const assessment = saveNutritionAssessment(
        nutritionDoctor,
        {
          patientId: "patient-adult-1",
          primaryGoal: "weight_loss",
          weightHistory: "زيادة 15 كجم خلال السنتين الماضيتين بعد تغيير الوظيفة",
          previousDiets: "حاولت عدة حميات منخفضة الكربوهيدرات مع استعادة سريعة للوزن",
          lifestyleSleepHours: 6,
          lifestyleActivityLevel: "light",
          lifestyleWorkNature: "عمل مكتبي مكتبي 8 ساعات يومياً",
          lifestyleSmoking: "non_smoker",
          sensitiveEatingDisorderFlag: true, // Doctor-only sensitive care flag
          clinicalConditionsNotes: "مقاومة إنسولين خفيفة",
          supplementsMedications: "ميتفورمين 500 مجم يومياً، فيتامين د 5000 وحدة",
          notes: "تتطلب الخطة نهجاً تدريجياً مرناً لتجنب الانتكاس في نوبات الشره",
        },
        clinicWithNutrition
      );

      expect(assessment.id).toBeDefined();
      expect(assessment.sensitiveEatingDisorderFlag).toBe(true);

      const record = getFullNutritionRecord(
        nutritionDoctor,
        "patient-adult-1",
        clinicWithNutrition
      );
      expect(record.assessment?.sensitiveEatingDisorderFlag).toBe(true);
      expect(record.assessment?.primaryGoal).toBe("weight_loss");
    });
  });

  describe("Anthropometry & Body Composition Tracking Over Visits", () => {
    it("records anthropometry and automatically computes BMI and Waist-to-Hip Ratio", () => {
      const anthro = recordAnthropometry(
        nutritionDoctor,
        {
          patientId: "patient-adult-1",
          weightKg: 85,
          heightCm: 170,
          waistCm: 92,
          hipCm: 104,
          armCircCm: 32,
          sex: "female",
          notes: "الزيارة الأولى",
        },
        clinicWithNutrition
      );

      expect(anthro.id).toBeDefined();
      expect(anthro.bmi).toBe(29.4);
      expect(anthro.waistHipRatio).toBe(0.88); // 92 / 104 = 0.88
    });

    it("records bioimpedance body composition data across visits", () => {
      const bcomp1 = recordBodyComposition(
        nutritionDoctor,
        {
          patientId: "patient-adult-1",
          recordedAt: "2026-08-01T10:00:00Z",
          bodyFatPct: 34.5,
          muscleMassKg: 52.0,
          bodyWaterPct: 48.0,
          visceralFatLevel: 10,
          bmrDeviceKcal: 1480,
          notes: "فحص أولي بجهاز InBody 270",
        },
        clinicWithNutrition
      );

      const bcomp2 = recordBodyComposition(
        nutritionDoctor,
        {
          patientId: "patient-adult-1",
          recordedAt: "2026-09-01T10:00:00Z",
          bodyFatPct: 32.8,
          muscleMassKg: 52.4,
          bodyWaterPct: 49.2,
          visceralFatLevel: 9,
          bmrDeviceKcal: 1490,
          notes: "متابعة بعد شهر: انخفاض نسبة الدهون وزيادة الكتلة العضلية",
        },
        clinicWithNutrition
      );

      expect(bcomp1.id).toBeDefined();
      expect(bcomp2.id).toBeDefined();

      const record = getFullNutritionRecord(
        nutritionDoctor,
        "patient-adult-1",
        clinicWithNutrition
      );
      expect(record.bodyCompositionHistory.length).toBe(2);
      expect(record.bodyCompositionHistory[0].bodyFatPct).toBe(32.8);
      expect(record.bodyCompositionHistory[1].bodyFatPct).toBe(34.5);
    });
  });

  describe("Energy Plan & Meal Plan Builder", () => {
    it("creates an energy plan calculating BMR, TDEE, and exact macronutrient grams", () => {
      const bmr = calculateBmr({
        formula: "mifflin_st_jeor",
        weightKg: 85,
        heightCm: 170,
        ageYears: 32,
        sex: "female",
      });
      const tdee = calculateTdee(bmr, "light"); // 1.375
      const targetCalories = 1500;
      const macros = calculateMacros(targetCalories, 30, 40, 30); // 30% P, 40% C, 30% F

      const plan = saveEnergyPlan(
        nutritionDoctor,
        {
          patientId: "patient-adult-1",
          bmrFormula: "mifflin_st_jeor",
          bmrCalculated: bmr,
          activityFactor: 1.375,
          tdeeKcal: tdee,
          targetCalories,
          proteinPct: 30,
          carbsPct: 40,
          fatsPct: 30,
          proteinG: macros.proteinGrams,
          carbsG: macros.carbsGrams,
          fatsG: macros.fatsGrams,
          waterLiters: 2.8,
          notes: "عجز 400 سعرة لإنقاص الوزن بمعدل 0.5 إلى 0.75 كجم أسبوعياً",
        },
        clinicWithNutrition
      );

      expect(plan.id).toBeDefined();
      expect(plan.proteinG).toBe(113); // (1500 * 0.3) / 4 = 112.5 -> 113g
      expect(plan.carbsG).toBe(150); // (1500 * 0.4) / 4 = 150g
      expect(plan.fatsG).toBe(50); // (1500 * 0.3) / 9 = 50g
    });

    it("creates a meal plan from template in under a minute and duplicates it for customization", () => {
      const record = getFullNutritionRecord(
        nutritionDoctor,
        "patient-adult-1",
        clinicWithNutrition
      );
      expect(record.templates.length).toBeGreaterThan(0);

      const template = record.templates[0]; // 1500 kcal template

      // 1. Create meal plan from template
      const mealPlan = saveMealPlan(
        nutritionDoctor,
        {
          patientId: "patient-adult-1",
          planName: template.templateName,
          targetCalories: template.targetCalories,
          meals: template.meals,
          isActive: true,
          notes: template.notes,
        },
        clinicWithNutrition
      );

      expect(mealPlan.id).toBeDefined();
      expect(mealPlan.isActive).toBe(true);
      expect(mealPlan.meals.length).toBe(5);

      // 2. Duplicate previous plan to edit for follow-up visit (Phase 12 Acceptance)
      const duplicatedPlan = duplicateMealPlan(
        nutritionDoctor,
        mealPlan.id,
        "نظام غذائي معدل - زيارة المتابعة الثانية (1600 سعرة)",
        clinicWithNutrition
      );

      expect(duplicatedPlan.id).toBeDefined();
      expect(duplicatedPlan.id).not.toBe(mealPlan.id);
      expect(duplicatedPlan.planName).toContain("زيارة المتابعة الثانية");
      expect(duplicatedPlan.isActive).toBe(true);

      // Verify that original plan became inactive when duplicate was made active
      const refreshed = getFullNutritionRecord(
        nutritionDoctor,
        "patient-adult-1",
        clinicWithNutrition
      );
      const original = refreshed.mealPlanHistory.find((p) => p.id === mealPlan.id);
      expect(original?.isActive).toBe(false);
    });

    it("allows saving a custom plan as a new reusable template", () => {
      const customTemplate = saveMealPlanTemplate(
        nutritionDoctor,
        {
          templateName: "نظام غذائي لمرضى مقاومة الإنسولين وتكيس المبايض (1400 سعرة)",
          category: "clinical",
          targetCalories: 1400,
          meals: [
            {
              id: "m-1",
              mealName: "الإفطار",
              items: [
                { foodItem: "أومليت بالخضار وزيت الزيتون", quantity: "2 بيضة" },
                { foodItem: "خبز حبة كاملة", quantity: "نصف رغيف" },
              ],
            },
          ],
          notes: "منخفض المؤشر الجلايسيمي وغني بالألياف ومضادات الأكسدة.",
        },
        clinicWithNutrition
      );

      expect(customTemplate.id).toBeDefined();
      const refreshed = getFullNutritionRecord(
        nutritionDoctor,
        "patient-adult-1",
        clinicWithNutrition
      );
      expect(
        refreshed.templates.some((t) => t.templateName.includes("تكيس المبايض"))
      ).toBe(true);
    });
  });
});
