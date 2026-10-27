"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  FileText,
  Pill,
  Calendar,
  Syringe,
  Plus,
  ArrowLeft,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Share2,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  Baby,
} from 'lucide-react';
import { Header } from '@/components/med-record/Header';
import { EmergencyBanner } from '@/components/med-record/EmergencyBanner';
import { QuickLogModal } from '@/components/med-record/QuickLogModal';
import { getMedRecordRepository } from '@/lib/med-record/repository';
import type {
  FamilyMember,
  Measurement,
  GrowthMeasurement,
  Medication,
  MedicalDocument,
  Encounter,
  Vaccination,
  MeasurementType,
  MeasurementValues,
} from '@/types/med-record';
import { formatMeasurementValue } from '@/lib/med-record/quick-log-helper';
import { evaluateVitalMeasurement } from '@/lib/med-record/vitals-evaluator';

export default function MedRecordDashboard() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>('');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [growthList, setGrowthList] = useState<GrowthMeasurement[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);

  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const repo = getMedRecordRepository();

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      const allMembers = await repo.getFamilyMembers();
      setMembers(allMembers);
      if (allMembers.length > 0) {
        const primary = allMembers.find(m => m.isPrimary) || allMembers[0];
        setActiveMemberId(primary.id);
        await loadMemberData(primary.id);
      }
      setIsLoading(false);
    }
    loadInitialData();
  }, []);

  const loadMemberData = async (memberId: string) => {
    const [m, g, meds, docs, encs, vacs] = await Promise.all([
      repo.getMeasurements(memberId),
      repo.getGrowthMeasurements(memberId),
      repo.getMedications(memberId, 'active'),
      repo.getDocuments(memberId),
      repo.getEncounters(memberId),
      repo.getVaccinations(memberId),
    ]);
    setMeasurements(m);
    setGrowthList(g);
    setMedications(meds);
    setDocuments(docs);
    setEncounters(encs);
    setVaccinations(vacs);
  };

  const handleSelectMember = async (id: string) => {
    setActiveMemberId(id);
    await loadMemberData(id);
  };

  const handleSaveQuickMeasurement = async (
    type: MeasurementType,
    values: MeasurementValues,
    notes?: string
  ) => {
    await repo.addMeasurement({
      memberId: activeMemberId,
      measurementType: type,
      values,
      unit: type === 'blood_pressure' ? 'mmHg' : type === 'blood_sugar' ? (values.context === 'hba1c' ? '%' : 'mg/dL') : 'unit',
      notes,
      recordedAt: new Date().toISOString(),
    });
    await loadMemberData(activeMemberId);
  };

  const activeMember = members.find(m => m.id === activeMemberId) || members[0];
  const isChild = activeMember?.relationship === 'child';

  // Latest measurements by type
  const getLatestMeasurement = (type: MeasurementType) => {
    const filtered = measurements.filter(m => m.measurementType === type);
    return filtered.length > 0 ? filtered[filtered.length - 1] : null;
  };

  const latestBP = getLatestMeasurement('blood_pressure');
  const latestSugar = getLatestMeasurement('blood_sugar');
  const latestHR = getLatestMeasurement('heart_rate');
  const latestSpO2 = getLatestMeasurement('oxygen_saturation');
  const latestTemp = getLatestMeasurement('temperature');
  const latestWeight = getLatestMeasurement('weight');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20" dir="rtl">
      {/* Top Header */}
      <Header
        members={members}
        activeMemberId={activeMemberId}
        onSelectMember={handleSelectMember}
        onAddMember={() => window.location.href = '/profiles'}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Emergency Info Banner */}
        {activeMember && <EmergencyBanner member={activeMember} />}

        {/* Quick Action Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setIsQuickLogOpen(true)}
            className="flex items-center gap-3 p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-md shadow-emerald-600/20 transition-all text-right group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-100">تسجيل سريع</div>
              <div className="text-sm font-black">قياس جديد</div>
            </div>
          </button>

          <Link
            href="/documents"
            className="flex items-center gap-3 p-4 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl border border-slate-200/80 shadow-xs transition-all text-right group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400">خزينة الملفات</div>
              <div className="text-sm font-black text-slate-900">رفع وثيقة / تحليل</div>
            </div>
          </Link>

          <Link
            href="/visits"
            className="flex items-center gap-3 p-4 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl border border-slate-200/80 shadow-xs transition-all text-right group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400">سجل الاستشارات</div>
              <div className="text-sm font-black text-slate-900">زيارة طبيب</div>
            </div>
          </Link>

          <Link
            href="/report"
            className="flex items-center gap-3 p-4 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl border border-slate-200/80 shadow-xs transition-all text-right group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400">ملخص الزيارة</div>
              <div className="text-sm font-black text-slate-900">تقرير الطبيب</div>
            </div>
          </Link>
        </div>

        {/* Vitals Overview Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <span>القياسات والمؤشرات الحيوية ({activeMember?.fullName})</span>
            </h2>
            <Link
              href="/measurements"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>عرض المخططات والتاريخ</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Blood Pressure Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>ضغط الدم</span>
                <Activity className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-lg font-black text-slate-900">
                {latestBP ? `${latestBP.values.systolic}/${latestBP.values.diastolic}` : '--'}
                <span className="text-[10px] text-slate-400 font-normal mr-1">mmHg</span>
              </div>
              <div className="mt-2 text-[10px]">
                {latestBP ? (
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold ${
                      latestBP.isAbnormal
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {latestBP.isAbnormal ? 'مرتفع' : 'طبيعي'}
                  </span>
                ) : (
                  <span className="text-slate-400">لا توجد قراءة</span>
                )}
              </div>
            </div>

            {/* Blood Sugar Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>السكر بالدم</span>
                <Activity className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-lg font-black text-slate-900">
                {latestSugar ? (latestSugar.values.glucose ?? latestSugar.values.value) : '--'}
                <span className="text-[10px] text-slate-400 font-normal mr-1">
                  {latestSugar?.values.context === 'hba1c' ? '%' : 'mg/dL'}
                </span>
              </div>
              <div className="mt-2 text-[10px]">
                {latestSugar ? (
                  <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                    {latestSugar.values.context === 'fasting'
                      ? 'صائم'
                      : latestSugar.values.context === 'post_prandial'
                      ? 'بعد الأكل'
                      : 'عشوائي'}
                  </span>
                ) : (
                  <span className="text-slate-400">لا توجد قراءة</span>
                )}
              </div>
            </div>

            {/* Heart Rate Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>النبض</span>
                <Activity className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-lg font-black text-slate-900">
                {latestHR ? latestHR.values.value : '--'}
                <span className="text-[10px] text-slate-400 font-normal mr-1">bpm</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-500">
                المعدل: 60-100
              </div>
            </div>

            {/* SpO2 Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>الأكسجين SpO2</span>
                <Activity className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-lg font-black text-slate-900">
                {latestSpO2 ? latestSpO2.values.value : '--'}
                <span className="text-[10px] text-slate-400 font-normal mr-1">%</span>
              </div>
              <div className="mt-2 text-[10px] text-emerald-700 font-bold">
                {latestSpO2 && latestSpO2.values.value! >= 95 ? 'نسبة ممتازة' : ''}
              </div>
            </div>

            {/* Temperature Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>الحرارة</span>
                <Activity className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-lg font-black text-slate-900">
                {latestTemp ? latestTemp.values.value : '--'}
                <span className="text-[10px] text-slate-400 font-normal mr-1">°C</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-500">
                طبيعي: 36.5 - 37.5
              </div>
            </div>

            {/* Weight Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>الوزن</span>
                <Activity className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-lg font-black text-slate-900">
                {latestWeight ? latestWeight.values.value : '--'}
                <span className="text-[10px] text-slate-400 font-normal mr-1">kg</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-500">
                {isChild ? 'متابع في منحنى WHO' : 'كتلة الجسم'}
              </div>
            </div>
          </div>
        </section>

        {/* 2-Column Section: Active Medications & Recent Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Medications */}
          <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">الأدوية والعلاجات الحالية</h3>
                  <p className="text-[11px] text-slate-500">الجرعات ومواعيد التذكير</p>
                </div>
              </div>
              <Link
                href="/medications"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                إدارة الأدوية
              </Link>
            </div>

            {medications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                لا توجد أدوية نشطة مسجلة حالياً
              </div>
            ) : (
              <div className="space-y-2.5">
                {medications.map(med => (
                  <div
                    key={med.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{med.name}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {med.dose} • {med.frequency}
                      </div>
                      {med.timingNotes && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{med.timingNotes}</div>
                      )}
                    </div>
                    {med.reminderEnabled && med.reminderTime && (
                      <span className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>{med.reminderTime}</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Documents & Labs */}
          <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">أحدث الوثائق والتحاليل</h3>
                  <p className="text-[11px] text-slate-500">تقارير المعامل والأشعة والروشتات</p>
                </div>
              </div>
              <Link
                href="/documents"
                className="text-xs font-bold text-blue-700 hover:text-blue-800"
              >
                فتح الخزينة
              </Link>
            </div>

            {documents.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                لم يتم رفع أي وثائق طبية بعد
              </div>
            ) : (
              <div className="space-y-2.5">
                {documents.slice(0, 3).map(doc => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{doc.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{doc.documentDate}</span>
                        {doc.doctorName && <span>• {doc.doctorName}</span>}
                      </div>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {doc.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.2 rounded-md bg-white border text-slate-600">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold">
                      {doc.documentType === 'lab_result' ? 'تحليل' : doc.documentType === 'radiology' ? 'أشعة' : 'روشتة'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Pediatric Vaccination Tracker Preview (if active member is a child) */}
        {isChild && (
          <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Syringe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">تطعيمات وزارة الصحة المصرية ({activeMember.fullName})</h3>
                  <p className="text-[11px] text-slate-500">جدول التطعيمات الإجبارية الرسمية من الولادة حتى 18 شهراً</p>
                </div>
              </div>
              <Link
                href="/vaccinations"
                className="text-xs font-bold text-purple-700 hover:text-purple-800"
              >
                جدول التطعيمات الكامل
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {vaccinations.slice(0, 3).map(vac => (
                <div key={vac.id} className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-purple-950">{vac.vaccineName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      تم التطعيم
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    تاريخ الإعطاء: {vac.administeredDate || vac.scheduledDate}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Quick Measurement Log Bottom Sheet Modal (< 10 seconds) */}
      <QuickLogModal
        isOpen={isQuickLogOpen}
        memberId={activeMemberId}
        memberName={activeMember?.fullName || ''}
        isChild={isChild}
        onClose={() => setIsQuickLogOpen(false)}
        onSave={handleSaveQuickMeasurement}
      />
    </div>
  );
}
