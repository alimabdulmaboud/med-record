"use client";

import Link from "next/link";
import { t } from "@/lib/i18n";
import { RemindersWorkspace } from "@/components/reminders/RemindersWorkspace";
import { ArrowLeft, Clock, Bell } from "lucide-react";

export default function ReceptionRemindersPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link
              href="/"
              className="hover:text-slate-800 transition-colors"
            >
              الرئيسية
            </Link>
            <span>/</span>
            <Link
              href="/reception"
              className="hover:text-slate-800 transition-colors flex items-center gap-1"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t("reception.title")}</span>
            </Link>
            <span>/</span>
            <span className="text-blue-600 font-bold">
              {t("reminders.title")}
            </span>
          </div>

          <Link
            href="/reception"
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            <span>العودة لطابور الاستقبال</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Reminders Workspace */}
        <RemindersWorkspace />
      </div>
    </main>
  );
}
