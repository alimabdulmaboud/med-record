"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, UserPlus } from "lucide-react";
import { PersonForm } from "@/components/family/PersonForm";
import type { CreatePersonInput, UpdatePersonInput, Person } from "@/types/family";

export default function NewPersonPage() {
  const handleCreate = async (data: CreatePersonInput | UpdatePersonInput) => {
    if (!data.name || !data.birth_date || !data.sex) {
      throw new Error("البيانات الأساسية مطلوبة");
    }

    const newPerson: Person = {
      id: "p-" + Date.now(),
      family_id: "fam-demo",
      name: data.name,
      birth_date: data.birth_date,
      sex: data.sex,
      blood_type: data.blood_type || "unknown",
      allergies: data.allergies || [],
      chronic_conditions: data.chronic_conditions || [],
      phone_number: data.phone_number || null,
      notes: data.notes || null,
      linked_user_id: data.linked_user_id || null,
      archived_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const stored = localStorage.getItem("med_family_people");
    const currentPeople: Person[] = stored ? JSON.parse(stored) : [];
    currentPeople.push(newPerson);
    localStorage.setItem("med_family_people", JSON.stringify(currentPeople));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">إضافة فرد جديد للأسرة</h1>
            <p className="text-xs text-slate-500">أدخل البيانات الصحية الأساسية (أقل من دقيقة)</p>
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

      <PersonForm onSubmit={handleCreate} />
    </div>
  );
}
