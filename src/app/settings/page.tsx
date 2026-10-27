"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/med-record/Header';
import { getMedRecordRepository } from '@/lib/med-record/repository';
import { DEMO_USER_ID } from '@/lib/med-record/mock-data';
import {
  exportUserDataAsJson,
  exportMeasurementsAsCsv,
  exportMedicationsAsCsv,
  exportEncountersAsCsv,
} from '@/lib/med-record/export-helper';
import type { FamilyMember } from '@/types/med-record';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  Trash2,
  ShieldCheck,
  Lock,
  Eye,
  AlertTriangle,
  ArrowRight,
  Info,
  CheckCircle2,
  HardDriveDownload,
  AlertOctagon,
} from 'lucide-react';

export default function SettingsPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string>('');
  const [isWiping, setIsWiping] = useState(false);
  const [isWiped, setIsWiped] = useState(false);
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(true);

  const repo = getMedRecordRepository();

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setIsMock(repo.isMockDataActive());
    const list = await repo.getFamilyMembers(DEMO_USER_ID);
    setMembers(list);
    if (list.length > 0) {
      const primary = list.find(m => m.isPrimary) || list[0];
      setActiveMemberId(primary.id);
    } else {
      setActiveMemberId('');
    }
  };

  const handleClearMock = async () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مسح كافة البيانات التجريبية والبدء بسجل حقيقي فارغ؟')) {
      await repo.clearAllMockData();
      setIsMock(false);
      setMembers([]);
      setActiveMemberId('');
      setExportSuccess('تم مسح البيانات التجريبية بنجاح! يمكنك الآن إضافة ملفاتك الحقيقية.');
      setTimeout(() => setExportSuccess(null), 4000);
    }
  };

  const handleRestoreMock = async () => {
    await repo.resetToMockData();
    setIsMock(true);
    await loadMembers();
    setExportSuccess('تمت استعادة البيانات التجريبية بنجاح.');
    setTimeout(() => setExportSuccess(null), 3000);
  };

  const handleDownloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = async () => {
    const jsonStr = await exportUserDataAsJson(DEMO_USER_ID, repo);
    const dateStr = new Date().toISOString().split('T')[0];
    handleDownloadFile(jsonStr, `med-record-export-${dateStr}.json`, 'application/json');
    setExportSuccess('تم تصدير السجل الطبي الكامل بصيغة JSON بنجاح');
    setTimeout(() => setExportSuccess(null), 3000);
  };

  const handleExportMeasurementsCsv = async () => {
    const list = await repo.getFamilyMembers(DEMO_USER_ID);
    const allMeas: any[] = [];
    for (const m of list) {
      const meas = await repo.getMeasurements(m.id);
      allMeas.push(...meas);
    }
    const csv = exportMeasurementsAsCsv(allMeas);
    const dateStr = new Date().toISOString().split('T')[0];
    handleDownloadFile(csv, `med-record-measurements-${dateStr}.csv`, 'text/csv;charset=utf-8;');
    setExportSuccess('تم تصدير ملف القياسات الحيوية CSV بنجاح');
    setTimeout(() => setExportSuccess(null), 3000);
  };

  const handleExportMedicationsCsv = async () => {
    const list = await repo.getFamilyMembers(DEMO_USER_ID);
    const allMeds: any[] = [];
    for (const m of list) {
      const meds = await repo.getMedications(m.id);
      allMeds.push(...meds);
    }
    const csv = exportMedicationsAsCsv(allMeds);
    const dateStr = new Date().toISOString().split('T')[0];
    handleDownloadFile(csv, `med-record-medications-${dateStr}.csv`, 'text/csv;charset=utf-8;');
    setExportSuccess('تم تصدير ملف الأدوية والعلاجات CSV بنجاح');
    setTimeout(() => setExportSuccess(null), 3000);
  };

  const handleExportEncountersCsv = async () => {
    const list = await repo.getFamilyMembers(DEMO_USER_ID);
    const allEncs: any[] = [];
    for (const m of list) {
      const encs = await repo.getEncounters(m.id);
      allEncs.push(...encs);
    }
    const csv = exportEncountersAsCsv(allEncs);
    const dateStr = new Date().toISOString().split('T')[0];
    handleDownloadFile(csv, `med-record-encounters-${dateStr}.csv`, 'text/csv;charset=utf-8;');
    setExportSuccess('تم تصدير سجل استشارات الأطباء CSV بنجاح');
    setTimeout(() => setExportSuccess(null), 3000);
  };

  const handleExecuteWipe = async () => {
    try {
      setIsWiping(true);
      await repo.deleteAllUserData(DEMO_USER_ID);
      setIsWiped(true);
      setShowWipeModal(false);
      setMembers([]);
      setActiveMemberId('');
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans" dir="rtl">
      <Header
        members={members}
        activeMemberId={activeMemberId}
        onSelectMember={setActiveMemberId}
      />

      <div className="max-w-4xl mx-auto px-4 pt-4 pb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للرئيسية</span>
        </Link>
      </div>

      <main className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Page Title */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-slate-900">
              إعدادات الخصوصية وسيادة البيانات الطبية
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              تحكم كامل في بياناتك وبيانات أسرتك: تصدير مفتوح، حماية مشددة، ومسح فوري عند الطلب
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Success Alert */}
        {exportSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-900 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{exportSuccess}</span>
          </div>
        )}

        {/* Demo Data Management Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
              <HardDriveDownload className="w-4 h-4 text-emerald-600" />
              <span>إدارة البيانات التجريبية والتخزين الدائم (Data Storage Mode)</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                isMock
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}
            >
              {isMock ? 'بيانات تجريبية (أحمد، سارة، ياسين)' : 'سجلك الطبي الحقيقي (محفوظ دائماً)'}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {isMock
              ? 'أنت تتصفح حالياً البيانات التجريبية للتعرف على وظائف النظام. يمكنك بضغطة واحدة مسح هذه البيانات والبدء بسجلك الحقيقي. كل ما تدخله بعد ذلك يُحفظ بشكل دائم في المتصفح وعلى القرص.'
              : 'النظام حالياً في وضع السجل الحقيقي. كافة الفحوصات والقياسات وأفراد الأسرة الذين تضيفهم يتم حفظهم واسترجاعهم تلقائياً في أي وقت.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {isMock ? (
              <button
                onClick={handleClearMock}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>مسح البيانات التجريبية والبدء بسجل حقيقي فارغ</span>
              </button>
            ) : (
              <button
                onClick={handleRestoreMock}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                استعادة البيانات التجريبية للتجربة
              </button>
            )}
          </div>
        </div>

        {/* Section 1: Data Sovereignty & Export */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-black text-sm border-b border-slate-100 pb-3">
            <HardDriveDownload className="w-4 h-4 text-emerald-600" />
            <span>تصدير البيانات وعدم الارتهان التقني (Data Portability)</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            بياناتك الصحية ملكك أنت وأسرتك بالكامل. يمكنك في أي وقت تنزيل نسخة رقمية موحدة متوافقة مع المعايير المفتوحة (HL7 FHIR / JSON) أو ملفات جداول ممتدة (CSV) لفتحها في Excel أو Google Sheets دون أي قيود.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleExportJson}
              className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-right flex items-start gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  تصدير السجل الكامل (JSON / FHIR)
                </span>
                <span className="text-[11px] text-slate-500">
                  كافة الحسابات، المؤشرات، الأدوية، الوثائق وسجل الزيارات بصيغة قياسية
                </span>
              </div>
            </button>

            <button
              onClick={handleExportMeasurementsCsv}
              className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-right flex items-start gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  تصدير القياسات الحيوية (CSV)
                </span>
                <span className="text-[11px] text-slate-500">
                  جدول قياسات الضغط، السكر، النبض، الحرارة والأكسجين مع التواريخ
                </span>
              </div>
            </button>

            <button
              onClick={handleExportMedicationsCsv}
              className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-right flex items-start gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  تصدير قائمة الأدوية (CSV)
                </span>
                <span className="text-[11px] text-slate-500">
                  سجل الأدوية الحالية والسابقة مع الجرعات والتكرار وأسماء الأطباء
                </span>
              </div>
            </button>

            <button
              onClick={handleExportEncountersCsv}
              className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-right flex items-start gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  تصدير استشارات الأطباء (CSV)
                </span>
                <span className="text-[11px] text-slate-500">
                  سجل الزيارات والعيادات والتشخيصات وتاريخ المتابعات
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Section 2: Privacy Architecture & Security Guarantees */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-black text-sm border-b border-slate-100 pb-3">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>معايير الأمان والخصوصية المطبقة (Security Architecture)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>عزل البيانات (RLS)</span>
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                قواعد أمان قاعدة البيانات (Row Level Security) تمنع أي مستخدم آخر من الوصول لبيانات أسرتك.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>خزينة الوثائق المشفرة</span>
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                ملفات التحاليل والأشعة لا تملك روابط عامة؛ يتم توليد روابط موقعة ومؤقتة تنتهي ذاتياً.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>حظر تسجيل البيانات الطبية</span>
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                لا يتم إرسال أو تخزين قيم المؤشرات الحيوية أو الأدوية في سجلات الخادم الخارجية (No Health Data Logging).
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Medical Disclaimer */}
        <div className="bg-amber-50/70 border border-amber-200/80 p-5 rounded-3xl space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <Info className="w-4 h-4 text-amber-700" />
            <span>إخلاء المسؤولية الطبية ونطاق استخدام التطبيق</span>
          </div>
          <p className="text-xs text-amber-950 leading-relaxed">
            منصة &quot;سجلي الطبي&quot; (Med Record) هي أداة إلكترونية لحفظ وأرشفة وتنظيم السجلات الصحية للأسرة وتسهيل التواصل مع الأطباء المعالجين. لا تُقدم هذه المنصة تشخيصات طبية آلية ولا تُعتبر بديلاً عن الاستشارة أو الفحص السريري من قبل الأطباء المتخصصين. في الحالات الطارئة، يرجى التوجه فوراً لأقرب مستشفى أو الاتصال بالإسعاف على الرقم 123.
          </p>
        </div>

        {/* Section 4: GDPR / Right to Erasure / Danger Zone */}
        <div className="bg-white p-6 rounded-3xl border border-rose-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-rose-700 font-black text-sm border-b border-rose-100 pb-3">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            <span>منطقة الخطر • مسح الحساب والبيانات نهائياً (GDPR Right to be Forgotten)</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            وفقاً لحق السيادة الكاملة على بياناتك، يمكنك بضغطة واحدة مسح حسابك وكافة سجلات أفراد أسرتك ووثائقهم من النظام نهائياً وبلا رجعة.
          </p>

          {isWiped ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-rose-600" />
              <span>تم مسح جميع بيانات الحساب وأفراد الأسرة نهائياً من قاعدة البيانات.</span>
            </div>
          ) : (
            <button
              onClick={() => setShowWipeModal(true)}
              className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>مسح جميع بياناتي وسجلاتي نهائياً</span>
            </button>
          )}
        </div>
      </main>

      {/* Wipe Confirmation Modal */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 border border-rose-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">
                تأكيد مسح كافة البيانات الصحية
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                هذا الإجراء سيقوم بحذف كافة السجلات، التحاليل، القياسات، وأفراد الأسرة بشكل دائم ولن يمكن استعادتها.
              </p>
            </div>

            <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200 text-center text-xs text-rose-900 font-bold">
              لتأكيد الحذف، اكتب كلمة <span className="underline font-mono">حذف نهائي</span> في الحقل أدناه:
            </div>

            <input
              type="text"
              value={wipeConfirmText}
              onChange={e => setWipeConfirmText(e.target.value)}
              placeholder="اكتب: حذف نهائي"
              className="w-full text-center text-xs font-bold p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-rose-600"
            />

            <div className="flex items-center gap-2 pt-2">
              <button
                disabled={wipeConfirmText.trim() !== 'حذف نهائي' || isWiping}
                onClick={handleExecuteWipe}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {isWiping ? 'جاري المسح...' : 'نعم، امسح كل بياناتي الآن'}
              </button>
              <button
                onClick={() => {
                  setShowWipeModal(false);
                  setWipeConfirmText('');
                }}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
