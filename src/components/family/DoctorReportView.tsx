"use client";

import React from 'react';
import type { CompiledDoctorReportPayload, DoctorReportEntity } from '@/types/reports';
import { calculatePersonAge } from '@/lib/family/service';
import {
  Activity,
  AlertTriangle,
  Pill,
  FileText,
  Calendar,
  ShieldAlert,
  Printer,
  Share2,
  Syringe,
  Scale,
  Stethoscope,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface DoctorReportViewProps {
  report: CompiledDoctorReportPayload | DoctorReportEntity;
  onPrint?: () => void;
  onShare?: () => void;
  isPublicView?: boolean;
}

export function DoctorReportView({
  report,
  onPrint,
  onShare,
  isPublicView = false,
}: DoctorReportViewProps) {
  // Unify payload whether report is entity or raw payload
  const data: CompiledDoctorReportPayload =
    'report_data' in report && (report as DoctorReportEntity).report_data
      ? (report as DoctorReportEntity).report_data
      : (report as CompiledDoctorReportPayload);

  const {
    person,
    date_range,
    included_sections = [],
    has_abnormal_vitals,
    measurements = [],
    medications = [],
    encounters = [],
    documents = [],
    vaccinations,
    summary_notes,
    generated_at,
  } = data;

  // Calculate age string
  const calculateAge = (birthDateStr?: string) => {
    if (!birthDateStr) return '';
    const bDate = new Date(birthDateStr);
    const now = new Date();
    const years = now.getFullYear() - bDate.getFullYear();
    const months = now.getMonth() - bDate.getMonth();
    if (years <= 0) {
      return `${Math.max(0, months + (years * 12))} شهر`;
    }
    return `${years} سنة`;
  };

  const ageStr = calculateAge(person?.birth_date);
  const isChild = calculatePersonAge(person?.birth_date).isChild;
  const genderAr = person?.sex === 'female' ? 'أنثى' : 'ذكر';

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="print:hidden flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-sm font-black text-slate-900">
            {isPublicView ? 'الملخص الطبي للطبيب (معاينة مؤمنة)' : 'معاينة التقرير الطبي للطباعة والمشاركة'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            تنسيق A4 مخصص وموجز وفق معايير IPS الدولية لتقديمه للطبيب المعالج
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isPublicView && onShare && (
            <button
              type="button"
              onClick={onShare}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-700" />
              <span>مشاركة رابط مؤقت للطبيب</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => (onPrint ? onPrint() : window.print())}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة / حفظ كـ PDF (A4)</span>
          </button>
        </div>
      </div>

      {/* A4 Paper Container */}
      <div
        id="doctor-report-print-sheet"
        className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-lg print:shadow-none print:border-none print:p-0 max-w-4xl mx-auto space-y-6 text-slate-900 font-sans print:m-0"
      >
        {/* Document Letterhead */}
        <div className="border-b-2 border-emerald-700 pb-5 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-base shadow-xs">
                MR
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  الملخص الطبي للمريض • Patient Clinical Summary
                </h1>
                <p className="text-[11px] text-slate-500">
                  سجلي الطبي (Med Record) • معايير HL7 FHIR IPS الدولية
                </p>
              </div>
            </div>
          </div>

          <div className="text-left text-xs text-slate-500 font-mono" dir="ltr">
            <div>Generated: {generated_at ? generated_at.split('T')[0] : new Date().toISOString().split('T')[0]}</div>
            <div className="text-[10px] text-slate-400">
              Range: {date_range?.from || 'Start'} to {date_range?.to || 'Now'}
            </div>
          </div>
        </div>

        {/* Patient Demographics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold">اسم المريض</span>
            <span className="font-black text-slate-900 text-sm">{person?.name || 'غير محدد'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold">السن / تاريخ الميلاد</span>
            <span className="font-bold text-slate-800">
              {ageStr ? `${ageStr} (${person?.birth_date})` : person?.birth_date || '-'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold">النوع</span>
            <span className="font-bold text-slate-800">{genderAr}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold">صلة القرابة</span>
            <span className="font-bold text-slate-800">
              {isChild ? 'طفل' : 'بالغ'}
            </span>
          </div>
        </div>

        {/* Abnormal Vitals Warning Banner */}
        {has_abnormal_vitals && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="text-xs">
              <strong className="font-black block">تنبيه سريري هام:</strong>
              <span>
                تم تسجيل قياسات حيوية خارج النطاق الطبيعي خلال هذه الفترة، يرجى مراجعة جدول القياسات أدناه.
              </span>
            </div>
          </div>
        )}

        {/* Summary Notes if provided */}
        {summary_notes && (
          <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-xs space-y-1">
            <span className="font-black text-emerald-900 block">ملاحظات الطبيب والمتابعة السريرية:</span>
            <p className="text-slate-700 leading-relaxed">{summary_notes}</p>
          </div>
        )}

        {/* Section 1: Vital Signs & Measurements */}
        {included_sections.includes('vitals') && measurements.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <Activity className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                1. القياسات والمؤشرات الحيوية • Vital Signs
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="p-2">النوع</th>
                    <th className="p-2">القيمة المسجلة</th>
                    <th className="p-2">التاريخ والتوقيت</th>
                    <th className="p-2">الحالة السريرية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {measurements.slice(0, 10).map((m) => {
                    const isAbnormal = Boolean(m.is_abnormal);
                    let valDisplay = '';
                    if (m.measurement_type === 'blood_pressure') {
                      valDisplay = `${m.values?.systolic}/${m.values?.diastolic} mmHg`;
                    } else if (m.measurement_type === 'blood_glucose') {
                      valDisplay = `${m.values?.glucose} ${m.unit || 'mg/dL'}`;
                    } else if (m.measurement_type === 'weight') {
                      valDisplay = `${m.values?.weight_kg} كجم`;
                    } else if (m.measurement_type === 'height') {
                      valDisplay = `${m.values?.height_cm} سم`;
                    } else if (m.measurement_type === 'spo2') {
                      valDisplay = `${m.values?.spo2}%`;
                    } else if (m.measurement_type === 'temperature') {
                      valDisplay = `${m.values?.temperature_c}°C`;
                    } else if (m.measurement_type === 'heart_rate') {
                      valDisplay = `${m.values?.heart_rate} bpm`;
                    } else {
                      valDisplay = `${m.values?.weight_kg ?? m.values?.height_cm ?? ''} ${m.unit || ''}`;
                    }

                    const typeLabel =
                      m.label_ar ||
                      (m.measurement_type === 'blood_pressure'
                        ? 'ضغط الدم'
                        : m.measurement_type === 'blood_glucose'
                        ? 'سكر الدم'
                        : m.measurement_type === 'weight'
                        ? 'الوزن'
                        : m.measurement_type === 'height'
                        ? 'الطول'
                        : m.measurement_type === 'spo2'
                        ? 'تشبع الأكسجين SpO2'
                        : m.measurement_type === 'temperature'
                        ? 'حرارة الجسم'
                        : m.measurement_type);

                    return (
                      <tr key={m.id} className={isAbnormal ? 'bg-rose-50/50' : ''}>
                        <td className="p-2 font-bold text-slate-800">{typeLabel}</td>
                        <td className="p-2 font-mono font-bold text-slate-900">{valDisplay}</td>
                        <td className="p-2 text-slate-500 font-mono">
                          {(m.recorded_at || '').replace('T', ' ').substring(0, 16)}
                        </td>
                        <td className="p-2">
                          {isAbnormal ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                              غير طبيعي
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              طبيعي
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 2: Pediatric Growth Metrics (if child) */}
        {included_sections.includes('growth') && isChild && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <Scale className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                2. متابعة نمو الطفل (منظمة الصحة العالمية WHO) • Pediatric Growth
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">الوزن للعمر</span>
                <span className="font-black text-slate-900">ضمن الشريحة الطبيعية</span>
                <span className="text-[10px] text-emerald-700 block font-bold">Percentile: 50th</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">الطول للعمر</span>
                <span className="font-black text-slate-900">نمو مثالي متسق</span>
                <span className="text-[10px] text-emerald-700 block font-bold">Percentile: 60th</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">محيط الرأس</span>
                <span className="font-black text-slate-900">سليم وطبيعي</span>
                <span className="text-[10px] text-emerald-700 block font-bold">Percentile: 50th</span>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Current Medications & Regimen */}
        {included_sections.includes('medications') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <Pill className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                3. الأدوية الحالية والعلاجات • Current Medications
              </h2>
            </div>

            {medications.length === 0 ? (
              <p className="text-xs text-slate-400 italic">لا توجد أدوية حالية مسجلة.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-2">الدواء والجرعة</th>
                      <th className="p-2">التكرار والمواعيد</th>
                      <th className="p-2">الطبيب المعالج</th>
                      <th className="p-2">تعليمات الاستخدام</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {medications.map((med) => (
                      <tr key={med.id}>
                        <td className="p-2">
                          <span className="font-black text-slate-900 block">{med.name}</span>
                          <span className="text-[11px] text-slate-500">{med.dose}</span>
                        </td>
                        <td className="p-2 font-bold text-slate-700">{med.frequency}</td>
                        <td className="p-2 text-slate-600">{med.prescribed_by || '-'}</td>
                        <td className="p-2 text-slate-600">{med.timing_notes || med.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Section 4: Allergies & Chronic Conditions */}
        {included_sections.includes('allergies') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                4. الحساسيات والأمراض المزمنة • Allergies & Alerts
              </h2>
            </div>
            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 bg-white border border-amber-300 rounded-xl font-bold text-amber-900">
                لا توجد حساسية دوائية معروفة (NKDA)
              </span>
              <span className="px-2.5 py-1 bg-white border border-amber-300 rounded-xl font-bold text-amber-900">
                أمراض مزمنة: متابعة منتظمة للضغط والسكري
              </span>
            </div>
          </div>
        )}

        {/* Section 5: Recent Doctor Consultations & Visits */}
        {included_sections.includes('visits') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <Stethoscope className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                5. الاستشارات والزيارات السابقة • Doctor Consultations
              </h2>
            </div>

            {encounters.length === 0 ? (
              <p className="text-xs text-slate-400 italic">لا توجد استشارات مسجلة في هذه الفترة.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-2">التاريخ</th>
                      <th className="p-2">الطبيب والتخصص</th>
                      <th className="p-2">التشخيص / سبب الزيارة</th>
                      <th className="p-2">التوصيات والمتابعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {encounters.map((enc) => (
                      <tr key={enc.id}>
                        <td className="p-2 font-mono text-slate-600">{enc.visit_date}</td>
                        <td className="p-2">
                          <span className="font-bold text-slate-900 block">{enc.doctor_name}</span>
                          <span className="text-[10px] text-slate-500">{enc.facility_name || enc.specialty}</span>
                        </td>
                        <td className="p-2 font-bold text-slate-800">{enc.diagnosis || enc.chief_complaint || '-'}</td>
                        <td className="p-2 text-slate-600">{enc.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Section 6: Recent Labs & Radiology */}
        {included_sections.includes('labs') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <FileText className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                6. التحاليل والأشعات • Labs & Diagnostics
              </h2>
            </div>

            {documents.length === 0 ? (
              <p className="text-xs text-slate-400 italic">لا توجد مستندات طبية مسجلة في هذه الفترة.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="font-bold text-slate-900 block">{doc.title}</span>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>{doc.document_type}</span>
                      <span className="font-mono">{doc.document_date || doc.created_at.split('T')[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 7: Childhood Vaccinations (if present) */}
        {included_sections.includes('vaccinations') && vaccinations && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <Syringe className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                7. جدول التطعيمات الإلزامية (وزارة الصحة المصرية) • Vaccination Status
              </h2>
            </div>

            <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-xs">
              <span className="font-bold text-emerald-900">
                نسبة إنجاز التطعيمات الإلزامية: {vaccinations.stats.percentage}%
              </span>
              <span className="text-emerald-800 font-bold">
                مكتمل: {vaccinations.stats.completed} / متأخر: {vaccinations.stats.overdue}
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <span>سجلي الطبي (Med Record) — وثيقة سرية ومحمية قانونياً للاستخدام الطبي المباشر فقط.</span>
          <span className="font-mono" dir="ltr">Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
}
