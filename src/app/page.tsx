"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Heart,
  Users,
  Building2,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Stethoscope,
  FileText,
  Lock,
  Globe,
} from "lucide-react";

export default function EntryScreen() {
  const [lang, setLang] = useState<"ar" | "en">("ar");

  const toggleLanguage = () => {
    setLang(lang === "ar" ? "en" : "ar");
  };

  const isAr = lang === "ar";

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Top Bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20 font-black text-xl">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg md:text-xl tracking-tight text-teal-950 dark:text-teal-100">
                {isAr ? "ميد" : "Med"}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                Phase 1
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? "منظومة السجلات الصحية للعائلة والعيادات"
                : "Health Records System for Families & Clinics"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Globe className="w-3.5 h-3.5 text-teal-600" />
          <span>{isAr ? "English" : "العربية"}</span>
        </button>
      </header>

      {/* Main Choice Section */}
      <main className="max-w-4xl w-full mx-auto px-4 py-8 md:py-16 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100/80 dark:bg-teal-950/80 text-teal-800 dark:text-teal-200 text-xs font-bold mb-3 border border-teal-200 dark:border-teal-800">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>{isAr ? "مرحباً بك في منصة Med" : "Welcome to Med Platform"}</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
            {isAr
              ? "اختر مسار الدخول المناسب لك"
              : "Choose your path to enter"}
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            {isAr
              ? "نوفر فضاءً خاصاً بالعائلات لحفظ ومتابعة السجلات الصحية، وبوابة مغلقة مخصصة للكوادر الطبية والعيادات."
              : "We provide a private space for families to track health records, and an invitation-only gateway for clinics."}
          </p>
        </div>

        {/* The Two Worlds Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          
          {/* 1. Regular User / Family Space */}
          <div className="relative group bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border-2 border-teal-500/30 hover:border-teal-500 shadow-xl shadow-teal-500/5 transition-all flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isAr ? "مستخدم عادي (فضاء العائلة)" : "Regular User (Family Space)"}
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {isAr ? "تسجيل متاح" : "Open Signup"}
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                {isAr
                  ? "سجل حسابك مجاناً لتسجيل ومتابعة صحتك وصحة أطفالك: القياسات الحيوية، الحساسية، والأمراض المزمنة، مع أمان تام وعزل لبياناتك."
                  : "Register for free to track your family and children's vitals, allergies, and chronic conditions with complete privacy and data isolation."}
              </p>

              <div className="space-y-2 mb-8 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>{isAr ? "عزل مشدد لبيانات العائلة بقواعد RLS" : "Strict family tenant isolation"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>{isAr ? "متابعة أفراد الأسرة وإضافة بيانات الطوارئ" : "Emergency contacts & child profiles"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="/signup"
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>{isAr ? "إنشاء حساب عائلي جديد" : "Create Family Account"}</span>
                <ArrowLeft className={`w-4 h-4 ${isAr ? "" : "rotate-180"}`} />
              </Link>
              <Link
                href="/login"
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors"
              >
                <span>{isAr ? "لدي حساب بالفعل · تسجيل الدخول" : "Already have an account · Sign In"}</span>
              </Link>
            </div>
          </div>

          {/* 2. Health-system Party / Clinics Gateway */}
          <div className="relative group bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 hover:border-slate-400 shadow-sm transition-all flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Building2 className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isAr ? "طرف في منظومة صحية" : "Health-System Party"}
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {isAr ? "بدعوة فقط" : "Invitation Only"}
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                {isAr
                  ? "بوابة مخصصة للعيادات والمراكز الصحية (المدير، الطبيب، وموظف الاستقبال) لإدارة الحجوزات والطابور والكشوفات الطبية."
                  : "Dedicated gateway for clinic staff (managers, doctors, receptionists) to manage visits, queues, and clinical workflows."}
              </p>

              <div className="space-y-2 mb-8 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <span>{isAr ? "الدخول حصري بالدعوات المعتمدة فقط" : "Access strictly via authorized invites"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <span>{isAr ? "فصل كامل ومستقل عن سجلات العائلات" : "Completely separate from family records"}</span>
                </div>
              </div>
            </div>

            <div>
              <Link
                href="/clinic"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                <span>{isAr ? "الدخول كفريق عيادة أو مركز" : "Enter Clinic Gateway"}</span>
                <ArrowLeft className={`w-4 h-4 ${isAr ? "" : "rotate-180"}`} />
              </Link>
              <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-3">
                {isAr ? "لا يوجد تسجيل ذاتي لموظفي العيادات" : "No self-signup for clinic staff"}
              </div>
            </div>
          </div>

        </div>

        {/* Non-Diagnostic Tool Notice */}
        <div className="mt-12 text-center max-w-xl mx-auto p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {isAr
              ? "ملاحظة هامة: تطبيق Med أداة لتوثيق وحفظ السجلات الصحية والمتابعة الشخصية وليست أداة تشخيص طبي أو بديلاً عن الاستشارة الطبية المتخصصة."
              : "Important: Med is a personal health tracking and record-keeping tool, not a diagnostic tool or substitute for professional medical care."}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200/60 dark:border-slate-800/60">
        Med Health Platform · Phase 1: Family Space & Clinic Stub · 2026
      </footer>
    </div>
  );
}
