"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { Person } from '@/types/family';
import {
  compileEmergencyCard,
  type EmergencyCardPayload,
} from '@/lib/family/emergency-service';
import { getStoredPeople } from '@/lib/family/demo-service';
import {
  AlertTriangle,
  PhoneCall,
  Activity,
  Pill,
  ArrowRight,
  ShieldAlert,
  Heart,
  Droplet,
  User,
  Users,
  Ambulance,
  FileText,
  Clock,
  Phone,
} from 'lucide-react';

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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function EmergencyMemberPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params?.memberId as string;

  const [people, setPeople] = useState<Person[]>([]);
  const [emergencyCard, setEmergencyCard] = useState<EmergencyCardPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [memberId]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const list = getStoredPeople();
      setPeople(list);

      const targetPerson = list.find((p) => p.id === memberId) || list[0];
      if (targetPerson) {
        const card = await compileEmergencyCard(targetPerson);
        setEmergencyCard(card);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchMember = (id: string) => {
    router.push(`/emergency/${id}`);
  };

  if (isLoading || !emergencyCard) {
    if (!isLoading && people.length === 0) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white" dir="rtl">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold">لا يوجد أفراد مسجلين في العائلة بعد</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              بطاقة الطوارئ تتطلب وجود فرد مسجل في فضاء العائلة لعرض الحساسيات وجهات الاتصال وأرقام الإسعاف.
            </p>
            <Link
              href="/family/person/new"
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all"
            >
              إضافة فرد جديد
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-rose-950 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center text-white space-y-3">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold">جاري تحميل بطاقة الطوارئ الطبية...</p>
        </div>
      </div>
    );
  }

  const { person, blood_type, emergency_contacts, severe_allergies, chronic_conditions, active_medications, recent_vitals, hotlines } = emergencyCard;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-4 sm:p-6 pb-20 select-none" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Top Navigation & Member Switcher */}
        <div className="flex items-center justify-between">
          <Link
            href={`/family/person/${person.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للملف الصحي</span>
          </Link>

          {/* Quick Switcher among all people */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {people.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSwitchMember(p.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  p.id === person.id
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* High-Contrast Emergency Header Card */}
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-red-700 p-5 rounded-3xl shadow-xl shadow-rose-950/50 border border-rose-500/40 relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
                  بطاقة الطوارئ الطبية السريعة • EMERGENCY ID
                </span>
              </div>
              <h1 className="text-2xl font-black text-white">{person.name}</h1>
              <p className="text-xs text-rose-100 mt-1">
                {emergencyCard.age_display} • {person.sex === 'male' ? 'ذكر' : 'أنثى'} •{' '}
                {emergencyCard.is_child ? 'طفل' : 'بالغ'}
              </p>
            </div>

            {/* Prominent Blood Type Badge */}
            <div className="bg-white text-rose-700 px-4 py-2.5 rounded-2xl shadow-lg text-center shrink-0 border border-rose-200">
              <span className="text-[10px] block font-bold text-slate-500">فصيلة الدم</span>
              <span className="text-2xl font-black font-mono leading-none">
                {blood_type || '؟'}
              </span>
            </div>
          </div>
        </div>

        {/* 1-Tap Egyptian Emergency Ambulance Dial (123) */}
        <div className="bg-rose-900/40 border border-rose-500/40 p-4 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black animate-pulse">
              123
            </div>
            <div>
              <h2 className="text-xs font-black text-rose-200">هيئة الإسعاف المصرية (Ambulance)</h2>
              <p className="text-[11px] text-rose-300">طوارئ وزارة الصحة والسكان — مجاني 24 ساعة</p>
            </div>
          </div>
          <a
            href="tel:123"
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>اتصال 123</span>
          </a>
        </div>

        {/* Severe Allergies Alert Box */}
        <div className="bg-slate-900/90 border border-rose-500/30 p-5 rounded-3xl space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>الحساسيات الدوائية والغذائية المهددة للحياة (Allergies)</span>
          </div>
          {severe_allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {severe_allergies.map((alg, i) => (
                <div
                  key={i}
                  className="px-3 py-2 bg-rose-950/70 border border-rose-600/50 text-rose-200 rounded-xl text-xs font-black flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>{alg}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-medium">لا توجد حساسية دوائية معروفة (NKDA)</p>
          )}
        </div>

        {/* Chronic Conditions */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
            <Activity className="w-4 h-4" />
            <span>الأمراض المزمنة والتشخيصات الهامة (Chronic Conditions)</span>
          </div>
          {chronic_conditions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {chronic_conditions.map((cond, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold"
                >
                  {cond}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-medium">لا توجد أمراض مزمنة مسجلة</p>
          )}
        </div>

        {/* Active Daily Medications */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <Pill className="w-4 h-4" />
            <span>الأدوية الحالية المنتظمة (Current Medications)</span>
          </div>
          {active_medications.length > 0 ? (
            <div className="space-y-2">
              {active_medications.map((med) => (
                <div
                  key={med.id}
                  className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{med.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {med.dose} • {med.frequency} {med.timing_notes ? `(${med.timing_notes})` : ''}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    منتظم
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-medium">لا توجد أدوية منتظمة مسجلة حالياً</p>
          )}
        </div>

        {/* Emergency Contacts with Click-to-Call Buttons */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <PhoneCall className="w-4 h-4" />
            <span>جهات الاتصال للطوارئ (Emergency Contacts)</span>
          </div>
          {emergency_contacts.length > 0 ? (
            <div className="space-y-2">
              {emergency_contacts.map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-slate-800/60 border border-slate-700/70 rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{c.name}</span>
                    <span className="text-[11px] text-slate-400">
                      صلة القرابة: {c.relationship} {c.is_primary ? '(جهة الاتصال الرئيسية)' : ''}
                    </span>
                  </div>
                  <a
                    href={`tel:${c.phone}`}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span className="font-mono" dir="ltr">{c.phone}</span>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-medium">لم يتم تسجيل جهات اتصال للطوارئ</p>
          )}
        </div>

        {/* Recent Vitals if available */}
        {recent_vitals && (
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
              <Clock className="w-4 h-4" />
              <span>أحدث المؤشرات الحيوية المسجلة</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              {recent_vitals.blood_pressure && (
                <div className="p-2 bg-slate-800/60 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">ضغط الدم</span>
                  <span className="font-bold text-white">{recent_vitals.blood_pressure}</span>
                </div>
              )}
              {recent_vitals.blood_sugar && (
                <div className="p-2 bg-slate-800/60 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">سكر الدم</span>
                  <span className="font-bold text-white">{recent_vitals.blood_sugar}</span>
                </div>
              )}
              {recent_vitals.heart_rate && (
                <div className="p-2 bg-slate-800/60 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">نبض القلب</span>
                  <span className="font-bold text-white">{recent_vitals.heart_rate}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* National Emergency Hotlines Accordion/Section */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <Ambulance className="w-4 h-4" />
            <span>خطوط الطوارئ الوطنية الرسمية (جمهورية مصر العربية)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {hotlines.map((h) => (
              <a
                key={h.number}
                href={`tel:${h.number}`}
                className="p-2.5 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 rounded-xl flex items-center justify-between transition-all cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-white block">{h.nameAr}</span>
                  <span className="text-[10px] text-slate-400">{h.descriptionAr}</span>
                </div>
                <span className="font-mono text-sm font-black text-rose-400 px-2 py-1 bg-rose-950/60 border border-rose-900 rounded-lg">
                  {h.number}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Full Doctor Report Link Shortcut */}
        <div className="text-center pt-2">
          <Link
            href={`/family/person/${person.id}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>عرض الملف الصحي والتقرير الطبي الكامل (A4 / IPS)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
