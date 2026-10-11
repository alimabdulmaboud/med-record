"use client";

import React, { useState } from "react";
import {
  FullNutritionRecord,
  MealPlan,
  MealPlanTemplate,
  EnergyPlan,
  NutritionGoal,
} from "@/modules/nutrition/types";
import {
  saveNutritionAssessment,
  recordAnthropometry,
  recordBodyComposition,
  saveEnergyPlan,
  saveDietHistory,
  saveMealPlan,
  duplicateMealPlan,
  saveMealPlanTemplate,
} from "@/modules/nutrition/service";
import {
  calculateBmr,
  calculateTdee,
  calculateMacros,
  BmrFormula,
  ActivityLevel,
  FORMULA_LABELS,
} from "@/modules/nutrition/energy/engine";
import { PrintableMealPlan } from "./PrintableMealPlan";
import { t } from "@/lib/i18n";
import {
  Utensils,
  Scale,
  Flame,
  Clock,
  Sparkles,
  Save,
  Printer,
  Copy,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface NutritionWorkspaceProps {
  doctor: { id: string; role: string; clinicId: string; name?: string; specialty?: string };
  clinicEnabledModules: string[];
  patient: {
    id: string;
    name: string;
    age?: string | number;
    gender?: string;
  };
  initialRecord: FullNutritionRecord;
  letterhead: {
    clinicName: string;
    doctorName: string;
    title: string;
    specialty: string;
    phone: string;
    address: string;
    logoUrl?: string | null;
  };
}

export function NutritionWorkspace({
  doctor,
  clinicEnabledModules,
  patient,
  initialRecord,
  letterhead,
}: NutritionWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<
    "assessment" | "anthropometry" | "energy" | "diet_history" | "meal_plan"
  >("meal_plan");

  const [record, setRecord] = useState<FullNutritionRecord>(initialRecord);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const showSuccess = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // 1. Assessment Form State
  const [assessmentForm, setAssessmentForm] = useState({
    primaryGoal: (record.assessment?.primaryGoal || "weight_loss") as NutritionGoal,
    weightHistory: record.assessment?.weightHistory || "",
    previousDiets: record.assessment?.previousDiets || "",
    lifestyleSleepHours: record.assessment?.lifestyleSleepHours || 7,
    lifestyleActivityLevel: (record.assessment?.lifestyleActivityLevel || "sedentary") as ActivityLevel,
    lifestyleWorkNature: record.assessment?.lifestyleWorkNature || "عمل مكتبي",
    lifestyleSmoking: record.assessment?.lifestyleSmoking || "non_smoker",
    sensitiveEatingDisorderFlag: record.assessment?.sensitiveEatingDisorderFlag ?? false,
    clinicalConditionsNotes: record.assessment?.clinicalConditionsNotes || "",
    supplementsMedications: record.assessment?.supplementsMedications || "",
    notes: record.assessment?.notes || "",
  });

  // 2. Anthropometry & Body Comp Form State
  const [anthroForm, setAnthroForm] = useState({
    weightKg: 82,
    heightCm: 172,
    waistCm: 90,
    hipCm: 102,
    armCircCm: 32,
    neckCircCm: 38,
    bodyFatPct: 32,
    muscleMassKg: 52,
    bodyWaterPct: 50,
    visceralFatLevel: 8,
    notes: "",
  });

  // 3. Energy Calculation State
  const [energyForm, setEnergyForm] = useState({
    formula: (record.activeEnergyPlan?.bmrFormula || "mifflin_st_jeor") as BmrFormula,
    activityLevel: "moderate" as ActivityLevel,
    targetCalories: record.activeEnergyPlan?.targetCalories || 1600,
    proteinPct: record.activeEnergyPlan?.proteinPct || 30,
    carbsPct: record.activeEnergyPlan?.carbsPct || 40,
    fatsPct: record.activeEnergyPlan?.fatsPct || 30,
    waterLiters: record.activeEnergyPlan?.waterLiters || 3.0,
    notes: record.activeEnergyPlan?.notes || "",
  });

  // 4. Meal Plan Form State
  const [activePlan, setActivePlan] = useState<MealPlan>(
    record.activeMealPlan || {
      id: "mp-temp",
      clinicId: doctor.clinicId,
      patientId: patient.id,
      planName: "نظام غذائي متوازن لإنقاص الوزن (1500 سعرة)",
      targetCalories: 1500,
      meals: record.templates[0]?.meals || [],
      isActive: true,
      createdAt: new Date().toISOString(),
    }
  );

  // Computed BMR and Macros for Energy Tab
  const patientAgeYears = typeof patient.age === "number" ? patient.age : 30;
  const sex = patient.gender === "أنثى" ? "female" : "male";

  const computedBmr = calculateBmr({
    formula: energyForm.formula,
    weightKg: anthroForm.weightKg,
    heightCm: anthroForm.heightCm,
    ageYears: patientAgeYears,
    sex,
    bodyFatPct: anthroForm.bodyFatPct,
  });

  const computedTdee = calculateTdee(computedBmr, energyForm.activityLevel);

  let computedMacros = { proteinGrams: 120, carbsGrams: 160, fatsGrams: 53 };
  try {
    computedMacros = calculateMacros(
      energyForm.targetCalories,
      energyForm.proteinPct,
      energyForm.carbsPct,
      energyForm.fatsPct
    );
  } catch {
    // Percentage fallback
  }

  // Handlers
  const handleSaveAssessment = () => {
    const updated = saveNutritionAssessment(
      doctor,
      {
        patientId: patient.id,
        ...assessmentForm,
      },
      clinicEnabledModules
    );
    setRecord((prev) => ({ ...prev, assessment: updated }));
    showSuccess("تم حفظ التقييم التغذوي بنجاح");
  };

  const handleRecordMeasurements = () => {
    const anthro = recordAnthropometry(
      doctor,
      {
        patientId: patient.id,
        weightKg: anthroForm.weightKg,
        heightCm: anthroForm.heightCm,
        waistCm: anthroForm.waistCm,
        hipCm: anthroForm.hipCm,
        armCircCm: anthroForm.armCircCm,
        neckCircCm: anthroForm.neckCircCm,
        sex,
        notes: anthroForm.notes,
      },
      clinicEnabledModules
    );

    const bcomp = recordBodyComposition(
      doctor,
      {
        patientId: patient.id,
        bodyFatPct: anthroForm.bodyFatPct,
        muscleMassKg: anthroForm.muscleMassKg,
        bodyWaterPct: anthroForm.bodyWaterPct,
        visceralFatLevel: anthroForm.visceralFatLevel,
        bmrDeviceKcal: computedBmr,
        notes: anthroForm.notes,
      },
      clinicEnabledModules
    );

    setRecord((prev) => ({
      ...prev,
      anthropometryHistory: [anthro, ...prev.anthropometryHistory],
      bodyCompositionHistory: [bcomp, ...prev.bodyCompositionHistory],
    }));

    showSuccess("تم تسجيل القياسات ونسبة الدهون بنجاح");
  };

  const handleSaveEnergyPlan = () => {
    const plan = saveEnergyPlan(
      doctor,
      {
        patientId: patient.id,
        bmrFormula: energyForm.formula,
        bmrCalculated: computedBmr,
        activityFactor: energyForm.activityLevel === "sedentary" ? 1.2 : 1.55,
        tdeeKcal: computedTdee,
        targetCalories: energyForm.targetCalories,
        proteinPct: energyForm.proteinPct,
        carbsPct: energyForm.carbsPct,
        fatsPct: energyForm.fatsPct,
        proteinG: computedMacros.proteinGrams,
        carbsG: computedMacros.carbsGrams,
        fatsG: computedMacros.fatsGrams,
        waterLiters: energyForm.waterLiters,
        notes: energyForm.notes,
      },
      clinicEnabledModules
    );

    setRecord((prev) => ({ ...prev, activeEnergyPlan: plan }));
    showSuccess("تم حفظ خطة الطاقة والمغذيات");
  };

  const handleLoadTemplate = (tpl: MealPlanTemplate) => {
    const newPlan: MealPlan = {
      id: `mp-${Date.now()}`,
      clinicId: doctor.clinicId,
      patientId: patient.id,
      planName: tpl.templateName,
      targetCalories: tpl.targetCalories,
      meals: JSON.parse(JSON.stringify(tpl.meals)),
      isActive: true,
      notes: tpl.notes,
      createdAt: new Date().toISOString(),
    };
    setActivePlan(newPlan);
    showSuccess(`تم تحميل القالب: ${tpl.templateName}`);
  };

  const handleDuplicatePlan = () => {
    const duplicated = duplicateMealPlan(
      doctor,
      activePlan.id,
      `${activePlan.planName} (نسخة معدلة)`,
      clinicEnabledModules
    );
    setActivePlan(duplicated);
    setRecord((prev) => ({
      ...prev,
      activeMealPlan: duplicated,
      mealPlanHistory: [duplicated, ...prev.mealPlanHistory],
    }));
    showSuccess("تم تكرار الخطة السابقة وجاهزة للتعديل السريع");
  };

  const handleSaveActiveMealPlan = () => {
    const saved = saveMealPlan(
      doctor,
      {
        patientId: patient.id,
        planName: activePlan.planName,
        targetCalories: activePlan.targetCalories,
        meals: activePlan.meals,
        isActive: true,
        notes: activePlan.notes,
      },
      clinicEnabledModules
    );
    setActivePlan(saved);
    setRecord((prev) => ({
      ...prev,
      activeMealPlan: saved,
      mealPlanHistory: [saved, ...prev.mealPlanHistory.filter((p) => p.id !== saved.id)],
    }));
    showSuccess("تم حفظ وتفعيل النظام الغذائي بنجاح");
  };

  // Recharts Progress Data
  const progressChartData = record.anthropometryHistory.map((a, idx) => {
    const bcomp = record.bodyCompositionHistory[idx];
    return {
      date: a.recordedAt.split("T")[0],
      weight: a.weightKg,
      bmi: a.bmi,
      fatPct: bcomp?.bodyFatPct || null,
      muscleMass: bcomp?.muscleMassKg || null,
    };
  }).reverse();

  return (
    <div className="bg-white rounded-xl border border-teal-200 shadow-sm overflow-hidden">
      {/* Title Header */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Utensils className="w-6 h-6 text-teal-200" />
          <div>
            <h2 className="font-bold text-base">{t("nutrition.title")}</h2>
            <p className="text-xs text-teal-100">
              حساب السعرات والمغذيات (BMR/TDEE)، قياسات InBody، وتصميم وطباعة الأنظمة الغذائية
            </p>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="bg-teal-950/80 text-teal-200 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-teal-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
            {saveSuccessMsg}
          </div>
        )}
      </div>

      {/* Sensitive Eating Disorder Alert Banner */}
      {assessmentForm.sensitiveEatingDisorderFlag && (
        <div className="bg-rose-50 border-y border-rose-200 px-4 py-2.5 flex items-center gap-2 text-xs text-rose-900 font-bold">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            {t("nutrition.sensitiveEatingDisorderFlag")} — يجب تجنب التقييد الصارم للسعرات والتركيز على التغذية الحدسية والعلاقة الصحية مع الطعام.
          </span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center border-b border-gray-200 bg-gray-50 px-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("meal_plan")}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === "meal_plan"
              ? "border-teal-600 text-teal-700 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Utensils className="w-4 h-4 text-teal-600" />
          {t("nutrition.mealPlanTitle")}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("energy")}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === "energy"
              ? "border-teal-600 text-teal-700 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Flame className="w-4 h-4 text-amber-500" />
          {t("nutrition.energyTitle")}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("anthropometry")}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === "anthropometry"
              ? "border-teal-600 text-teal-700 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Scale className="w-4 h-4 text-blue-600" />
          {t("nutrition.anthropometryTitle")}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("assessment")}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === "assessment"
              ? "border-teal-600 text-teal-700 bg-white"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          {t("nutrition.assessmentTitle")}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-5">
        {/* ================================================================ */}
        {/* 1. Meal Plan Builder Tab */}
        {/* ================================================================ */}
        {activeTab === "meal_plan" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-teal-600" />
                  تصميم وتخصيص النظام الغذائي
                </h3>
                <p className="text-xs text-gray-500">
                  إنشاء خطة من قالب جاهز، تكرار نظام سابق، والطباعة بضغطة زر
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDuplicatePlan}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-gray-600" />
                  {t("nutrition.templates.duplicate")}
                </button>

                <button
                  type="button"
                  onClick={() => setPrintModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {t("nutrition.printPlan")}
                </button>
              </div>
            </div>

            {/* Template Loaders */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                تحميل سريع من بروتوكولات العيادة الجاهزة (توفير الوقت):
              </span>
              <div className="flex flex-wrap gap-2">
                {record.templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleLoadTemplate(tpl)}
                    className="bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs text-slate-800 transition-all text-right"
                  >
                    {tpl.templateName}
                  </button>
                ))}
              </div>
            </div>

            {/* Plan Header Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">اسم الخطة / النظام</label>
                <input
                  type="text"
                  value={activePlan.planName}
                  onChange={(e) => setActivePlan((p) => ({ ...p, planName: e.target.value }))}
                  className="w-full text-xs border rounded-lg p-2 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">السعرات المستهدفة (kcal)</label>
                <input
                  type="number"
                  value={activePlan.targetCalories || 1500}
                  onChange={(e) => setActivePlan((p) => ({ ...p, targetCalories: Number(e.target.value) }))}
                  className="w-full text-xs border rounded-lg p-2 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات والتوجيهات</label>
                <input
                  type="text"
                  value={activePlan.notes || ""}
                  onChange={(e) => setActivePlan((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="تعليمات شرب الماء والرياضة..."
                  className="w-full text-xs border rounded-lg p-2"
                />
              </div>
            </div>

            {/* Meals List */}
            <div className="space-y-3">
              {activePlan.meals.map((meal, mealIdx) => (
                <div key={meal.id || mealIdx} className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-600" />
                      {meal.mealName} {meal.timeOfDay ? `(${meal.timeOfDay})` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedMeals = activePlan.meals.map((m, idx) => {
                          if (idx === mealIdx) {
                            return {
                              ...m,
                              items: [...m.items, { foodItem: "عنصر طعام جديد", quantity: "حصة واحدة" }],
                            };
                          }
                          return m;
                        });
                        setActivePlan((p) => ({ ...p, meals: updatedMeals }));
                      }}
                      className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      إضافة عنصر
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {meal.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 text-xs">
                        <input
                          type="text"
                          value={item.foodItem}
                          onChange={(e) => {
                            const updatedMeals = [...activePlan.meals];
                            updatedMeals[mealIdx].items[itemIdx].foodItem = e.target.value;
                            setActivePlan((p) => ({ ...p, meals: updatedMeals }));
                          }}
                          className="flex-1 font-semibold border-0 p-0 focus:ring-0 text-slate-800"
                        />
                        <input
                          type="text"
                          value={item.quantity}
                          onChange={(e) => {
                            const updatedMeals = [...activePlan.meals];
                            updatedMeals[mealIdx].items[itemIdx].quantity = e.target.value;
                            setActivePlan((p) => ({ ...p, meals: updatedMeals }));
                          }}
                          className="w-36 font-bold text-emerald-700 border-0 p-0 focus:ring-0 text-left"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updatedMeals = [...activePlan.meals];
                            updatedMeals[mealIdx].items.splice(itemIdx, 1);
                            setActivePlan((p) => ({ ...p, meals: updatedMeals }));
                          }}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={handleSaveActiveMealPlan}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                حفظ وتفعيل النظام للمريض
              </button>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* 2. Energy Needs & Macros Tab */}
        {/* ================================================================ */}
        {activeTab === "energy" && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              حساب احتياجات الطاقة والأيض الأساسي وتوزيع الماكروز
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t("nutrition.bmrFormula")}
                </label>
                <select
                  value={energyForm.formula}
                  onChange={(e) => setEnergyForm((f) => ({ ...f, formula: e.target.value as any }))}
                  className="w-full border rounded-lg p-2 bg-white"
                >
                  <option value="mifflin_st_jeor">ميفلين-سانت جور (Mifflin-St Jeor - موصى بها)</option>
                  <option value="harris_benedict">هاريس-بندكت المعدلة (Harris-Benedict)</option>
                  <option value="katch_mcardle">كاتش-ماكاردل (Katch-McArdle - بدلالة نسبة الدهون)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {t("nutrition.activityLevel")}
                </label>
                <select
                  value={energyForm.activityLevel}
                  onChange={(e) => setEnergyForm((f) => ({ ...f, activityLevel: e.target.value as any }))}
                  className="w-full border rounded-lg p-2 bg-white"
                >
                  <option value="sedentary">خامل / قليل الحركة (×1.2)</option>
                  <option value="light">نشاط خفيف 1-3 أيام أسبوعياً (×1.375)</option>
                  <option value="moderate">نشاط متوسط 3-5 أيام أسبوعياً (×1.55)</option>
                  <option value="very_active">نشاط عالي 6-7 أيام أسبوعياً (×1.725)</option>
                </select>
              </div>
            </div>

            {/* Calculations KPI Results */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-teal-50/60 border border-teal-200 rounded-xl p-4 text-center">
              <div>
                <span className="text-xs text-gray-500">معدل الأيض الأساسي (BMR)</span>
                <span className="block text-lg font-black text-teal-900 mt-1">{computedBmr} kcal</span>
              </div>
              <div>
                <span className="text-xs text-gray-500">إجمالي الحرق اليومي (TDEE)</span>
                <span className="block text-lg font-black text-teal-800 mt-1">{computedTdee} kcal</span>
              </div>
              <div>
                <span className="text-xs text-gray-500">السعرات المستهدفة</span>
                <input
                  type="number"
                  value={energyForm.targetCalories}
                  onChange={(e) => setEnergyForm((f) => ({ ...f, targetCalories: Number(e.target.value) }))}
                  className="w-24 text-center font-black text-emerald-700 text-lg border rounded mt-1 bg-white"
                />
              </div>
              <div>
                <span className="text-xs text-gray-500">عجز / فائض الطاقة</span>
                <span className="block text-lg font-black text-amber-700 mt-1">
                  {energyForm.targetCalories - computedTdee} kcal
                </span>
              </div>
            </div>

            {/* Macro Percentages */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-gray-800">توزيع المغذيات الكبرى (Macros):</h4>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <span className="font-bold text-gray-700">البروتين: {energyForm.proteinPct}%</span>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={energyForm.proteinPct}
                    onChange={(e) => setEnergyForm((f) => ({ ...f, proteinPct: Number(e.target.value) }))}
                    className="w-full mt-2"
                  />
                  <span className="block font-black text-teal-800 text-sm mt-1">{computedMacros.proteinGrams} جم</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <span className="font-bold text-gray-700">الكربوهيدرات: {energyForm.carbsPct}%</span>
                  <input
                    type="range"
                    min="10"
                    max="65"
                    value={energyForm.carbsPct}
                    onChange={(e) => setEnergyForm((f) => ({ ...f, carbsPct: Number(e.target.value) }))}
                    className="w-full mt-2"
                  />
                  <span className="block font-black text-teal-800 text-sm mt-1">{computedMacros.carbsGrams} جم</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                  <span className="font-bold text-gray-700">الدهون الصحية: {energyForm.fatsPct}%</span>
                  <input
                    type="range"
                    min="15"
                    max="45"
                    value={energyForm.fatsPct}
                    onChange={(e) => setEnergyForm((f) => ({ ...f, fatsPct: Number(e.target.value) }))}
                    className="w-full mt-2"
                  />
                  <span className="block font-black text-teal-800 text-sm mt-1">{computedMacros.fatsGrams} جم</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveEnergyPlan}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                حفظ خطة الطاقة
              </button>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* 3. Anthropometry & Body Composition Tab */}
        {/* ================================================================ */}
        {activeTab === "anthropometry" && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              القياسات ومحيطات الجسم وفحص InBody
            </h3>

            {/* Input Form */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-gray-600 mb-1">الوزن (كجم)</label>
                  <input
                    type="number"
                    value={anthroForm.weightKg}
                    onChange={(e) => setAnthroForm((f) => ({ ...f, weightKg: Number(e.target.value) }))}
                    className="w-full border rounded p-1.5 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">الطول (سم)</label>
                  <input
                    type="number"
                    value={anthroForm.heightCm}
                    onChange={(e) => setAnthroForm((f) => ({ ...f, heightCm: Number(e.target.value) }))}
                    className="w-full border rounded p-1.5 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">محيط الخصر (سم)</label>
                  <input
                    type="number"
                    value={anthroForm.waistCm}
                    onChange={(e) => setAnthroForm((f) => ({ ...f, waistCm: Number(e.target.value) }))}
                    className="w-full border rounded p-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">محيط الأرداف (سم)</label>
                  <input
                    type="number"
                    value={anthroForm.hipCm}
                    onChange={(e) => setAnthroForm((f) => ({ ...f, hipCm: Number(e.target.value) }))}
                    className="w-full border rounded p-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">نسبة الدهون (%)</label>
                  <input
                    type="number"
                    value={anthroForm.bodyFatPct}
                    onChange={(e) => setAnthroForm((f) => ({ ...f, bodyFatPct: Number(e.target.value) }))}
                    className="w-full border rounded p-1.5 bg-white text-rose-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">الكتلة العضلية (كجم)</label>
                  <input
                    type="number"
                    value={anthroForm.muscleMassKg}
                    onChange={(e) => setAnthroForm((f) => ({ ...f, muscleMassKg: Number(e.target.value) }))}
                    className="w-full border rounded p-1.5 bg-white text-blue-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">نسبة الماء (%)</label>
                  <input
                    type="number"
                    value={anthroForm.bodyWaterPct}
                    onChange={(e) => setAnthroForm((f) => ({ ...f, bodyWaterPct: Number(e.target.value) }))}
                    className="w-full border rounded p-1.5 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">الدهون الحشوية</label>
                  <input
                    type="number"
                    value={anthroForm.visceralFatLevel}
                    onChange={(e) => setAnthroForm((f) => ({ ...f, visceralFatLevel: Number(e.target.value) }))}
                    className="w-full border rounded p-1.5 bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleRecordMeasurements}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  تسجيل القياسات في ملف الزيارة
                </button>
              </div>
            </div>

            {/* Historical Charts */}
            {progressChartData.length > 0 && (
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                  تتبع نزول الوزن ونسبة الدهون عبر الزيارات
                </h4>
                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="weight" name="الوزن (كجم)" stroke="#2563eb" strokeWidth={2} />
                      <Line type="monotone" dataKey="fatPct" name="نسبة الدهون (%)" stroke="#e11d48" strokeWidth={2} />
                      <Line type="monotone" dataKey="muscleMass" name="الكتلة العضلية (كجم)" stroke="#059669" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* 4. Initial Assessment Tab */}
        {/* ================================================================ */}
        {activeTab === "assessment" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              التقييم التغذوي الشامل وتاريخ الوزن
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">{t("nutrition.goal")}</label>
                <select
                  value={assessmentForm.primaryGoal}
                  onChange={(e) => setAssessmentForm((f) => ({ ...f, primaryGoal: e.target.value as any }))}
                  className="w-full border rounded-lg p-2 bg-white"
                >
                  <option value="weight_loss">{t("nutrition.goals.weight_loss")}</option>
                  <option value="weight_gain">{t("nutrition.goals.weight_gain")}</option>
                  <option value="muscle_building">{t("nutrition.goals.muscle_building")}</option>
                  <option value="diabetes_management">{t("nutrition.goals.diabetes_management")}</option>
                  <option value="hypertension">{t("nutrition.goals.hypertension")}</option>
                  <option value="pregnancy_lactation">{t("nutrition.goals.pregnancy_lactation")}</option>
                  <option value="gi_disorders">{t("nutrition.goals.gi_disorders")}</option>
                  <option value="sports_nutrition">{t("nutrition.goals.sports_nutrition")}</option>
                  <option value="general_wellness">{t("nutrition.goals.general_wellness")}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">تاريخ الوزن والتغيرات السابقة</label>
                <input
                  type="text"
                  value={assessmentForm.weightHistory}
                  onChange={(e) => setAssessmentForm((f) => ({ ...f, weightHistory: e.target.value }))}
                  placeholder="أعلى وزن، أقل وزن، أسباب الزيادة..."
                  className="w-full border rounded-lg p-2 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">الحميات السابقة وتجارب الدايت</label>
                <input
                  type="text"
                  value={assessmentForm.previousDiets}
                  onChange={(e) => setAssessmentForm((f) => ({ ...f, previousDiets: e.target.value }))}
                  placeholder="أنواع الدايت السابقة..."
                  className="w-full border rounded-lg p-2 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">الأدوية والمكملات الحالية</label>
                <input
                  type="text"
                  value={assessmentForm.supplementsMedications}
                  onChange={(e) => setAssessmentForm((f) => ({ ...f, supplementsMedications: e.target.value }))}
                  className="w-full border rounded-lg p-2 bg-white"
                />
              </div>
            </div>

            {/* Doctor-only sensitive eating disorder flag checkbox */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-950">
                <input
                  type="checkbox"
                  checked={assessmentForm.sensitiveEatingDisorderFlag}
                  onChange={(e) => setAssessmentForm((f) => ({ ...f, sensitiveEatingDisorderFlag: e.target.checked }))}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                {t("nutrition.sensitiveEatingDisorderFlag")}
              </label>
              <p className="text-[11px] text-rose-700 mt-1 mr-6">
                هذه العلامة سرية وخاصة بالطبيب فقط لتوجيه الخطة وتجنب هوس الميزان أو التقييد الحاد.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveAssessment}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                حفظ التقييم
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Printable Modal */}
      {printModalOpen && (
        <PrintableMealPlan
          plan={activePlan}
          energyPlan={record.activeEnergyPlan}
          patient={patient}
          letterhead={letterhead}
          onClose={() => setPrintModalOpen(false)}
        />
      )}
    </div>
  );
}
