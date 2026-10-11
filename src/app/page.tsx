"use client";

import { useState } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { getAllModules } from "@/modules/registry";
import {
  ShieldCheck,
  UserCheck,
  LogIn,
  MailCheck,
  Copy,
  Check,
  Stethoscope,
  Apple,
  Layers,
  ArrowLeft,
  KeyRound,
  Building2,
  Users,
  Clock,
  TrendingUp,
} from "lucide-react";

export default function HomePage() {
  const modules = getAllModules();
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const seedAccounts = [
    {
      category: t("home.platformSuperAdmin"),
      role: t("roles.platform_admin"),
      email: "admin@med.local",
      desc: "علي - إدارة العيادات والمشتركين والاشتراكات",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    },
    {
      category: t("home.pediatricsClinic"),
      role: t("roles.clinic_owner"),
      email: "owner.peds@med.local",
      desc: "د. تامر - مالك عيادة الأطفال وإعداداتها",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    },
    {
      category: t("home.pediatricsClinic"),
      role: t("roles.doctor"),
      email: "doctor.peds@med.local",
      desc: "د. سارة - كشف الأطفال ومنحنيات النمو",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
    },
    {
      category: t("home.pediatricsClinic"),
      role: t("roles.receptionist"),
      email: "reception.peds@med.local",
      desc: "مريم - حجز وإدارة طابور الانتظار",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    {
      category: t("home.nutritionClinic"),
      role: t("roles.clinic_owner"),
      email: "owner.nutrition@med.local",
      desc: "د. هاني - مالك مركز التغذية والتقارير",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
    },
    {
      category: t("home.nutritionClinic"),
      role: t("roles.doctor"),
      email: "doctor.nutrition@med.local",
      desc: "د. نورهان - التقييم الغذائي وخطط الوجبات",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    },
    {
      category: t("home.nutritionClinic"),
      role: t("roles.receptionist"),
      email: "reception.nutrition@med.local",
      desc: "يوسف - تسجيل المراجعين والطابور",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Main Hero Header */}
        <div className="text-center space-y-4 bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600 text-white font-bold text-3xl shadow-md">
            {t("app.name")}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t("app.tagline")}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t("app.description")}
          </p>

          {/* Quick Action Test Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl text-base shadow-sm hover:shadow transition-all"
            >
              <LogIn className="w-5 h-5" />
              <span>{t("home.openLogin")}</span>
              <ArrowLeft className="w-4 h-4 mr-1" />
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-xl text-base shadow-sm hover:shadow transition-all"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{t("admin.title")}</span>
            </Link>

            <Link
              href="/settings"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium py-3 px-6 rounded-xl text-base shadow-sm transition-all"
            >
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>{t("settings.title")}</span>
            </Link>

            <Link
              href="/patients"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium py-3 px-6 rounded-xl text-base shadow-sm transition-all"
            >
              <Users className="w-5 h-5 text-emerald-600" />
              <span>{t("patients.title")}</span>
            </Link>

            <Link
              href="/reception"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl text-base shadow-sm hover:shadow transition-all"
            >
              <Clock className="w-5 h-5" />
              <span>{t("reception.title")}</span>
            </Link>

            <Link
              href="/doctor"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-6 rounded-xl text-base shadow-sm hover:shadow transition-all"
            >
              <Stethoscope className="w-5 h-5" />
              <span>{t("doctor.title")}</span>
            </Link>

            <Link
              href="/owner/reports"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl text-base shadow-sm hover:shadow transition-all"
            >
              <TrendingUp className="w-5 h-5" />
              <span>{t("reports.title")}</span>
            </Link>

            <Link
              href="/invite/accept?token=dev-test-token-123"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium py-3 px-6 rounded-xl text-base shadow-sm transition-all"
            >
              <MailCheck className="w-5 h-5 text-blue-600" />
              <span>{t("home.openInvite")}</span>
            </Link>
          </div>

          {/* Security & System Readiness Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100 mt-6 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {t("home.securityStatus")}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 rounded-full font-medium">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              {t("home.invitationOnly")}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1 rounded-full font-medium font-mono">
              TZ: Africa/Cairo
            </span>
          </div>
        </div>

        {/* Ready Dev Seed Accounts Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-600" />
                {t("home.testAccountsTitle")}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {t("home.testAccountsDesc")}{" "}
                <code className="bg-slate-100 text-slate-900 font-mono px-2 py-0.5 rounded font-bold border border-slate-200">
                  Password123!
                </code>
              </p>
            </div>
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 self-start sm:self-auto"
            >
              <span>{t("auth.login")}</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seedAccounts.map((acc, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      {acc.category}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${acc.badgeColor}`}
                    >
                      {acc.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{acc.desc}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <span
                    className="font-mono text-xs text-slate-700 truncate select-all"
                    dir="ltr"
                  >
                    {acc.email}
                  </span>
                  <button
                    onClick={() => copyToClipboard(acc.email)}
                    title={t("home.copyCredentials")}
                    className="p-1.5 rounded-md hover:bg-white text-slate-500 hover:text-slate-800 border border-transparent hover:border-slate-200 transition-colors shrink-0"
                  >
                    {copiedEmail === acc.email ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modules Registry Showcase */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>{t("modules.core.name")} &amp; الوحدات التخصصية</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className="p-5 rounded-xl border border-slate-100 bg-slate-50/80 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {mod.id === "core" && (
                      <Layers className="w-5 h-5 text-blue-600" />
                    )}
                    {mod.id === "pediatrics" && (
                      <Stethoscope className="w-5 h-5 text-sky-600" />
                    )}
                    {mod.id === "nutrition" && (
                      <Apple className="w-5 h-5 text-emerald-600" />
                    )}
                    <span className="font-bold text-slate-900 text-sm">
                      {mod.name.ar}
                    </span>
                  </div>
                  {mod.isCore && (
                    <span className="text-xs bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded font-semibold">
                      Core
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {mod.description.ar}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
