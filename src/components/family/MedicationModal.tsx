"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Pill,
  Clock,
  Calendar,
  Bell,
  UserCheck,
  AlertCircle,
  FileText,
} from "lucide-react";
import type {
  PersonMedication,
  CreateMedicationInput,
  UpdateMedicationInput,
  MedicationStatus,
} from "@/types/medications-encounters";
import {
  MEDICATION_FREQUENCY_PRESETS,
  MEDICATION_TIMING_PRESETS,
} from "./medications-encounters-utils";
import { formatMedicationSchedule } from "@/lib/family/medications-encounters-service";
import { DrugCombobox } from "@/components/drugs/DrugCombobox";

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: CreateMedicationInput | UpdateMedicationInput,
    medicationId?: string
  ) => Promise<void>;
  familyId: string;
  personId: string;
  initialMedication?: PersonMedication | null;
}

export function MedicationModal({
  isOpen,
  onClose,
  onSave,
  familyId,
  personId,
  initialMedication,
}: MedicationModalProps) {
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("مرة واحدة يومياً");
  const [timingNotes, setTimingNotes] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<MedicationStatus>("active");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [prescribedBy, setPrescribedBy] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialMedication) {
      setName(initialMedication.name);
      setDose(initialMedication.dose);
      setFrequency(initialMedication.frequency);
      setTimingNotes(initialMedication.timing_notes || "");
      setStartDate(initialMedication.start_date);
      setEndDate(initialMedication.end_date || "");
      setStatus(initialMedication.status);
      setReminderEnabled(initialMedication.reminder_enabled);
      setReminderTime(initialMedication.reminder_time || "08:00");
      setPrescribedBy(initialMedication.prescribed_by || "");
      setNotes(initialMedication.notes || "");
    } else {
      setName("");
      setDose("");
      setFrequency("مرة واحدة يومياً");
      setTimingNotes("");
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate("");
      setStatus("active");
      setReminderEnabled(false);
      setReminderTime("08:00");
      setPrescribedBy("");
      setNotes("");
    }
    setError(null);
  }, [initialMedication, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("يرجى إدخال اسم الدواء");
      return;
    }
    if (!dose.trim()) {
      setError("يرجى إدخال الجرعة (مثال: 5 مجم أو قرص واحد)");
      return;
    }
    if (!frequency.trim()) {
      setError("يرجى تحديد معدل التكرار");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (initialMedication) {
        const updateData: UpdateMedicationInput = {
          name: name.trim(),
          dose: dose.trim(),
          frequency: frequency.trim(),
          timing_notes: timingNotes.trim() || null,
          start_date: startDate,
          end_date: endDate.trim() || null,
          status,
          reminder_enabled: reminderEnabled,
          reminder_time: reminderEnabled ? reminderTime : null,
          prescribed_by: prescribedBy.trim() || null,
          notes: notes.trim() || null,
        };
        await onSave(updateData, initialMedication.id);
      } else {
        const createData: CreateMedicationInput = {
          family_id: familyId,
          person_id: personId,
          name: name.trim(),
          dose: dose.trim(),
          frequency: frequency.trim(),
          timing_notes: timingNotes.trim() || undefined,
          start_date: startDate,
          end_date: endDate.trim() || undefined,
          status,
          reminder_enabled: reminderEnabled,
          reminder_time: reminderEnabled ? reminderTime : undefined,
          prescribed_by: prescribedBy.trim() || undefined,
          notes: notes.trim() || undefined,
        };
        await onSave(createData);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء حفظ الدواء");
    } finally {
      setSubmitting(false);
    }
  };

  const previewReminder = reminderEnabled
    ? formatMedicationSchedule({
        id: "preview",
        memberId: personId,
        name: name || "الدواء",
        dose,
        frequency,
        startDate,
        status,
        reminderEnabled: true,
        reminderTime,
        createdAt: "",
      }).reminderLabelAr
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {initialMedication ? "تعديل بيانات الدواء" : "إضافة دواء جديد"}
              </h2>
              <p className="text-xs text-slate-500">
                سجل جرعاتك ومواعيد التذكير بدقة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name & Dose */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                اسم الدواء (من قاعدة الأدوية المصرية أو يدوياً) <span className="text-rose-500">*</span>
              </label>
              <DrugCombobox
                value={name}
                onChange={(val, selectedDrug) => {
                  setName(val);
                  if (selectedDrug && !notes) {
                    if (selectedDrug.scientificName) {
                      setNotes(`المادة الفعالة: ${selectedDrug.scientificName}`);
                    }
                  }
                }}
                onSelectDrug={(drug) => {
                  if (!dose && drug.route) {
                    if (drug.route.includes("SOLID")) {
                      setDose("قرص واحد");
                    } else if (drug.route.includes("LIQUID")) {
                      setDose("5 مل (ملعقة)");
                    }
                  }
                }}
                placeholder="ابحث في 25,000+ دواء مصري أو اكتب يدوياً..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الجرعة <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="مثال: 5 مجم، قرص واحد، 5 مل"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Frequency & Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              معدل التكرار <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all mb-2"
              required
            />
            <div className="flex flex-wrap gap-1.5">
              {MEDICATION_FREQUENCY_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setFrequency(p)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors border ${
                    frequency === p
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-medium"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Timing Notes & Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              توقيت تناول الدواء (اختياري)
            </label>
            <input
              type="text"
              value={timingNotes}
              onChange={(e) => setTimingNotes(e.target.value)}
              placeholder="مثال: بعد الأكل، على الريق، قبل النوم"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all mb-2"
            />
            <div className="flex flex-wrap gap-1.5">
              {MEDICATION_TIMING_PRESETS.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTimingNotes(t)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors border ${
                    timingNotes === t
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-medium"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Status & Start/End Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                حالة الدواء
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MedicationStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="active">ساري حالياً</option>
                <option value="paused">موقوف مؤقتاً</option>
                <option value="completed">منتهي / مكتمل</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                تاريخ البدء
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                تاريخ الانتهاء (اختياري)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Daily Reminder Box */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">
                  تفعيل تنبيه موعد الجرعة اليومي
                </span>
              </div>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </div>

            {reminderEnabled && (
              <div className="flex items-center gap-4 pt-2 border-t border-slate-200/60">
                <div className="flex-1">
                  <label className="block text-xs text-slate-600 mb-1">
                    وقت التذكير اليومي (24 ساعة)
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                {previewReminder && (
                  <div className="text-xs bg-emerald-50 text-emerald-800 px-3 py-2 rounded-lg border border-emerald-200 font-medium self-end">
                    سيصلك تذكير في: {previewReminder}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Doctor & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الطبيب المعالج (اختياري)
              </label>
              <input
                type="text"
                value={prescribedBy}
                onChange={(e) => setPrescribedBy(e.target.value)}
                placeholder="مثال: د. طارق البدري"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ملاحظات أو توصيات إضافية
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: لا يؤخذ مع منتجات الألبان"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {submitting ? "جاري الحفظ..." : initialMedication ? "تحديث الدواء" : "حفظ الدواء"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
