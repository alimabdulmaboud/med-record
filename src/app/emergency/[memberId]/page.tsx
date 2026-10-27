"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getMedRecordRepository } from '@/lib/med-record/repository';
import type { FamilyMember, Medication } from '@/types/med-record';
import {
  AlertTriangle,
  PhoneCall,
  Activity,
  Pill,
  ShieldAlert,
  ArrowRight,
  Heart,
  Droplet,
  User,
  Users,
  Ambulance,
  FileText,
} from 'lucide-react';

export default function EmergencyMemberPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params?.memberId as string;

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [activeMember, setActiveMember] = useState<FamilyMember | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const repo = getMedRecordRepository();

  useEffect(() => {
    loadData();
  }, [memberId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const fam = await repo.getFamilyMembers();
      setMembers(fam);

      const target = fam.find(m => m.id === memberId) || fam.find(m => m.isPrimary) || fam[0];
      if (target) {
        setActiveMember(target);
        const meds = await repo.getMedications(target.id);
        setMedications(meds.filter(m => m.status === 'active'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchMember = (id: string) => {
    router.push(`/emergency/${id}`);
  };

  if (isLoading || !activeMember) {
    return (
      <div className="min-h-screen bg-rose-950 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center text-white space-y-3">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold">جاري تحميل بطاقة الطوارئ الطبية...</p>
        </div>
      </div>
    );
  }

  const birthYear = new Date(activeMember.birthDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-4 sm:p-6 pb-20 select-none" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Top Navigation & Exit */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>خروج من وضع الطوارئ</span>
          </Link>

          {/* Quick Family Member Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {members.map(m => (
              <button
                key={m.id}
                onClick={() => handleSwitchMember(m.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  m.id === activeMember.id
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m.fullName.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Emergency Header Badge */}
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-red-700 p-5 rounded-3xl shadow-xl shadow-rose-950/50 border border-rose-500/40 relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
                  بطاقة الطوارئ الطبية السريعة • EMERGENCY
                </span>
              </div>
              <h1 className="text-2xl font-black text-white">{activeMember.fullName}</h1>
              <p className="text-xs text-rose-100 mt-1">
                {age} سنة • {activeMember.sex === 'male' ? 'ذكر' : 'أنثى'} •{' '}
                {activeMember.relationshipLabel || (activeMember.relationship === 'self' ? 'صاحب الحساب' : activeMember.relationship)}
              </p>
            </div>

            {/* Huge Blood Type Badge */}
            <div className="bg-white text-rose-700 px-4 py-2.5 rounded-2xl shadow-lg text-center shrink-0 border border-rose-200">
              <span className="text-[10px] block font-bold text-slate-500">فصيلة الدم</span>
              <span className="text-2xl font-black font-mono leading-none">
                {activeMember.bloodType || '؟'}
              </span>
            </div>
          </div>
        </div>

        {/* Egyptian Ambulance 123 Quick Dial */}
        <div className="bg-rose-900/40 border border-rose-500/40 p-4 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black animate-pulse">
              123
            </div>
            <div>
              <h2 className="text-xs font-black text-rose-200">الإسعاف المصرية (Ambulance)</h2>
              <p className="text-[11px] text-rose-300">طوارئ وزارة الصحة والسكان - مجاني 24 ساعة</p>
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

        {/* Critical Allergies */}
        <div className="bg-slate-900/90 border border-rose-500/30 p-5 rounded-3xl space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>الحساسيات الدوائية والغذائية المهددة للحياة (Allergies)</span>
          </div>
          {activeMember.allergies && activeMember.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeMember.allergies.map((alg, i) => (
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
            <p className="text-xs text-slate-400 font-medium">لا توجد حساسيات مسجلة</p>
          )}
        </div>

        {/* Chronic Conditions */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
            <Activity className="w-4 h-4" />
            <span>الأمراض المزمنة والتشخيصات الهامة (Chronic Conditions)</span>
          </div>
          {activeMember.chronicConditions && activeMember.chronicConditions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeMember.chronicConditions.map((cond, i) => (
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

        {/* Active Medications */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <Pill className="w-4 h-4" />
            <span>الأدوية الحالية المنتظمة (Current Medications)</span>
          </div>
          {medications.length > 0 ? (
            <div className="space-y-2">
              {medications.map(med => (
                <div
                  key={med.id}
                  className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{med.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {med.dose} • {med.frequency}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    منتظم
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-medium">لا توجد أدوية مسجلة حالياً</p>
          )}
        </div>

        {/* Emergency Contacts (Direct Tel Call) */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <PhoneCall className="w-4 h-4" />
            <span>جهات الاتصال للطوارئ وأقارب الدرجة الأولى (Emergency Contacts)</span>
          </div>
          {activeMember.emergencyContacts && activeMember.emergencyContacts.length > 0 ? (
            <div className="space-y-2">
              {activeMember.emergencyContacts.map(c => (
                <div
                  key={c.id}
                  className="p-3 bg-slate-800/60 border border-slate-700/70 rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{c.name}</span>
                    <span className="text-[11px] text-slate-400">صلة القرابة: {c.relation}</span>
                  </div>
                  <a
                    href={`tel:${c.phone}`}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span className="font-mono">{c.phone}</span>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-medium">لم يتم تسجيل جهات اتصال للطوارئ</p>
          )}
        </div>

        {/* Doctor Report Link Shortcut */}
        <div className="text-center pt-2">
          <Link
            href="/report"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>عرض التقرير الطبي الكامل المعتمد للطبيب</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
