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

export default function ClinicPortalPage() {
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
      desc: "د. سارة - كشف الأطفال، المخططات، الروشتات",
      badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
    },
    {
      category: t("home.pediatricsClinic"),
      role: t("roles.receptionist"),
      email: "reception.peds@med.local",
      desc: "مريم - حجز، تسجيل وصول، إدارة الطابور",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
    },
    {
      category: t("home.nutritionClinic"),
      role: t("roles.clinic_owner"),
      email: "owner.nutri@med.local",
      desc: "د. نور - مالكة عيادة التغذية وإعداداتها",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    {
      category: t("home.nutritionClinic"),
      role: t("roles.doctor"),
      email: "doctor.nutri@med.local",
      desc: "د. خالد - استشارات التغذية، الأنظمة الغذائية",
      badgeColor: "bg-green-100 text-green-800 border-green-200",
    },
    {
      category: t("home.nutritionClinic"),
      role: t("roles.receptionist"),
      email: "reception.nutri@med.local",
      desc: "سلمى - حجز، تسجيل وصول عيادة التغذية",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16" dir="rtl">
      {/* Top Banner */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                منصة Med — بوابة العيادات والأطباء
              </h1>
              <p className="text-xs text-slate-500">نظام إدارة العيادات والمراكز الطبية</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md border border-emerald-200 transition-colors"
            >
              ← الانتقال إلى تطبيق سجلي الطبي (Med Record)
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-medium rounded-md transition-colors"
            >
              <LogIn className="h-4 w-4" />
              {t("nav.login")}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">بوابة تسجيل دخول كوادر العيادات</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seedAccounts.map((acc, index) => (
              <div key={index} className="p-4 border rounded-lg bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600">{acc.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${acc.badgeColor}`}>
                      {acc.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{acc.desc}</p>
                  <p className="text-xs font-mono text-slate-800 bg-white p-1.5 rounded border mb-2">
                    {acc.email}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(acc.email)}
                    className="flex-1 text-xs py-1.5 px-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded flex items-center justify-center gap-1"
                  >
                    {copiedEmail === acc.email ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    نسخ البريد
                  </button>
                  <Link
                    href={`/login?email=${encodeURIComponent(acc.email)}`}
                    className="flex-1 text-xs py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center gap-1"
                  >
                    تسجيل الدخول
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
