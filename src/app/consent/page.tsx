"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, AlertTriangle, CheckCircle, FileText, ArrowLeft } from "lucide-react";

export default function ConsentPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!agreed) return;
    setLoading(true);

    try {
      // Record consent timestamp
      const acceptedAt = new Date().toISOString();
      localStorage.setItem("med_consent_accepted_at", acceptedAt);
      document.cookie = `med_consent_accepted=true; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

      // Redirect to Family Space Home
      router.push("/family");
    } catch {
      alert("حدث خطأ أثناء حفظ الإقرار. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 rounded-3xl sm:px-10">
          
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold">
              إقرار الاستخدام وإخلاء المسؤولية الطبية
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              خطوة إلزامية لمرة واحدة قبل الدخول إلى فضاء العائلة
            </p>
          </div>

          {/* Core Notice Box */}
          <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-amber-950 dark:text-amber-200 space-y-3 mb-6">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>تنبيه طبي وقانوني هام</span>
            </div>
            <p className="text-xs md:text-sm leading-relaxed text-amber-900/90 dark:text-amber-100/90">
              منصة <strong>Med</strong> هي أداة رقمية شخصية مخصصة <strong>لحفظ السجلات الطبية وتوثيق القياسات والملفات الصحية للأسرة</strong>، وليست منصة تشخيص أو تقديم رعاية طبية طارئة أو بديلة عن مراجعة الطبيب المرخص.
            </p>
            <ul className="text-xs list-disc list-inside space-y-1.5 text-amber-900/80 dark:text-amber-200/80 pt-1">
              <li>أي مؤشرات أو أرقام أو رسوم بيانية تظهر في التطبيق هي لأغراض المتابعة الشخصية فقط.</li>
              <li>لا تبدأ أو توقف أي علاج أو دواء دون استشارة طبيبك المعالج مباشرة.</li>
              <li>في حالات الطوارئ الطبية الحرجة، يجب الاتصال بالإسعاف أو التوجه فوراً لأقرب مستشفى.</li>
            </ul>
          </div>

          {/* Explicit Consent Checkbox */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer shrink-0"
              />
              <span className="text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed select-none font-medium">
                أقر بأنني قرأت وفهمت أن تطبيق Med هو أداة توثيق شخصية وليس أداة تشخيص، وأوافق على شروط الاستخدام وسياسة الخصوصية وأتحمل مسؤولية البيانات التي أقوم بتسجيلها.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              disabled={!agreed || loading}
              onClick={handleAccept}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md shadow-teal-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>{loading ? "جاري تسجيل الإقرار..." : "موافق والمتابعة إلى فضاء العائلة"}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full py-2.5 px-4 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-center transition-colors"
            >
              إلغاء والعودة للبوابة الرئيسية
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
