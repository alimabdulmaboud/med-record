"use client";

import { useState } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { NutritionWorkspace } from "@/components/nutrition/NutritionWorkspace";
import { getFullNutritionRecord } from "@/modules/nutrition/service";
import {
  Apple,
  Users,
  Clock,
  ArrowRight,
  Flame,
  Scale,
  Sparkles,
  Utensils,
  ChevronLeft,
  CheckCircle2,
  Stethoscope,
  HeartPulse,
} from "lucide-react";

interface NutritionPatient {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female";
  phone: string;
  currentGoal: string;
  weight: number;
  height: number;
  targetWeight: number;
  status: "waiting" | "in_consultation" | "completed";
  time: string;
}

const SEED_NUTRITION_PATIENTS: NutritionPatient[] = [
  {
    id: "pat-nut-1",
    name: "سارة محمود عبد العزيز",
    age: 29,
    gender: "female",
    phone: "01098765432",
    currentGoal: "إنقاص الوزن وحرق الدهون (دهون حشوية)",
    weight: 78.5,
    height: 165,
    targetWeight: 63,
    status: "in_consultation",
    time: "17:30",
  },
  {
    id: "pat-nut-2",
    name: "خالد عبد الرحمن المنشاوي",
    age: 44,
    gender: "male",
    phone: "01123456789",
    currentGoal: "تنظيم مقاومة الإنسولين ومرحلة ما قبل السكري",
    weight: 96,
    height: 178,
    targetWeight: 80,
    status: "waiting",
    time: "18:00",
  },
  {
    id: "pat-nut-3",
    name: "أحمد سامي النجار",
    age: 26,
    gender: "male",
    phone: "01234567890",
    currentGoal: "تغذية رياضية وزيادة الكتلة العضلية (Hypertrophy)",
    weight: 71,
    height: 175,
    targetWeight: 77,
    status: "waiting",
    time: "18:30",
  },
  {
    id: "pat-nut-4",
    name: "رانيا يوسف التلمساني",
    age: 32,
    gender: "female",
    phone: "01512345678",
    currentGoal: "تغذية صحية خلال فترة الرضاعة الطبيعية",
    weight: 74,
    height: 162,
    targetWeight: 60,
    status: "waiting",
    time: "19:00",
  },
];

export default function NutritionConsultationsPage() {
  const [patients, setPatients] = useState<NutritionPatient[]>(SEED_NUTRITION_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("pat-nut-1");

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  const nutritionDoctor = {
    id: "doc-nutrition-1",
    name: "د. نورهان الشريف",
    specialty: "استشاري التغذية العلاجية وعلاج السمنة والنحافة",
    clinicId: "clinic-nutrition",
    role: "doctor",
  };

  const handleCallPatient = (patientId: string) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) return { ...p, status: "in_consultation" };
        if (p.status === "in_consultation") return { ...p, status: "completed" };
        return p;
      })
    );
    setSelectedPatientId(patientId);
  };

  return (
    <main className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Link href="/" className="hover:text-slate-800 transition-colors">
                الرئيسية
              </Link>
              <span>/</span>
              <span className="text-emerald-600 font-bold">
                عيادة التغذية العلاجية (Consultations)
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Apple className="w-7 h-7 text-emerald-600" />
              <span>استشارات التغذية العلاجية وخطط الوجبات</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {nutritionDoctor.name} — {nutritionDoctor.specialty}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/doctor"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <span>شاشة الطبيب العامة (/doctor)</span>
            </Link>
            <Link
              href="/reception"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>طابور الاستقبال (/reception)</span>
            </Link>
          </div>
        </div>

        {/* Patients Queue Bar for Nutrition Clinic */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>طابور مراجعي عيادة التغذية اليوم ({patients.length} حالات)</span>
            </div>
            <span className="text-[11px] text-slate-500">
              الحالة الحالية: <strong className="text-emerald-700">{selectedPatient.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {patients.map((p) => {
              const isSelected = p.id === selectedPatientId;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2.5 ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {p.age} سنة • {p.gender === "male" ? "ذكر" : "أنثى"}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      {p.time}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1">{p.currentGoal}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                    <span className="font-mono text-[11px] text-slate-500">
                      الوزن: <strong>{p.weight} كجم</strong>
                    </span>
                    {p.status === "in_consultation" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Flame className="w-3 h-3 text-emerald-600" />
                        <span>بالكشف الآن</span>
                      </span>
                    ) : p.status === "completed" ? (
                      <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        مكتمل
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCallPatient(p.id);
                        }}
                        className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-0.5 rounded-lg transition-colors"
                      >
                        بدء الكشف
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nutrition Clinical Workspace */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-600" />
                <span>ملف التقييم الغذائي وتصميم الوجبات — {selectedPatient.name}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                حساب السعرات ومعدل الأيض (BMR/TDEE)، قياسات InBody، وتوزيع المغذيات الكبرى وطباعة النظام الغذائي
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold">
                الهدف: {selectedPatient.currentGoal}
              </span>
            </div>
          </div>

          <NutritionWorkspace
            doctor={nutritionDoctor}
            clinicEnabledModules={["nutrition"]}
            patient={{
              id: selectedPatient.id,
              name: selectedPatient.name,
              age: selectedPatient.age,
              gender: selectedPatient.gender === "female" ? "أنثى" : "ذكر",
            }}
            initialRecord={getFullNutritionRecord(
              nutritionDoctor,
              selectedPatient.id,
              ["nutrition"]
            )}
            letterhead={{
              clinicName: "مركز النخبة للتغذية العلاجية والرشاقة",
              doctorName: nutritionDoctor.name,
              title: "استشاري التغذية العلاجية",
              specialty: nutritionDoctor.specialty,
              phone: "01099887766",
              address: "شارع الطيران، مدينة نصر، القاهرة",
            }}
          />
        </div>
      </div>
    </main>
  );
}
