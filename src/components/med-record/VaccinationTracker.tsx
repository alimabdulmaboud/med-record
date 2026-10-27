"use client";

import React, { useState } from 'react';
import {
  Syringe,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  X,
  Check,
  ShieldCheck,
  Baby,
} from 'lucide-react';
import type { Vaccination, VaccinationStatus } from '@/types/med-record';
import {
  getEgyptianVaccineSchedule,
  type ScheduledVaccine,
} from '@/lib/med-record/vaccine-schedule';
import {
  groupVaccinesByMilestone,
  calculateVaccinationStats,
} from '@/lib/med-record/vaccination-view-helper';

interface VaccinationTrackerProps {
  memberId: string;
  memberName: string;
  birthDate: string;
  existingVaccinations: Vaccination[];
  onRecordDose: (vacData: {
    vaccineName: string;
    targetDisease: string;
    doseNumber: number;
    administeredDate: string;
    batchNumber?: string;
    notes?: string;
  }) => Promise<void>;
}

export function VaccinationTracker({
  memberId,
  memberName,
  birthDate,
  existingVaccinations,
  onRecordDose,
}: VaccinationTrackerProps) {
  const [selectedVaccine, setSelectedVaccine] = useState<ScheduledVaccine | null>(null);
  const [administeredDate, setAdministeredDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchNumber, setBatchNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate schedule based on child's birth date & logged vaccinations
  const schedule = getEgyptianVaccineSchedule(birthDate, undefined, existingVaccinations);
  const groups = groupVaccinesByMilestone(schedule);
  const stats = calculateVaccinationStats(schedule);

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVaccine) return;

    try {
      setIsSubmitting(true);
      await onRecordDose({
        vaccineName: selectedVaccine.vaccineName,
        targetDisease: selectedVaccine.targetDisease,
        doseNumber: selectedVaccine.doseNumber,
        administeredDate,
        batchNumber: batchNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setSelectedVaccine(null);
      setBatchNumber('');
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Progress & Stats Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
              <Baby className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                جدول تطعيمات وزارة الصحة المصرية ({memberName})
              </h3>
              <p className="text-xs text-slate-500">
                تاريخ الميلاد: {birthDate} • التطعيمات الإلزامية حتى 18 شهراً
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="text-left sm:text-right">
              <span className="text-xl font-black text-purple-700">{stats.percentage}%</span>
              <span className="text-[10px] text-slate-400 block font-medium">نسبة الإنجاز</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div
            className="bg-purple-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>

        {/* Stats Badges */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
            <span className="block font-black text-sm">{stats.completed}</span>
            <span className="text-[10px] text-emerald-700">جرعات مكتملة</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-100">
            <span className="block font-black text-sm">{stats.pending}</span>
            <span className="text-[10px] text-slate-500">جرعات قادمة</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-100">
            <span className="block font-black text-sm">{stats.overdue}</span>
            <span className="text-[10px] text-rose-700">متأخرة / مستحقة</span>
          </div>
        </div>
      </div>

      {/* Milestone Groups Timeline */}
      <div className="space-y-4">
        {groups.map(group => (
          <div
            key={group.milestoneMonths}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
          >
            {/* Milestone Header */}
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <h4 className="text-xs font-black text-slate-900">{group.labelAr}</h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {group.vaccines.length} جرعات
              </span>
            </div>

            {/* Vaccines inside this milestone */}
            <div className="divide-y divide-slate-100">
              {group.vaccines.map(vac => (
                <div
                  key={vac.code}
                  className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-black text-slate-900">{vac.vaccineName}</h5>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                        {vac.vaccineNameEn}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>الوقاية من: <span className="font-medium text-slate-700">{vac.targetDisease}</span></span>
                      <span>•</span>
                      <span>الموعد المقدر: <span className="font-medium text-slate-700">{vac.scheduledDate}</span></span>
                      {vac.notes && (
                        <>
                          <span>•</span>
                          <span className="text-amber-700">{vac.notes}</span>
                        </>
                      )}
                    </div>

                    {vac.administeredDate && (
                      <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 pt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تم أخذ الجرعة بتاريخ: {vac.administeredDate}</span>
                        {vac.batchNumber && <span>(رقم التشغيلة: {vac.batchNumber})</span>}
                      </div>
                    )}
                  </div>

                  {/* Status Badge & Action */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {vac.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تم التطعيم</span>
                      </span>
                    ) : vac.status === 'overdue' ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>متأخر ومستحق</span>
                        </span>
                        <button
                          onClick={() => setSelectedVaccine(vac)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                        >
                          تسجيل الجرعة
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>قادم</span>
                        </span>
                        <button
                          onClick={() => setSelectedVaccine(vac)}
                          className="px-3 py-1 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 rounded-xl text-xs font-bold transition-colors border"
                        >
                          تسجيل مسبق
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Record Vaccine Dose Modal */}
      {selectedVaccine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-base font-black text-slate-900">
                تسجيل إعطاء التطعيم ({memberName})
              </h3>
              <button
                onClick={() => setSelectedVaccine(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <span className="text-xs font-bold text-purple-900 block">{selectedVaccine.vaccineName}</span>
                <span className="text-[11px] text-purple-700 block mt-0.5">{selectedVaccine.targetDisease}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تاريخ أخذ الجرعة بالمركز الصحي / العيادة *
                </label>
                <input
                  type="date"
                  value={administeredDate}
                  onChange={e => setAdministeredDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم التشغيلة / الباتش (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: BCG-2026-99"
                  value={batchNumber}
                  onChange={e => setBatchNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات أو أعراض بعد التطعيم (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: سخونية خفيفة استجابت للسيتال"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedVaccine(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'تأكيد وحفظ الجرعة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
