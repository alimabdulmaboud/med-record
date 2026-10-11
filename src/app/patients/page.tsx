"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { calculateAgeFormatted } from "@/lib/patients/service";
import { Sex } from "@/lib/patients/types";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  UsersRound,
  Archive,
  RotateCcw,
  Edit3,
  ShieldCheck,
  ArrowLeft,
  X,
  UserCheck,
  User,
  HeartHandshake,
} from "lucide-react";

interface DisplayPatient {
  id: string;
  name: string;
  dateOfBirth: string;
  sex: Sex;
  notes?: string | null;
  archivedAt?: string | null;
  guardian: {
    id: string;
    name: string;
    phone: string;
    relationship: string;
  };
}

export default function PatientsPage() {
  // Mock initial patients representing realistic pediatric and nutrition clinics
  const [patients, setPatients] = useState<DisplayPatient[]>([
    {
      id: "pat-101",
      name: "عمر أحمد خليل",
      dateOfBirth: "2023-06-10",
      sex: "male",
      notes: "حساسية من البنسلين",
      archivedAt: null,
      guardian: {
        id: "guard-201",
        name: "أحمد خليل",
        phone: "+201011112222",
        relationship: "father",
      },
    },
    {
      id: "pat-102",
      name: "نور أحمد خليل",
      dateOfBirth: "2025-06-10",
      sex: "female",
      notes: "متابعة تطعيمات وتغذية",
      archivedAt: null,
      guardian: {
        id: "guard-201", // Shares the exact same guardian (Sibling)
        name: "أحمد خليل",
        phone: "+201011112222",
        relationship: "father",
      },
    },
    {
      id: "pat-103",
      name: "سارة إبراهيم الشريف",
      dateOfBirth: "1998-04-15",
      sex: "female",
      notes: "حمية غذائية رياضية (مركز التغذية)",
      archivedAt: null,
      guardian: {
        id: "guard-202",
        name: "سارة إبراهيم الشريف",
        phone: "+201055554444",
        relationship: "self",
      },
    },
    {
      id: "pat-104",
      name: "ياسين كريم شريف",
      dateOfBirth: "2021-11-20",
      sex: "male",
      notes: "ملف تم أرشفته سابقاً",
      archivedAt: "2026-09-01T10:00:00Z",
      guardian: {
        id: "guard-203",
        name: "كريم شريف",
        phone: "+201099998888",
        relationship: "father",
      },
    },
  ]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"active" | "archived" | "all">("active");

  // Registration modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    sex: "male" as Sex,
    notes: "",
    isSelf: false,
    guardianName: "",
    guardianPhone: "",
    relationship: "father",
    linkExistingGuardianId: null as string | null,
    allowDuplicate: false,
  });

  // Edit patient modal state
  const [editingPatient, setEditingPatient] = useState<DisplayPatient | null>(null);

  // Success message banner
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 3500);
  };

  // Live Sibling Detection based on entered guardian phone
  const detectedSiblings = useMemo(() => {
    const cleaned = formData.guardianPhone.trim().replace(/\s+/g, "");
    if (!cleaned || cleaned.length < 5) return [];

    return patients.filter((p) => {
      const pPhone = p.guardian.phone.trim().replace(/\s+/g, "");
      return pPhone === cleaned;
    });
  }, [formData.guardianPhone, patients]);

  // Live Duplicate Check: same name + same DOB + same phone
  const detectedDuplicate = useMemo(() => {
    if (!formData.name.trim() || !formData.dateOfBirth || !formData.guardianPhone.trim()) {
      return null;
    }
    const cleanPhone = formData.guardianPhone.trim().replace(/\s+/g, "");
    const cleanName = formData.name.trim().toLowerCase();

    return patients.find(
      (p) =>
        p.name.trim().toLowerCase() === cleanName &&
        p.dateOfBirth === formData.dateOfBirth &&
        p.guardian.phone.trim().replace(/\s+/g, "") === cleanPhone
    );
  }, [formData.name, formData.dateOfBirth, formData.guardianPhone, patients]);

  // Filtered patients list
  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return patients.filter((p) => {
      // Tab filter
      if (filterTab === "active" && p.archivedAt) return false;
      if (filterTab === "archived" && !p.archivedAt) return false;

      // Search query
      if (!q) return true;
      const matchesName = p.name.toLowerCase().includes(q);
      const matchesPhone = p.guardian.phone.includes(q);
      const matchesGuardian = p.guardian.name.toLowerCase().includes(q);

      return matchesName || matchesPhone || matchesGuardian;
    });
  }, [patients, searchQuery, filterTab]);

  // Calculate siblings count for a patient
  const getSiblingsCount = (patient: DisplayPatient) => {
    return patients.filter(
      (p) => p.guardian.id === patient.guardian.id && p.id !== patient.id
    ).length;
  };

  // Registration handler
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.dateOfBirth) return;
    if (!formData.isSelf && (!formData.guardianName.trim() || !formData.guardianPhone.trim())) return;

    if (detectedDuplicate && !formData.allowDuplicate) {
      return;
    }

    const guardianId =
      formData.linkExistingGuardianId ||
      (detectedSiblings.length > 0 ? detectedSiblings[0].guardian.id : `guard-${Date.now()}`);

    const newPatient: DisplayPatient = {
      id: `pat-${Date.now()}`,
      name: formData.name.trim(),
      dateOfBirth: formData.dateOfBirth,
      sex: formData.sex,
      notes: formData.notes.trim() || null,
      archivedAt: null,
      guardian: {
        id: guardianId,
        name: formData.isSelf ? formData.name.trim() : formData.guardianName.trim(),
        phone: formData.guardianPhone.trim(),
        relationship: formData.isSelf ? "self" : formData.relationship,
      },
    };

    setPatients([newPatient, ...patients]);
    setIsRegisterModalOpen(false);
    resetForm();
    showSuccess(t("patients.registeredSuccess"));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      dateOfBirth: "",
      sex: "male",
      notes: "",
      isSelf: false,
      guardianName: "",
      guardianPhone: "",
      relationship: "father",
      linkExistingGuardianId: null,
      allowDuplicate: false,
    });
  };

  // Archive / Soft-Delete (Rule #5)
  const handleArchive = (id: string) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, archivedAt: new Date().toISOString() } : p
      )
    );
    showSuccess(t("patients.archivePatient"));
  };

  // Restore Patient
  const handleRestore = (id: string) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, archivedAt: null } : p
      )
    );
    showSuccess(t("patients.restorePatient"));
  };

  // Edit Patient Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;

    setPatients((prev) =>
      prev.map((p) => (p.id === editingPatient.id ? editingPatient : p))
    );
    setEditingPatient(null);
    showSuccess(t("patients.updatedSuccess"));
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1 text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                <span>الرئيسية</span>
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-blue-600 font-medium text-sm">
                {t("patients.title")}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <span>{t("patients.title")}</span>
            </h1>
            <p className="text-sm text-slate-600">{t("patients.subtitle")}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                resetForm();
                setIsRegisterModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-xl shadow-sm hover:shadow transition-all"
            >
              <UserPlus className="w-5 h-5" />
              <span>{t("patients.registerNew")}</span>
            </button>
          </div>
        </div>

        {/* Privacy Notice (Rule #2: Medical privacy on reception views) */}
        <div className="flex items-start gap-3 bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">{t("patients.privacyNotice")}</p>
            <p className="text-xs text-blue-800">{t("patients.actionNotice")}</p>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successBanner && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Search & Tabs Controls */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                placeholder={t("patients.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-11 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start">
              <button
                onClick={() => setFilterTab("active")}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterTab === "active"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("patients.filterActive")} ({patients.filter((p) => !p.archivedAt).length})
              </button>
              <button
                onClick={() => setFilterTab("archived")}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterTab === "archived"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("patients.filterArchived")} ({patients.filter((p) => p.archivedAt).length})
              </button>
              <button
                onClick={() => setFilterTab("all")}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterTab === "all"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("patients.filterAll")} ({patients.length})
              </button>
            </div>
          </div>
        </div>

        {/* Patients List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-base font-medium text-slate-700">
                {t("patients.noResults")}
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterTab("all");
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                عرض كافة المراجعين المسجلين
              </button>
            </div>
          ) : (
            filteredPatients.map((patient) => {
              const age = calculateAgeFormatted(patient.dateOfBirth);
              const siblingsCount = getSiblingsCount(patient);
              const isArchived = Boolean(patient.archivedAt);

              return (
                <div
                  key={patient.id}
                  className={`bg-white rounded-2xl border p-5 transition-all shadow-sm flex flex-col justify-between ${
                    isArchived
                      ? "border-slate-300 bg-slate-50/70 opacity-80"
                      : "border-slate-200 hover:border-blue-300 hover:shadow-md"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header: Name, Gender & Age */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900">
                            {patient.name}
                          </h3>
                          {isArchived && (
                            <span className="text-[10px] font-medium bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                              {t("patients.filterArchived")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span
                            className={`px-2 py-0.5 rounded-md font-medium ${
                              patient.sex === "male"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-pink-50 text-pink-700"
                            }`}
                          >
                            {patient.sex === "male" ? t("patients.male") : t("patients.female")}
                          </span>
                          <span>•</span>
                          <span className="font-medium text-slate-700">
                            {t("patients.age")}: {age}
                          </span>
                        </div>
                      </div>

                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                        {patient.name.charAt(0)}
                      </div>
                    </div>

                    {/* DOB & Notes */}
                    <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t("patients.dob")}: {patient.dateOfBirth}</span>
                      </div>
                      {patient.notes && (
                        <div className="text-slate-500 line-clamp-2 pt-1 border-t border-slate-200/60 mt-1">
                          {patient.notes}
                        </div>
                      )}
                    </div>

                    {/* Guardian Info & Sibling Badge */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-1">
                          <HeartHandshake className="w-3.5 h-3.5 text-blue-500" />
                          <span>{patient.guardian.name}</span>
                          <span className="text-slate-400 font-normal">
                            (
                            {patient.guardian.relationship === "self"
                              ? t("patients.relSelf")
                              : patient.guardian.relationship === "father"
                              ? t("patients.relFather")
                              : patient.guardian.relationship === "mother"
                              ? t("patients.relMother")
                              : t("patients.relGuardian")}
                            )
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1.5 text-slate-600 font-mono" dir="ltr">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {patient.guardian.phone}
                        </span>

                        {siblingsCount > 0 && (
                          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-[11px] font-medium">
                            <UsersRound className="w-3 h-3 text-purple-600" />
                            <span>
                              {t("patients.siblingsCount", { count: String(siblingsCount) })}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => setEditingPatient(patient)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs inline-flex items-center gap-1"
                      title={t("patients.editPatient")}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{t("patients.editPatient")}</span>
                    </button>

                    {isArchived ? (
                      <button
                        onClick={() => handleRestore(patient.id)}
                        className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors text-xs inline-flex items-center gap-1"
                        title={t("patients.restorePatient")}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t("patients.restorePatient")}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleArchive(patient.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-xs inline-flex items-center gap-1"
                        title={t("patients.archivePatient")}
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>{t("patients.archivePatient")}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Registration Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-blue-600" />
                <span>{t("patients.registerNew")}</span>
              </h2>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              {/* Section 1: Patient Demographics */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <span>بيانات المريض الأساسية</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">
                      {t("patients.patientName")} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="الاسم الثلاثي أو الرباعي..."
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          name: e.target.value,
                          guardianName: formData.isSelf ? e.target.value : formData.guardianName,
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      {t("patients.dob")} *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                    {formData.dateOfBirth && (
                      <p className="text-[11px] text-blue-600 font-medium">
                        {t("patients.age")}: {calculateAgeFormatted(formData.dateOfBirth)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      {t("patients.sex")} *
                    </label>
                    <div className="flex gap-3 pt-1">
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="sex"
                          value="male"
                          checked={formData.sex === "male"}
                          onChange={() => setFormData({ ...formData, sex: "male" })}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>{t("patients.male")}</span>
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="sex"
                          value="female"
                          checked={formData.sex === "female"}
                          onChange={() => setFormData({ ...formData, sex: "female" })}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>{t("patients.female")}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("patients.notes")}
                  </label>
                  <input
                    type="text"
                    placeholder="ملاحظات الحجز أو التفضيلات..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Section 2: Guardian & Contact */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-blue-500" />
                    <span>{t("patients.guardianInfo")}</span>
                  </h3>

                  {/* Adult Self Checkbox */}
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formData.isSelf}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData({
                          ...formData,
                          isSelf: checked,
                          relationship: checked ? "self" : "father",
                          guardianName: checked ? formData.name : formData.guardianName,
                        });
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>{t("patients.isSelfContact")}</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Guardian Phone */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">
                      {t("patients.guardianPhone")} *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+201..."
                      value={formData.guardianPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, guardianPhone: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                      dir="ltr"
                    />
                  </div>

                  {/* LIVE SIBLING DISCOVERY ALERT */}
                  {detectedSiblings.length > 0 && (
                    <div className="sm:col-span-2 bg-purple-50 border border-purple-200 rounded-xl p-3.5 text-xs text-purple-900 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-purple-800">
                        <UsersRound className="w-4 h-4 text-purple-600" />
                        <span>{t("patients.siblingsDetected")}</span>
                      </div>
                      <p className="text-slate-600">
                        مسجل حالياً بهذا الرقم:{" "}
                        <span className="font-semibold text-purple-950">
                          {detectedSiblings.map((s) => s.name).join("، ")}
                        </span>{" "}
                        (ولي الأمر: {detectedSiblings[0].guardian.name})
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            guardianName: detectedSiblings[0].guardian.name,
                            relationship: detectedSiblings[0].guardian.relationship,
                            linkExistingGuardianId: detectedSiblings[0].guardian.id,
                          })
                        }
                        className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium px-3 py-1.5 rounded-lg shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{t("patients.linkToExisting")}</span>
                      </button>
                    </div>
                  )}

                  {!formData.isSelf && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          {t("patients.guardianName")} *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="اسم ولي الأمر..."
                          value={formData.guardianName}
                          onChange={(e) =>
                            setFormData({ ...formData, guardianName: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          {t("patients.relationship")}
                        </label>
                        <select
                          value={formData.relationship}
                          onChange={(e) =>
                            setFormData({ ...formData, relationship: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        >
                          <option value="father">{t("patients.relFather")}</option>
                          <option value="mother">{t("patients.relMother")}</option>
                          <option value="guardian">{t("patients.relGuardian")}</option>
                          <option value="other">{t("patients.relOther")}</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* LIVE DUPLICATE WARNING ALERT */}
              {detectedDuplicate && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{t("patients.duplicateWarning")}</span>
                  </div>
                  <p className="text-amber-800">
                    الملف المطابق: <strong>{detectedDuplicate.name}</strong> (تاريخ الميلاد: {detectedDuplicate.dateOfBirth})
                  </p>
                  <label className="inline-flex items-center gap-2 pt-1 font-semibold text-amber-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowDuplicate}
                      onChange={(e) =>
                        setFormData({ ...formData, allowDuplicate: e.target.checked })
                      }
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>{t("patients.confirmDuplicate")}</span>
                  </label>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  {t("patients.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={Boolean(detectedDuplicate && !formData.allowDuplicate)}
                  className="px-5 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl shadow-sm hover:shadow transition-all"
                >
                  {t("patients.savePatient")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Patient Demographics Modal */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>{t("patients.editPatient")}</span>
              </h2>
              <button
                onClick={() => setEditingPatient(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {t("patients.patientName")}
                </label>
                <input
                  type="text"
                  required
                  value={editingPatient.name}
                  onChange={(e) =>
                    setEditingPatient({ ...editingPatient, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("patients.dob")}
                  </label>
                  <input
                    type="date"
                    required
                    value={editingPatient.dateOfBirth}
                    onChange={(e) =>
                      setEditingPatient({ ...editingPatient, dateOfBirth: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("patients.sex")}
                  </label>
                  <select
                    value={editingPatient.sex}
                    onChange={(e) =>
                      setEditingPatient({ ...editingPatient, sex: e.target.value as Sex })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="male">{t("patients.male")}</option>
                    <option value="female">{t("patients.female")}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {t("patients.notes")}
                </label>
                <textarea
                  rows={3}
                  value={editingPatient.notes || ""}
                  onChange={(e) =>
                    setEditingPatient({ ...editingPatient, notes: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {t("patients.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
                >
                  {t("patients.saveChanges")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
