"use client";

import React from 'react';
import type { CompiledDoctorReport } from '@/lib/med-record/report-compiler';
import { formatMeasurementValue } from '@/lib/med-record/quick-log-helper';
import {
  Activity,
  AlertTriangle,
  Pill,
  FileText,
  Calendar,
  ShieldAlert,
  Printer,
  Share2,
} from 'lucide-react';

interface DoctorReportPrintViewProps {
  report: CompiledDoctorReport;
  onPrint?: () => void;
  onShare?: () => void;
}

export function DoctorReportPrintView({
  report,
  onPrint,
  onShare,
}: DoctorReportPrintViewProps) {
  const { member, measurements, medications, encounters, documents } = report;

  // Calculate age
  const birthYear = new Date(member.birthDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const approxAge = currentYear - birthYear;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top Action Buttons (Hidden when printing) */}
      <div className="print:hidden flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-sm font-black text-slate-900">معاينة التقرير الطبي للطباعة والمشاركة</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            تنسيق A4 مخصص وموجز (1-2 صفحة) لتقديمه للطبيب المعالج
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onShare && (
            <button
              onClick={onShare}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-700" />
              <span>مشاركة رابط مؤقت للطبيب</span>
            </button>
          )}

          <button
            onClick={() => onPrint ? onPrint() : window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة / حفظ كـ PDF</span>
          </button>
        </div>
      </div>

      {/* A4 Paper Container */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-lg print:shadow-none print:border-none print:p-0 max-w-4xl mx-auto space-y-6 text-slate-900 font-sans print:m-0">
        {/* Document Letterhead */}
        <div className="border-b-2 border-emerald-700 pb-5 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-sm">
                MR
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 leading-tight">
                  الملخص الطبي للمريض • Patient Clinical Summary
                </h1>
                <p className="text-[11px] text-slate-500">
                  سجلي الطبي (Med Record) • معايير HL7 FHIR IPS الدولية
                </p>
              </div>
            </div>
          </div>

          <div className="text-left text-xs text-slate-500 font-mono" dir="ltr">
            <div>Generated: {report.generatedAt.split('T')[0]}</div>
            <div className="text-[10px] text-slate-400">Range: {report.dateRange.from} to {report.dateRange.to}</div>
          </div>
        </div>

        {/* Patient Demographics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block">اسم المريض</span>
            <span className="font-black text-slate-900 text-sm">{member.fullName}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">تاريخ الميلاد / العمر</span>
            <span className="font-bold text-slate-800">{member.birthDate} ({approxAge} سنة)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">النوع / الجنس</span>
            <span className="font-bold text-slate-800">{member.sex === 'male' ? 'ذكر' : 'أنثى'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">فصيلة الدم</span>
            <span className="font-black text-rose-700 text-sm">{member.bloodType}</span>
          </div>
        </div>

        {/* Critical Alerts: Allergies & Chronic Conditions */}
        {(member.allergies?.length || member.chronicConditions?.length) ? (
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-black text-rose-900 text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>تنبيهات الحساسية الدوائية والأمراض المزمنة (Critical Clinical Alerts)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {member.allergies && member.allergies.length > 0 && (
                <div>
                  <span className="font-bold text-rose-950 block text-[11px]">الحساسيات المعروفة:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {member.allergies.map((allergy, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-rose-200/60 text-rose-950 font-bold text-[11px]">
                        ⚠️ {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {member.chronicConditions && member.chronicConditions.length > 0 && (
                <div>
                  <span className="font-bold text-slate-900 block text-[11px]">الأمراض المزمنة المسجلة:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {member.chronicConditions.map((cond, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-800 font-semibold text-[11px]">
                        🩺 {cond}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Section 1: Active Medications */}
        {report.includedSections.includes('medications') && (
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide border-b pb-1 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-emerald-700" />
              <span>الأدوية الحالية المستمرة (Active Medications)</span>
            </h3>

            {medications.length === 0 ? (
              <p className="text-xs text-slate-400 py-1">لا توجد أدوية حالية مسجلة</p>
            ) : (
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="border-b text-slate-400 text-[10px]">
                    <th className="py-1.5">اسم الدواء</th>
                    <th className="py-1.5">الجرعة</th>
                    <th className="py-1.5">معدل التكرار</th>
                    <th className="py-1.5">تعليمات التناول</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medications.map(med => (
                    <tr key={med.id}>
                      <td className="py-2 font-black text-slate-900">{med.name}</td>
                      <td className="py-2 font-semibold text-slate-700">{med.dose}</td>
                      <td className="py-2 text-slate-700">{med.frequency}</td>
                      <td className="py-2 text-slate-500">{med.timingNotes || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Section 2: Recent Vital Measurements */}
        {report.includedSections.includes('vitals') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b pb-1">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-700" />
                <span>القياسات والمؤشرات الحيوية خلال الفترة (Recent Measurements)</span>
              </h3>
              {report.hasAbnormalVitals && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  يوجد قياسات خارج المعدل الطبيعي محددة باللون الأحمر
                </span>
              )}
            </div>

            {measurements.length === 0 ? (
              <p className="text-xs text-slate-400 py-1">لا توجد قياسات مسجلة في هذا النطاق الزمني</p>
            ) : (
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="border-b text-slate-400 text-[10px]">
                    <th className="py-1.5">التاريخ</th>
                    <th className="py-1.5">نوع القياس</th>
                    <th className="py-1.5">القيمة المسجلة</th>
                    <th className="py-1.5">الحالة الطبية</th>
                    <th className="py-1.5">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {measurements.slice(-8).map(m => {
                    const valStr = formatMeasurementValue(m.measurementType, m.values);
                    return (
                      <tr key={m.id} className={m.isAbnormal ? 'bg-rose-50/50' : ''}>
                        <td className="py-2 text-slate-500 text-[11px] font-mono">{m.recordedAt.split('T')[0]}</td>
                        <td className="py-2 font-bold text-slate-800">
                          {m.measurementType === 'blood_pressure'
                            ? 'ضغط الدم'
                            : m.measurementType === 'blood_sugar'
                            ? 'السكر بالدم'
                            : m.measurementType === 'heart_rate'
                            ? 'النبض'
                            : m.measurementType === 'oxygen_saturation'
                            ? 'الأكسجين SpO2'
                            : m.measurementType}
                        </td>
                        <td className="py-2 font-black text-slate-900">{valStr}</td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              m.isAbnormal
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {m.isAbnormal ? 'خارج المعدل ⚠️' : 'طبيعي'}
                          </span>
                        </td>
                        <td className="py-2 text-slate-500 text-[11px]">{m.notes || '--'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Section 3: Recent Consultations & Diagnoses */}
        {report.includedSections.includes('visits') && (
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide border-b pb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-700" />
              <span>الاستشارات والزيارات السابقة (Previous Consultations)</span>
            </h3>

            {encounters.length === 0 ? (
              <p className="text-xs text-slate-400 py-1">لا توجد زيارات مسجلة في هذا النطاق الزمني</p>
            ) : (
              <div className="space-y-2">
                {encounters.slice(0, 3).map(enc => (
                  <div key={enc.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{enc.doctorName} ({enc.specialty})</span>
                      <span className="text-slate-500 font-mono text-[10px]">{enc.visitDate}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-emerald-800">التشخيص: </span>
                      <span className="text-slate-800">{enc.diagnosis}</span>
                    </div>
                    {enc.notes && (
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {enc.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 4: Recent Labs & Radiology */}
        {report.includedSections.includes('labs') && (
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide border-b pb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-700" />
              <span>أحدث نتائج الفحوصات والتحاليل (Recent Diagnostics)</span>
            </h3>

            {documents.length === 0 ? (
              <p className="text-xs text-slate-400 py-1">لا توجد وثائق في هذا النطاق الزمني</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {documents.slice(0, 4).map(doc => (
                  <div key={doc.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 truncate">{doc.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0 mr-1">{doc.documentDate}</span>
                    </div>
                    {doc.facilityName && (
                      <div className="text-[10px] text-slate-500">{doc.facilityName}</div>
                    )}
                    {doc.extractedSummary && (
                      <p className="text-[10px] text-slate-600 line-clamp-2 mt-1 bg-white p-1.5 rounded border border-slate-100">
                        {doc.extractedSummary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary Notes if provided */}
        {report.summaryNotes && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-700 block">ملاحظات مخصصة للطبيب:</span>
            <p className="text-slate-800">{report.summaryNotes}</p>
          </div>
        )}

        {/* Medical Disclaimer & Print Footer */}
        <div className="pt-4 border-t border-slate-200 text-center space-y-1 text-[10px] text-slate-400">
          <p>
            تنويه قانوني وطبي: هذا التقرير هو وثيقة شخصية مستخرجة من مدخلات المريض، وتُقدم للطبيب المعالج لأغراض الاسترشاد فقط ولا تُعد تشخيصاً طبياً بديلاً.
          </p>
          <p dir="ltr">
            Med Record Personal Health System • Open Standards FHIR IPS Compliant • Verified Patient Data
          </p>
        </div>
      </div>
    </div>
  );
}
