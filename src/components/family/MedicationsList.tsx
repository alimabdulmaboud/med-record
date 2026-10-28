"use client";

import React, { useState } from "react";
import {
  Pill,
  Plus,
  Clock,
  Calendar,
  Bell,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Edit2,
  Trash2,
  User,
  AlertCircle,
} from "lucide-react";
import type {
  PersonMedication,
  MedicationStatus,
} from "@/types/medications-encounters";
import {
  STATUS_LABELS_AR,
  filterMedicationsByTab,
} from "./medications-encounters-utils";
import { formatMedicationSchedule } from "@/lib/family/medications-encounters-service";

interface MedicationsListProps {
  medications: PersonMedication[];
  onAddMedication: () => void;
  onEditMedication: (med: PersonMedication) => void;
  onStatusChange: (id: string, status: MedicationStatus) => Promise<void>;
  onArchiveMedication: (id: string) => Promise<void>;
}

export function MedicationsList({
  medications,
  onAddMedication,
  onEditMedication,
  onStatusChange,
  onArchiveMedication,
}: MedicationsListProps) {
  const [activeTab, setActiveTab] = useState<"all" | MedicationStatus>("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const filtered = filterMedicationsByTab(medications, activeTab);

  const handleStatusClick = async (id: string, status: MedicationStatus) => {
    try {
      setActionLoadingId(id);
      await onStatusChange(id, status);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleArchiveClick = async (id: string) => {
    try {
      setActionLoadingId(id);
      await onArchiveMedication(id);
      setConfirmDeleteId(null);
    } finally {
      setActionLoadingId(null);
    }
  };

  const counts = {
    all: medications.length,
    active: medications.filter((m) => m.status === "active").length,
    paused: medications.filter((m) => m.status === "paused").length,
    completed: medications.filter((m) => m.status === "completed").length,
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Bar: Tabs & Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>الكل</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("active")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "active"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>سارية</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
              {counts.active}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("paused")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "paused"
                ? "bg-white text-amber-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>موقوفة مؤقتاً</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800">
              {counts.paused}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "completed"
                ? "bg-white text-slate-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>منتهية</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {counts.completed}
            </span>
          </button>
        </div>

        {/* Add Medication Button */}
        <button
          onClick={onAddMedication}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة دواء جديد</span>
        </button>
      </div>

      {/* Medications List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Pill className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {activeTab === "all"
              ? "لا توجد أدوية مسجلة بعد"
              : `لا توجد أدوية بحالة "${STATUS_LABELS_AR[activeTab as MedicationStatus]?.label}"`}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            سجل أدويتك اليومية ومواعيد الجرعات لتبقى على اطلاع دائم بتعليمات الطبيب
          </p>
          <button
            onClick={onAddMedication}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition-colors mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>أضف دواء الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((med) => {
            const formatted = formatMedicationSchedule({
              id: med.id,
              memberId: med.person_id,
              name: med.name,
              dose: med.dose,
              frequency: med.frequency,
              timingNotes: med.timing_notes || undefined,
              startDate: med.start_date,
              endDate: med.end_date || undefined,
              status: med.status,
              reminderEnabled: med.reminder_enabled,
              reminderTime: med.reminder_time || undefined,
              createdAt: med.created_at,
            });

            const statusConfig = STATUS_LABELS_AR[med.status];
            const isLoading = actionLoadingId === med.id;

            return (
              <div
                key={med.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* Top: Name & Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {med.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span className="font-semibold text-slate-700">
                            {med.dose}
                          </span>
                          <span>•</span>
                          <span>{med.frequency}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${statusConfig.color} flex items-center gap-1.5 shrink-0`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.badgeBg}`} />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Timing & Notes */}
                  {med.timing_notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 mb-2">
                      <span className="font-semibold text-slate-700">التوقيت:</span> {med.timing_notes}
                    </p>
                  )}

                  {/* Badges row: Reminder & Prescriber */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    {med.reminder_enabled && formatted.reminderLabelAr && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                        <Bell className="w-3 h-3 text-emerald-600" />
                        <span>تنبيه: {formatted.reminderLabelAr}</span>
                      </span>
                    )}

                    {med.prescribed_by && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                        <User className="w-3 h-3 text-blue-600" />
                        <span>{med.prescribed_by}</span>
                      </span>
                    )}

                    {med.start_date && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>منذ {med.start_date}</span>
                      </span>
                    )}
                  </div>

                  {/* Extra Notes */}
                  {med.notes && (
                    <p className="text-xs text-slate-500 mt-2 italic border-r-2 border-emerald-300 pr-2">
                      {med.notes}
                    </p>
                  )}
                </div>

                {/* Actions Row */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {/* Status Toggle Quick Buttons */}
                  <div className="flex items-center gap-1.5">
                    {med.status === "active" && (
                      <>
                        <button
                          disabled={isLoading}
                          onClick={() => handleStatusClick(med.id, "paused")}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <PauseCircle className="w-3.5 h-3.5" />
                          <span>إيقاف مؤقت</span>
                        </button>
                        <button
                          disabled={isLoading}
                          onClick={() => handleStatusClick(med.id, "completed")}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>تم إنهاؤه</span>
                        </button>
                      </>
                    )}

                    {med.status === "paused" && (
                      <>
                        <button
                          disabled={isLoading}
                          onClick={() => handleStatusClick(med.id, "active")}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>استئناف</span>
                        </button>
                        <button
                          disabled={isLoading}
                          onClick={() => handleStatusClick(med.id, "completed")}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>إنهاء</span>
                        </button>
                      </>
                    )}

                    {med.status === "completed" && (
                      <button
                        disabled={isLoading}
                        onClick={() => handleStatusClick(med.id, "active")}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>إعادة تفعيل</span>
                      </button>
                    )}
                  </div>

                  {/* Edit & Archive */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditMedication(med)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                      title="تعديل الدواء"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {confirmDeleteId === med.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg border border-rose-200">
                        <button
                          onClick={() => handleArchiveClick(med.id)}
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
                        onClick={() => setConfirmDeleteId(med.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="أرشفة / حذف الدواء"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
