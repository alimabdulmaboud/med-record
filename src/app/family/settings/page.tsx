"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  Trash2,
  ArrowRight,
  ShieldAlert,
  Archive,
  RefreshCw,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Shield,
} from "lucide-react";
import type { Person } from "@/types/family";
import {
  exportComprehensiveFamilyCSV,
  type FamilyExportPayload,
} from "@/lib/family/export";

export default function FamilySettingsPage() {
  const router = useRouter();
  const [archivedPeople, setArchivedPeople] = useState<Person[]>([]);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("med_family_people");
      if (stored) {
        const people: Person[] = JSON.parse(stored);
        setArchivedPeople(people.filter((p) => Boolean(p.archived_at)));
      }
    } catch {
      // Ignore
    }
  }, []);

  const getFullExportPayload = (): FamilyExportPayload => {
    const parseKey = (key: string) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
      } catch {
        return [];
      }
    };

    const people: Person[] = parseKey("med_family_people");
    const measurements = parseKey("med_person_measurements");
    const documents = parseKey("med_person_documents");
    const medications = parseKey("med_family_person_medications");
    const encounters = parseKey("med_family_person_encounters");
    const vaccinations = parseKey("med_family_person_vaccinations");
    const doctor_reports = parseKey("med_family_doctor_reports");

    return {
      schema_version: "1.0",
      platform: "Med Health Records (فضاء العائلة)",
      exported_at: new Date().toISOString(),
      family: {
        id: "fam-export",
        name: "عائلتي",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      members: [],
      people,
      emergency_contacts: [],
      measurements,
      documents,
      medications,
      encounters,
      vaccinations,
      doctor_reports,
    };
  };

  const handleExportData = () => {
    setExporting(true);
    try {
      const exportPayload = getFullExportPayload();
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `med-family-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ text: "تم تصدير ملف بيانات العائلة الكامل بصيغة JSON بنجاح", type: "success" });
    } catch {
      setMessage({ text: "حدث خطأ أثناء تصدير البيانات", type: "error" });
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = () => {
    setExporting(true);
    try {
      const exportPayload = getFullExportPayload();
      const csvContent = exportComprehensiveFamilyCSV(exportPayload);
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `med-family-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ text: "تم تصدير ملف Excel / CSV المرمز بـ UTF-8 BOM بنجاح", type: "success" });
    } catch {
      setMessage({ text: "حدث خطأ أثناء تصدير ملف CSV", type: "error" });
    } finally {
      setExporting(false);
    }
  };

  const handleRestorePerson = (personId: string) => {
    try {
      const stored = localStorage.getItem("med_family_people");
      if (!stored) return;
      const people: Person[] = JSON.parse(stored);
      const updated = people.map((p) =>
        p.id === personId ? { ...p, archived_at: null } : p
      );
      localStorage.setItem("med_family_people", JSON.stringify(updated));
      setArchivedPeople(updated.filter((p) => Boolean(p.archived_at)));
      setMessage({ text: "تمت استعادة الفرد إلى القائمة الرئيسية بنجاح", type: "success" });
    } catch {
      setMessage({ text: "فشلت استعادة الفرد", type: "error" });
    }
  };

  const handleDeleteAllData = async () => {
    if (deleteConfirmationText !== "حذف بياناتي نهائيا") {
      alert('يرجى كتابة جملة التأكيد مطابقة تماماً: "حذف بياناتي نهائيا"');
      return;
    }

    setDeleting(true);
    try {
      localStorage.removeItem("med_family_people");
      localStorage.removeItem("med_person_measurements");
      localStorage.removeItem("med_person_documents");
      localStorage.removeItem("med_family_person_medications");
      localStorage.removeItem("med_family_person_encounters");
      localStorage.removeItem("med_family_person_vaccinations");
      localStorage.removeItem("med_family_doctor_reports");
      localStorage.removeItem("med_family_report_shares");
      localStorage.removeItem("med_user_name");
      localStorage.removeItem("med_user_email");
      localStorage.removeItem("med_consent_accepted_at");
      document.cookie = "med_auth_session=; path=/; max-age=0";
      document.cookie = "med_consent_accepted=; path=/; max-age=0";

      alert("تم حذف جميع بيانات حسابك العائلي وسجلاتك الصحية بنجاح.");
      router.push("/");
    } catch {
      alert("حدث خطأ أثناء محاولة الحذف");
    } finally {
      setDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">إعدادات الخصوصية والبيانات</h1>
            <p className="text-xs text-slate-500 mt-1">
              تحكم كامل في سجلاتك: التصدير بصيغة مفتوحة، إدارة المؤرشف، والحذف النهائي
            </p>
          </div>

          <Link
            href="/family"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50"
          >
            <span>العودة لفضاء العائلة</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {message && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* 1. Export My Data (JSON & Excel / CSV) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Download className="w-5 h-5 text-teal-600" />
              <span>تصدير بياناتي بالكامل (Data Sovereignty)</span>
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
              حمل نسخة احتياطية كاملة من سجلات أسرتك، الحساسيات، القياسات، الأدوية، الكشوفات، والتطعيمات بصيغة JSON المفتوحة أو ملفات Excel / CSV المرمزة بـ UTF-8 BOM.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              disabled={exporting}
              onClick={handleExportCSV}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{exporting ? "جاري التصدير..." : "تحميل Excel / CSV"}</span>
            </button>

            <button
              type="button"
              disabled={exporting}
              onClick={handleExportData}
              className="w-full sm:w-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? "جاري التصدير..." : "تحميل JSON"}</span>
            </button>
          </div>
        </div>

        {/* 2. Archived Members */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Archive className="w-5 h-5 text-slate-500" />
            <span>سجل الأفراد المؤرشفين</span>
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            وفقاً لمبادئ الخصوصية الطبية، لا يتم حذف الأفراد نهائياً لمنع فقدان التاريخ المرضي والتطعيمات، بل يُنقل الفرد للأرشيف ويمكن استعادته بأي وقت.
          </p>

          {archivedPeople.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-400 text-center">
              لا يوجد أي أفراد مؤرشفين حالياً في العائلة.
            </div>
          ) : (
            <div className="space-y-2">
              {archivedPeople.map((person) => (
                <div
                  key={person.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-bold">{person.name}</div>
                    <div className="text-[11px] text-slate-400">
                      تاريخ الأرشفة: {person.archived_at ? new Date(person.archived_at).toLocaleDateString("ar-EG") : "مؤرشف"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRestorePerson(person.id)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950 text-slate-700 dark:text-slate-300 hover:text-teal-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>استعادة</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Delete All My Data (Danger Zone) */}
        <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-3xl p-6 border border-rose-200 dark:border-rose-900/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>منطقة الخطر: حذف جميع بياناتي نهائياً</span>
            </h2>
            <p className="text-xs text-rose-800/80 dark:text-rose-300/80 leading-relaxed max-w-lg">
              حذف فوري وشامل لجميع سجلات أسرتك، الحساب، الإقرارات، والقياسات من قواعد البيانات بصورة غير قابلة للاسترجاع (Right to be Forgotten).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>حذف جميع البيانات</span>
          </button>
        </div>

      </div>

      {/* Strong Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-center text-rose-950 dark:text-rose-100 mb-2">
              تأكيد حذف الحساب والبيانات نهائياً
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed text-center mb-4">
              هذا الإجراء <strong>دائم ولا يمكن التراجع عنه</strong>. سيتم مسح كافة سجلات أفراد عائلتك وحسابك تماماً.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                لتأكيد الحذف، اكتب في المربع أدناه:{" "}
                <span className="font-mono text-rose-600 font-bold select-all">
                  حذف بياناتي نهائيا
                </span>
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="حذف بياناتي نهائيا"
                className="w-full px-3 py-2 text-sm rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-center font-bold"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={deleteConfirmationText !== "حذف بياناتي نهائيا" || deleting}
                onClick={handleDeleteAllData}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {deleting ? "جاري الحذف..." : "نعم، احذف بياناتي نهائياً"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationText("");
                }}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
