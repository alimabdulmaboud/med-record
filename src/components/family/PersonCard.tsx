"use client";

import React from "react";
import Link from "next/link";
import {
  User,
  Baby,
  HeartPulse,
  Pill,
  FileText,
  Edit3,
  Archive,
  AlertCircle,
  Phone,
  Shield,
} from "lucide-react";
import type { Person } from "@/types/family";
import { calculatePersonAge } from "@/lib/family/service";

interface PersonCardProps {
  person: Person;
  onArchive?: (personId: string) => void;
}

export function PersonCard({ person, onArchive }: PersonCardProps) {
  const age = calculatePersonAge(person.birth_date);
  const isMale = person.sex === "male";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Header: Avatar, Name, Relationship, and Edit Action */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <Link
            href={`/family/person/${person.id}`}
            className="flex items-center gap-3 group/avatar"
            title="عرض الملف الصحي الكامل والقياسات"
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-sm transition-transform group-hover/avatar:scale-105 ${
                age.isChild
                  ? "bg-amber-500 shadow-amber-500/20"
                  : isMale
                  ? "bg-teal-600 shadow-teal-600/20"
                  : "bg-rose-500 shadow-rose-500/20"
              }`}
            >
              {age.isChild ? <Baby className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base md:text-lg text-slate-900 dark:text-white group-hover/avatar:text-teal-600 dark:group-hover/avatar:text-teal-400 transition-colors">
                  {person.name}
                </h3>
                {person.linked_user_id && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                    أنا (الحساب)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="font-medium text-teal-700 dark:text-teal-400">
                  {age.displayAr}
                </span>
                <span>•</span>
                <span>{isMale ? "ذكر" : "أنثى"}</span>
                {person.blood_type && person.blood_type !== "unknown" && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      {person.blood_type}
                    </span>
                  </>
                )}
              </div>
            </div>
          </Link>

          <Link
            href={`/family/person/${person.id}/edit`}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="تعديل البيانات أو الأرشفة"
          >
            <Edit3 className="w-4 h-4" />
          </Link>
        </div>

        {/* Badges for Allergies & Chronic Conditions */}
        <div className="space-y-2 mb-5">
          {person.allergies && person.allergies.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>حساسية:</span>
              </span>
              {person.allergies.map((allergy, i) => (
                <span
                  key={i}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                >
                  {allergy}
                </span>
              ))}
            </div>
          )}

          {person.chronic_conditions && person.chronic_conditions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>أمراض مزمنة:</span>
              </span>
              {person.chronic_conditions.map((condition, i) => (
                <span
                  key={i}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                >
                  {condition}
                </span>
              ))}
            </div>
          )}

          {person.phone_number && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
              <Phone className="w-3 h-3 text-slate-400" />
              <span dir="ltr">{person.phone_number}</span>
              <span className="text-[10px] text-slate-400">(لربط العيادات مستقبلاً)</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions (Phase 2) */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          إجراءات سريعة
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Link
            href={`/family/person/${person.id}`}
            className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-200 flex flex-col items-center gap-1 text-[11px] font-bold transition-colors"
          >
            <HeartPulse className="w-4 h-4 text-teal-600" />
            <span>الملف والقياس</span>
          </Link>

          <button
            type="button"
            onClick={() => alert("إضافة الروشتات ومواعيد الجرعات ستنطلق في المرحلة القادمة")}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950 text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 flex flex-col items-center gap-1 text-[11px] font-medium transition-colors"
          >
            <Pill className="w-4 h-4 text-indigo-600" />
            <span>روشتة</span>
          </button>

          <button
            type="button"
            onClick={() => alert("توليد تقرير الزيارة الطبية الموحد سينطلق في مرحلة التقارير")}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950 text-slate-600 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 flex flex-col items-center gap-1 text-[11px] font-medium transition-colors"
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>تقرير طبيب</span>
          </button>
        </div>
      </div>
    </div>
  );
}
