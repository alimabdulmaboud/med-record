"use client";

import React, { useState } from 'react';
import {
  Activity,
  Heart,
  Droplets,
  Wind,
  Thermometer,
  Scale,
  Ruler,
  Baby,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import type { MeasurementType, MeasurementValues } from '@/types/med-record';
import { validateMeasurementInput } from '@/lib/med-record/quick-log-helper';
import { evaluateVitalMeasurement } from '@/lib/med-record/vitals-evaluator';

interface QuickLogModalProps {
  isOpen: boolean;
  memberId: string;
  memberName: string;
  isChild?: boolean;
  onClose: () => void;
  onSave: (type: MeasurementType, values: MeasurementValues, notes?: string) => Promise<void>;
}

export function QuickLogModal({
  isOpen,
  memberId,
  memberName,
  isChild,
  onClose,
  onSave,
}: QuickLogModalProps) {
  const [selectedType, setSelectedType] = useState<MeasurementType>('blood_pressure');
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({
    systolic: '120',
    diastolic: '80',
    glucose: '95',
    context: 'fasting',
    value: '',
  });
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const measurementTypes: Array<{
    type: MeasurementType;
    labelAr: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    childOnly?: boolean;
    adultOnly?: boolean;
  }> = [
    { type: 'blood_pressure', labelAr: 'ضغط الدم', icon: Activity, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { type: 'blood_sugar', labelAr: 'السكر في الدم', icon: Droplets, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { type: 'oxygen_saturation', labelAr: 'نسبة الأكسجين SpO2', icon: Wind, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { type: 'heart_rate', labelAr: 'النبض', icon: Heart, color: 'text-red-600 bg-red-50 border-red-200' },
    { type: 'temperature', labelAr: 'درجة الحرارة', icon: Thermometer, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { type: 'weight', labelAr: 'الوزن', icon: Scale, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { type: 'height', labelAr: 'الطول / القامة', icon: Ruler, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { type: 'head_circumference', labelAr: 'محيط الرأس', icon: Baby, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  ];

  // Instant evaluation preview
  const validation = validateMeasurementInput(selectedType, rawInputs);
  const evaluation = validation.isValid && validation.values
    ? evaluateVitalMeasurement(selectedType, validation.values)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.isValid || !validation.values) {
      setErrorMsg(validation.errorAr || 'يرجى مراجعة القيمة المدخلة');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onSave(selectedType, validation.values, notes.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ القياس');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50" dir="rtl">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-black text-slate-900">
              تسجيل قياس سريع ({memberName})
            </h3>
            <p className="text-xs text-slate-500">سجل القراءة الحالية في أقل من 10 ثوانٍ</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Quick Select Type Badges */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              اختر نوع القياس:
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
              {measurementTypes.map(item => {
                const isSelected = selectedType === item.type;
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setSelectedType(item.type);
                      setErrorMsg(null);
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 text-emerald-900 font-bold scale-[1.02]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-[11px] leading-tight">{item.labelAr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Inputs according to selected type */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 space-y-3">
            {selectedType === 'blood_pressure' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    الانقباضي (العالي - Systolic)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      placeholder="مثال: 120"
                      value={rawInputs.systolic}
                      onChange={e => setRawInputs({ ...rawInputs, systolic: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-center text-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <span className="absolute left-2.5 top-3 text-[10px] text-slate-400 font-medium">mmHg</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    الانبساطي (الواطي - Diastolic)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      placeholder="مثال: 80"
                      value={rawInputs.diastolic}
                      onChange={e => setRawInputs({ ...rawInputs, diastolic: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-center text-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <span className="absolute left-2.5 top-3 text-[10px] text-slate-400 font-medium">mmHg</span>
                  </div>
                </div>
              </div>
            )}

            {selectedType === 'blood_sugar' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    توقيت فحص السكر
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'fasting', label: 'صائم' },
                      { id: 'post_prandial', label: 'بعد الأكل' },
                      { id: 'random', label: 'عشوائي' },
                      { id: 'hba1c', label: 'تراكمي' },
                    ].map(ctx => (
                      <button
                        key={ctx.id}
                        type="button"
                        onClick={() => setRawInputs({ ...rawInputs, context: ctx.id })}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                          rawInputs.context === ctx.id
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {ctx.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {rawInputs.context === 'hba1c' ? 'نسبة السكر التراكمي (%)' : 'قيمة السكر (ملجم/دسل)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step={rawInputs.context === 'hba1c' ? '0.1' : '1'}
                      placeholder={rawInputs.context === 'hba1c' ? 'مثال: 5.6' : 'مثال: 95'}
                      value={rawInputs.glucose}
                      onChange={e => setRawInputs({ ...rawInputs, glucose: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-center text-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <span className="absolute left-3 top-3 text-xs text-slate-400 font-medium">
                      {rawInputs.context === 'hba1c' ? '%' : 'mg/dL'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {['heart_rate', 'oxygen_saturation', 'temperature', 'weight', 'height', 'head_circumference'].includes(selectedType) && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  القيمة المقروءة:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step={selectedType === 'temperature' ? '0.1' : selectedType === 'weight' ? '0.05' : '1'}
                    placeholder={
                      selectedType === 'temperature'
                        ? '37.0'
                        : selectedType === 'oxygen_saturation'
                        ? '98'
                        : selectedType === 'heart_rate'
                        ? '75'
                        : selectedType === 'weight'
                        ? '70.5'
                        : '50'
                    }
                    value={rawInputs.value}
                    onChange={e => setRawInputs({ ...rawInputs, value: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-center text-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <span className="absolute left-3 top-3 text-xs text-slate-400 font-medium">
                    {validation.unit}
                  </span>
                </div>
              </div>
            )}

            {/* Instant Clinical Evaluation Banner */}
            {evaluation && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                  evaluation.severity === 'critical'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : evaluation.severity === 'high'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : evaluation.severity === 'low'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {evaluation.isAbnormal ? (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 shrink-0" />
                  )}
                  <span className="font-bold">{evaluation.labelAr}</span>
                </div>
                {evaluation.normalRange && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    المعدل: {evaluation.normalRange}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              ملاحظة سريعة (اختياري)
            </label>
            <input
              type="text"
              placeholder="مثال: بعد ممارسة رياضة خفيفة / بعد أخذ الدواء"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ القياس الآن'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
