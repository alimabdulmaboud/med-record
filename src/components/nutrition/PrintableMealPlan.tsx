"use client";

import React from "react";
import { MealPlan, EnergyPlan } from "@/modules/nutrition/types";
import { FORMULA_LABELS } from "@/modules/nutrition/energy/engine";
import { Printer, X, Sparkles, Utensils } from "lucide-react";
import { t } from "@/lib/i18n";

interface PrintableMealPlanProps {
  plan: MealPlan;
  energyPlan?: EnergyPlan;
  patient: {
    name: string;
    age?: string | number;
    gender?: string;
  };
  letterhead: {
    clinicName: string;
    doctorName: string;
    title: string;
    specialty: string;
    phone: string;
    address: string;
    logoUrl?: string | null;
  };
  onClose: () => void;
}

export function PrintableMealPlan({
  plan,
  energyPlan,
  patient,
  letterhead,
  onClose,
}: PrintableMealPlanProps) {
  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Container */}
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="print:hidden bg-slate-800 text-white px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">معاينة وطباعة النظام الغذائي</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              طباعة الآن
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div className="p-8 overflow-y-auto flex-1 font-sans text-slate-800 print:p-0 print:m-0" dir="rtl">
          <div className="max-w-[210mm] mx-auto bg-white p-6 rounded-xl border border-slate-200 print:border-none print:p-0">
            {/* 1. Official Clinic Letterhead */}
            <header className="border-b-2 border-emerald-600 pb-5 mb-6 flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-black text-emerald-800">
                  {letterhead.clinicName}
                </h1>
                <p className="text-sm font-bold text-slate-700 mt-1">
                  {letterhead.doctorName} — {letterhead.title} {letterhead.specialty}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{letterhead.address}</p>
                <p className="text-xs text-slate-500">{letterhead.phone}</p>
              </div>

              <div className="text-left font-sans">
                <span className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black px-3 py-1 rounded-md">
                  خطة التغذية العلاجية
                </span>
                <p className="text-xs text-slate-500 mt-2">التاريخ: {currentDate}</p>
              </div>
            </header>

            {/* 2. Patient Demographics & Calorie Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex gap-6">
                <div>
                  <span className="text-slate-500">اسم المريض: </span>
                  <span className="font-bold text-slate-900 text-sm">{patient.name}</span>
                </div>
                {patient.age && (
                  <div>
                    <span className="text-slate-500">العمر: </span>
                    <span className="font-bold text-slate-800">{patient.age}</span>
                  </div>
                )}
                {patient.gender && (
                  <div>
                    <span className="text-slate-500">الجنس: </span>
                    <span className="font-bold text-slate-800">{patient.gender}</span>
                  </div>
                )}
              </div>

              {plan.targetCalories && (
                <div className="bg-emerald-700 text-white font-black px-3.5 py-1.5 rounded-lg text-sm shadow-sm">
                  السعرات المستهدفة: {plan.targetCalories} kcal / يومياً
                </div>
              )}
            </div>

            {/* 3. Energy Formula & Macronutrient Breakdown (Section 7.3) */}
            {energyPlan && (
              <div className="mb-6 border border-emerald-100 bg-emerald-50/50 rounded-xl p-3.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-2 mb-2 font-bold text-emerald-900">
                  <span>
                    طريقة حساب الطاقة:{" "}
                    <span className="font-semibold text-emerald-800">
                      {FORMULA_LABELS[energyPlan.bmrFormula]?.ar || energyPlan.bmrFormula}
                    </span>
                  </span>
                  <span>معدل الأيض (BMR): {energyPlan.bmrCalculated} kcal</span>
                  <span>معامل النشاط: ×{energyPlan.activityFactor} (TDEE: {energyPlan.tdeeKcal} kcal)</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1 font-medium">
                  <div className="bg-white p-2 rounded border border-emerald-200">
                    <span className="text-slate-500 block text-[11px]">البروتين ({energyPlan.proteinPct}%)</span>
                    <span className="font-bold text-emerald-800 text-sm">{energyPlan.proteinG} جم</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-emerald-200">
                    <span className="text-slate-500 block text-[11px]">الكربوهيدرات ({energyPlan.carbsPct}%)</span>
                    <span className="font-bold text-emerald-800 text-sm">{energyPlan.carbsG} جم</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-emerald-200">
                    <span className="text-slate-500 block text-[11px]">الدهون الصحية ({energyPlan.fatsPct}%)</span>
                    <span className="font-bold text-emerald-800 text-sm">{energyPlan.fatsG} جم</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Meals & Quantities Schedule */}
            <div className="space-y-4 mb-8">
              <h3 className="font-bold text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-600" />
                توزيع الوجبات والمقادير اليومية
              </h3>

              <div className="space-y-3">
                {plan.meals.map((meal, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-xl p-3.5 bg-white break-inside-avoid shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        {meal.mealName}
                      </h4>
                      {meal.timeOfDay && (
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {meal.timeOfDay}
                        </span>
                      )}
                    </div>

                    <ul className="divide-y divide-slate-100 text-xs">
                      {meal.items.map((it, itemIdx) => (
                        <li key={itemIdx} className="py-1.5 flex justify-between gap-4">
                          <span className="font-semibold text-slate-800">• {it.foodItem}</span>
                          <span className="text-emerald-700 font-bold shrink-0">{it.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. General Advice & Doctor Signature */}
            <footer className="border-t-2 border-slate-200 pt-4 flex items-end justify-between text-xs text-slate-600">
              <div className="max-w-md">
                <p className="font-bold text-slate-800 mb-1">تعليمات هامة:</p>
                <p className="text-[11px] text-slate-600">
                  {plan.notes ||
                    "شرب ما لا يقل عن 2.5 لتر ماء يومياً، وممارسة رياضة المشي 30 دقيقة، والنوم المنتظم 7-8 ساعات."}
                </p>
              </div>

              <div className="text-center">
                <p className="font-bold text-slate-800">توقيع أخصائي التغذية</p>
                <p className="mt-8 text-xs font-serif text-slate-500">{letterhead.doctorName}</p>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
