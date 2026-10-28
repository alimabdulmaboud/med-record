"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  User,
  Baby,
  Plus,
  Activity,
  Heart,
  Droplets,
  Wind,
  Thermometer,
  Scale,
  Ruler,
  AlertTriangle,
  Edit3,
  Trash2,
  Calendar,
  Sparkles,
  Shield,
  Phone,
  FileText,
  AlertCircle,
} from "lucide-react";
import type { Person } from "@/types/family";
import type {
  PersonMeasurement,
  PersonVitalsSummary,
  MeasurementType,
} from "@/types/measurements";
import type { PersonDocument } from "@/types/documents";
import {
  getPersonMeasurements,
  getLatestVitalsSummary,
  archivePersonMeasurement,
  seedRealisticMockMeasurements,
} from "@/lib/family/measurements-service";
import {
  getPersonDocuments,
  archivePersonDocument,
  seedRealisticMockDocuments,
} from "@/lib/family/documents-service";
import { calculatePersonAge } from "@/lib/family/service";
import { QuickLogModal } from "@/components/family/QuickLogModal";
import { MeasurementChart } from "@/components/family/MeasurementChart";
import { GrowthChart } from "@/components/family/GrowthChart";
import { DocumentVault } from "@/components/family/DocumentVault";
import { DocumentUploadModal } from "@/components/family/DocumentUploadModal";

const INITIAL_DEMO_PEOPLE: Person[] = [
  {
    id: "p-ahmed",
    family_id: "fam-demo",
    name: "أحمد مصطفى إبراهيم",
    birth_date: "1988-06-15",
    sex: "male",
    blood_type: "A+",
    allergies: ["بنسلين (Penicillin)"],
    chronic_conditions: ["ارتفاع ضغط الدم (Hypertension)"],
    phone_number: "+201012345678",
    linked_user_id: "usr-ahmed",
    notes: "متابعة دورية لقياسات الضغط",
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p-sara",
    family_id: "fam-demo",
    name: "سارة أحمد مصطفى",
    birth_date: "2021-04-10",
    sex: "female",
    blood_type: "A+",
    allergies: ["الفول السوداني (Peanuts)"],
    chronic_conditions: [],
    phone_number: null,
    linked_user_id: null,
    notes: "حساسية شديدة من الفول السوداني",
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p-yassin",
    family_id: "fam-demo",
    name: "ياسين أحمد مصطفى",
    birth_date: "2025-08-20",
    sex: "male",
    blood_type: "O+",
    allergies: [],
    chronic_conditions: [],
    phone_number: null,
    linked_user_id: null,
    notes: "متابعة جدول التطعيمات الإلزامية",
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function PersonHealthDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const personId = unwrappedParams.id;
  const router = useRouter();

  const [person, setPerson] = useState<Person | null>(null);
  const [measurements, setMeasurements] = useState<PersonMeasurement[]>([]);
  const [documents, setDocuments] = useState<PersonDocument[]>([]);
  const [summary, setSummary] = useState<PersonVitalsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [quickLogInitialType, setQuickLogInitialType] = useState<MeasurementType | undefined>();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [activeChartType, setActiveChartType] = useState<MeasurementType>("blood_pressure");
  const [activeTab, setActiveTab] = useState<"vitals" | "growth" | "history" | "documents">("vitals");

  useEffect(() => {
    loadData();
  }, [personId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Find person from localStorage or demo seed
      let found: Person | undefined;
      try {
        const stored = localStorage.getItem("med_family_people");
        if (stored) {
          const list: Person[] = JSON.parse(stored);
          found = list.find((p) => p.id === personId);
        }
      } catch {
        // ignore
      }

      if (!found) {
        found = INITIAL_DEMO_PEOPLE.find((p) => p.id === personId);
      }

      if (!found) {
        // fallback generic person
        found = {
          id: personId,
          family_id: "fam-demo",
          name: "فرد من العائلة",
          birth_date: "1995-01-01",
          sex: "male",
          blood_type: "unknown",
          allergies: [],
          chronic_conditions: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      setPerson(found);

      // Seed mock measurements & documents if empty
      await seedRealisticMockMeasurements([found, ...INITIAL_DEMO_PEOPLE]);
      await seedRealisticMockDocuments([found, ...INITIAL_DEMO_PEOPLE]);

      // 2. Load measurements, documents & summary
      const mList = await getPersonMeasurements(personId);
      setMeasurements(mList);

      const dList = await getPersonDocuments(personId);
      setDocuments(dList);

      const s = await getLatestVitalsSummary(personId);
      setSummary(s);

      const age = calculatePersonAge(found.birth_date);
      if (age.isChild) {
        setActiveTab("growth");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuickLog = (type?: MeasurementType) => {
    setQuickLogInitialType(type);
    setIsQuickLogOpen(true);
  };

  const handleQuickLogSuccess = async () => {
    await loadData();
  };

  const handleArchive = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه القراءة؟")) return;
    await archivePersonMeasurement(id);
    await loadData();
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستند؟ يمكنك استعادته لاحقاً.")) return;
    await archivePersonDocument(id);
    await loadData();
  };

  const handleUploadSuccess = async () => {
    await loadData();
  };

  if (loading || !person) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-slate-500" dir="rtl">
        <p className="animate-pulse font-bold text-sm">جاري تحميل الملف الصحي...</p>
      </div>
    );
  }

  const age = calculatePersonAge(person.birth_date);
  const isMale = person.sex === "male";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/10 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 pb-16" dir="rtl">
      {/* Top Navbar */}
      <header className="px-4 sm:px-8 py-4 border-b border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/family"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="العودة لفضاء العائلة"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              الملف الصحي الشخصي
            </h1>
            <p className="text-xs text-slate-500">
              {person.name} • {age.displayAr}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/emergency/${person.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold hover:bg-rose-100 transition-all"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">بطاقة الطوارئ</span>
          </Link>
          <Link
            href={`/family/person/${person.id}/edit`}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="تعديل البيانات الأساسية"
          >
            <Edit3 className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Profile Card & Action Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-md ${
                age.isChild
                  ? "bg-amber-500 shadow-amber-500/20"
                  : isMale
                  ? "bg-teal-600 shadow-teal-600/20"
                  : "bg-rose-500 shadow-rose-500/20"
              }`}
            >
              {age.isChild ? <Baby className="w-8 h-8" /> : <User className="w-8 h-8" />}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {person.name}
                </h2>
                {person.blood_type && person.blood_type !== "unknown" && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-extrabold text-xs">
                    {person.blood_type}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-teal-700 dark:text-teal-400">{age.displayAr}</span>
                <span>•</span>
                <span>{isMale ? "ذكر" : "أنثى"}</span>
                <span>•</span>
                <span>تاريخ الميلاد: {person.birth_date}</span>
              </div>

              {/* Allergy & Chronic Tags */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {person.allergies && person.allergies.length > 0 && (
                  <div className="flex items-center gap-1">
                    {person.allergies.map((a, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200"
                      >
                        حساسية: {a}
                      </span>
                    ))}
                  </div>
                )}
                {person.chronic_conditions && person.chronic_conditions.length > 0 && (
                  <div className="flex items-center gap-1">
                    {person.chronic_conditions.map((c, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Primary Quick Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-900 font-extrabold text-xs shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              <FileText className="w-4 h-4 text-teal-600" />
              <span>رفع مستند طبي</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenQuickLog()}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل قياس سريع (&lt; 10 ثوانٍ)</span>
            </button>
          </div>
        </div>

        {/* Abnormal Highlights Warning Banner */}
        {summary?.has_abnormal && (
          <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-sm text-rose-900 dark:text-rose-200">
                تنبيه سريري: تم رصد قراءات حيوية خارج النطاق الطبيعي
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">
                يرجى مراجعة القراءات الموضحة أدناه واستشارة الطبيب المختص عند استمرار الارتفاع أو الانخفاض.
              </p>
            </div>
          </div>
        )}

        {/* Latest Vitals Snapshot Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* BP */}
          <div
            onClick={() => handleOpenQuickLog("blood_pressure")}
            className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all shadow-xs"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500">ضغط الدم</span>
              <Activity className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {summary?.latest_bp ? (
                <span>
                  {summary.latest_bp.values.systolic}/{summary.latest_bp.values.diastolic}
                </span>
              ) : (
                <span className="text-slate-300 text-sm">--</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">mmHg</span>
            {summary?.latest_bp?.is_abnormal && (
              <span className="block mt-1 text-[9px] font-bold text-rose-600">مرتفع</span>
            )}
          </div>

          {/* Blood Glucose */}
          <div
            onClick={() => handleOpenQuickLog("blood_glucose")}
            className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all shadow-xs"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500">السكر</span>
              <Droplets className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {summary?.latest_glucose?.values.glucose ?? (
                <span className="text-slate-300 text-sm">--</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">mg/dL</span>
          </div>

          {/* Heart Rate */}
          <div
            onClick={() => handleOpenQuickLog("heart_rate")}
            className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all shadow-xs"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500">النبض</span>
              <Heart className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {summary?.latest_heart_rate?.values.heart_rate ?? (
                <span className="text-slate-300 text-sm">--</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">bpm</span>
          </div>

          {/* SpO2 */}
          <div
            onClick={() => handleOpenQuickLog("spo2")}
            className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all shadow-xs"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500">الأكسجين</span>
              <Wind className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {summary?.latest_spo2?.values.spo2 ? (
                `${summary.latest_spo2.values.spo2}%`
              ) : (
                <span className="text-slate-300 text-sm">--</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">SpO2</span>
          </div>

          {/* Temperature */}
          <div
            onClick={() => handleOpenQuickLog("temperature")}
            className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all shadow-xs"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500">الحرارة</span>
              <Thermometer className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {summary?.latest_temperature?.values.temperature_c ? (
                `${summary.latest_temperature.values.temperature_c}°`
              ) : (
                <span className="text-slate-300 text-sm">--</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">درجة مئوية</span>
          </div>

          {/* Weight */}
          <div
            onClick={() => handleOpenQuickLog(age.isChild ? "growth_entry" : "weight")}
            className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all shadow-xs"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500">الوزن</span>
              <Scale className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {summary?.latest_weight?.values.weight_kg ??
                summary?.latest_growth?.values.weight_kg ?? (
                  <span className="text-slate-300 text-sm">--</span>
                )}
            </div>
            <span className="text-[10px] text-slate-400">كجم</span>
            {summary?.latest_growth?.percentiles?.weight_for_age_percentile !== undefined && (
              <span className="block mt-1 text-[9px] font-bold text-purple-600">
                P{summary.latest_growth.percentiles.weight_for_age_percentile}
              </span>
            )}
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          {age.isChild && (
            <button
              type="button"
              onClick={() => setActiveTab("growth")}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                activeTab === "growth"
                  ? "bg-purple-600 text-white shadow-sm shadow-purple-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              منحنيات النمو الرسمية (WHO)
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("vitals")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "vitals"
                ? "bg-teal-600 text-white shadow-sm shadow-teal-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            مخططات القياسات الحيوية
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "documents"
                ? "bg-teal-600 text-white shadow-sm shadow-teal-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            المستندات والتحاليل ({documents.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "history"
                ? "bg-teal-600 text-white shadow-sm shadow-teal-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            سجل القراءات التاريخي ({measurements.length})
          </button>
        </div>

        {/* Tab 1: Growth Curves (Child) */}
        {activeTab === "growth" && age.isChild && (
          <GrowthChart sex={person.sex} childName={person.name} records={measurements} />
        )}

        {/* Tab 2: Vitals Charts */}
        {activeTab === "vitals" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  اتجاه القياسات الحيوية والنطاقات الطبيعية
                </h3>
                <p className="text-xs text-slate-500">
                  المساحة الخضراء المظللة تمثل النطاق الصحي الموصى به طبياً
                </p>
              </div>

              {/* Selector for chart vital type */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                {[
                  { id: "blood_pressure", label: "ضغط الدم" },
                  { id: "blood_glucose", label: "السكر" },
                  { id: "heart_rate", label: "النبض" },
                  { id: "spo2", label: "الأكسجين" },
                  { id: "temperature", label: "الحرارة" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveChartType(item.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeChartType === item.id
                        ? "bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-200 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <MeasurementChart type={activeChartType} measurements={measurements} />
          </div>
        )}

        {/* Tab 3: Medical Documents Vault */}
        {activeTab === "documents" && (
          <DocumentVault
            documents={documents}
            onUploadClick={() => setIsUploadModalOpen(true)}
            onDeleteDocument={handleDeleteDocument}
          />
        )}

        {/* Tab 4: History Table */}
        {activeTab === "history" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                جميع القراءات المسجلة
              </h3>
              <span className="text-xs text-slate-400">{measurements.length} قراءة</span>
            </div>

            {measurements.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                لا توجد قراءات مسجلة بعد.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5 font-bold">التاريخ والتوقيت</th>
                      <th className="p-3.5 font-bold">نوع القياس</th>
                      <th className="p-3.5 font-bold">القيمة والوحدة</th>
                      <th className="p-3.5 font-bold">الحالة والتقييم</th>
                      <th className="p-3.5 font-bold">ملاحظات</th>
                      <th className="p-3.5 font-bold text-center">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {measurements.map((m) => {
                      const d = new Date(m.recorded_at);
                      const dateStr = d.toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      let valueDisplay = "";
                      if (m.measurement_type === "blood_pressure") {
                        valueDisplay = `${m.values.systolic} / ${m.values.diastolic} ${m.unit}`;
                      } else if (m.measurement_type === "growth_entry") {
                        valueDisplay = `وزن: ${m.values.weight_kg ?? "--"} كجم • طول: ${m.values.height_cm ?? "--"} سم`;
                      } else if (m.measurement_type === "blood_glucose") {
                        valueDisplay = `${m.values.glucose} ${m.unit}`;
                      } else {
                        valueDisplay = `${m.values.heart_rate ?? m.values.spo2 ?? m.values.temperature_c ?? m.values.weight_kg ?? "--"} ${m.unit}`;
                      }

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <td className="p-3.5 text-slate-500 whitespace-nowrap">{dateStr}</td>
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                            {m.label_ar || m.measurement_type}
                          </td>
                          <td className="p-3.5 font-extrabold text-teal-800 dark:text-teal-300" dir="ltr">
                            {valueDisplay}
                          </td>
                          <td className="p-3.5">
                            {m.is_abnormal ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10px] border border-rose-200">
                                غير طبيعي
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200">
                                طبيعي
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-500 max-w-xs truncate">{m.notes || "-"}</td>
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleArchive(m.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="حذف القراءة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Legal Disclaimer */}
        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            سجلي الطبي أداة توثيق ومتابعة شخصية وليست بديلاً عن الاستشارة والتشخيص الطبي المباشر.
          </span>
        </div>
      </main>

      {/* Quick Log Modal Trigger */}
      <QuickLogModal
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        person={person}
        initialType={quickLogInitialType}
        onSuccess={handleQuickLogSuccess}
      />

      {/* Document Upload Modal Trigger */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        person={person}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
