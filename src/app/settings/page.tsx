"use client";

import { useState } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { ClinicSettings, ClinicSettingsSchema } from "@/lib/settings/schema";
import {
  Building2,
  FileText,
  DollarSign,
  Layers,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Lock,
  ArrowLeft,
  LayoutDashboard,
  ShieldAlert,
  Download,
} from "lucide-react";
import { ClinicExportService } from "@/lib/export/service";

export default function ClinicSettingsPage() {
  // Current user role simulator (defaults to clinic_owner, toggleable to test read-only)
  const [currentUserRole, setCurrentUserRole] = useState<"clinic_owner" | "doctor" | "receptionist">("clinic_owner");
  const isOwner = currentUserRole === "clinic_owner";

  const [activeTab, setActiveTab] = useState<"general" | "pricing" | "modules" | "queue" | "export">("general");
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  // Form State initialized with realistic seeded clinic settings
  const [settings, setSettings] = useState<ClinicSettings>({
    name: "عيادة النور لطب الأطفال",
    letterhead: {
      address: "شارع مصطفى النحاس، مدينة نصر، القاهرة",
      phone: "+201012345678",
      logo_url: null,
      doctors: [
        {
          name: "د. تامر الشناوي",
          title: "استشاري طب الأطفال وحديثي الولادة",
          specialty: "طب أطفال",
        },
        {
          name: "د. سارة محمود",
          title: "أخصائي طب الأطفال",
          specialty: "رعاية حديثي الولادة",
        },
      ],
    },
    consultation_prices: {
      new: 350,
      follow_up: 180,
      quick_consult: 100,
    },
    enabled_modules: ["pediatrics"],
    queue: {
      arrive_before_minutes: 15,
      skip_alert_minutes: 60,
      urgent_enabled: false,
      urgent_fee_multiplier: 3,
      end_of_day_time: "22:00",
    },
  });

  const [showUrgentModal, setShowUrgentModal] = useState(false);
  const [urgentConfirmed, setUrgentConfirmed] = useState(false);
  const [pendingUrgentState, setPendingUrgentState] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState(false);

  // Urgent toggle handler
  const handleUrgentToggle = (checked: boolean) => {
    if (!isOwner) return;

    if (checked && !settings.queue.urgent_enabled) {
      // Opening modal for explicit confirmation
      setPendingUrgentState(true);
      setShowUrgentModal(true);
    } else {
      setSettings({
        ...settings,
        queue: {
          ...settings.queue,
          urgent_enabled: false,
        },
      });
      setUrgentConfirmed(false);
    }
  };

  const handleConfirmUrgent = () => {
    setUrgentConfirmed(true);
    setSettings({
      ...settings,
      queue: {
        ...settings.queue,
        urgent_enabled: true,
      },
    });
    setShowUrgentModal(false);
  };

  // Add / Remove Doctor for letterhead
  const handleAddDoctor = () => {
    if (!isOwner) return;
    setSettings({
      ...settings,
      letterhead: {
        ...settings.letterhead,
        doctors: [
          ...settings.letterhead.doctors,
          { name: "", title: "", specialty: "" },
        ],
      },
    });
  };

  const handleRemoveDoctor = (index: number) => {
    if (!isOwner) return;
    const updated = settings.letterhead.doctors.filter((_, i) => i !== index);
    setSettings({
      ...settings,
      letterhead: { ...settings.letterhead, doctors: updated },
    });
  };

  const handleDoctorChange = (index: number, field: "name" | "title" | "specialty", value: string) => {
    if (!isOwner) return;
    const updated = [...settings.letterhead.doctors];
    updated[index][field] = value;
    setSettings({
      ...settings,
      letterhead: { ...settings.letterhead, doctors: updated },
    });
  };

  // Module toggle
  const handleModuleToggle = (modId: "pediatrics" | "nutrition") => {
    if (!isOwner) return;
    const exists = settings.enabled_modules.includes(modId);
    const updated = exists
      ? settings.enabled_modules.filter((m) => m !== modId)
      : [...settings.enabled_modules, modId];

    setSettings({
      ...settings,
      enabled_modules: updated,
    });
  };

  // Submit Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isOwner) {
      setErrorMessage(t("settings.readOnlyNotice"));
      return;
    }

    // Validate with Zod
    const validation = ClinicSettingsSchema.safeParse(settings);
    if (!validation.success) {
      const errorText = validation.error.errors.map((err) => err.message).join(" • ");
      setErrorMessage(errorText);
      return;
    }

    setSuccessMessage(true);
    setTimeout(() => setSuccessMessage(false), 3000);
  };

  const handleExportJson = async () => {
    try {
      const exportService = new ClinicExportService();
      const res = await exportService.exportClinicData(
        { id: "owner-1", clinicId: "clinic-1", roles: ["clinic_owner"] },
        "clinic-1",
        settings.name
      );
      const blob = new Blob([JSON.stringify(res.json, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clinic_export_${new Date().toISOString().substring(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus("تم تصدير ملف JSON بنجاح وتوثيق الإجراء في سجل التدقيق.");
      setTimeout(() => setExportStatus(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "فشل تصدير البيانات");
    }
  };

  const handleExportCsv = async () => {
    try {
      const exportService = new ClinicExportService();
      const res = await exportService.exportClinicData(
        { id: "owner-1", clinicId: "clinic-1", roles: ["clinic_owner"] },
        "clinic-1",
        settings.name
      );
      const blob = new Blob([res.csvPatients], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clinic_patients_${new Date().toISOString().substring(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus("تم تصدير ملفات CSV بنجاح بتنسيق UTF-8 BOM للأكسيل.");
      setTimeout(() => setExportStatus(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "فشل تصدير البيانات");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-sm"
            >
              {t("app.name")}
            </Link>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                {t("settings.title")}
              </h1>
              <p className="text-xs text-slate-500 font-sans">
                {settings.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Role Perspective Simulator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs bg-slate-100 p-1 rounded-lg border border-slate-200">
              <span className="text-slate-500 px-1">معاينة كـ:</span>
              <button
                type="button"
                onClick={() => setCurrentUserRole("clinic_owner")}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  isOwner ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("roles.clinic_owner")}
              </button>
              <button
                type="button"
                onClick={() => setCurrentUserRole("doctor")}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  currentUserRole === "doctor" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("roles.doctor")}
              </button>
              <button
                type="button"
                onClick={() => setCurrentUserRole("receptionist")}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  currentUserRole === "receptionist" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("roles.receptionist")}
              </button>
            </div>

            <Link
              href="/"
              className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
              <span>{t("common.back")}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Read-Only Notice if not owner */}
        {!isOwner && (
          <div className="flex items-center gap-2 p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{t("settings.readOnlyNotice")}</span>
          </div>
        )}

        {/* Error and Success Alerts */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{t("settings.savedSuccess")}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "general"
                ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{t("settings.tabs.general")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pricing")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "pricing"
                ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>{t("settings.tabs.pricing")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("modules")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "modules"
                ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t("settings.tabs.modules")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "queue"
                ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{t("settings.tabs.queue")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "export"
                ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>تصدير البيانات (Open Export)</span>
          </button>
        </div>

        {/* Form Form Body */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* TAB 1: GENERAL & LETTERHEAD */}
          {activeTab === "general" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                {t("settings.letterhead.clinicName")} والترويسة المطبوعة
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t("settings.letterhead.clinicName")}
                  </label>
                  <input
                    type="text"
                    disabled={!isOwner}
                    required
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t("settings.letterhead.phone")}
                  </label>
                  <input
                    type="text"
                    disabled={!isOwner}
                    value={settings.letterhead.phone}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        letterhead: { ...settings.letterhead, phone: e.target.value },
                      })
                    }
                    dir="ltr"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50 text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t("settings.letterhead.address")}
                  </label>
                  <input
                    type="text"
                    disabled={!isOwner}
                    value={settings.letterhead.address}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        letterhead: { ...settings.letterhead, address: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Doctors for Letterhead */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">
                    {t("settings.letterhead.doctorsTitle")}
                  </h3>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={handleAddDoctor}
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold border border-blue-200 bg-blue-50/50 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t("settings.letterhead.addDoctor")}</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {settings.letterhead.doctors.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row gap-3 items-end"
                    >
                      <div className="flex-1 w-full space-y-1">
                        <label className="text-[11px] font-medium text-slate-600 block">
                          {t("settings.letterhead.doctorName")}
                        </label>
                        <input
                          type="text"
                          disabled={!isOwner}
                          value={doc.name}
                          onChange={(e) => handleDoctorChange(idx, "name", e.target.value)}
                          placeholder="د. اسم الطبيب"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white disabled:bg-slate-50"
                        />
                      </div>

                      <div className="flex-1 w-full space-y-1">
                        <label className="text-[11px] font-medium text-slate-600 block">
                          {t("settings.letterhead.doctorTitle")}
                        </label>
                        <input
                          type="text"
                          disabled={!isOwner}
                          value={doc.title}
                          onChange={(e) => handleDoctorChange(idx, "title", e.target.value)}
                          placeholder="استشاري / أخصائي..."
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white disabled:bg-slate-50"
                        />
                      </div>

                      <div className="flex-1 w-full space-y-1">
                        <label className="text-[11px] font-medium text-slate-600 block">
                          {t("settings.letterhead.doctorSpecialty")}
                        </label>
                        <input
                          type="text"
                          disabled={!isOwner}
                          value={doc.specialty}
                          onChange={(e) => handleDoctorChange(idx, "specialty", e.target.value)}
                          placeholder="طب أطفال / تغذية..."
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white disabled:bg-slate-50"
                        />
                      </div>

                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDoctor(idx)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                          title={t("settings.letterhead.removeDoctor")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRICING */}
          {activeTab === "pricing" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {t("settings.pricing.title")}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  تحدد هذه الأسعار القيمة الافتراضية للكشف عند تسجيل المريض في الاستقبال وحساب إيرادات العيادة.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t("settings.pricing.newPrice")}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      disabled={!isOwner}
                      value={settings.consultation_prices.new}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          consultation_prices: {
                            ...settings.consultation_prices,
                            new: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-mono font-bold text-blue-700 disabled:bg-slate-50"
                    />
                    <span className="text-xs text-slate-500 font-semibold">{t("settings.pricing.currency")}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t("settings.pricing.followUpPrice")}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      disabled={!isOwner}
                      value={settings.consultation_prices.follow_up}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          consultation_prices: {
                            ...settings.consultation_prices,
                            follow_up: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-mono font-bold text-blue-700 disabled:bg-slate-50"
                    />
                    <span className="text-xs text-slate-500 font-semibold">{t("settings.pricing.currency")}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t("settings.pricing.quickConsultPrice")}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      disabled={!isOwner}
                      value={settings.consultation_prices.quick_consult}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          consultation_prices: {
                            ...settings.consultation_prices,
                            quick_consult: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-mono font-bold text-blue-700 disabled:bg-slate-50"
                    />
                    <span className="text-xs text-slate-500 font-semibold">{t("settings.pricing.currency")}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SPECIALTY MODULES */}
          {activeTab === "modules" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {t("settings.modules.title")}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {t("settings.modules.desc")}
                </p>
              </div>

              <div className="space-y-3">
                {/* Core Module (Always Enabled) */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {t("modules.core.name")}
                      </span>
                      <span className="text-[11px] bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded font-bold">
                        دائم / Core
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {t("modules.core.description")}
                    </p>
                  </div>
                  <span className="text-xs text-blue-700 font-bold bg-white px-3 py-1.5 rounded-lg border border-blue-200">
                    مفعل دائماً
                  </span>
                </div>

                {/* Pediatrics Module */}
                <label className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors block">
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">
                      {t("modules.pediatrics.name")}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      {t("modules.pediatrics.description")}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!isOwner}
                    checked={settings.enabled_modules.includes("pediatrics")}
                    onChange={() => handleModuleToggle("pediatrics")}
                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </label>

                {/* Nutrition Module */}
                <label className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors block">
                  <div>
                    <span className="font-bold text-sm text-slate-900 block">
                      {t("modules.nutrition.name")}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      {t("modules.nutrition.description")}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!isOwner}
                    checked={settings.enabled_modules.includes("nutrition")}
                    onChange={() => handleModuleToggle("nutrition")}
                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: QUEUE RULES */}
          {activeTab === "queue" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {t("settings.queue.title")}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  تحدد هذه القواعد كيفية تعامل محرك الطابور مع المواعيد المسبقة، حالات التخطي، ونهاية اليوم.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t("settings.queue.arriveBefore")}
                  </label>
                  <p className="text-[11px] text-slate-500">
                    {t("settings.queue.arriveBeforeDesc")}
                  </p>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    disabled={!isOwner}
                    value={settings.queue.arrive_before_minutes}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        queue: {
                          ...settings.queue,
                          arrive_before_minutes: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-mono font-bold text-blue-700 disabled:bg-slate-50"
                  />
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t("settings.queue.skipAlert")}
                  </label>
                  <p className="text-[11px] text-slate-500">
                    {t("settings.queue.skipAlertDesc")}
                  </p>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    disabled={!isOwner}
                    value={settings.queue.skip_alert_minutes}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        queue: {
                          ...settings.queue,
                          skip_alert_minutes: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-mono font-bold text-blue-700 disabled:bg-slate-50"
                  />
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t("settings.queue.endOfDay")}
                  </label>
                  <p className="text-[11px] text-slate-500">
                    {t("settings.queue.endOfDayDesc")}
                  </p>
                  <input
                    type="text"
                    disabled={!isOwner}
                    value={settings.queue.end_of_day_time}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        queue: {
                          ...settings.queue,
                          end_of_day_time: e.target.value,
                        },
                      })
                    }
                    dir="ltr"
                    placeholder="22:00"
                    className="w-48 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-mono font-bold text-blue-700 disabled:bg-slate-50 text-right"
                  />
                </div>
              </div>

              {/* Paid Urgent Queue Section */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="p-5 border border-amber-200 bg-amber-50/40 rounded-xl space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="font-bold text-sm text-amber-950">
                          {t("settings.queue.urgentSection")}
                        </span>
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed">
                        {t("settings.queue.urgentDesc")}
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!isOwner}
                        checked={settings.queue.urgent_enabled}
                        onChange={(e) => handleUrgentToggle(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  {settings.queue.urgent_enabled && (
                    <div className="pt-3 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <label className="text-xs font-bold text-amber-950 block">
                          {t("settings.queue.urgentMultiplier")}
                        </label>
                        <span className="text-[11px] text-amber-800">
                          (سعر الكشف × المضاعف = رسوم الكشف المستعجل)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="10"
                          disabled={!isOwner}
                          value={settings.queue.urgent_fee_multiplier}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              queue: {
                                ...settings.queue,
                                urgent_fee_multiplier: parseFloat(e.target.value) || 1,
                              },
                            })
                          }
                          className="w-24 px-3 py-1.5 border border-amber-300 rounded-lg text-sm bg-white font-mono font-bold text-amber-900 text-center"
                        />
                        <span className="text-xs font-semibold text-amber-900">
                          {t("settings.queue.multiplierSuffix")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DATA EXPORT (Phase 15) */}
          {activeTab === "export" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-600" />
                  <span>تصدير بيانات العيادة (Open Data Export)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  حق المالك القانوني في تنزيل نسخة كاملة ومستقلة من سجلات عيادته بتنسيقات مفتوحة (JSON و CSV) متوافقة مع الأنظمة الأخرى.
                </p>
              </div>

              {exportStatus && (
                <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{exportStatus}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/60 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">JSON</span>
                    <span>ملف البيانات الشامل (Full Backup)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    يتضمن بيانات العيادة، إعداداتها، المرضى، المواعيد، وتاريخ الطابور في ملف JSON مهيكل.
                  </p>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>تنزيل ملف JSON</span>
                  </button>
                </div>

                <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/60 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <span className="font-mono text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">CSV</span>
                    <span>جداول البيانات للأكسيل (Excel CSV)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    جداول المرضى والمواعيد والطابور بترميز UTF-8 مع BOM لضمان عدم تلف الحروف العربية في برنامج Excel.
                  </p>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>تنزيل جداول CSV</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>ملاحظة أمنية ومطابقة للخصوصية:</strong> يتم توثيق كل عملية تصدير كاملة للبيانات تلقائياً في سجل العمليات والتدقيق (audit_log) لحماية خصوصية بيانات المرضى والعيادة.
                </p>
              </div>
            </div>
          )}

          {/* Action Footer */}
          {isOwner && (
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-xl text-sm shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{t("settings.saveChanges")}</span>
              </button>
            </div>
          )}
        </form>
      </main>

      {/* Urgent Confirmation Modal (Rule from PROJECT.md §6) */}
      {showUrgentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-700">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                {t("settings.queue.modal.title")}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-amber-50 p-4 rounded-xl border border-amber-200 text-justify">
              {t("settings.queue.modal.body")}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowUrgentModal(false);
                  setPendingUrgentState(false);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {t("settings.queue.modal.cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmUrgent}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors"
              >
                {t("settings.queue.modal.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
