"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  Tag,
  ChevronDown,
  ChevronUp,
  FileCheck2,
} from "lucide-react";
import type {
  ScheduledVaccine,
  MilestoneGroup,
  VaccinationStats,
} from "@/lib/family/vaccinations-service";
import type { VaccinationStatus } from "@/types/vaccinations";
import {
  VACCINE_STATUS_CONFIG,
  filterVaccinesByTab,
} from "./vaccination-tracker-utils";

interface VaccinationTrackerProps {
  milestones: MilestoneGroup[];
  stats: VaccinationStats;
  childName: string;
  onRecordVaccine: (vaccine: ScheduledVaccine) => void;
}

export function VaccinationTracker({
  milestones,
  stats,
  childName,
  onRecordVaccine,
}: VaccinationTrackerProps) {
  const [filterStatus, setFilterStatus] = useState<"all" | VaccinationStatus>("all");
  const [expandedMilestones, setExpandedMilestones] = useState<Record<number, boolean>>({
    0: true,
    2: true,
    4: true,
    6: true,
    9: true,
    12: true,
    18: true,
  });

  const toggleMilestone = (months: number) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [months]: !prev[months],
    }));
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* 1. Header Progress Card */}
      <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-purple-300" />
                <h3 className="text-base font-extrabold text-white">
                  جدول التطعيمات الإجبارية الرسمية ({childName})
                </h3>
              </div>
              <p className="text-xs text-purple-200">
                وفق جدول وزارة الصحة والسكان المصرية المعتمد لحماية الأطفال
              </p>
            </div>
            <div className="text-right sm:text-left">
              <span className="text-2xl font-black text-emerald-400">
                {stats.percentage}%
              </span>
              <span className="block text-[11px] text-purple-300">
                نسبة إتمام التطعيمات
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-purple-950/60 rounded-full overflow-hidden p-0.5 border border-purple-800/40">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
              <span className="block text-[10px] text-purple-200">إجمالي الجرعات</span>
              <span className="text-base font-black text-white">{stats.total}</span>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-xs p-2.5 rounded-xl border border-emerald-500/30">
              <span className="block text-[10px] text-emerald-200">الجرعات المعطاة</span>
              <span className="text-base font-black text-emerald-300">{stats.completed}</span>
            </div>
            <div className="bg-blue-500/20 backdrop-blur-xs p-2.5 rounded-xl border border-blue-500/30">
              <span className="block text-[10px] text-blue-200">الجرعات القادمة</span>
              <span className="text-base font-black text-blue-300">{stats.pending}</span>
            </div>
            <div
              className={`p-2.5 rounded-xl border backdrop-blur-xs ${
                stats.overdue > 0
                  ? "bg-rose-500/30 border-rose-500/50 text-rose-200"
                  : "bg-white/10 border-white/10 text-purple-200"
              }`}
            >
              <span className="block text-[10px]">تطعيمات متأخرة</span>
              <span className="text-base font-black text-white">{stats.overdue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Overdue Warning Banner if any */}
      {stats.overdue > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
            <div>
              <span className="font-bold block text-sm">
                تنبيه: يوجد {stats.overdue} تطعيمات متأخرة عن الموعد المحدد!
              </span>
              <span className="text-slate-600">
                يرجى مراجعة أقرب مكتب صحة أو طبيب الأطفال لتدارك الجرعات المتأخرة بأمان.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Filter Buttons */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            filterStatus === "all"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          الكل ({stats.total})
        </button>
        <button
          onClick={() => setFilterStatus("completed")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            filterStatus === "completed"
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          المعطاة ({stats.completed})
        </button>
        <button
          onClick={() => setFilterStatus("overdue")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            filterStatus === "overdue"
              ? "bg-white text-rose-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          المتأخرة ({stats.overdue})
        </button>
        <button
          onClick={() => setFilterStatus("pending")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
            filterStatus === "pending"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          القادمة ({stats.pending})
        </button>
      </div>

      {/* 4. Milestones Accordion */}
      <div className="space-y-4">
        {milestones.map((group) => {
          const filteredVaccines =
            filterStatus === "all"
              ? group.vaccines
              : group.vaccines.filter((v) => v.status === filterStatus);

          if (filteredVaccines.length === 0 && filterStatus !== "all") {
            return null;
          }

          const isExpanded = expandedMilestones[group.milestoneMonths] ?? true;
          const groupCompleted = group.vaccines.every((v) => v.status === "completed");
          const groupHasOverdue = group.vaccines.some((v) => v.status === "overdue");

          return (
            <div
              key={group.milestoneMonths}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
            >
              {/* Milestone Accordion Header */}
              <button
                type="button"
                onClick={() => toggleMilestone(group.milestoneMonths)}
                className="w-full px-5 py-4 flex items-center justify-between text-right bg-slate-50/70 hover:bg-slate-100/70 transition-colors border-b border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      groupCompleted
                        ? "bg-emerald-100 text-emerald-800"
                        : groupHasOverdue
                        ? "bg-rose-100 text-rose-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {group.milestoneMonths === 0 ? "0" : `${group.milestoneMonths}m`}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {group.labelAr}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {group.vaccines.length} تطعيمات معتمدة
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {groupCompleted && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>مكتمل بالكامل</span>
                    </span>
                  )}
                  {groupHasOverdue && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>متأخر</span>
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Milestone Vaccines Grid */}
              {isExpanded && (
                <div className="p-4 divide-y divide-slate-100">
                  {filteredVaccines.map((v) => {
                    const statusConfig = VACCINE_STATUS_CONFIG[v.status];

                    return (
                      <div
                        key={v.code}
                        className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {v.vaccineName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                              {v.code}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusConfig.color} flex items-center gap-1`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.badgeBg}`} />
                              <span>{statusConfig.labelAr}</span>
                            </span>
                          </div>

                          <p className="text-xs text-slate-600">
                            الوقاية من: <span className="font-medium">{v.targetDisease}</span>
                          </p>

                          {v.notes && (
                            <p className="text-[11px] text-purple-700 bg-purple-50/60 px-2 py-1 rounded border border-purple-100 inline-block">
                              {v.notes}
                            </p>
                          )}

                          {/* Administration Info if Completed */}
                          {v.status === "completed" && v.administeredDate && (
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-emerald-800 pt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                <span>تاريخ الإعطاء: {v.administeredDate}</span>
                              </span>
                              {v.batchNumber && (
                                <span className="flex items-center gap-1 text-slate-500">
                                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                                  <span>التشغيلة: {v.batchNumber}</span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* Scheduled Date if Pending / Overdue */}
                          {v.status !== "completed" && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>تاريخ الاستحقاق: {v.scheduledDate}</span>
                            </div>
                          )}
                        </div>

                        {/* Action: Record Button */}
                        <div className="shrink-0 flex items-center gap-2">
                          {v.status !== "completed" ? (
                            <button
                              type="button"
                              onClick={() => onRecordVaccine(v)}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span>تسجيل الإعطاء</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onRecordVaccine(v)}
                              className="px-2.5 py-1 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg text-[11px] font-semibold transition-colors"
                            >
                              تعديل السجل
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
