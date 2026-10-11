"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { UserRole } from "@/lib/invitations/types";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  DollarSign,
  AlertTriangle,
  Download,
  Filter,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  UserX,
  Zap,
  Building2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { SEED_REPORT_RECORDS } from "@/lib/reports/service";
import { computeOwnerReport, exportReportToCsv } from "@/lib/reports/engine";
import { ReportInputRecord } from "@/lib/reports/types";

export default function OwnerReportsPage() {
  // Current logged in actor simulation (Clinic Owner)
  const currentActor = {
    id: "owner-peds-1",
    clinicId: "clinic-pediatrics",
    clinicName: "عيادة الشروق لطب الأطفال",
    roles: ["clinic_owner" as UserRole],
  };

  // State
  const [period, setPeriod] = useState<"today" | "yesterday" | "last7Days" | "last30Days">("today");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("all");
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Doctors list for filter
  const doctorsList = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of SEED_REPORT_RECORDS) {
      if (r.doctorId && r.doctorName) {
        map.set(r.doctorId, r.doctorName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, []);

  // Filter records
  const filteredRecords = useMemo(() => {
    return SEED_REPORT_RECORDS.filter((r) => {
      if (selectedDoctorId !== "all" && r.doctorId !== selectedDoctorId) {
        return false;
      }
      return true;
    });
  }, [selectedDoctorId]);

  // Compute report summary
  const report = useMemo(() => {
    const periodLabelMap = {
      today: t("reports.filters.today"),
      yesterday: t("reports.filters.yesterday"),
      last7Days: t("reports.filters.last7Days"),
      last30Days: t("reports.filters.last30Days"),
    };
    return computeOwnerReport(filteredRecords, {
      clinicId: currentActor.clinicId,
      periodLabel: periodLabelMap[period],
      baseConsultationPrice: 300,
      urgentFeeMultiplier: 3,
    });
  }, [filteredRecords, currentActor.clinicId, period]);

  // Handle CSV Download
  const handleExportCsv = () => {
    const csvContent = exportReportToCsv(report);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `owner_report_${currentActor.clinicId}_${new Date().toISOString().substring(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
              >
                <span>{t("app.name")}</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </Link>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                {currentActor.clinicName}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <span>{t("reports.title")}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {t("reports.subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm shadow-sm hover:shadow transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{t("reports.exportCsv")}</span>
            </button>
            {downloadSuccess && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                تم تحميل ملف CSV بنجاح!
              </span>
            )}
          </div>
        </div>

        {/* Medical Privacy Banner (Rule #2) */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start sm:items-center gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-xs sm:text-sm text-amber-800 leading-relaxed font-medium">
            {t("reports.privacyBanner")}
          </p>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 ml-2 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              {t("reports.filters.period")}:
            </span>
            {(["today", "yesterday", "last7Days", "last30Days"] as const).map((pKey) => (
              <button
                key={pKey}
                onClick={() => setPeriod(pKey)}
                className={`text-xs font-medium px-3.5 py-1.5 rounded-lg border transition-all ${
                  period === pKey
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {t(`reports.filters.${pKey}`)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              {t("reports.filters.doctor")}:
            </span>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t("reports.filters.allDoctors")}</option>
              {doctorsList.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Top KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Patients Seen & Queue Total */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">{t("reports.kpis.patientsSeen")}</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {report.patientsSeenCount}
              </span>
              <span className="text-xs text-slate-400">
                من إجمالي {report.totalQueueEntries}
              </span>
            </div>
            <p className="text-xs text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
              <span>جديد: {report.newVisitsCount}</span>
              <span>متابعة: {report.followUpVisitsCount}</span>
            </p>
          </div>

          {/* Card 2: Waiting Time (Mean & Median) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">{t("reports.kpis.avgWaitTime")}</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {report.waitingTime.averageMinutes}
              </span>
              <span className="text-xs text-slate-500">دقيقة</span>
            </div>
            <p className="text-xs text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
              <span>{t("reports.kpis.medianWaitTime")}:</span>
              <span className="font-mono font-bold text-slate-700">
                {report.waitingTime.medianMinutes} دقيقة
              </span>
            </p>
          </div>

          {/* Card 3: Left Rate & Auto-Closed */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">{t("reports.kpis.leftRate")}</span>
              <UserX className="w-4 h-4 text-rose-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono">
                {report.leftBeforeSeen.leftRatePct}%
              </span>
              <span className="text-xs text-slate-400">
                ({report.leftBeforeSeen.totalLeft} مريض)
              </span>
            </div>
            <p className="text-xs text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
              <span>{t("reports.kpis.autoClosed")}:</span>
              <span className="font-mono font-bold text-slate-700">
                {report.leftBeforeSeen.autoClosedCount}
              </span>
            </p>
          </div>

          {/* Card 4: Appointment No-Show Rate */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">{t("reports.kpis.noShowRate")}</span>
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {report.appointmentNoShow.noShowRatePct}%
              </span>
              <span className="text-xs text-slate-400">
                ({report.appointmentNoShow.noShowCount} من {report.appointmentNoShow.totalAppointments})
              </span>
            </div>
            <p className="text-xs text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
              <span>نسبة الحضور:</span>
              <span className="font-mono font-bold text-emerald-600">
                {100 - report.appointmentNoShow.noShowRatePct}%
              </span>
            </p>
          </div>
        </div>

        {/* Second Row: Financial Performance & Lost Revenue */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 5: Paid Revenue & Collection Rate */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">{t("reports.kpis.paidTotal")}</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-700 font-mono">
                {report.billing.paidTotal.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">ج.م</span>
            </div>
            <div className="space-y-1 text-xs text-slate-500 border-t border-slate-100 pt-2">
              <div className="flex justify-between">
                <span>{t("reports.kpis.billedTotal")}:</span>
                <span className="font-mono">{report.billing.totalBilled.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span>{t("reports.kpis.unpaidTotal")}:</span>
                <span className="font-mono text-rose-600 font-bold">
                  {report.billing.unpaidTotal.toLocaleString()} ج.م
                </span>
              </div>
              <div className="flex justify-between pt-1 font-semibold text-slate-800">
                <span>{t("reports.kpis.collectionRate")}:</span>
                <span className="font-mono text-emerald-600">{report.billing.paidRatePct}%</span>
              </div>
            </div>
          </div>

          {/* Card 6: Estimated Lost Revenue (with clear disclaimer) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">{t("reports.kpis.lostRevenue")}</span>
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-600 font-mono">
                {report.lostRevenue.estimatedLostRevenue.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">ج.م تقديراً</span>
            </div>
            <div className="text-xs text-slate-500 border-t border-slate-100 pt-2 space-y-1">
              <p className="leading-relaxed text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100">
                {report.lostRevenue.disclaimer} ({report.leftBeforeSeen.totalLeft} حالة ×{" "}
                {report.lostRevenue.baseConsultationPrice} ج.م)
              </p>
            </div>
          </div>

          {/* Card 7: Paid Urgent Multiplier Volume */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold">{t("reports.kpis.urgentCount")}</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-600 font-mono">
                {report.paidUrgent.count}
              </span>
              <span className="text-xs text-slate-500">
                كشف مستعجل ({report.paidUrgent.sharePct}% من الإجمالي)
              </span>
            </div>
            <div className="text-xs text-slate-500 border-t border-slate-100 pt-2 space-y-1">
              <div className="flex justify-between">
                <span>الإيراد الإضافي من رسوم الاستعجال:</span>
                <span className="font-mono text-emerald-600 font-bold">
                  +{report.paidUrgent.estimatedExtraRevenue.toLocaleString()} ج.م
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                حسب تسعيرة رسوم الدخول المستعجل (3 أضعاف الكشف)
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Waiting Time by Hour (Line Chart) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>{t("reports.charts.waitingByHour")}</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">دقائق الانتظار</span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={report.waitingTime.byHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    stroke="#cbd5e1"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    stroke="#cbd5e1"
                    unit=" د"
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value} دقيقة`, "متوسط الانتظار"]}
                    labelFormatter={(label) => `الساعة ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgMinutes"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ fill: "#2563eb", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="متوسط الانتظار (دقيقة)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Visits & Revenue by Doctor (Bar Chart) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>{t("reports.charts.doctorVolume")}</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">كشوفات / إيراد</span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.doctorBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="doctorName"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    stroke="#cbd5e1"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    stroke="#cbd5e1"
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      if (name === "patientsSeen") return [`${value} حالة`, "الكشوفات"];
                      if (name === "paidTotal") return [`${value} ج.م`, "المحصل"];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="patientsSeen"
                    name="عدد الكشوفات"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="paidTotal"
                    name="المحصل (ج.م)"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Doctor Performance Breakdown Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>جدول أداء الأطباء والمتحصلات</span>
            </h2>
            <span className="text-xs text-slate-500">
              {report.doctorBreakdown.length} طبيب مسجل
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">{t("reports.doctorTable.doctor")}</th>
                  <th className="py-3 px-4 text-center">{t("reports.doctorTable.completed")}</th>
                  <th className="py-3 px-4 text-center">{t("reports.doctorTable.new")}</th>
                  <th className="py-3 px-4 text-center">{t("reports.doctorTable.followUp")}</th>
                  <th className="py-3 px-4 text-center">{t("reports.doctorTable.avgWait")}</th>
                  <th className="py-3 px-4 text-left">{t("reports.doctorTable.paid")}</th>
                  <th className="py-3 px-4 text-left">{t("reports.doctorTable.unpaid")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.doctorBreakdown.map((doc) => (
                  <tr key={doc.doctorId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{doc.doctorName}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-blue-600">
                      {doc.patientsSeen}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600">
                      {doc.newVisits}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600">
                      {doc.followUpVisits}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-amber-600 font-semibold">
                      {doc.avgWaitMinutes} د
                    </td>
                    <td className="py-3 px-4 text-left font-mono font-bold text-emerald-700">
                      {doc.paidTotal.toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 text-left font-mono text-rose-600 font-semibold">
                      {doc.unpaidTotal > 0 ? `${doc.unpaidTotal.toLocaleString()} ج.م` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Link back to Settings & Reception */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="text-blue-600 hover:text-blue-800 font-medium underline underline-offset-4"
            >
              {t("settings.title")}
            </Link>
            <span>•</span>
            <Link
              href="/reception"
              className="text-blue-600 hover:text-blue-800 font-medium underline underline-offset-4"
            >
              {t("reception.title")}
            </Link>
          </div>
          <span className="font-mono text-slate-400">Med SaaS — Aggregated Reports Engine v1.0</span>
        </div>
      </div>
    </main>
  );
}
