"use client";

import React, { useState } from "react";
import {
  Stethoscope,
  Plus,
  Calendar,
  Building2,
  FileText,
  AlertTriangle,
  Clock,
  Edit2,
  Trash2,
  Activity,
  CheckCircle,
} from "lucide-react";
import type { PersonEncounter } from "@/types/medications-encounters";
import { getFollowUpAlertStatus } from "@/lib/family/medications-encounters-service";

interface EncountersTimelineProps {
  encounters: PersonEncounter[];
  onAddEncounter: () => void;
  onEditEncounter: (encounter: PersonEncounter) => void;
  onArchiveEncounter: (id: string) => Promise<void>;
}

export function EncountersTimeline({
  encounters,
  onAddEncounter,
  onEditEncounter,
  onArchiveEncounter,
}: EncountersTimelineProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleArchive = async (id: string) => {
    try {
      setDeletingId(id);
      await onArchiveEncounter(id);
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-blue-600" />
            <span>سجل الكشوفات والزيارات الطبية</span>
          </h3>
          <p className="text-xs text-slate-500">
            تاريخ استشاراتك وتشخيصات الأطباء المعالجين
          </p>
        </div>
        <button
          onClick={onAddEncounter}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل كشف جديد</span>
        </button>
      </div>

      {/* Encounters Timeline */}
      {encounters.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            لا توجد كشوفات طبية مسجلة بعد
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            سجل تشخيصات طبيبك، الفحوصات المطلوبة، ومواعيد الاستشارة القادمة لتصلك التنبيهات في وقتها
          </p>
          <button
            onClick={onAddEncounter}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-blue-700 transition-colors mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>سجل كشفك الأول</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {encounters.map((enc) => {
            const followUpAlert = enc.follow_up_date
              ? getFollowUpAlertStatus(enc)
              : null;

            return (
              <div
                key={enc.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                {/* Header row: Doctor & Specialty & Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {enc.doctor_name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {enc.specialty}
                        </span>
                        {enc.facility_name && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{enc.facility_name}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{enc.visit_date}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Edit & Archive Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditEncounter(enc)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                      title="تعديل الكشف"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {confirmDeleteId === enc.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg border border-rose-200">
                        <button
                          disabled={deletingId === enc.id}
                          onClick={() => handleArchive(enc.id)}
                          className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700"
                        >
                          حذف
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1.5 py-0.5 text-slate-500 rounded text-[10px] hover:bg-slate-200"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(enc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="أرشفة الكشف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Complaint & Diagnosis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {enc.chief_complaint && (
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700 block mb-0.5">
                        الشكوى الرئيسية:
                      </span>
                      <span className="text-slate-600">{enc.chief_complaint}</span>
                    </div>
                  )}

                  {enc.diagnosis && (
                    <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                      <span className="font-bold text-emerald-800 block mb-0.5">
                        التشخيص الطبي:
                      </span>
                      <span className="text-emerald-950 font-medium">
                        {enc.diagnosis}
                      </span>
                    </div>
                  )}
                </div>

                {/* Doctor Notes & Recommendations */}
                {enc.notes && (
                  <div className="text-xs bg-slate-50/50 p-3 rounded-xl border border-slate-100 border-r-2 border-r-blue-500">
                    <span className="font-bold text-slate-700 block mb-1">
                      تعليمات وتوصيات الطبيب:
                    </span>
                    <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                      {enc.notes}
                    </p>
                  </div>
                )}

                {/* Follow-up Alert Box */}
                {followUpAlert && (
                  <div
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold border ${
                      followUpAlert.isOverdue
                        ? "bg-rose-50 text-rose-800 border-rose-200"
                        : followUpAlert.isDueSoon
                        ? "bg-blue-50 text-blue-800 border-blue-200"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>
                        موعد الاستشارة / المتابعة القادمة: {enc.follow_up_date}
                      </span>
                    </div>
                    {followUpAlert.badgeLabelAr && (
                      <span className="px-2 py-0.5 rounded-md bg-white/80 border border-current font-bold text-[11px]">
                        {followUpAlert.badgeLabelAr}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
