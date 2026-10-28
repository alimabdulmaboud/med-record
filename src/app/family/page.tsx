"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Settings,
  LogOut,
  ShieldCheck,
  Heart,
  Baby,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { PersonCard } from "@/components/family/PersonCard";
import type { Person } from "@/types/family";

// Default realistic fake Egyptian family seed data for Phase 1
const INITIAL_DEMO_PEOPLE: Person[] = [
  {
    id: "p-ahmed",
    family_id: "fam-demo",
    name: "أحمد مصطفى إبراهيم",
    birth_date: "1988-06-15",
    sex: "male",
    blood_type: "A+",
    allergies: ["بنسلين (Penicillin)"],
    chronic_conditions: ["ارتفاع ضغط الدم (Hypertension)"],
    phone_number: "+201012345678",
    linked_user_id: "usr-ahmed",
    notes: "متابعة دورية لقياسات الضغط",
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p-sara",
    family_id: "fam-demo",
    name: "سارة أحمد مصطفى",
    birth_date: "2021-04-10",
    sex: "female",
    blood_type: "A+",
    allergies: ["الفول السوداني (Peanuts)"],
    chronic_conditions: [],
    phone_number: null,
    linked_user_id: null,
    notes: "حساسية شديدة من الفول السوداني",
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p-yassin",
    family_id: "fam-demo",
    name: "ياسين أحمد مصطفى",
    birth_date: "2025-08-20",
    sex: "male",
    blood_type: "O+",
    allergies: [],
    chronic_conditions: [],
    phone_number: null,
    linked_user_id: null,
    notes: "متابعة جدول التطعيمات الإلزامية",
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function FamilySpaceHome() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [familyName, setFamilyName] = useState("عائلة أحمد مصطفى");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load people from localStorage or fallback to initial fake seed data
    try {
      const stored = localStorage.getItem("med_family_people");
      if (stored) {
        const parsed = JSON.parse(stored) as Person[];
        setPeople(parsed.filter((p) => !p.archived_at));
      } else {
        localStorage.setItem("med_family_people", JSON.stringify(INITIAL_DEMO_PEOPLE));
        setPeople(INITIAL_DEMO_PEOPLE);
      }
    } catch {
      setPeople(INITIAL_DEMO_PEOPLE);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleArchive = (personId: string) => {
    if (!confirm("هل أنت متأكد من أرشفة هذا الفرد؟ يمكنك استعادته لاحقاً من الإعدادات.")) {
      return;
    }

    try {
      const stored = localStorage.getItem("med_family_people");
      const currentPeople = stored ? JSON.parse(stored) : people;
      const updated = currentPeople.map((p: Person) =>
        p.id === personId ? { ...p, archived_at: new Date().toISOString() } : p
      );
      localStorage.setItem("med_family_people", JSON.stringify(updated));
      setPeople(updated.filter((p: Person) => !p.archived_at));
    } catch {
      alert("حدث خطأ أثناء الأرشفة");
    }
  };

  const handleSignOut = () => {
    document.cookie = "med_auth_session=; path=/; max-age=0";
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between" dir="rtl">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-xl shadow-sm">
            M
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base md:text-lg">{familyName}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                فضاء العائلة
              </span>
            </div>
            <p className="text-xs text-slate-500">سجل صحي عائلي مشفر وخاص</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/family/settings"
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="إعدادات الخصوصية وتصدير البيانات"
          >
            <Settings className="w-5 h-5" />
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto p-4 md:p-8 flex-1">
        
        {/* Banner with Add Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-gradient-to-l from-teal-500/10 via-teal-500/5 to-transparent p-5 rounded-3xl border border-teal-500/20">
          <div>
            <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-sm mb-1">
              <Users className="w-4 h-4" />
              <span>أفراد الأسرة المسجلين</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              تابع الحساسية، التطعيمات، القياسات الحيوية، وفحص الأعراض وتوجيه التخصصات لكل فرد
            </p>
          </div>

          <Link
            href="/family/person/new"
            className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة فرد جديد</span>
          </Link>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && people.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center max-w-md mx-auto border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold mb-1">لا يوجد أفراد مسجلين في العائلة بعد</h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              ابدأ بإضافة بياناتك الشخصية كولي أمر أو أضف طفلك لتتبع نموه وسجله الصحي.
            </p>
            <Link
              href="/family/person/new"
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة الفرد الأول</span>
            </Link>
          </div>
        )}

        {/* People Grid */}
        {!loading && people.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {people.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                onArchive={handleArchive}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800">
        تطبيق Med العائلي · أداة لحفظ السجلات والمتابعة الشخصية وليست أداة تشخيص طبي
      </footer>
    </div>
  );
}
