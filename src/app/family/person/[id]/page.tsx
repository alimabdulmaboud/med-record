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
  ShieldCheck,
  Phone,
  FileText,
  AlertCircle,
  Pill,
  Stethoscope,
} from "lucide-react";
import type { Person } from "@/types/family";
import type {
  PersonMeasurement,
  PersonVitalsSummary,
  MeasurementType,
} from "@/types/measurements";
import type { PersonDocument } from "@/types/documents";
import type {
  PersonMedication,
  PersonEncounter,
  CreateMedicationInput,
  UpdateMedicationInput,
  CreateEncounterInput,
  UpdateEncounterInput,
  MedicationStatus,
} from "@/types/medications-encounters";
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
import {
  getPersonMedications,
  getPersonEncounters,
  createPersonMedication,
  updatePersonMedication,
  setMedicationStatus,
  archivePersonMedication,
  createPersonEncounter,
  updatePersonEncounter,
  archivePersonEncounter,
  seedRealisticMockMedicationsAndEncounters,
} from "@/lib/family/medications-encounters-service";
import {
  getPersonVaccinationsSchedule,
  recordVaccineAdministered,
  seedRealisticMockVaccinations,
  type ScheduledVaccine,
  type MilestoneGroup,
  type VaccinationStats,
} from "@/lib/family/vaccinations-service";
import { calculatePersonAge } from "@/lib/family/service";
import { QuickLogModal } from "@/components/family/QuickLogModal";
import { MeasurementChart } from "@/components/family/MeasurementChart";
import { GrowthChart } from "@/components/family/GrowthChart";
import { DocumentVault } from "@/components/family/DocumentVault";
import { DocumentUploadModal } from "@/components/family/DocumentUploadModal";
import { MedicationModal } from "@/components/family/MedicationModal";
import { EncounterModal } from "@/components/family/EncounterModal";
import { MedicationsList } from "@/components/family/MedicationsList";
import { EncountersTimeline } from "@/components/family/EncountersTimeline";
import { VaccinationTracker } from "@/components/family/VaccinationTracker";
import { RecordVaccinationModal } from "@/components/family/RecordVaccinationModal";
import type { DoctorReportEntity, CreateDoctorReportInput } from "@/types/reports";
import {
  getPersonDoctorReports,
  createDoctorReport,
  generateReportShareLink,
  revokeReportShareLink,
  seedRealisticMockReports,
} from "@/lib/family/reports-service";
import { DoctorReportModal } from "@/components/family/DoctorReportModal";
import { DoctorReportView } from "@/components/family/DoctorReportView";
import { DoctorReportShareModal } from "@/components/family/DoctorReportShareModal";
import { SymptomTriageModal } from "@/components/med-record/SymptomTriageModal";
import type { FamilyMember, BloodType } from "@/types/med-record";
import { isDemoModeActive } from "@/lib/family/demo-service";

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
  const [activeTab, setActiveTab] = useState<
    | "vitals"
    | "growth"
    | "history"
    | "documents"
    | "medications"
    | "encounters"
    | "vaccinations"
    | "reports"
  >("vitals");

  const [reports, setReports] = useState<DoctorReportEntity[]>([]);
  const [activeReportToView, setActiveReportToView] = useState<DoctorReportEntity | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareModalReport, setShareModalReport] = useState<DoctorReportEntity | null>(null);

  const [medications, setMedications] = useState<PersonMedication[]>([]);
  const [encounters, setEncounters] = useState<PersonEncounter[]>([]);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<PersonMedication | null>(null);
  const [isEncounterModalOpen, setIsEncounterModalOpen] = useState(false);
  const [editingEncounter, setEditingEncounter] = useState<PersonEncounter | null>(null);

  const [vaccinationMilestones, setVaccinationMilestones] = useState<MilestoneGroup[]>([]);
  const [vaccinationStats, setVaccinationStats] = useState<VaccinationStats | null>(null);
  const [isRecordVaccineModalOpen, setIsRecordVaccineModalOpen] = useState(false);
  const [selectedVaccineForModal, setSelectedVaccineForModal] = useState<ScheduledVaccine | null>(null);
  const [isTriageModalOpen, setIsTriageModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("triage") === "true") {
        setIsTriageModalOpen(true);
      }
    }
  }, []);

  const toFamilyMember = (p: Person): FamilyMember => {
    const ageInfo = calculatePersonAge(p.birth_date);
    return {
      id: p.id,
      userId: p.linked_user_id || "demo-user",
      fullName: p.name,
      birthDate: p.birth_date,
      sex: p.sex,
      relationship: p.linked_user_id ? "self" : ageInfo.isChild ? "child" : "other",
      relationshipLabel: p.linked_user_id ? "أنا (صاحب الحساب)" : ageInfo.isChild ? "طفل" : "فرد أسرة",
      bloodType: (p.blood_type as BloodType) || "unknown",
      allergies: p.allergies || [],
      chronicConditions: p.chronic_conditions || [],
      createdAt: p.created_at,
    };
  };

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
      const ageCalc = calculatePersonAge(found.birth_date);

      // Seed mock measurements & documents ONLY if in active demo mode and viewing a demo member
      const isDemoActive = isDemoModeActive();
      const isDemoMember = INITIAL_DEMO_PEOPLE.some((p) => p.id === personId);

      if (isDemoActive && isDemoMember) {
        await seedRealisticMockMeasurements([found, ...INITIAL_DEMO_PEOPLE]);
        await seedRealisticMockDocuments([found, ...INITIAL_DEMO_PEOPLE]);

        await seedRealisticMockMedicationsAndEncounters(
          personId,
          found.family_id,
          ageCalc.years
        );
        await seedRealisticMockReports(found);
        if (ageCalc.isChild) {
          await seedRealisticMockVaccinations(personId, found.family_id, found.birth_date);
        }
      }

      // 2. Load measurements, documents, medications, encounters & summary
      const mList = await getPersonMeasurements(personId);
      setMeasurements(mList);

      const dList = await getPersonDocuments(personId);
      setDocuments(dList);

      const medsList = await getPersonMedications(personId);
      setMedications(medsList);

      const encsList = await getPersonEncounters(personId);
      setEncounters(encsList);

      const s = await getLatestVitalsSummary(personId);
      setSummary(s);

      const repList = await getPersonDoctorReports(personId);
      setReports(repList);
      if (repList.length > 0) {
        setActiveReportToView(repList[0]);
      }

      if (ageCalc.isChild) {
        const vacData = await getPersonVaccinationsSchedule(personId, found.birth_date);
        setVaccinationMilestones(vacData.milestones);
        setVaccinationStats(vacData.stats);
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

  const handleSaveMedication = async (
    data: CreateMedicationInput | UpdateMedicationInput,
    medicationId?: string
  ) => {
    if (medicationId) {
      await updatePersonMedication(medicationId, data as UpdateMedicationInput);
    } else {
      await createPersonMedication(data as CreateMedicationInput);
    }
    await loadData();
  };

  const handleStatusChangeMedication = async (
    id: string,
    status: MedicationStatus
  ) => {
    await setMedicationStatus(id, status);
    await loadData();
  };

  const handleArchiveMedication = async (id: string) => {
    await archivePersonMedication(id);
    await loadData();
  };

  const handleSaveEncounter = async (
    data: CreateEncounterInput | UpdateEncounterInput,
    encounterId?: string
  ) => {
    if (encounterId) {
      await updatePersonEncounter(encounterId, data as UpdateEncounterInput);
    } else {
      await createPersonEncounter(data as CreateEncounterInput);
    }
    await loadData();
  };

  const handleArchiveEncounter = async (id: string) => {
    await archivePersonEncounter(id);
    await loadData();
  };

  const handleSaveVaccination = async (data: {
    family_id: string;
    person_id: string;
    vaccine_code: string;
    vaccine_name: string;
    target_disease: string;
    dose_number: number;
    age_milestone_months: number;
    scheduled_date: string;
    administered_date: string;
    batch_number?: string;
    administered_by?: string;
    notes?: string;
  }) => {
    await recordVaccineAdministered(data);
    await loadData();
  };

  const handleOpenDoctorReportModal = () => {
    setIsReportModalOpen(true);
  };

  const handleGenerateDoctorReport = async (
    input: CreateDoctorReportInput
  ): Promise<DoctorReportEntity> => {
    if (!person) throw new Error("No person");
    const rep = await createDoctorReport(input, "usr-mgr", person);
    await loadData();
    setActiveReportToView(rep);
    setActiveTab("reports");
    return rep;
  };

  const handleOpenShareModal = (reportEntity: DoctorReportEntity) => {
    setShareModalReport(reportEntity);
    setIsShareModalOpen(true);
  };

  const handleCreateShareLink = async (
    reportId: string,
    hours: number,
    pin?: string
  ) => {
    if (!person) throw new Error("No person");
    const s = await generateReportShareLink(
      {
        family_id: person.family_id,
        person_id: person.id,
        report_id: reportId,
        expires_in_hours: hours,
        pin,
      },
      "usr-mgr"
    );
    return { accessToken: s.access_token, expiresAt: s.expires_at };
  };

  const handleRevokeShareLink = async (shareId: string) => {
    await revokeReportShareLink(shareId, "usr-mgr");
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
          <button
            type="button"
            onClick={() => setIsTriageModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-xs font-bold hover:bg-amber-100 transition-all cursor-pointer shadow-xs"
            title="فحص الأعراض والشكوى الحالية وتوجيه التخصص"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">فحص الأعراض (AI)</span>
          </button>
          <button
            type="button"
            onClick={handleOpenDoctorReportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">تقرير الطبيب (A4 / PDF)</span>
          </button>
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
        {isDemoModeActive() && INITIAL_DEMO_PEOPLE.some((p) => p.id === person.id) && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>تنبيه:</strong> هذا ملف تجريبي استرشادي ({person.name}). يمكنك تجربة تسجيل القياسات وإضافة الأدوية عليه، أو الرجوع لفضاء العائلة لمسحه والبدء بسجل عائلتك الحقيقي.
              </span>
            </div>
            <Link
              href="/family"
              className="inline-flex items-center gap-1 font-bold text-amber-800 dark:text-amber-300 underline underline-offset-4 shrink-0"
            >
              <span>إدارة البيانات / مسح التجريبي</span>
            </Link>
          </div>
        )}

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
              onClick={() => setIsTriageModalOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>فحص الأعراض والشكوى</span>
            </button>

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

          {age.isChild && (
            <button
              type="button"
              onClick={() => setActiveTab("vaccinations")}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "vaccinations"
                  ? "bg-purple-600 text-white shadow-sm shadow-purple-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                التطعيمات {vaccinationStats ? `(${vaccinationStats.completed}/${vaccinationStats.total})` : ""}
              </span>
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
            onClick={() => setActiveTab("medications")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "medications"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>الأدوية ({medications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("encounters")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "encounters"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>الكشوفات ({encounters.length})</span>
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

          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "reports"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>التقارير الطبية ({reports.length})</span>
          </button>
        </div>

        {/* Tab 1: Growth Curves (Child) */}
        {activeTab === "growth" && age.isChild && (
          <GrowthChart sex={person.sex} childName={person.name} records={measurements} />
        )}

        {/* Tab: Childhood Vaccinations */}
        {activeTab === "vaccinations" && age.isChild && vaccinationStats && (
          <VaccinationTracker
            milestones={vaccinationMilestones}
            stats={vaccinationStats}
            childName={person.name}
            onRecordVaccine={(vac) => {
              setSelectedVaccineForModal(vac);
              setIsRecordVaccineModalOpen(true);
            }}
          />
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

        {/* Tab: Medications */}
        {activeTab === "medications" && (
          <MedicationsList
            medications={medications}
            onAddMedication={() => {
              setEditingMedication(null);
              setIsMedicationModalOpen(true);
            }}
            onEditMedication={(med) => {
              setEditingMedication(med);
              setIsMedicationModalOpen(true);
            }}
            onStatusChange={handleStatusChangeMedication}
            onArchiveMedication={handleArchiveMedication}
          />
        )}

        {/* Tab: Encounters */}
        {activeTab === "encounters" && (
          <EncountersTimeline
            encounters={encounters}
            onAddEncounter={() => {
              setEditingEncounter(null);
              setIsEncounterModalOpen(true);
            }}
            onEditEncounter={(enc) => {
              setEditingEncounter(enc);
              setIsEncounterModalOpen(true);
            }}
            onArchiveEncounter={handleArchiveEncounter}
          />
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

        {/* Reports Tab Panel */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  التقارير الطبية وملخصات الزيارة (A4 / IPS)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  توليد تقرير طبي موحد وموجز لتقديمه للطبيب، مع إمكانية الطباعة أو مشاركة رابط مشفر ومؤقت.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenDoctorReportModal}
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء تقرير جديد</span>
              </button>
            </div>

            {reports.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <span className="text-xs font-bold text-slate-400 shrink-0">التقارير السابقة:</span>
                {reports.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveReportToView(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      activeReportToView?.id === r.id
                        ? "bg-emerald-600 text-white"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {r.title}
                  </button>
                ))}
              </div>
            )}

            {activeReportToView ? (
              <DoctorReportView
                report={activeReportToView}
                onShare={() => handleOpenShareModal(activeReportToView)}
              />
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200/80 dark:border-slate-800 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    لا يوجد تقرير طبي مولد حتى الآن
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                    يمكنك بنقرة واحدة توليد تقرير طبي متكامل يلخص القياسات والأدوية والاستشارات والتحاليل في صفحة A4 منظمة.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenDoctorReportModal}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>توليد تقرير طبي موجز للطبيب الآن</span>
                </button>
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

      {/* Medication Modal Trigger */}
      <MedicationModal
        isOpen={isMedicationModalOpen}
        onClose={() => {
          setIsMedicationModalOpen(false);
          setEditingMedication(null);
        }}
        onSave={handleSaveMedication}
        familyId={person.family_id}
        personId={person.id}
        initialMedication={editingMedication}
      />

      {/* Encounter Modal Trigger */}
      <EncounterModal
        isOpen={isEncounterModalOpen}
        onClose={() => {
          setIsEncounterModalOpen(false);
          setEditingEncounter(null);
        }}
        onSave={handleSaveEncounter}
        familyId={person.family_id}
        personId={person.id}
        initialEncounter={editingEncounter}
      />

      {/* Record Vaccination Modal Trigger */}
      <RecordVaccinationModal
        isOpen={isRecordVaccineModalOpen}
        onClose={() => {
          setIsRecordVaccineModalOpen(false);
          setSelectedVaccineForModal(null);
        }}
        vaccine={selectedVaccineForModal}
        familyId={person.family_id}
        personId={person.id}
        onSave={handleSaveVaccination}
      />

      {/* Doctor Report Modal Trigger */}
      <DoctorReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        person={person}
        onGenerateReport={handleGenerateDoctorReport}
      />

      {/* Doctor Report Share Modal Trigger */}
      {shareModalReport && (
        <DoctorReportShareModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setShareModalReport(null);
          }}
          reportId={shareModalReport.id}
          patientName={person.name}
          onCreateShare={handleCreateShareLink}
          onRevokeShare={handleRevokeShareLink}
        />
      )}

      {/* Symptom Triage Modal */}
      {person && (
        <SymptomTriageModal
          isOpen={isTriageModalOpen}
          onClose={() => setIsTriageModalOpen(false)}
          member={toFamilyMember(person)}
          onAssessmentSaved={async () => {
            await loadData();
          }}
        />
      )}
    </div>
  );
}
