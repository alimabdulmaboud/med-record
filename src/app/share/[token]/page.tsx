"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getMedRecordRepository } from '@/lib/med-record/repository';
import type { DoctorReport, FamilyMember, ReportShare } from '@/types/med-record';
import { formatMeasurementValue } from '@/lib/med-record/quick-log-helper';
import {
  ShieldAlert,
  Clock,
  Lock,
  Printer,
  AlertTriangle,
  FileText,
  Activity,
  Pill,
  Calendar,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

export default function SharedReportPage() {
  const params = useParams();
  const token = params?.token as string;

  const [isLoading, setIsLoading] = useState(true);
  const [shareData, setShareData] = useState<ReportShare | null>(null);
  const [report, setReport] = useState<DoctorReport | null>(null);
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [pinRequired, setPinRequired] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [statusError, setStatusError] = useState<{ code: string; message: string } | null>(null);

  const repo = getMedRecordRepository();

  useEffect(() => {
    if (token) {
      loadReport(undefined);
    }
  }, [token]);

  const loadReport = async (pin?: string) => {
    try {
      setIsLoading(true);
      setPinError('');

      // Find share record
      const share = repo['shares'].find((s: any) => s.accessToken === token);
      if (!share) {
        setStatusError({
          code: 'NOT_FOUND',
          message: 'رابط التقرير غير صحيح أو تم حذفه.',
        });
        return;
      }

      setShareData(share);

      if (share.isRevoked) {
        setStatusError({
          code: 'REVOKED',
          message: 'تم إلغاء صلاحية هذا الرابط من قبل المريض لأسباب أمنية.',
        });
        return;
      }

      if (new Date(share.expiresAt).getTime() < Date.now()) {
        setStatusError({
          code: 'EXPIRED',
          message: `انتهت صلاحية هذا الرابط في ${new Date(share.expiresAt).toLocaleString('ar-EG')}. يمكنك طلب رابط حديث من المريض.`,
        });
        return;
      }

      // Check PIN
      if (share.pinHash) {
        if (!pin) {
          setPinRequired(true);
          return;
        }
        if (share.pinHash !== pin) {
          setPinError('رمز PIN غير صحيح. يرجى التأكد من المريض.');
          return;
        }
      }

      // Successful verification
      const rep = await repo.getDoctorReport(share.reportId);
      if (!rep) {
        setStatusError({
          code: 'NOT_FOUND',
          message: 'لم يتم العثور على التقرير الطبي المطلوب.',
        });
        return;
      }

      const mem = await repo.getFamilyMember(rep.memberId);
      if (!mem) {
        setStatusError({
          code: 'NOT_FOUND',
          message: 'لم يتم العثور على ملف المريض.',
        });
        return;
      }

      setReport(rep);
      setMember(mem);
      setPinRequired(false);
      share.viewCount += 1;
      share.lastViewedAt = new Date().toISOString();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPin.trim()) {
      setPinError('يرجى إدخال رمز PIN');
      return;
    }
    loadReport(enteredPin.trim());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold">جاري التحقق من صلاحية رابط التقرير الطبي...</p>
        </div>
      </div>
    );
  }

  // Error States: Expired, Revoked, Not Found
  if (statusError) {
    return (
      <div className="min-h-screen bg-slate-100/60 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-slate-900">
            {statusError.code === 'EXPIRED'
              ? 'انتهت صلاحية الرابط'
              : statusError.code === 'REVOKED'
              ? 'تم إلغاء الرابط'
              : 'التقرير غير متاح'}
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {statusError.message}
          </p>
          <div className="pt-2">
            <span className="inline-block text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              سجلي الطبي • حماية خصوصية بيانات المرضى
            </span>
          </div>
        </div>
      </div>
    );
  }

  // PIN Prompt Screen
  if (pinRequired) {
    return (
      <div className="min-h-screen bg-slate-100/60 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-base font-black text-slate-900">
              هذا التقرير محمي برمز PIN
            </h2>
            <p className="text-xs text-slate-500">
              لحماية البيانات الطبية للمريض، يرجى إدخال رمز المرور السري المكون من 4 أرقام المزود من المريض
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={8}
                value={enteredPin}
                onChange={e => setEnteredPin(e.target.value)}
                placeholder="أدخل رمز PIN"
                autoFocus
                className="w-full text-center tracking-widest text-lg font-mono font-bold py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-emerald-600 focus:bg-white transition-all"
              />
              {pinError && (
                <p className="text-[11px] text-rose-600 font-bold mt-1.5 text-center">
                  {pinError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>فتح التقرير الطبي</span>
            </button>
          </form>

          <p className="text-[10px] text-center text-slate-500">
            سجلي الطبي • منصة السجل الطبي للأسرة
          </p>
        </div>
      </div>
    );
  }

  if (!report || !member) return null;

  const snapshot = report.snapshotData;
  const birthYear = new Date(member.birthDate).getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 font-sans text-slate-900" dir="rtl">
      {/* Top Banner (Hidden in print) */}
      <div className="print:hidden max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900">
              تقرير طبي معتمد للمعاينة الطبية (للقراءة فقط)
            </h1>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>
                صالح حتى: {shareData?.expiresAt ? new Date(shareData.expiresAt).toLocaleString('ar-EG') : '—'}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة التقرير (A4 / PDF)</span>
        </button>
      </div>

      {/* A4 Report Paper */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-lg print:shadow-none print:border-none print:p-0 space-y-6">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900">سجلي الطبي</span>
                <span className="text-xs font-bold text-slate-500 font-mono">Med Record</span>
              </div>
              <h2 className="text-sm font-bold text-slate-700 mt-1">
                تقرير طبي موجز للطبيب المعالج • Medical Summary for Doctor
              </h2>
            </div>
            <div className="text-left">
              <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full font-mono">
                SECURE READ-ONLY
              </span>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                {new Date(report.createdAt).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>
        </div>

        {/* Patient Demographic Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[11px] text-slate-500 block">اسم المريض (Patient):</span>
            <span className="font-bold text-slate-900 text-sm">{member.fullName}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">العمر والجنس (Age/Sex):</span>
            <span className="font-bold text-slate-800">
              {age} سنة ({member.sex === 'male' ? 'ذكر' : 'أنثى'})
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">فصيلة الدم (Blood Type):</span>
            <span className="font-bold text-rose-700 font-mono text-sm">
              {member.bloodType || 'غير محدد'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">نطاق الفحص (Date Range):</span>
            <span className="font-bold text-slate-800 font-mono text-[11px]">
              {report.dateFrom} ↔ {report.dateTo}
            </span>
          </div>
        </div>

        {/* Chief Complaint / Doctor Notes */}
        {report.summaryNotes && (
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 text-xs text-amber-950">
            <span className="font-bold block mb-1">
              ملاحظات المريض / سبب الزيارة (Reason for Consultation):
            </span>
            <p className="leading-relaxed">{report.summaryNotes}</p>
          </div>
        )}

        {/* Critical Alerts: Allergies & Chronic Conditions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200/70">
            <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>الحساسيات المعروفة (Allergies)</span>
            </div>
            {member.allergies && member.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {member.allergies.map((alg, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-white border border-rose-200 text-rose-900 rounded-lg text-xs font-bold"
                  >
                    ⚠️ {alg}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-medium">لا توجد حساسيات مسجلة</p>
            )}
          </div>

          <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200/70">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs mb-2">
              <Activity className="w-4 h-4 text-blue-700" />
              <span>الأمراض المزمنة (Chronic Conditions)</span>
            </div>
            {member.chronicConditions && member.chronicConditions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {member.chronicConditions.map((cond, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-white border border-blue-200 text-blue-900 rounded-lg text-xs font-bold"
                  >
                    {cond}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-medium">لا توجد أمراض مزمنة مسجلة</p>
            )}
          </div>
        </div>

        {/* Active Medications */}
        {snapshot.medications && snapshot.medications.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-emerald-700" />
              <span>الأدوية الحالية المنتظمة (Current Medications)</span>
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">اسم الدواء</th>
                    <th className="p-3">الجرعة</th>
                    <th className="p-3">التكرار</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {snapshot.medications.map(med => (
                    <tr key={med.id}>
                      <td className="p-3 font-bold text-slate-900">{med.name}</td>
                      <td className="p-3 text-slate-700 font-mono">{med.dose}</td>
                      <td className="p-3 text-slate-700">{med.frequency}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          نشط
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Measurements / Vitals */}
        {snapshot.measurements && snapshot.measurements.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-700" />
              <span>سجل القياسات والمؤشرات الحيوية (Vital Signs)</span>
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">التاريخ والوقت</th>
                    <th className="p-3">نوع القياس</th>
                    <th className="p-3">القيمة</th>
                    <th className="p-3">التقييم الطبي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {snapshot.measurements.slice(0, 10).map(m => (
                    <tr key={m.id} className={m.isAbnormal ? 'bg-amber-50/50' : ''}>
                      <td className="p-3 font-mono text-slate-600">
                        {new Date(m.recordedAt).toLocaleString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3 font-medium text-slate-900">
                        {m.measurementType === 'blood_pressure' && 'ضغط الدم'}
                        {m.measurementType === 'heart_rate' && 'نبض القلب'}
                        {m.measurementType === 'blood_sugar' && 'السكر في الدم'}
                        {m.measurementType === 'weight' && 'الوزن'}
                        {m.measurementType === 'height' && 'الطول'}
                        {m.measurementType === 'temperature' && 'درجة الحرارة'}
                        {m.measurementType === 'oxygen_saturation' && 'أكسجين الدم SpO2'}
                      </td>
                      <td className="p-3 font-bold font-mono text-slate-900">
                        {formatMeasurementValue(m.measurementType, m.values)} {m.unit}
                      </td>
                      <td className="p-3">
                        {m.isAbnormal ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            ⚠️ غير طبيعي
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            طبيعي
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Encounters */}
        {snapshot.encounters && snapshot.encounters.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>استشارات وزيارات الأطباء السابقة (Previous Consultations)</span>
            </h3>
            <div className="space-y-2">
              {snapshot.encounters.map(enc => (
                <div key={enc.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      د. {enc.doctorName} • {enc.specialty}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">{enc.visitDate}</span>
                  </div>
                  {enc.diagnosis && (
                    <p className="text-slate-700 mt-1">
                      <span className="font-bold text-slate-900">التشخيص:</span> {enc.diagnosis}
                    </p>
                  )}
                  {enc.notes && (
                    <p className="text-slate-500 text-[11px] mt-0.5">{enc.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer & Footer */}
        <div className="border-t border-slate-200 pt-4 text-center space-y-2">
          <p className="text-[10px] text-slate-500 leading-relaxed max-w-2xl mx-auto">
            إخلاء مسؤولية طبية: هذا التقرير مستخرج وموجز من السجل الطبي الإلكتروني للأسرة بغرض الاسترشاد ومساعدة الطبيب المعالج في اتخاذ القرار الطبي. لا يُعتبر هذا التقرير تشخيصاً نهائياً أو بديلاً عن الفحص الطبي السريري.
          </p>
          <p className="text-[10px] font-mono text-slate-500">
            سجلي الطبي (Med Record) • صُنع لحماية صحة الأسرة
          </p>
        </div>
      </div>
    </div>
  );
}
