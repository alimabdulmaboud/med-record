"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Lock,
  Globe,
  Calendar,
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
                Phase 1 · 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? "منظومة السجلات الصحية للعائلة والعيادات"
                : "Health Records System for Families & Clinics"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/services"
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-600 transition-colors"
          >
            {isAr ? "الخدمات" : "Services"}
          </Link>
          <Link
            href="/faq"
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-600 transition-colors"
          >
            {isAr ? "الأسئلة الشائعة" : "FAQ"}
          </Link>
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            <span>{isAr ? "English" : "العربية"}</span>
          </button>
        </div>
      </header>

      {/* Main Choice Section */}
      <main className="max-w-4xl w-full mx-auto px-4 py-8 md:py-16 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/80 dark:bg-teal-950/80 text-teal-800 dark:text-teal-200 text-xs font-bold mb-3 border border-teal-200 dark:border-teal-800">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>{isAr ? "مرحباً بك في منصة Med" : "Welcome to Med Platform"}</span>
            <span className="text-teal-400">·</span>
            <div className="flex items-center gap-1 text-[11px] font-medium text-teal-700 dark:text-teal-300">
              <Calendar className="w-3 h-3 text-teal-600" />
              <span>{isAr ? "تاريخ آخر تحديث:" : "Last updated:"}</span>
              <time dateTime="2026-10-28" className="font-semibold underline decoration-teal-400">
                {isAr ? "28 أكتوبر 2026" : "October 28, 2026"}
              </time>
            </div>
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

        {/* The Two Portals Section with Question Headings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
          
          {/* 1. Family Portal */}
          <section className="relative group bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border-2 border-teal-500/30 hover:border-teal-500 shadow-xl shadow-teal-500/5 transition-all flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isAr ? "كيف تسجل في فضاء العائلة المجاني؟" : "How do you join the free Family Space?"}
                </h2>
              </div>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                {isAr
                  ? "يمكنك إنشاء حساب عائلي مجاناً بنسبة 100% (0 جنيه) للبدء فوراً في تسجيل المؤشرات الحيوية ونمو الأطفال وحفظ الوثائق الطبية. تضمن المنصة عزلاً كاملاً لبياناتك بقواعد RLS بحيث لا يطّلع عليها أي طرف إلا بمشاركتك الصريحة."
                  : "You can create a 100% free family account (0 EGP) to immediately log vitals, track child growth, and store encrypted medical records. Database-level RLS ensures your family health data is completely private and accessible only by you."}
              </p>

              <div className="space-y-2 mb-8 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>{isAr ? "عزل مشدد لبيانات العائلة بقواعد RLS" : "Strict family tenant isolation via RLS"}</span>
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
                <span>{isAr ? "إنشاء حساب عائلي جديد (مجاناً)" : "Create Family Account (Free)"}</span>
                <ArrowLeft className={`w-4 h-4 ${isAr ? "" : "rotate-180"}`} />
              </Link>
              <Link
                href="/login"
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-center transition-colors"
              >
                <span>{isAr ? "لدي حساب بالفعل · تسجيل الدخول" : "Already have an account · Sign In"}</span>
              </Link>
            </div>
          </section>

          {/* 2. Clinic Gateway */}
          <section className="relative group bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 hover:border-slate-400 shadow-sm transition-all flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Building2 className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isAr ? "كيف تعمل بوابة العيادات والمراكز الصحية؟" : "How does the Clinic Gateway work?"}
                </h2>
              </div>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                {isAr
                  ? "تعمل بوابة العيادات بنظام الدعوات المعتمدة فقط لإدارة المواعيد وطابور الانتظار المباشر وكشوفات الأطباء المكتوبة والروشتات. تتيح البوابة لفرق العمل الطبية تنظيم الكشوفات مع فصل كامل ومستقل عن سجلات العائلات غير المرتبطة بالعيادة."
                  : "The Clinic Gateway operates strictly via authorized invitations to manage appointments, live waiting queues, and structured doctor visits. It gives healthcare teams dedicated tools while maintaining strict segregation from unassociated family files."}
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
          </section>

        </div>

        {/* Section 3: Definition & Core Value */}
        <section className="mb-8 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2">
            {isAr
              ? "ما هي منصة سجلي الطبي (Med Record) وما المشكلة التي تحلها؟"
              : "What is Med Record and what problem does it solve?"}
          </h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {isAr
              ? "سجلي الطبي (Med Record) هي منصة صحية ثنائية اللغة انطلقت عام 2026 في القاهرة بمصر، تدمج بين فضاء مجاني لحفظ ومتابعة السجلات الصحية ونمو الأطفال للعائلات، ونظام سحابي متكامل لإدارة العيادات وكشوفات الأطباء. تحل المنصة مشكلة فقدان التاريخ الصحي وتشتت الفحوصات بين عدة عيادات ومستشفيات بتوفير سجل إلكتروني موحد يملكه المريض دائماً."
              : "Med Record is a bilingual healthcare SaaS platform launched in 2026 in Cairo, Egypt. It combines a free personal health space for families with a multi-clinic management system for healthcare providers. It solves medical data fragmentation by giving patients permanent, unified ownership of their clinical records and child development milestones."}
          </p>
        </section>

        {/* Section 4: Security & Privacy */}
        <section className="mb-8 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2">
            {isAr
              ? "كيف تحمي منصة Med Record خصوصية وسرية السجلات الطبية؟"
              : "How does Med Record protect patient privacy and clinical records?"}
          </h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {isAr
              ? "تعتمد المنصة عزلاً أمنياً صارماً على مستوى قاعدة بيانات PostgreSQL باستخدام سياسات Row Level Security (RLS) المشفرة. تمنع المنصة موظفي الاستقبال ومديري النظام العامين من قراءة الفحوصات أو الملاحظات الطبية، وتبقى كل عائلة معزولة تماماً في بيئة سحابية خاصة."
              : "The platform enforces tenant isolation through Row Level Security (RLS) in PostgreSQL. Receptionists and system administrators are technically restricted from accessing diagnostic or medical notes, ensuring full confidentiality for every household."}
          </p>
        </section>

        {/* Section 5: Pricing */}
        <section className="mb-8 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2">
            {isAr
              ? "كم تبلغ تكلفة استخدام منصة Med Record للأسر والعيادات؟"
              : "How much does Med Record cost for families and clinics?"}
          </h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {isAr
              ? "استخدام فضاء العائلة للأفراد والآباء مجاني بنسبة 100% (0 جنيه مصري) لجميع الميزات الأساسية لمتابعة المؤشرات ونمو الأطفال وحفظ الوثائق مدى الحياة. في المقابل، تعتمد بوابة العيادات والمراكز الطبية نموذج اشتراك سنوي مخصص يتيح إدارة الكشوفات والطوابير والروشتات وفق حجم العيادة."
              : "The Family Health Space is 100% free (0 EGP) for parents and individuals to log vitals, child growth, and documents with no hidden fees. Clinic management is provided via transparent annual B2B subscriptions tailored to healthcare facility size and queue volume."}
          </p>
        </section>

        {/* Non-Diagnostic Tool Notice */}
        <div className="mt-8 text-center max-w-xl mx-auto p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {isAr
              ? "ملاحظة هامة: تطبيق Med أداة لتوثيق وحفظ السجلات الصحية والمتابعة الشخصية وليست أداة تشخيص طبي أو بديلاً عن الاستشارة الطبية المتخصصة."
              : "Important: Med is a personal health tracking and record-keeping tool, not a diagnostic tool or substitute for professional medical care."}
          </p>
        </div>
      </main>

      {/* Footer with Visible Updated Date */}
      <footer className="py-6 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1">
        <div>
          Med Health Platform · Phase 1: Family Space & Clinic Stub · 2026 · Cairo, Egypt
        </div>
        <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
          <span>{isAr ? "تاريخ آخر تحديث:" : "Last updated:"}</span>
          <time dateTime="2026-10-28" className="font-medium text-slate-600 dark:text-slate-300">
            {isAr ? "28 أكتوبر 2026" : "October 28, 2026"}
          </time>
        </div>
      </footer>
    </div>
  );
}
