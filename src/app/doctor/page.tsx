"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import {
  QueueClinicSettings,
  QueueEntry,
  QueuePriority,
} from "@/lib/queue/types";
import {
  computeQueueOrder,
  transitionQueueState,
} from "@/lib/queue/engine";
import {
  openPatientClinicalChart,
  saveVisitAndComplete,
  getClinicalTemplates,
  getAuditLogs,
  recordPrintPrescriptionAudit,
} from "@/lib/clinical/service";
import {
  PatientClinicalSummary,
  PrescriptionItem,
  Visit,
} from "@/lib/clinical/types";
import { PrintablePrescription } from "@/components/prescription/PrintablePrescription";
import { DrugCombobox } from "@/components/drugs/DrugCombobox";
import { isModuleEnabled } from "@/modules/registry";
import { getFullPediatricRecord } from "@/modules/pediatrics/service";
import { PediatricsWorkspace } from "@/components/pediatrics/PediatricsWorkspace";
import { getFullNutritionRecord } from "@/modules/nutrition/service";
import { NutritionWorkspace } from "@/components/nutrition/NutritionWorkspace";
import {
  Stethoscope,
  Users,
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  Pill,
  History,
  ShieldCheck,
  Calendar,
  Plus,
  Trash2,
  Printer,
  ChevronDown,
  Sparkles,
  ArrowRight,
  TrendingUp,
  HeartPulse,
  Thermometer,
  Radio,
  FileCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function DoctorDashboardPage() {
  const [mounted, setMounted] = useState(false);

  // Doctor session state
  const currentDoctor = useMemo(
    () => ({
      id: "doc-1",
      name: "د. تامر الشناوي",
      specialty: "استشاري طب الأطفال وحديثي الولادة",
      clinicId: "clinic-1",
      role: "doctor",
    }),
    []
  );

  // Queue settings
  const [settings] = useState<QueueClinicSettings>({
    arrive_before_minutes: 15,
    skip_alert_minutes: 60,
    urgent_enabled: true,
    urgent_fee_multiplier: 3,
    end_of_day_time: "22:00",
  });

  // Enabled modules for current clinic (pediatrics and nutrition enabled)
  const [clinicEnabledModules] = useState<string[]>(["pediatrics", "nutrition"]);

  // Seed / Live Queue Entries
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([
    {
      id: "q-101",
      clinicId: "clinic-1",
      patientId: "pat-1",
      patientName: "عمر أحمد خليل",
      doctorId: "doc-1",
      appointmentId: "apt-1",
      scheduledTime: "2026-10-10T11:00:00Z",
      arrivalTime: "2026-10-10T10:45:00Z",
      calledTime: "2026-10-10T11:15:00Z",
      consultationStartTime: "2026-10-10T11:15:00Z",
      completedTime: null,
      leftTime: null,
      state: "in_consultation",
      priority: "normal",
      orderIndex: 0,
      autoClosed: false,
      urgentMultiplier: 1,
      createdAt: "2026-10-10T10:45:00Z",
      updatedAt: "2026-10-10T11:15:00Z",
    },
    {
      id: "q-102",
      clinicId: "clinic-1",
      patientId: "pat-2",
      patientName: "ياسين كريم شريف",
      doctorId: "doc-1",
      appointmentId: null,
      scheduledTime: null,
      arrivalTime: "2026-10-10T10:10:00Z",
      calledTime: null,
      consultationStartTime: null,
      completedTime: null,
      leftTime: null,
      state: "waiting",
      priority: "normal",
      orderIndex: 1,
      autoClosed: false,
      urgentMultiplier: 1,
      createdAt: "2026-10-10T10:10:00Z",
      updatedAt: "2026-10-10T10:10:00Z",
    },
    {
      id: "q-103",
      clinicId: "clinic-1",
      patientId: "pat-3",
      patientName: "نور أحمد خليل",
      doctorId: "doc-1",
      appointmentId: "apt-2",
      scheduledTime: "2026-10-10T11:30:00Z",
      arrivalTime: "2026-10-10T11:10:00Z",
      calledTime: null,
      consultationStartTime: null,
      completedTime: null,
      leftTime: null,
      state: "waiting",
      priority: "normal",
      orderIndex: 2,
      autoClosed: false,
      urgentMultiplier: 1,
      createdAt: "2026-10-10T11:10:00Z",
      updatedAt: "2026-10-10T11:10:00Z",
    },
  ]);

  // Selected Active Patient and Clinical Summary
  const [selectedPatientId, setSelectedPatientId] = useState<string>("pat-1");
  const [activeQueueEntryId, setActiveQueueEntryId] = useState<string>("q-101");
  const [patientSummary, setPatientSummary] = useState<PatientClinicalSummary | null>(null);

  // Active visit form state
  const [visitType, setVisitType] = useState<"new" | "follow_up" | "consultation">("follow_up");
  const [chiefComplaint, setChiefComplaint] = useState<string>("سعال جاف متكرر وضيق بالتنفس ليلًا منذ 3 أيام");
  const [diagnosis, setDiagnosis] = useState<string>("نوبة ربو خفيفة مصاحبة لنزلة برد");
  const [price, setPrice] = useState<number>(300);
  const [isPaid, setIsPaid] = useState<boolean>(true);
  const [followUpDate, setFollowUpDate] = useState<string>("2026-10-18");
  const [visitNotes, setVisitNotes] = useState<string>("تحسن ملحوظ بعد جلسة الاستنشاق؛ الاستمرار على العلاج.");

  // Vital Signs Form
  const [weightKg, setWeightKg] = useState<string>("16.2");
  const [heightCm, setHeightCm] = useState<string>("103");
  const [tempC, setTempC] = useState<string>("37.1");
  const [pulseBpm, setPulseBpm] = useState<string>("94");
  const [systolicBp, setSystolicBp] = useState<string>("95");
  const [diastolicBp, setDiastolicBp] = useState<string>("60");
  const [spo2, setSpo2] = useState<string>("98");

  // Prescription Items
  const [prescriptionItems, setPrescriptionItems] = useState<Omit<PrescriptionItem, "id">[]>([
    {
      medicationName: "Ventolin Syrup",
      dose: "2.5 مل",
      frequency: "3 مرات يومياً",
      duration: "5 أيام",
      instructions: "بعد الأكل",
    },
    {
      medicationName: "Cetal Drops",
      dose: "15 نقطة",
      frequency: "عند اللزوم كل 6 ساعات",
      duration: "3 أيام",
      instructions: "لخفض الحرارة وتسكين الألم",
    },
  ]);

  // Alerts & Completion Modal
  const [bannerAlert, setBannerAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [completedModalOpen, setCompletedModalOpen] = useState(false);
  const [lastCompletedPatientName, setLastCompletedPatientName] = useState("");

  const showAlert = (type: "success" | "error", message: string) => {
    setBannerAlert({ type, message });
    setTimeout(() => setBannerAlert(null), 4000);
  };

  // Phase 10: Print Modal State & Letterhead
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printPaperSize, setPrintPaperSize] = useState<"A4" | "A5">("A5");
  const [prescriptionToPrint, setPrescriptionToPrint] = useState<{
    patient: { name: string; age?: string | number; gender?: string; patientId: string };
    visitDate: string;
    diagnosis?: string;
    items: Omit<PrescriptionItem, "id">[];
    advice?: string;
    followUpDate?: string;
    isReprint?: boolean;
  } | null>(null);

  const clinicLetterhead = useMemo(
    () => ({
      clinicName: "عيادات الأمل التخصصية",
      doctorName: currentDoctor.name,
      title: "استشاري",
      specialty: currentDoctor.specialty,
      phone: "+201012345678 - 0223456789",
      address: "15 شارع النصر، المعادي، القاهرة",
      logoUrl: null,
    }),
    [currentDoctor]
  );

  const handleOpenCurrentPrint = () => {
    setPrescriptionToPrint({
      patient: {
        name: patientSummary?.patientName || "المريض",
        age: "4 سنوات",
        gender: patientSummary?.gender || "طفل",
        patientId: selectedPatientId,
      },
      visitDate: new Date().toISOString(),
      diagnosis,
      items: prescriptionItems.filter((i) => i.medicationName.trim() !== ""),
      advice: visitNotes,
      followUpDate,
      isReprint: false,
    });
    setPrintModalOpen(true);
  };

  const handleReprintVisit = (vis: Visit) => {
    setPrescriptionToPrint({
      patient: {
        name: patientSummary?.patientName || "المريض",
        age: "4 سنوات",
        gender: patientSummary?.gender || "طفل",
        patientId: selectedPatientId,
      },
      visitDate: vis.visitDate,
      diagnosis: vis.diagnosis || undefined,
      items:
        vis.prescription?.items.map((i) => ({
          medicationName: i.medicationName,
          dose: i.dose,
          frequency: i.frequency,
          duration: i.duration,
          instructions: i.instructions,
        })) || [],
      advice: vis.notes || undefined,
      followUpDate: vis.followUpDate || undefined,
      isReprint: true,
    });
    setPrintModalOpen(true);
  };

  const handleTriggerPrint = () => {
    try {
      recordPrintPrescriptionAudit(
        { id: currentDoctor.id, role: currentDoctor.role, clinicId: currentDoctor.clinicId },
        selectedPatientId,
        `pr-${Date.now()}`,
        { isReprint: prescriptionToPrint?.isReprint, paperSize: printPaperSize }
      );
      showAlert(
        "success",
        prescriptionToPrint?.isReprint
          ? t("doctor.print.reprintedSuccess")
          : t("doctor.print.printedSuccess")
      );
      window.print();
    } catch (e: any) {
      showAlert("error", e.message || "حدث خطأ أثناء طباعة الروشتة.");
    }
  };

  // Broadcast channel for sync with /reception
  const broadcastUpdate = useCallback((newEntries: QueueEntry[]) => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const channel = new BroadcastChannel("med_live_queue_sync");
        channel.postMessage({ type: "QUEUE_UPDATE", entries: newEntries });
        channel.close();
      } catch (e) {
        console.error("BroadcastChannel error:", e);
      }
    }
  }, []);

  // Listen to queue sync events from reception
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel("med_live_queue_sync");

    channel.onmessage = (event) => {
      if (event.data?.type === "QUEUE_UPDATE") {
        setQueueEntries(event.data.entries);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  // Compute live queue using the pure engine
  const computedQueue = useMemo(() => {
    return computeQueueOrder(queueEntries, settings);
  }, [queueEntries, settings]);

  // Doctor's waiting patients
  const doctorWaitingQueue = useMemo(() => {
    return computedQueue.filter((e) => e.doctorId === currentDoctor.id && e.state === "waiting");
  }, [computedQueue, currentDoctor.id]);

  // Doctor's in-consultation patient
  const inConsultationEntry = useMemo(() => {
    return computedQueue.find((e) => e.doctorId === currentDoctor.id && e.state === "in_consultation");
  }, [computedQueue, currentDoctor.id]);

  // Load clinical chart with Rule #6 audit logging
  const loadPatientChart = useCallback(
    (patientId: string, queueEntryId?: string) => {
      try {
        const summary = openPatientClinicalChart(patientId, currentDoctor.clinicId, {
          id: currentDoctor.id,
          role: currentDoctor.role,
          clinicId: currentDoctor.clinicId,
        });
        setPatientSummary(summary);
        setSelectedPatientId(patientId);
        if (queueEntryId) {
          setActiveQueueEntryId(queueEntryId);
        }
      } catch (err: any) {
        showAlert("error", err.message || "حدث خطأ أثناء فتح الملف الطبي.");
      }
    },
    [currentDoctor]
  );

  // Initial load of current consultation patient
  useEffect(() => {
    if (inConsultationEntry) {
      loadPatientChart(inConsultationEntry.patientId, inConsultationEntry.id);
    } else if (selectedPatientId) {
      loadPatientChart(selectedPatientId);
    }
  }, [inConsultationEntry, loadPatientChart, selectedPatientId]);

  // Action: Call Next Patient (مناداة المريض التالي)
  const handleCallNext = () => {
    if (doctorWaitingQueue.length === 0) {
      showAlert("error", t("doctor.queue.noWaiting"));
      return;
    }

    const nextPatient = doctorWaitingQueue[0];
    try {
      // Transition next patient from 'waiting' to 'in_consultation'
      const transitionResult = transitionQueueState(
        nextPatient,
        "in_consultation",
        { id: currentDoctor.id, role: "doctor" },
        { reason: "Doctor called next patient into consultation room" }
      );

      const now = new Date().toISOString();
      const updatedEntries = queueEntries.map((e) => {
        if (e.id === nextPatient.id) {
          return {
            ...transitionResult.updatedEntry,
            consultationStartTime: now,
            calledTime: now,
          };
        }
        return e;
      });

      setQueueEntries(updatedEntries);
      broadcastUpdate(updatedEntries);

      // Open clinical record and log audit
      loadPatientChart(nextPatient.patientId, nextPatient.id);
      showAlert("success", `تمت مناداة المريض ${nextPatient.patientName} بنجاح.`);
    } catch (err: any) {
      showAlert("error", err.message || "فشلت مناداة المريض.");
    }
  };

  // Action: Load clinical protocol template
  const handleLoadTemplate = (templateName: string) => {
    const templates = getClinicalTemplates(currentDoctor.clinicId);
    const tpl = templates.find((t) => t.name.includes(templateName));
    if (tpl) {
      if (tpl.content.chiefComplaint) setChiefComplaint(tpl.content.chiefComplaint);
      if (tpl.content.diagnosis) setDiagnosis(tpl.content.diagnosis);
      if (tpl.content.prescriptionItems) {
        setPrescriptionItems(tpl.content.prescriptionItems);
      }
      if (tpl.content.notes) setVisitNotes(tpl.content.notes);
      showAlert("success", `تم تحميل ${tpl.name} بنجاح.`);
    }
  };

  // Action: Add new prescription item row
  const handleAddPrescriptionItem = () => {
    setPrescriptionItems((prev) => [
      ...prev,
      {
        medicationName: "",
        dose: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);
  };

  // Action: Remove prescription item row
  const handleRemovePrescriptionItem = (index: number) => {
    setPrescriptionItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Action: Update prescription item field
  const handleUpdatePrescriptionItem = (
    index: number,
    field: keyof Omit<PrescriptionItem, "id">,
    val: string
  ) => {
    setPrescriptionItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: val } : item))
    );
  };

  // Action: Complete Visit (إنهاء الكشف وحفظ الزيارة)
  const handleCompleteVisit = () => {
    if (!chiefComplaint.trim()) {
      showAlert("error", "الرجاء إدخال الشكوى الرئيسية للمريض.");
      return;
    }

    try {
      const activeQueueEntry = queueEntries.find((e) => e.id === activeQueueEntryId);

      const result = saveVisitAndComplete(
        {
          clinicId: currentDoctor.clinicId,
          patientId: selectedPatientId,
          doctorId: currentDoctor.id,
          queueEntryId: activeQueueEntry?.id || null,
          visitType,
          chiefComplaint,
          diagnosis,
          price,
          isPaid,
          followUpDate,
          notes: visitNotes,
          measurements: {
            weightKg: weightKg ? parseFloat(weightKg) : undefined,
            heightCm: heightCm ? parseFloat(heightCm) : undefined,
            temperatureC: tempC ? parseFloat(tempC) : undefined,
            pulseBpm: pulseBpm ? parseFloat(pulseBpm) : undefined,
            systolicBp: systolicBp ? parseFloat(systolicBp) : undefined,
            diastolicBp: diastolicBp ? parseFloat(diastolicBp) : undefined,
            oxygenSaturation: spo2 ? parseFloat(spo2) : undefined,
          },
          prescriptionItems: prescriptionItems.filter((i) => i.medicationName.trim() !== ""),
        },
        {
          id: currentDoctor.id,
          role: currentDoctor.role,
          clinicId: currentDoctor.clinicId,
        },
        queueEntries
      );

      if (result.updatedQueueList) {
        setQueueEntries(result.updatedQueueList);
        broadcastUpdate(result.updatedQueueList);
      }

      setLastCompletedPatientName(patientSummary?.patientName || "المريض");
      setCompletedModalOpen(true);

      // Refresh patient summary to show the new visit in history
      loadPatientChart(selectedPatientId);
    } catch (err: any) {
      showAlert("error", err.message || "حدث خطأ أثناء إنهاء الكشف.");
    }
  };

  // Recharts data formatting for measurements timeline
  const chartData = useMemo(() => {
    if (!patientSummary?.measurementsTimeline) return [];
    return patientSummary.measurementsTimeline.map((m, idx) => ({
      visitIndex: `زيارة ${idx + 1}`,
      date: m.recordedAt.split("T")[0],
      weight: m.weightKg || null,
      height: m.heightCm || null,
      temp: m.temperatureC || null,
      systolic: m.systolicBp || null,
      diastolic: m.diastolicBp || null,
      pulse: m.pulseBpm || null,
    }));
  }, [patientSummary]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16" dir="rtl">
      {/* Top Banner Alert */}
      {bannerAlert && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg border flex items-center gap-3 transition-all ${
            bannerAlert.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500"
              : "bg-red-600 text-white border-red-500"
          }`}
        >
          {bannerAlert.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span className="font-semibold text-sm">{bannerAlert.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  {t("doctor.title")}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                    {currentDoctor.name}
                  </span>
                </h1>
                <p className="text-xs text-slate-500">{currentDoctor.specialty}</p>
              </div>
            </div>

            {/* Privacy & Fast Navigation Links */}
            <div className="flex items-center gap-3">
              <span className="hidden md:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-medium">
                <ShieldCheck className="w-4 h-4" />
                سجل طبي مشفر ومحمي (Doctor RLS Only)
              </span>

              <Link
                href="/reception"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                شاشة الاستقبال
              </Link>
              <Link
                href="/"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                الرئيسية
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ============================================================== */}
          {/* LEFT/SIDEBAR (4 Cols): Doctor's Waiting Queue & Call Next */}
          {/* ============================================================== */}
          <div className="lg:col-span-4 space-y-6">
            {/* Active Consultation Card */}
            <div className="bg-white rounded-2xl border-2 border-blue-500 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  داخل غرفة الكشف الآن
                </span>
                <span className="text-xs text-slate-400">
                  {inConsultationEntry?.consultationStartTime
                    ? "منذ " +
                      Math.max(
                        1,
                        Math.round(
                          (Date.now() -
                            new Date(inConsultationEntry.consultationStartTime).getTime()) /
                            60000
                        )
                      ) +
                      " دقيقة"
                    : "نشط"}
                </span>
              </div>

              {inConsultationEntry ? (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {inConsultationEntry.patientName}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    تذكرة رقم #{inConsultationEntry.orderIndex + 1} • وصول:{" "}
                    {inConsultationEntry.arrivalTime
                      ? new Date(inConsultationEntry.arrivalTime).toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        loadPatientChart(inConsultationEntry.patientId, inConsultationEntry.id)
                      }
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      عرض الملف والكشف
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm text-slate-500 mb-3">لا يوجد مريض داخل الكشف حالياً.</p>
                  <button
                    onClick={handleCallNext}
                    disabled={doctorWaitingQueue.length === 0}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    {t("doctor.queue.callNext")}
                  </button>
                </div>
              )}
            </div>

            {/* Waiting Queue List Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-600" />
                  <h2 className="font-bold text-slate-900 text-base">
                    {t("doctor.queue.title")}
                  </h2>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {doctorWaitingQueue.length} في الانتظار
                </span>
              </div>

              {/* Call Next Button */}
              <button
                onClick={handleCallNext}
                disabled={doctorWaitingQueue.length === 0}
                className="w-full mb-4 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Play className="w-4 h-4 fill-white" />
                {t("doctor.queue.callNext")}
              </button>

              {/* Queue Items */}
              <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                {doctorWaitingQueue.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    {t("doctor.queue.noWaiting")}
                  </div>
                ) : (
                  doctorWaitingQueue.map((entry, index) => {
                    const waitMin = entry.arrivalTime
                      ? Math.max(
                          1,
                          Math.round(
                            (Date.now() - new Date(entry.arrivalTime).getTime()) / 60000
                          )
                        )
                      : 0;

                    return (
                      <div
                        key={entry.id}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          entry.id === activeQueueEntryId
                            ? "border-blue-500 bg-blue-50/50"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                        onClick={() => loadPatientChart(entry.patientId, entry.id)}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                              {index + 1}
                            </span>
                            {entry.patientName}
                          </span>

                          {entry.priority === "critical" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-100 text-red-800 font-bold">
                              حرج
                            </span>
                          )}
                          {entry.priority === "urgent" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold">
                              مستعجل 3x
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            انتظار منذ {waitMin} دقيقة
                          </span>
                          <span className="text-blue-600 font-medium">فتح السجل</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Templates Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                تحميل بروتوكول كشف سريع
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleLoadTemplate("نزلة معوية")}
                  className="w-full text-right py-2 px-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-xs font-medium text-slate-700 transition-colors flex items-center justify-between"
                >
                  <span>بروتوكول نزلة معوية حادة (GE)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 rotate-180" />
                </button>
                <button
                  onClick={() => handleLoadTemplate("اللوزتين")}
                  className="w-full text-right py-2 px-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-xs font-medium text-slate-700 transition-colors flex items-center justify-between"
                >
                  <span>بروتوكول التهاب اللوزتين (Tonsillitis)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 rotate-180" />
                </button>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* RIGHT (8 Cols): Patient Clinical Chart & Visit Form */}
          {/* ============================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* Patient Header Banner */}
            {patientSummary && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      {patientSummary.patientName}
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                        كود: {patientSummary.patientId}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      تاريخ الميلاد: {patientSummary.dateOfBirth || "غير محدد"} • النوع:{" "}
                      {patientSummary.gender || "طفل"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>تم تسجيل فتح هذا السجل في سجل التدقيق (Audit Log)</span>
                  </div>
                </div>

                {/* 1. PROMINENT ALLERGY BANNER (Non-negotiable requirement) */}
                <div className="mt-4">
                  {patientSummary.allergies.length > 0 ? (
                    <div className="rounded-xl border-2 border-red-500 bg-red-50 p-4 shadow-sm animate-pulse">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-600 text-white rounded-lg">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-red-900">
                            {t("doctor.chart.allergyAlertTitle")}
                          </h4>
                          <div className="mt-1 space-y-1">
                            {patientSummary.allergies.map((alg) => (
                              <p key={alg.id} className="text-xs font-bold text-red-800">
                                ⚠️ {alg.allergen} — درجة التحسس:{" "}
                                <span className="underline">
                                  {alg.severity === "severe"
                                    ? "شديدة جداً"
                                    : alg.severity === "moderate"
                                    ? "متوسطة"
                                    : "طفيفة"}
                                </span>{" "}
                                {alg.reaction && `(${alg.reaction})`}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 flex items-center gap-2 text-xs text-emerald-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {t("doctor.chart.noAllergies")}
                    </div>
                  )}
                </div>

                {/* 2. Chronic Conditions & Current Medications Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <History className="w-4 h-4 text-slate-500" />
                      {t("doctor.chart.chronicConditions")}
                    </h4>
                    {patientSummary.chronicConditions.length > 0 ? (
                      <ul className="space-y-1 text-xs text-slate-800 font-medium">
                        {patientSummary.chronicConditions.map((ch) => (
                          <li key={ch.id}>• {ch.conditionName}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400">{t("doctor.chart.noChronic")}</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <Pill className="w-4 h-4 text-slate-500" />
                      {t("doctor.chart.currentMedications")}
                    </h4>
                    {patientSummary.currentMedications.length > 0 ? (
                      <ul className="space-y-1 text-xs text-slate-800 font-medium">
                        {patientSummary.currentMedications.map((med, idx) => (
                          <li key={idx}>• {med}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400">{t("doctor.chart.noMedications")}</p>
                    )}
                  </div>
                </div>

                {/* 3. Measurement Timeline Chart (Recharts) */}
                {mounted && chartData.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-3">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      {t("doctor.chart.measurementsTrend")} (الوزن والطول عبر الزيارات)
                    </h4>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="visitIndex" tick={{ fontSize: 11 }} />
                          <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="weight"
                            name="الوزن (كجم)"
                            stroke="#2563eb"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="height"
                            name="الطول (سم)"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* PEDIATRICS SPECIALTY MODULE (Growth, Vaccines, Milestones) */}
            {/* ============================================================== */}
            {isModuleEnabled("pediatrics", clinicEnabledModules) && patientSummary && (
              <div className="mb-6">
                <PediatricsWorkspace
                  doctor={currentDoctor}
                  clinicEnabledModules={clinicEnabledModules}
                  patient={{
                    id: selectedPatientId,
                    name: patientSummary.patientName,
                    dateOfBirth: patientSummary.dateOfBirth || "2022-04-15",
                    gender: patientSummary.gender || "ذكر",
                  }}
                  initialRecord={getFullPediatricRecord(
                    currentDoctor,
                    selectedPatientId,
                    patientSummary.dateOfBirth || "2022-04-15",
                    clinicEnabledModules
                  )}
                  currentMeasurements={{
                    weightKg: weightKg ? Number(weightKg) : undefined,
                    heightCm: heightCm ? Number(heightCm) : undefined,
                  }}
                  historicalMeasurements={patientSummary.measurementsTimeline.map((m) => ({
                    date: m.recordedAt,
                    weightKg: m.weightKg,
                    heightCm: m.heightCm,
                  }))}
                />
              </div>
            )}

            {/* ============================================================== */}
            {/* NUTRITION SPECIALTY MODULE (Energy, Anthropometry, Meal Plans) */}
            {/* ============================================================== */}
            {isModuleEnabled("nutrition", clinicEnabledModules) && patientSummary && (
              <div className="mb-6">
                <NutritionWorkspace
                  doctor={currentDoctor}
                  clinicEnabledModules={clinicEnabledModules}
                  patient={{
                    id: selectedPatientId,
                    name: patientSummary.patientName,
                    age: 32,
                    gender: patientSummary.gender || "أنثى",
                  }}
                  initialRecord={getFullNutritionRecord(
                    currentDoctor,
                    selectedPatientId,
                    clinicEnabledModules
                  )}
                  letterhead={clinicLetterhead}
                />
              </div>
            )}

            {/* ============================================================== */}
            {/* CURRENT VISIT FORM */}
            {/* ============================================================== */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-lg">
                    {t("doctor.visitForm.title")}
                  </h3>
                </div>

                <div className="flex gap-2">
                  {(["new", "follow_up", "consultation"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setVisitType(type)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                        visitType === type
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {type === "new" ? "كشف جديد" : type === "follow_up" ? "استشارة / متابعة" : "فحص سريع"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chief Complaint */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t("doctor.visitForm.complaint")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder={t("doctor.visitForm.complaintPlaceholder")}
                  className="w-full text-sm rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Measurements Inputs */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                  {t("doctor.visitForm.measurements")}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">{t("doctor.visitForm.weight")}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="15.5"
                      className="w-full text-xs font-semibold rounded-lg border border-slate-200 p-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">{t("doctor.visitForm.height")}</label>
                    <input
                      type="number"
                      step="0.5"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      placeholder="101"
                      className="w-full text-xs font-semibold rounded-lg border border-slate-200 p-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">{t("doctor.visitForm.temp")}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tempC}
                      onChange={(e) => setTempC(e.target.value)}
                      placeholder="37.0"
                      className="w-full text-xs font-semibold rounded-lg border border-slate-200 p-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">{t("doctor.visitForm.pulse")}</label>
                    <input
                      type="number"
                      value={pulseBpm}
                      onChange={(e) => setPulseBpm(e.target.value)}
                      placeholder="95"
                      className="w-full text-xs font-semibold rounded-lg border border-slate-200 p-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">{t("doctor.visitForm.bp")}</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={systolicBp}
                        onChange={(e) => setSystolicBp(e.target.value)}
                        placeholder="95"
                        className="w-1/2 text-xs font-semibold rounded-lg border border-slate-200 p-2 text-center"
                      />
                      <input
                        type="number"
                        value={diastolicBp}
                        onChange={(e) => setDiastolicBp(e.target.value)}
                        placeholder="60"
                        className="w-1/2 text-xs font-semibold rounded-lg border border-slate-200 p-2 text-center"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">{t("doctor.visitForm.spo2")}</label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      placeholder="98"
                      className="w-full text-xs font-semibold rounded-lg border border-slate-200 p-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Diagnosis + Common Diagnoses Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t("doctor.visitForm.diagnosis")}
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder={t("doctor.visitForm.diagnosisPlaceholder")}
                  className="w-full text-sm rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium mb-2.5"
                />

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {t("doctor.visitForm.commonDiagnoses")}
                  </span>
                  {[
                    "التهاب الحلق واللوزتين",
                    "نزلة معوية حادة",
                    "نزلة شعبية",
                    "نوبة حساسية صدرية",
                    "التهاب الأذن الوسطى",
                    "فحص نمو وتغذية",
                  ].map((diag) => (
                    <button
                      key={diag}
                      type="button"
                      onClick={() => setDiagnosis(diag)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 transition-colors font-medium border border-slate-200"
                    >
                      + {diag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prescription Items (Verbatim Doctor Text - Rule #8) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    {t("doctor.visitForm.prescriptions")}
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenCurrentPrint}
                      className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      {t("doctor.print.title")}
                    </button>
                    <button
                      type="button"
                      onClick={handleAddPrescriptionItem}
                      className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t("doctor.visitForm.addItem")}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {prescriptionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-4">
                          <label className="block text-[11px] text-slate-500 mb-1">{t("doctor.visitForm.medName")}</label>
                          <DrugCombobox
                            value={item.medicationName}
                            onChange={(val) =>
                              handleUpdatePrescriptionItem(idx, "medicationName", val)
                            }
                            onSelectDrug={(drug) => {
                              if (!item.dose && drug.route) {
                                if (drug.route.includes("SOLID")) {
                                  handleUpdatePrescriptionItem(idx, "dose", "قرص واحد");
                                } else if (drug.route.includes("LIQUID")) {
                                  handleUpdatePrescriptionItem(idx, "dose", "5 مل");
                                }
                              }
                            }}
                            placeholder="ابحث في أدوية مصر أو اكتب..."
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-slate-500 mb-1">{t("doctor.visitForm.dose")}</label>
                          <input
                            type="text"
                            value={item.dose}
                            onChange={(e) =>
                              handleUpdatePrescriptionItem(idx, "dose", e.target.value)
                            }
                            placeholder="2.5 مل"
                            className="w-full text-xs rounded-lg border border-slate-200 p-2 focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] text-slate-500 mb-1">{t("doctor.visitForm.frequency")}</label>
                          <input
                            type="text"
                            value={item.frequency}
                            onChange={(e) =>
                              handleUpdatePrescriptionItem(idx, "frequency", e.target.value)
                            }
                            placeholder="3 مرات يومياً"
                            className="w-full text-xs rounded-lg border border-slate-200 p-2 focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] text-slate-500 mb-1">{t("doctor.visitForm.duration")}</label>
                          <input
                            type="text"
                            value={item.duration}
                            onChange={(e) =>
                              handleUpdatePrescriptionItem(idx, "duration", e.target.value)
                            }
                            placeholder="5 أيام"
                            className="w-full text-xs rounded-lg border border-slate-200 p-2 focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div className="sm:col-span-1 flex items-end justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemovePrescriptionItem(idx)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف الدواء"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={item.instructions || ""}
                          onChange={(e) =>
                            handleUpdatePrescriptionItem(idx, "instructions", e.target.value)
                          }
                          placeholder="التعليمات (مثال: بعد الأكل، مع الإكثار من السوائل...)"
                          className="w-full text-xs rounded-lg border border-slate-200 p-2 focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes & Follow-up Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t("doctor.visitForm.notes")}
                  </label>
                  <textarea
                    rows={2}
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    placeholder="ملاحظات وتوجيهات الطبيب..."
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t("doctor.visitForm.followUpDate")}
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2 mt-2">
                    {[7, 14, 30].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + days);
                          setFollowUpDate(d.toISOString().split("T")[0]);
                        }}
                        className="text-[10px] px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                      >
                        بعد {days} يوم
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Consultation Fee & Paid Status */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">
                      {t("doctor.visitForm.price")}
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      className="w-28 text-sm font-bold rounded-lg border border-slate-200 p-1.5 text-slate-900 bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="paid_status_checkbox"
                      checked={isPaid}
                      onChange={(e) => setIsPaid(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <label htmlFor="paid_status_checkbox" className="text-xs font-bold text-slate-800">
                      تم سداد الرسوم بالاستقبال
                    </label>
                  </div>
                </div>

                {/* Complete Visit Button (إنهاء الكشف وحفظ الزيارة) */}
                <button
                  type="button"
                  onClick={handleCompleteVisit}
                  className="py-3 px-6 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {t("doctor.visitForm.completeVisit")}
                </button>
              </div>
            </div>

            {/* ============================================================== */}
            {/* PREVIOUS VISITS TIMELINE */}
            {/* ============================================================== */}
            {patientSummary && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-600" />
                  {t("doctor.chart.previousVisits")} ({patientSummary.visits.length})
                </h3>

                {patientSummary.visits.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    {t("doctor.chart.noPreviousVisits")}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {patientSummary.visits.map((vis) => (
                      <div
                        key={vis.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                            {new Date(vis.visitDate).toLocaleDateString("ar-EG", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {vis.visitType === "new"
                              ? "كشف جديد"
                              : vis.visitType === "follow_up"
                              ? "استشارة ومتابعة"
                              : "فحص"}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-800">
                          الشكوى: <span className="font-normal">{vis.chiefComplaint}</span>
                        </p>
                        {vis.diagnosis && (
                          <p className="text-xs font-semibold text-slate-800">
                            التشخيص: <span className="font-normal text-emerald-800">{vis.diagnosis}</span>
                          </p>
                        )}

                        {vis.prescription && vis.prescription.items.length > 0 && (
                          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                            <div>
                              <span className="font-bold text-slate-700">الأدوية الموصوفة: </span>
                              {vis.prescription.items.map((i) => i.medicationName).join("، ")}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleReprintVisit(vis)}
                              className="text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300 flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-sm"
                              title="إعادة طباعة هذه الروشتة"
                            >
                              <Printer className="w-3.5 h-3.5 text-blue-600" />
                              {t("doctor.print.reprintButton")}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Completion Modal */}
      {completedModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              {t("doctor.visitForm.completedSuccess")}
            </h3>
            <p className="text-xs text-slate-500">
              تم تحديث حالة تذكرة المريض <span className="font-bold text-slate-800">{lastCompletedPatientName}</span> إلى مكتملة وحفظ السجل الطبي.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setCompletedModalOpen(false);
                  handleOpenCurrentPrint();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                {t("doctor.visitForm.printPrescription")}
              </button>

              <button
                onClick={() => {
                  setCompletedModalOpen(false);
                  handleCallNext();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-white" />
                مناداة المريض التالي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 10: Interactive Prescription Print Preview Modal */}
      {printModalOpen && prescriptionToPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {t("doctor.print.title")}
                  {prescriptionToPrint.isReprint && (
                    <span className="mr-2 text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                      {t("doctor.print.reprintButton")}
                    </span>
                  )}
                </h3>
              </div>

              {/* Paper Size Switcher (A4 vs A5) */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPrintPaperSize("A5")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    printPaperSize === "A5"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t("doctor.print.a5")}
                </button>
                <button
                  type="button"
                  onClick={() => setPrintPaperSize("A4")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    printPaperSize === "A4"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t("doctor.print.a4")}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerPrint}
                  className="py-2 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  {t("doctor.print.printButton")}
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(false)}
                  className="py-2 px-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
                >
                  {t("doctor.print.close")}
                </button>
              </div>
            </div>

            {/* Audit Notice */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t("doctor.print.auditNotice")}</span>
            </div>

            {/* Visual Prescription Preview Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-100 rounded-xl flex justify-center">
              <PrintablePrescription
                paperSize={printPaperSize}
                letterhead={clinicLetterhead}
                patient={prescriptionToPrint.patient}
                visitDate={prescriptionToPrint.visitDate}
                diagnosis={prescriptionToPrint.diagnosis}
                items={prescriptionToPrint.items}
                advice={prescriptionToPrint.advice}
                followUpDate={prescriptionToPrint.followUpDate}
                isReprint={prescriptionToPrint.isReprint}
              />
            </div>
          </div>
        </div>
      )}

      {/* Hidden container for Browser Print Dialog (Window.print) */}
      <div className="hidden print:block">
        {prescriptionToPrint && (
          <PrintablePrescription
            paperSize={printPaperSize}
            letterhead={clinicLetterhead}
            patient={prescriptionToPrint.patient}
            visitDate={prescriptionToPrint.visitDate}
            diagnosis={prescriptionToPrint.diagnosis}
            items={prescriptionToPrint.items}
            advice={prescriptionToPrint.advice}
            followUpDate={prescriptionToPrint.followUpDate}
            isReprint={prescriptionToPrint.isReprint}
          />
        )}
      </div>
    </div>
  );
}
