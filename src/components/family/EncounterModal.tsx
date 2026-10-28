"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Stethoscope,
  Calendar,
  Building2,
  FileText,
  AlertCircle,
  Clock,
} from "lucide-react";
import type {
  PersonEncounter,
  CreateEncounterInput,
  UpdateEncounterInput,
} from "@/types/medications-encounters";
import {
  MEDICAL_SPECIALTIES_AR,
  getFollowUpAlertStatus,
} from "@/lib/family/medications-encounters-service";

interface EncounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: CreateEncounterInput | UpdateEncounterInput,
    encounterId?: string
  ) => Promise<void>;
  familyId: string;
  personId: string;
  initialEncounter?: PersonEncounter | null;
}

export function EncounterModal({
  isOpen,
  onClose,
  onSave,
  familyId,
  personId,
  initialEncounter,
}: EncounterModalProps) {
  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState(MEDICAL_SPECIALTIES_AR[0]);
  const [facilityName, setFacilityName] = useState("");
  const [visitDate, setVisitDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialEncounter) {
      setDoctorName(initialEncounter.doctor_name);
      setSpecialty(initialEncounter.specialty);
      setFacilityName(initialEncounter.facility_name || "");
      setVisitDate(initialEncounter.visit_date);
      setChiefComplaint(initialEncounter.chief_complaint || "");
      setDiagnosis(initialEncounter.diagnosis || "");
      setNotes(initialEncounter.notes || "");
      setFollowUpDate(initialEncounter.follow_up_date || "");
    } else {
      setDoctorName("");
      setSpecialty(MEDICAL_SPECIALTIES_AR[0]);
      setFacilityName("");
      setVisitDate(new Date().toISOString().split("T")[0]);
      setChiefComplaint("");
      setDiagnosis("");
      setNotes("");
      setFollowUpDate("");
    }
    setError(null);
  }, [initialEncounter, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim()) {
      setError("يرجى إدخال اسم الطبيب أو الاستشاري");
      return;
    }
    if (!specialty.trim()) {
      setError("يرجى اختيار التخصص الطبي");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (initialEncounter) {
        const updateData: UpdateEncounterInput = {
          doctor_name: doctorName.trim(),
          specialty: specialty.trim(),
          facility_name: facilityName.trim() || null,
          visit_date: visitDate,
          chief_complaint: chiefComplaint.trim() || null,
          diagnosis: diagnosis.trim() || null,
          notes: notes.trim() || null,
          follow_up_date: followUpDate.trim() || null,
        };
        await onSave(updateData, initialEncounter.id);
      } else {
        const createData: CreateEncounterInput = {
          family_id: familyId,
          person_id: personId,
          doctor_name: doctorName.trim(),
          specialty: specialty.trim(),
          facility_name: facilityName.trim() || undefined,
          visit_date: visitDate,
          chief_complaint: chiefComplaint.trim() || undefined,
          diagnosis: diagnosis.trim() || undefined,
          notes: notes.trim() || undefined,
          follow_up_date: followUpDate.trim() || undefined,
        };
        await onSave(createData);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء حفظ الكشف الطبي");
    } finally {
      setSubmitting(false);
    }
  };

  const followUpAlert = followUpDate
    ? getFollowUpAlertStatus({
        id: "preview",
        memberId: personId,
        visitDate,
        doctorName,
        specialty,
        followUpDate,
        createdAt: "",
      })
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
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {initialEncounter ? "تعديل الكشف الطبي" : "تسجيل زيارة / كشف طبي"}
              </h2>
              <p className="text-xs text-slate-500">
                وثّق تشخيصات الطبيب وتوصيات الاستشارة
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

          {/* Doctor Name & Specialty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                اسم الطبيب / الاستشاري <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="مثال: د. طارق البدري"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                التخصص الطبي <span className="text-rose-500">*</span>
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                {MEDICAL_SPECIALTIES_AR.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Facility Name & Visit Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                اسم المستشفى أو العيادة
              </label>
              <input
                type="text"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                placeholder="مثال: عيادات الصفا، مستشفى الشروق"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                تاريخ الكشف / الزيارة
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Chief Complaint */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              الشكوى الرئيسية أو سبب الزيارة
            </label>
            <input
              type="text"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="مثال: صداع مستمر، فحص دوري، كحة وحرارة"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Diagnosis */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              التشخيص الطبي
            </label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="مثال: التهاب الشعب الهوائية، ارتفاع ضغط دم منتظم"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Notes & Recommendations */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              تعليمات الطبيب والتوصيات العلاجية
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب التوصيات كما أملاها الطبيب بدقة..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* Follow-up Date Box */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              موعد الاستشارة / المتابعة القادمة (اختياري)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 flex-1"
              />
              {followUpAlert?.badgeLabelAr && (
                <div
                  className={`text-xs px-3 py-2 rounded-lg font-bold border ${
                    followUpAlert.isOverdue
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : followUpAlert.isDueSoon
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {followUpAlert.badgeLabelAr}
                </div>
              )}
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
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {submitting ? "جاري الحفظ..." : initialEncounter ? "تحديث الكشف" : "حفظ الكشف"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
