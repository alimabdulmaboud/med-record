"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Trash2,
  UserPlus,
  AlertCircle,
  X,
  CheckCircle2,
  Info,
} from "lucide-react";
import { clearDemoData } from "@/lib/family/demo-service";

interface DemoNoticeBannerProps {
  onCleared: () => void;
}

export function DemoNoticeBanner({ onCleared }: DemoNoticeBannerProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleConfirmClear = () => {
    setClearing(true);
    try {
      clearDemoData();
      setIsConfirmOpen(false);
      onCleared();
    } catch (err) {
      console.error("Failed to clear demo data:", err);
      alert("حدث خطأ أثناء مسح البيانات التجريبية");
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <aside
        aria-label="تنبيه البيانات التجريبية"
        className="mb-6 rounded-3xl border border-amber-300 dark:border-amber-600/40 bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-amber-950/30 p-4 sm:p-5 shadow-sm text-slate-900 dark:text-slate-100 transition-all"
        dir="rtl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Text & Icon */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base text-amber-900 dark:text-amber-200">
                  تنبيه: أنت تتصفح حالياً بيانات استرشادية تجريبية (Demo Data)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
                  بيانات وهمية للتجربة
                </span>
              </div>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed max-w-2xl">
                هذه السجلات (عائلة أحمد مصطفى) مجهزة لتوضيح كيف يعمل السجل الصحي وتتبع القياسات، التطعيمات، والروشتات.
                يمكنك استعراضها لمعرفة كيف تعمل المنظومة، أو مسحها الآن للبدء بسجل نظيف وخاص بعائلتك.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>مسح البيانات التجريبية والبدء الآن</span>
            </button>

            <Link
              href="/family/person/new"
              className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 hover:bg-amber-100/50 dark:hover:bg-slate-800 text-amber-900 dark:text-amber-200 font-bold text-xs transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة فرد لعائلتي</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          dir="rtl"
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    تأكيد مسح البيانات التجريبية
                  </h3>
                  <p className="text-xs text-slate-500">
                    بدء سجل صحي حقيقي لعائلتك
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-xs text-slate-600 dark:text-slate-300 space-y-2 border border-slate-100 dark:border-slate-800">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                سيتم مسح ما يلي:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400 mr-1">
                <li>الملفات التجريبية (أحمد، سارة، ياسين).</li>
                <li>قياسات الضغط والسكر الوهمية.</li>
                <li>الروشتات والاستشارات والتطعيمات الاسترشادية.</li>
              </ul>
              <p className="text-[11px] text-teal-600 dark:text-teal-400 font-bold pt-1">
                ✓ سيصبح السجل الصحي فارغاً ونظيفاً تماماً وجاهزاً لإضافة أفراد أسرتك الحقيقيين.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={clearing}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                disabled={clearing}
                className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all"
              >
                {clearing ? (
                  <span>جاري المسح...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>نعم، امسح وابدأ بسجل عائلتي</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
