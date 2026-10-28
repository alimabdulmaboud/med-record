"use client";

import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  Calendar,
  Building2,
  FileText,
  AlertCircle,
  Tag,
} from "lucide-react";
import type { ScheduledVaccine } from "@/lib/family/vaccinations-service";

interface RecordVaccinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaccine: ScheduledVaccine | null;
  familyId: string;
  personId: string;
  onSave: (data: {
    family_id: string;
    person_id: string;
    vaccine_code: string;
    vaccine_name: string;
    target_disease: string;
    dose_number: number;
    age_milestone_months: number;
    scheduled_date: string;
    administered_date: string;
    batch_number?: string;
    administered_by?: string;
    notes?: string;
  }) => Promise<void>;
}

export function RecordVaccinationModal({
  isOpen,
  onClose,
  vaccine,
  familyId,
  personId,
  onSave,
}: RecordVaccinationModalProps) {
  const [administeredDate, setAdministeredDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [batchNumber, setBatchNumber] = useState(vaccine?.batchNumber || "");
  const [administeredBy, setAdministeredBy] = useState(
    "مكتب صحة رعاية الأمومة والطفولة"
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !vaccine) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!administeredDate) {
      setError("يرجى تحديد تاريخ إعطاء التطعيم");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await onSave({
        family_id: familyId,
        person_id: personId,
        vaccine_code: vaccine.code,
        vaccine_name: vaccine.vaccineName,
        target_disease: vaccine.targetDisease,
        dose_number: vaccine.doseNumber,
        age_milestone_months: vaccine.ageMilestoneMonths,
        scheduled_date: vaccine.scheduledDate,
        administered_date: administeredDate,
        batch_number: batchNumber.trim() || undefined,
        administered_by: administeredBy.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء حفظ سجل التطعيم");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                تسجيل إعطاء التطعيم
              </h2>
              <p className="text-xs text-slate-500">
                توثيق رسمي للتطعيم وتاريخ أخذه
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Vaccine Info Banner */}
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900">
                {vaccine.vaccineName}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-200/70 text-purple-800">
                الجرعة {vaccine.doseNumber}
              </span>
            </div>
            <p className="text-[11px] text-purple-700">
              الوقاية من: {vaccine.targetDisease}
            </p>
            <p className="text-[10px] text-slate-500">
              تاريخ الاستحقاق المجدول: {vaccine.scheduledDate}
            </p>
          </div>

          {/* Administered Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              تاريخ إعطاء التطعيم الفعلي <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={administeredDate}
                onChange={(e) => setAdministeredDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Administered By (Health Center / Clinic) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              الجهة المعطية للتطعيم أو الطبيب
            </label>
            <div className="relative">
              <input
                type="text"
                value={administeredBy}
                onChange={(e) => setAdministeredBy(e.target.value)}
                placeholder="مثال: مكتب صحة التجمع الخامس، عيادة د. منى"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          {/* Batch Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              رقم التشغيلة / Batch Number (اختياري)
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="مثال: EG-MOH-2026-90"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ملاحظات أو أعراض بعد التطعيم
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: ارتفاع طفيف في درجة الحرارة تم إعطاء بنادول"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
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
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
            >
              {submitting ? "جاري الحفظ..." : "تأكيد تسجيل التطعيم"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
