"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  verifyAndAccessSharedReport,
  type VerifySharedReportResult,
} from '@/lib/family/reports-service';
import { DoctorReportView } from '@/components/family/DoctorReportView';
import type { DoctorReportEntity } from '@/types/reports';
import {
  ShieldAlert,
  Clock,
  Lock,
  AlertTriangle,
  FileText,
  KeyRound,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function SharedReportPage() {
  const params = useParams();
  const token = params?.token as string;

  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<DoctorReportEntity | null>(null);
  const [pinRequired, setPinRequired] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [statusError, setStatusError] = useState<{ code: string; message: string } | null>(null);

  useEffect(() => {
    if (token) {
      loadReport(undefined);
    }
  }, [token]);

  const loadReport = async (pin?: string) => {
    try {
      setIsLoading(true);
      setPinError('');
      setStatusError(null);

      const res: VerifySharedReportResult = await verifyAndAccessSharedReport(token, pin);

      if (!res.success) {
        if (res.errorCode === 'PIN_REQUIRED') {
          setPinRequired(true);
          return;
        }
        if (res.errorCode === 'INVALID_PIN') {
          setPinError(res.errorAr || 'رمز PIN غير صحيح. يرجى المحاولة مرة أخرى.');
          return;
        }
        setStatusError({
          code: res.errorCode || 'ERROR',
          message: res.errorAr || 'تعذر تحميل التقرير الطبي.',
        });
        return;
      }

      setPinRequired(false);
      if (res.report) {
        setReport(res.report);
      } else {
        setStatusError({
          code: 'NOT_FOUND',
          message: 'لم يتم العثور على محتوى التقرير الطبي.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPin.trim()) return;
    loadReport(enteredPin.trim());
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans" dir="rtl">
      {/* Top Banner */}
      <header className="print:hidden bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-sm">
              MR
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 block leading-tight">سجلي الطبي • Med Record</span>
              <span className="text-[10px] text-slate-500">مشاركة تقرير سريري مؤمن للطبيب</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>رابط مشفر صالح لمدة 72 ساعة</span>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6">
        {isLoading && !pinRequired ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-600">جارٍ التحقق من صلاحية الرابط وتحميل التقرير الطبي...</p>
          </div>
        ) : statusError ? (
          <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-slate-900">تعذر فتح التقرير الطبي</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{statusError.message}</p>
            <div className="pt-2">
              <Link
                href="/family"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                <span>الانتقال للصفحة الرئيسية</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : pinRequired && !report ? (
          <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-5">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black text-slate-900">التقرير محمي برمز PIN سري</h2>
              <p className="text-xs text-slate-500">
                قام المريض بحماية هذا التقرير برمز سري. يرجى إدخال الرمز الممنوح لك من المريض.
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  الرمز السري (PIN):
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    required
                    value={enteredPin}
                    onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="أدخل الرمز المكون من 4 أرقام"
                    className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono tracking-widest focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {pinError && <p className="text-xs text-rose-600 font-bold mt-1.5">{pinError}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading || !enteredPin}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                {isLoading ? 'جارٍ التحقق...' : 'تأكيد الرمز وفتح التقرير'}
              </button>
            </form>
          </div>
        ) : report ? (
          <DoctorReportView report={report} isPublicView={true} />
        ) : null}
      </main>
    </div>
  );
}
