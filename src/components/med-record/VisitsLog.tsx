"use client";

import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Stethoscope,
  Building2,
  Clock,
  AlertCircle,
  X,
  Check,
  FileText,
} from 'lucide-react';
import type { Encounter } from '@/types/med-record';
import {
  MEDICAL_SPECIALTIES_AR,
  getFollowUpAlertStatus,
} from '@/lib/med-record/medications-visits-helper';

interface VisitsLogProps {
  memberId: string;
  memberName: string;
  encounters: Encounter[];
  onAddEncounter: (enc: Omit<Encounter, 'id' | 'createdAt'>) => Promise<void>;
}

export function VisitsLog({
  memberId,
  memberName,
  encounters,
  onAddEncounter,
}: VisitsLogProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Visit Form State
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState(MEDICAL_SPECIALTIES_AR[0]);
  const [facilityName, setFacilityName] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName || !visitDate || !diagnosis) {
      setErrorMsg('يرجى ملء اسم الطبيب وتاريخ الزيارة والتشخيص المبدئي');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      await onAddEncounter({
        memberId,
        doctorName,
        specialty,
        facilityName: facilityName.trim() || undefined,
        visitDate,
        chiefComplaint: chiefComplaint.trim() || undefined,
        diagnosis,
        notes: notes.trim() || undefined,
        followUpDate: followUpDate ? followUpDate : undefined,
      });

      // Reset
      setDoctorName('');
      setFacilityName('');
      setChiefComplaint('');
      setDiagnosis('');
      setNotes('');
      setFollowUpDate('');
      setIsModalOpen(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ الزيارة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-sm font-black text-slate-900">
            سجل الاستشارات وزيارات الأطباء ({encounters.length})
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            توثيق الملاحظات الطبية، التشخيص، وتنبيهات مواعيد إعادة الكشف والمتابعة
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-purple-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل زيارة طبيب جديدة</span>
        </button>
      </div>

      {/* Visits List */}
      {encounters.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 space-y-2">
          <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">لم يتم تسجيل أي زيارات أو استشارات بعد</h4>
          <p className="text-xs text-slate-400">سجل استشارتك القادمة لتوثيق تشخيص الطبيب وموعد الإعادة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {encounters.map(enc => {
            const followUpAlert = getFollowUpAlertStatus(enc);

            return (
              <div
                key={enc.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 hover:shadow-md transition-shadow"
              >
                {/* Header: Date, Doctor, Specialty */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">{enc.doctorName}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                          {enc.specialty}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{enc.visitDate}</span>
                        </span>
                        {enc.facilityName && (
                          <span className="flex items-center gap-1">
                            <span>•</span>
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{enc.facilityName}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Follow-up alert badge */}
                  {followUpAlert.hasFollowUp && (
                    <div
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 self-start sm:self-auto border ${
                        followUpAlert.isOverdue
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : followUpAlert.isDueSoon
                          ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>موعد الاستشارة: {followUpAlert.followUpDate} ({followUpAlert.badgeLabelAr || 'محدد'})</span>
                    </div>
                  )}
                </div>

                {/* Complaint & Diagnosis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {enc.chiefComplaint && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-500 block mb-0.5">الشكوى الرئيسية:</span>
                      <span className="font-semibold text-slate-800">{enc.chiefComplaint}</span>
                    </div>
                  )}

                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <span className="font-bold text-emerald-800 block mb-0.5">التشخيص الطبي:</span>
                    <span className="font-black text-emerald-950">{enc.diagnosis}</span>
                  </div>
                </div>

                {/* Notes */}
                {enc.notes && (
                  <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-500 block mb-1">تعليمات وخطة الطبيب:</span>
                    <p className="whitespace-pre-line leading-relaxed">{enc.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Visit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-base font-black text-slate-900">
                تسجيل زيارة أو استشارة جديدة ({memberName})
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم الطبيب المعالج *</label>
                  <input
                    type="text"
                    placeholder="مثال: د. حسام قنديل"
                    value={doctorName}
                    onChange={e => setDoctorName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التخصص الطبي *</label>
                  <select
                    value={specialty}
                    onChange={e => setSpecialty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  >
                    {MEDICAL_SPECIALTIES_AR.map(spec => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الزيارة *</label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={e => setVisitDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المستشفى أو المركز الطبي (اختياري)</label>
                  <input
                    type="text"
                    placeholder="مثال: مستشفى السلام الدولي"
                    value={facilityName}
                    onChange={e => setFacilityName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب الزيارة أو الشكوى</label>
                <input
                  type="text"
                  placeholder="مثال: متابعة دورية لضغط الدم / كحة وسخونية"
                  value={chiefComplaint}
                  onChange={e => setChiefComplaint(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">التشخيص الطبي *</label>
                <input
                  type="text"
                  placeholder="مثال: ارتفاع ضغط دم أولي مستقر / نزلة شعبية حادة"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات الطبيب وخطة العلاج</label>
                <textarea
                  rows={3}
                  placeholder="أدخل نصائح الطبيب، الأدوية الموصوفة، أو التحاليل المطلوب إجراؤها..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  موعد إعادة الكشف / الاستشارة (اختياري)
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ الزيارة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
