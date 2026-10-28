"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Activity,
  Droplets,
  Heart,
  Wind,
  Thermometer,
  Scale,
  Ruler,
  Baby,
  AlertTriangle,
  Sparkles,
  Plus,
  Minus,
} from "lucide-react";
import type { Person } from "@/types/family";
import type {
  MeasurementType,
  PersonMeasurement,
} from "@/types/measurements";
import {
  getQuickLogDefaults,
  validateQuickLogValues,
} from "./quick-log-utils";
import { addPersonMeasurement } from "@/lib/family/measurements-service";
import { calculatePersonAge } from "@/lib/family/service";

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  initialType?: MeasurementType;
  onSuccess?: (measurement: PersonMeasurement) => void;
}

export function QuickLogModal({
  isOpen,
  onClose,
  person,
  initialType,
  onSuccess,
}: QuickLogModalProps) {
  const age = calculatePersonAge(person.birth_date);
  const defaults = getQuickLogDefaults(person);

  const [activeType, setActiveType] = useState<MeasurementType>(
    initialType || defaults.defaultType
  );

  const [inputs, setInputs] = useState<Record<string, string>>({
    systolic: "120",
    diastolic: "80",
    glucose: "95",
    meal_context: "fasting",
    heart_rate: "75",
    spo2: "98",
    temperature_c: "37.0",
    weight_kg: age.isChild ? "12.0" : "75.0",
    height_cm: age.isChild ? "85" : "175",
    head_circumference_cm: "46.0",
  });

  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialType) {
      setActiveType(initialType);
    } else {
      setActiveType(defaults.defaultType);
    }
    setErrorMsg(null);
  }, [isOpen, initialType, defaults.defaultType]);

  if (!isOpen) return null;

  const handleAdjust = (field: string, delta: number, isFloat = false) => {
    setInputs((prev) => {
      const current = parseFloat(prev[field] || "0");
      const next = isFloat
        ? (current + delta).toFixed(1)
        : Math.round(current + delta).toString();
      return { ...prev, [field]: next };
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = validateQuickLogValues(activeType, inputs);
    if (!validation.isValid || !validation.values) {
      setErrorMsg(validation.errorAr || "يرجى التحقق من القيم المدخلة");
      return;
    }

    try {
      setSubmitting(true);
      const measurement = await addPersonMeasurement(
        {
          family_id: person.family_id,
          person_id: person.id,
          measurement_type: activeType,
          values: validation.values,
          notes: notes.trim() || undefined,
        },
        person
      );

      if (onSuccess) {
        onSuccess(measurement);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء حفظ القياس");
    } finally {
      setSubmitting(false);
    }
  };

  const tabs: Array<{
    type: MeasurementType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = age.isChild
    ? [
        { type: "growth_entry", label: "النمو (WHO)", icon: Baby },
        { type: "temperature", label: "الحرارة", icon: Thermometer },
        { type: "heart_rate", label: "النبض", icon: Heart },
        { type: "spo2", label: "الأكسجين", icon: Wind },
      ]
    : [
        { type: "blood_pressure", label: "ضغط الدم", icon: Activity },
        { type: "blood_glucose", label: "السكر", icon: Droplets },
        { type: "heart_rate", label: "النبض", icon: Heart },
        { type: "spo2", label: "الأكسجين", icon: Wind },
        { type: "temperature", label: "الحرارة", icon: Thermometer },
        { type: "weight", label: "الوزن", icon: Scale },
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                تسجيل قياس سريع
              </h2>
              <p className="text-xs text-slate-500">
                تسجيل لـ: <span className="font-bold text-teal-700 dark:text-teal-400">{person.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Measurement Type Horizontal Scroll Tabs */}
        <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-800 overflow-x-auto flex gap-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeType === tab.type;
            return (
              <button
                key={tab.type}
                type="button"
                onClick={() => {
                  setActiveType(tab.type);
                  setErrorMsg(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-teal-600 text-white shadow-sm shadow-teal-600/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Blood Pressure Input */}
          {activeType === "blood_pressure" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Systolic */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 block mb-1">
                    الانقباضي (Systolic)
                  </span>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => handleAdjust("systolic", -5)}
                      className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={inputs.systolic}
                      onChange={(e) => handleInputChange("systolic", e.target.value)}
                      className="w-16 text-center text-xl font-black bg-transparent text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjust("systolic", 5)}
                      className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 block text-center mt-1">mmHg</span>
                </div>

                {/* Diastolic */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 block mb-1">
                    الانبساطي (Diastolic)
                  </span>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => handleAdjust("diastolic", -5)}
                      className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={inputs.diastolic}
                      onChange={(e) => handleInputChange("diastolic", e.target.value)}
                      className="w-16 text-center text-xl font-black bg-transparent text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjust("diastolic", 5)}
                      className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 block text-center mt-1">mmHg</span>
                </div>
              </div>
            </div>
          )}

          {/* Blood Glucose Input */}
          {activeType === "blood_glucose" && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-500 block mb-2">
                  مستوى السكر في الدم (mg/dL)
                </span>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjust("glucose", -5)}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    value={inputs.glucose}
                    onChange={(e) => handleInputChange("glucose", e.target.value)}
                    className="w-24 text-center text-3xl font-black bg-transparent text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAdjust("glucose", 5)}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Meal Context Selector */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-2">
                  توقيت القياس بالنسبة للوجبة:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "fasting", label: "صائم (8+ ساعات)" },
                    { id: "post_prandial", label: "بعد الأكل (ساعتين)" },
                    { id: "random", label: "عشوائي" },
                  ].map((ctx) => (
                    <button
                      key={ctx.id}
                      type="button"
                      onClick={() => handleInputChange("meal_context", ctx.id)}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        inputs.meal_context === ctx.id
                          ? "bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-800 dark:text-teal-200 font-bold"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {ctx.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Child Growth Entry Input (Weight, Height, Head Circumference) */}
          {activeType === "growth_entry" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Weight */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 block mb-1">الوزن (كجم)</span>
                  <div className="flex items-center justify-between gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => handleAdjust("weight_kg", -0.5, true)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step="0.1"
                      value={inputs.weight_kg}
                      onChange={(e) => handleInputChange("weight_kg", e.target.value)}
                      className="w-16 text-center font-black text-lg bg-transparent text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjust("weight_kg", 0.5, true)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Height */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 block mb-1">الطول (سم)</span>
                  <div className="flex items-center justify-between gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => handleAdjust("height_cm", -1)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={inputs.height_cm}
                      onChange={(e) => handleInputChange("height_cm", e.target.value)}
                      className="w-16 text-center font-black text-lg bg-transparent text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjust("height_cm", 1)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Head Circumference */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 block mb-1">محيط الرأس (سم)</span>
                  <div className="flex items-center justify-between gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => handleAdjust("head_circumference_cm", -0.5, true)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      step="0.5"
                      value={inputs.head_circumference_cm}
                      onChange={(e) => handleInputChange("head_circumference_cm", e.target.value)}
                      className="w-16 text-center font-black text-lg bg-transparent text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjust("head_circumference_cm", 0.5, true)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-900 text-teal-800 dark:text-teal-300 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-teal-600" />
                <span>
                  سيتم احتساب الشريحة المئوية (Percentiles) تلقائياً وفق جداول منظمة الصحة العالمية (WHO) لعمر {age.displayAr}.
                </span>
              </div>
            </div>
          )}

          {/* Temperature */}
          {activeType === "temperature" && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-500 block mb-2">درجة الحرارة (°C)</span>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleAdjust("temperature_c", -0.1, true)}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.temperature_c}
                  onChange={(e) => handleInputChange("temperature_c", e.target.value)}
                  className="w-24 text-center text-3xl font-black bg-transparent text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleAdjust("temperature_c", 0.1, true)}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Heart Rate */}
          {activeType === "heart_rate" && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-500 block mb-2">معدل النبض (نبضة / دقيقة)</span>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleAdjust("heart_rate", -2)}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  value={inputs.heart_rate}
                  onChange={(e) => handleInputChange("heart_rate", e.target.value)}
                  className="w-24 text-center text-3xl font-black bg-transparent text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleAdjust("heart_rate", 2)}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* SpO2 */}
          {activeType === "spo2" && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-500 block mb-2">نسبة تشبع الأكسجين (%)</span>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleAdjust("spo2", -1)}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  value={inputs.spo2}
                  onChange={(e) => handleInputChange("spo2", e.target.value)}
                  className="w-24 text-center text-3xl font-black bg-transparent text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleAdjust("spo2", 1)}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Weight for adult */}
          {activeType === "weight" && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-500 block mb-2">الوزن الحالي (كجم)</span>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleAdjust("weight_kg", -0.5, true)}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  step="0.5"
                  value={inputs.weight_kg}
                  onChange={(e) => handleInputChange("weight_kg", e.target.value)}
                  className="w-24 text-center text-3xl font-black bg-transparent text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleAdjust("weight_kg", 0.5, true)}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center font-bold text-slate-700 dark:text-slate-200"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Notes Input */}
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
              ملاحظات إضافية (اختياري)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: بعد مجهود خفيف، أو قياس في الصباح"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? "جاري الحفظ..." : "حفظ القياس الآن"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="py-3 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
