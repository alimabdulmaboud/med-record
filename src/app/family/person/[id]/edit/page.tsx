"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowRight, Edit3, Archive, Trash2, AlertCircle } from "lucide-react";
import { PersonForm } from "@/components/family/PersonForm";
import type { Person, UpdatePersonInput } from "@/types/family";

export default function EditPersonPage() {
  const router = useRouter();
  const params = useParams();
  const personId = params.id as string;

  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("med_family_people");
      if (stored) {
        const people: Person[] = JSON.parse(stored);
        const found = people.find((p) => p.id === personId);
        if (found) {
          setPerson(found);
        }
      }
    } catch {
      // Handle error gracefully
    } finally {
      setLoading(false);
    }
  }, [personId]);

  const handleUpdate = async (data: UpdatePersonInput) => {
    const stored = localStorage.getItem("med_family_people");
    const people: Person[] = stored ? JSON.parse(stored) : [];
    const updated = people.map((p) => {
      if (p.id === personId) {
        return {
          ...p,
          ...data,
          updated_at: new Date().toISOString(),
        };
      }
      return p;
    });

    localStorage.setItem("med_family_people", JSON.stringify(updated));
  };

  const handleArchive = () => {
    if (!confirm("هل أنت متأكد من أرشفة هذا الفرد؟ لن يظهر في القائمة الرئيسية.")) {
      return;
    }

    const stored = localStorage.getItem("med_family_people");
    const people: Person[] = stored ? JSON.parse(stored) : [];
    const updated = people.map((p) => {
      if (p.id === personId) {
        return { ...p, archived_at: new Date().toISOString() };
      }
      return p;
    });

    localStorage.setItem("med_family_people", JSON.stringify(updated));
    router.push("/family");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-xs text-slate-500">جاري تحميل البيانات...</div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div>
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h2 className="text-base font-bold">لم يتم العثور على هذا الفرد</h2>
          <Link href="/family" className="text-xs text-teal-600 underline mt-2 inline-block">
            العودة لفضاء العائلة
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">تعديل بيانات: {person.name}</h1>
            <p className="text-xs text-slate-500">تحديث البيانات أو الحساسية أو أرشفة الفرد</p>
          </div>
        </div>

        <Link
          href="/family"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50"
        >
          <span>العودة</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <PersonForm initialData={person} onSubmit={handleUpdate} isEditing={true} />

      {/* Archive Section */}
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200/60 dark:border-rose-900/40 shadow-sm flex items-center justify-between">
        <div>
          <div className="font-bold text-sm text-rose-900 dark:text-rose-200">
            أرشفة هذا الفرد
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            يتم إخفاء الفرد من القائمة الرئيسية مع الاحتفاظ بسجلاته لعدم ضياع التاريخ الطبي.
          </div>
        </div>

        <button
          type="button"
          onClick={handleArchive}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-semibold text-xs rounded-xl border border-rose-200 dark:border-rose-800 transition-colors"
        >
          <Archive className="w-4 h-4" />
          <span>أرشفة</span>
        </button>
      </div>
    </div>
  );
}
