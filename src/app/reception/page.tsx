"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import {
  QueueClinicSettings,
  QueueEntry,
  QueuePriority,
  QueueState,
} from "@/lib/queue/types";
import {
  computeQueueOrder,
  detectSkipAlerts,
  reorderQueueEntry,
  setEntryPriority,
  snoozeSkipAlert,
  transitionQueueState,
} from "@/lib/queue/engine";
import {
  Users,
  Clock,
  Play,
  CheckCircle2,
  UserX,
  AlertTriangle,
  ShieldCheck,
  DollarSign,
  Calendar,
  ArrowUpDown,
  Bell,
  Plus,
  Phone,
  RefreshCw,
  X,
  AlertCircle,
  Filter,
  ArrowLeft,
  Flame,
  Radio,
  FileCheck2,
} from "lucide-react";

interface SeedAppointment {
  id: string;
  patientName: string;
  guardianPhone: string;
  doctorName: string;
  doctorId: string;
  scheduledTime: string;
  status: "booked" | "checked_in" | "cancelled" | "no_show";
  notes?: string;
}

export default function ReceptionDashboardPage() {
  // Clinic Settings (Parameterized, Rule #9)
  const [settings] = useState<QueueClinicSettings>({
    arrive_before_minutes: 15,
    skip_alert_minutes: 60,
    urgent_enabled: true,
    urgent_fee_multiplier: 3,
    end_of_day_time: "22:00",
  });

  // Realtime Connection State
  const [isConnected, setIsConnected] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());

  // Filter by doctor
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>("all");

  // Active tab
  const [activeTab, setActiveTab] = useState<"queue" | "appointments" | "alerts">("queue");

  // Seed doctors for the clinic
  const clinicDoctors = [
    { id: "doc-1", name: "د. تامر الشناوي" },
    { id: "doc-2", name: "د. سارة محمود" },
  ];

  // Seed Live Queue Entries
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
      arrivalTime: "2026-10-10T10:10:00Z", // Arrived early, but was skipped by later patient!
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
    {
      id: "q-104",
      clinicId: "clinic-1",
      patientId: "pat-4",
      patientName: "حمزة طارق زياد",
      doctorId: "doc-2",
      appointmentId: null,
      scheduledTime: null,
      arrivalTime: "2026-10-10T11:20:00Z",
      calledTime: null,
      consultationStartTime: null,
      completedTime: null,
      leftTime: null,
      state: "waiting",
      priority: "normal",
      orderIndex: 3,
      autoClosed: false,
      urgentMultiplier: 1,
      createdAt: "2026-10-10T11:20:00Z",
      updatedAt: "2026-10-10T11:20:00Z",
    },
    {
      id: "q-105",
      clinicId: "clinic-1",
      patientId: "pat-5",
      patientName: "سارة إبراهيم الشريف",
      doctorId: "doc-1",
      appointmentId: null,
      scheduledTime: null,
      arrivalTime: "2026-10-10T09:30:00Z",
      calledTime: "2026-10-10T09:45:00Z",
      consultationStartTime: "2026-10-10T09:45:00Z",
      completedTime: "2026-10-10T10:15:00Z",
      leftTime: null,
      state: "completed",
      priority: "normal",
      orderIndex: 0,
      autoClosed: false,
      urgentMultiplier: 1,
      createdAt: "2026-10-10T09:30:00Z",
      updatedAt: "2026-10-10T10:15:00Z",
    },
  ]);

  // Seed Paid Status Map (Reception tracking of payment)
  const [paidStatus, setPaidStatus] = useState<Record<string, boolean>>({
    "q-101": true,
    "q-102": false,
    "q-103": true,
    "q-104": false,
    "q-105": true,
  });

  // Seed Guardian Phones Map (Reception contact)
  const [guardianPhones] = useState<Record<string, string>>({
    "q-101": "+201011112222",
    "q-102": "+201099998888",
    "q-103": "+201011112222",
    "q-104": "+201077776666",
    "q-105": "+201055554444",
  });

  // Seed Today's Appointments List
  const [appointments, setAppointments] = useState<SeedAppointment[]>([
    {
      id: "apt-201",
      patientName: "ملك محمود سامي",
      guardianPhone: "+201033332222",
      doctorName: "د. تامر الشناوي",
      doctorId: "doc-1",
      scheduledTime: "12:00",
      status: "booked",
      notes: "استشارة متابعة نمو",
    },
    {
      id: "apt-202",
      patientName: "زين عبد الرحمن",
      guardianPhone: "+201044441111",
      doctorName: "د. سارة محمود",
      doctorId: "doc-2",
      scheduledTime: "12:30",
      status: "booked",
      notes: "كشف أطفال جديد",
    },
    {
      id: "apt-203",
      patientName: "ليلى حسن توفيق",
      guardianPhone: "+201088885555",
      doctorName: "د. تامر الشناوي",
      doctorId: "doc-1",
      scheduledTime: "13:00",
      status: "booked",
      notes: "فحص دوري وتطعيمات",
    },
  ]);

  // Modals state
  const [reorderModalEntry, setReorderModalEntry] = useState<QueueEntry | null>(null);
  const [reorderTargetIndex, setReorderTargetIndex] = useState<number>(1);
  const [reorderReason, setReorderReason] = useState<string>("");
  const [reorderError, setReorderError] = useState<string | null>(null);

  const [priorityModalEntry, setPriorityModalEntry] = useState<QueueEntry | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<QueuePriority>("normal");
  const [priorityReason, setPriorityReason] = useState<string>("");
  const [priorityApprover, setPriorityApprover] = useState<string>("د. تامر الشناوي (مالك العيادة)");
  const [priorityError, setPriorityError] = useState<string | null>(null);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingPatientName, setBookingPatientName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingDoctorId, setBookingDoctorId] = useState("doc-1");
  const [bookingTime, setBookingTime] = useState("13:30");
  const [bookingNotes, setBookingNotes] = useState("");

  const [bannerAlert, setBannerAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showAlert = (type: "success" | "error", message: string) => {
    setBannerAlert({ type, message });
    setTimeout(() => setBannerAlert(null), 4000);
  };

  // Realtime Broadcast Channel synchronization (Inter-tab communication)
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel("med_live_queue_sync");

    channel.onmessage = (event) => {
      if (event.data?.type === "QUEUE_UPDATE") {
        setQueueEntries(event.data.entries);
        setLastSyncTime(new Date().toISOString());
      }
    };

    return () => {
      channel.close();
    };
  }, []);

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
    setLastSyncTime(new Date().toISOString());
  }, []);

  // Compute live queue order using the Pure Engine
  const computedQueue = useMemo(() => {
    return computeQueueOrder(queueEntries, settings);
  }, [queueEntries, settings]);

  // Filtered Queue by Doctor
  const filteredQueue = useMemo(() => {
    if (selectedDoctorFilter === "all") return computedQueue;
    return computedQueue.filter((e) => e.doctorId === selectedDoctorFilter);
  }, [computedQueue, selectedDoctorFilter]);

  // Active Waiting Patients
  const waitingEntries = useMemo(() => {
    return filteredQueue.filter((e) => e.state === "waiting");
  }, [filteredQueue]);

  // Current Patient in Consultation
  const inConsultationEntries = useMemo(() => {
    return filteredQueue.filter((e) => e.state === "in_consultation");
  }, [filteredQueue]);

  // Completed Today
  const completedEntries = useMemo(() => {
    return filteredQueue.filter((e) => e.state === "completed");
  }, [filteredQueue]);

  // Left Today
  const leftEntries = useMemo(() => {
    return filteredQueue.filter((e) => e.state === "left");
  }, [filteredQueue]);

  // Skip Alerts detected by Pure Engine
  const activeSkipAlerts = useMemo(() => {
    return detectSkipAlerts(queueEntries, settings, new Date().toISOString());
  }, [queueEntries, settings]);

  // Calculate Waiting Duration Formatted
  const calculateWaitingMinutes = (arrivalTimeStr: string | null | undefined): string => {
    if (!arrivalTimeStr) return "-";
    const arr = new Date(arrivalTimeStr).getTime();
    const now = new Date().getTime();
    const diffMins = Math.max(0, Math.floor((now - arr) / (1000 * 60)));
    if (diffMins >= 60) {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours} س و ${mins} د`;
    }
    return `${diffMins} دقيقة`;
  };

  // ONE-TAP ACTION: Check-in patient
  const handleCheckIn = (apt: SeedAppointment) => {
    const now = new Date().toISOString();
    const newEntry: QueueEntry = {
      id: `q-${Date.now()}`,
      clinicId: "clinic-1",
      patientId: `pat-${apt.id}`,
      patientName: apt.patientName,
      doctorId: apt.doctorId,
      appointmentId: apt.id,
      scheduledTime: `${new Date().toISOString().split("T")[0]}T${apt.scheduledTime}:00Z`,
      arrivalTime: now,
      calledTime: null,
      consultationStartTime: null,
      completedTime: null,
      leftTime: null,
      state: "waiting",
      priority: "normal",
      orderIndex: waitingEntries.length + 1,
      autoClosed: false,
      urgentMultiplier: 1,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newEntry, ...queueEntries];
    setQueueEntries(updated);
    setPaidStatus((prev) => ({ ...prev, [newEntry.id]: false }));
    guardianPhones[newEntry.id] = apt.guardianPhone;

    setAppointments((prev) =>
      prev.map((a) => (a.id === apt.id ? { ...a, status: "checked_in" } : a))
    );

    broadcastUpdate(updated);
    showAlert("success", `تم تسجيل حضور المريض ${apt.patientName} بنجاح وحساب دوره في الطابور.`);
  };

  // ONE-TAP ACTION: Call next patient into consultation
  const handleCallNext = (entry: QueueEntry) => {
    const actor = { id: "reception-user", role: "receptionist" };
    const { updatedEntry } = transitionQueueState(entry, "in_consultation", actor);

    const updated = queueEntries.map((e) => (e.id === entry.id ? updatedEntry : e));
    setQueueEntries(updated);
    broadcastUpdate(updated);
    showAlert("success", `تم استدعاء ${entry.patientName} لدخول الكشف.`);
  };

  // ONE-TAP ACTION: Mark Completed
  const handleComplete = (entry: QueueEntry) => {
    const actor = { id: "doctor-user", role: "doctor" };
    const { updatedEntry } = transitionQueueState(entry, "completed", actor);

    const updated = queueEntries.map((e) => (e.id === entry.id ? updatedEntry : e));
    setQueueEntries(updated);
    broadcastUpdate(updated);
    showAlert("success", `تم إنهاء كشف ${entry.patientName}.`);
  };

  // ONE-TAP ACTION: Mark Left
  const handleMarkLeft = (entry: QueueEntry) => {
    const actor = { id: "reception-user", role: "receptionist" };
    const { updatedEntry } = transitionQueueState(entry, "left", actor, {
      reason: "مغادرة المريض للعيادة قبل الدخول",
    });

    const updated = queueEntries.map((e) => (e.id === entry.id ? updatedEntry : e));
    setQueueEntries(updated);
    broadcastUpdate(updated);
    showAlert("success", `تم تسجيل مغادرة ${entry.patientName}.`);
  };

  // ONE-TAP ACTION: Mark No-Show
  const handleMarkNoShow = (entry: QueueEntry) => {
    const actor = { id: "reception-user", role: "receptionist" };
    const { updatedEntry } = transitionQueueState(entry, "no_show", actor);

    const updated = queueEntries.map((e) => (e.id === entry.id ? updatedEntry : e));
    setQueueEntries(updated);
    broadcastUpdate(updated);
    showAlert("success", `تم تسجيل ${entry.patientName} كـ (لم يحضر).`);
  };

  // ONE-TAP ACTION: Cancel
  const handleCancel = (entry: QueueEntry) => {
    const actor = { id: "reception-user", role: "receptionist" };
    const { updatedEntry } = transitionQueueState(entry, "cancelled", actor);

    const updated = queueEntries.map((e) => (e.id === entry.id ? updatedEntry : e));
    setQueueEntries(updated);
    broadcastUpdate(updated);
    showAlert("success", `تم إلغاء تذكرة ${entry.patientName}.`);
  };

  // ONE-TAP ACTION: Toggle Paid Status
  const handleTogglePaid = (entryId: string) => {
    setPaidStatus((prev) => {
      const current = Boolean(prev[entryId]);
      const next = !current;
      showAlert("success", next ? "تم تأكيد دفع الرسوم بنجاح." : "تم تعيين الحالة كغير مدفوع.");
      return { ...prev, [entryId]: next };
    });
  };

  // ACTION: Snooze Skip Alert (Scenario 5)
  const handleSnoozeAlert = (entryId: string) => {
    const target = queueEntries.find((e) => e.id === entryId);
    if (!target) return;

    const { updatedEntry } = snoozeSkipAlert(
      target,
      15,
      new Date().toISOString(),
      { id: "reception-user", role: "receptionist" }
    );

    const updated = queueEntries.map((e) => (e.id === entryId ? updatedEntry : e));
    setQueueEntries(updated);
    broadcastUpdate(updated);
    showAlert("success", `تم تأجيل تنبيه التخطي للمريض ${target.patientName} لمدة 15 دقيقة.`);
  };

  // ACTION: Manual Reorder Submit (Scenario 7: Enforces reason)
  const handleReorderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reorderModalEntry) return;

    if (!reorderReason.trim()) {
      setReorderError(t("reorderModal.reasonLabel"));
      return;
    }

    try {
      const { updatedEntries } = reorderQueueEntry(
        queueEntries,
        reorderModalEntry.id,
        reorderTargetIndex,
        { id: "reception-user", role: "receptionist" },
        reorderReason
      );

      setQueueEntries(updatedEntries);
      broadcastUpdate(updatedEntries);
      setReorderModalEntry(null);
      setReorderReason("");
      setReorderError(null);
      showAlert("success", "تمت إعادة ترتيب الطابور وتوثيق سبب التعديل بنجاح.");
    } catch (err: any) {
      setReorderError(err.message || "حدث خطأ أثناء إعادة الترتيب.");
    }
  };

  // ACTION: Set Priority Submit (Scenario 4: Urgent fee multiplier)
  const handlePrioritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priorityModalEntry) return;

    if (selectedPriority === "urgent" && !priorityReason.trim()) {
      setPriorityError("يرجى كتابة سبب الاستعجال لاعتماده في التدقيق.");
      return;
    }

    try {
      const { updatedEntry } = setEntryPriority(
        priorityModalEntry,
        selectedPriority,
        settings,
        { id: "reception-user", role: "receptionist" },
        {
          reason: priorityReason,
          approverId: priorityApprover,
        }
      );

      const updated = queueEntries.map((e) => (e.id === priorityModalEntry.id ? updatedEntry : e));
      setQueueEntries(updated);
      broadcastUpdate(updated);
      setPriorityModalEntry(null);
      setPriorityReason("");
      setPriorityError(null);
      showAlert("success", `تم تحديث أولوية المريض ${priorityModalEntry.patientName} إلى: ${selectedPriority}.`);
    } catch (err: any) {
      setPriorityError(err.message || "فشل تغيير الأولوية.");
    }
  };

  // ACTION: Quick Book Appointment
  const handleQuickBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingPatientName.trim() || !bookingPhone.trim()) return;

    const doctor = clinicDoctors.find((d) => d.id === bookingDoctorId);
    const newApt: SeedAppointment = {
      id: `apt-${Date.now()}`,
      patientName: bookingPatientName.trim(),
      guardianPhone: bookingPhone.trim(),
      doctorName: doctor?.name || "د. تامر الشناوي",
      doctorId: bookingDoctorId,
      scheduledTime: bookingTime,
      status: "booked",
      notes: bookingNotes.trim() || undefined,
    };

    setAppointments([newApt, ...appointments]);
    setIsBookingModalOpen(false);
    setBookingPatientName("");
    setBookingPhone("");
    setBookingNotes("");
    showAlert("success", `تم حجز موعد جديد للمريض ${newApt.patientName} بنجاح.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
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
                {t("reception.title")}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <span>{t("reception.title")}</span>
            </h1>
            <p className="text-sm text-slate-600">{t("reception.subtitle")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Realtime Status Indicator */}
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
                isConnected
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isConnected ? "text-emerald-600 animate-pulse" : "text-amber-600"}`} />
              <span>{isConnected ? t("reception.connectionLive") : t("reception.connectionOffline")}</span>
            </div>

            {/* Quick Book Button */}
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition-all text-sm min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>{t("reception.actions.quickBook")}</span>
            </button>
          </div>
        </div>

        {/* Medical Privacy Banner (Rule #2) */}
        <div className="flex items-start gap-3 bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">{t("reception.privacyBanner")}</p>
          </div>
        </div>

        {/* Notification Banner */}
        {bannerAlert && (
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border animate-in fade-in duration-200 ${
              bannerAlert.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {bannerAlert.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{bannerAlert.message}</span>
          </div>
        )}

        {/* Realtime Queue Counters (Large tap target metrics) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">
                {t("reception.counters.waiting")}
              </span>
              <p className="text-3xl font-extrabold text-blue-600">{waitingEntries.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">
                {t("reception.counters.inConsultation")}
              </span>
              <p className="text-3xl font-extrabold text-emerald-600">
                {inConsultationEntries.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Play className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">
                {t("reception.counters.completedToday")}
              </span>
              <p className="text-3xl font-extrabold text-purple-600">{completedEntries.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">
                {t("reception.counters.leftToday")}
              </span>
              <p className="text-3xl font-extrabold text-slate-700">{leftEntries.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
              <UserX className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Skip Alert Banner (if any waiting patient has been skipped > skip_alert_minutes) */}
        {activeSkipAlerts.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>{t("reception.alerts.title")} ({activeSkipAlerts.length})</span>
            </div>
            <div className="space-y-2">
              {activeSkipAlerts.map((alert) => (
                <div
                  key={alert.queueEntryId}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-xl border border-amber-200 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-sm">{alert.patientName}</p>
                    <p className="text-slate-600">
                      {t("reception.alerts.desc", { minutes: String(alert.skippedDurationMinutes) })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleSnoozeAlert(alert.queueEntryId)}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-medium transition-colors min-h-[38px]"
                    >
                      {t("reception.actions.snooze")}
                    </button>
                    <button
                      onClick={() => {
                        const target = queueEntries.find((e) => e.id === alert.queueEntryId);
                        if (target) handleMarkLeft(target);
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-medium transition-colors min-h-[38px]"
                    >
                      {t("reception.actions.markLeft")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls: Filter & Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          {/* Main Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("queue")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[40px] flex items-center gap-1.5 ${
                activeTab === "queue"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{t("reception.tabs.liveQueue")}</span>
              <span className="bg-blue-100 text-blue-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
                {waitingEntries.length + inConsultationEntries.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("appointments")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[40px] flex items-center gap-1.5 ${
                activeTab === "appointments"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{t("reception.tabs.todayAppointments")}</span>
              <span className="bg-slate-200 text-slate-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
                {appointments.filter((a) => a.status === "booked").length}
              </span>
            </button>
          </div>

          {/* Doctor Filter Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDoctorFilter}
              onChange={(e) => setSelectedDoctorFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t("reception.allDoctors")}</option>
              {clinicDoctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TAB 1: Live Waiting Queue */}
        {activeTab === "queue" && (
          <div className="space-y-4">
            {/* CURRENTLY IN CONSULTATION SECTION */}
            {inConsultationEntries.length > 0 && (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                    <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                    <span>{t("reception.counters.inConsultation")}</span>
                  </h2>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
                    الكشف جارٍ الآن
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {inConsultationEntries.map((entry) => {
                    const doctor = clinicDoctors.find((d) => d.id === entry.doctorId);
                    const isPaid = paidStatus[entry.id] ?? false;

                    return (
                      <div
                        key={entry.id}
                        className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-base text-slate-900">{entry.patientName}</h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <span>الطبيب: {doctor?.name || "د. تامر الشناوي"}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => handleTogglePaid(entry.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all min-h-[32px] ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            }`}
                          >
                            {isPaid ? t("reception.payment.paid") : t("reception.payment.unpaid")}
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="text-xs text-slate-500 font-mono" dir="ltr">
                            {guardianPhones[entry.id] || "-"}
                          </span>
                          <button
                            onClick={() => handleComplete(entry)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg shadow-sm transition-all min-h-[36px]"
                          >
                            إتمام الكشف
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WAITING QUEUE LIST */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>المرضى في الانتظار بالترتيب المعتمد</span>
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  {waitingEntries.length} منتظر
                </span>
              </div>

              {waitingEntries.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-medium">{t("reception.queueEmpty")}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {waitingEntries.map((entry, idx) => {
                    const doctor = clinicDoctors.find((d) => d.id === entry.doctorId);
                    const isPaid = paidStatus[entry.id] ?? false;
                    const phone = guardianPhones[entry.id];
                    const waitingMins = calculateWaitingMinutes(entry.arrivalTime);

                    return (
                      <div
                        key={entry.id}
                        className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Left: Rank, Name, Badges & Contact */}
                        <div className="flex items-start gap-4">
                          {/* Order Rank Badge */}
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm ${
                              entry.priority === "critical"
                                ? "bg-rose-600 text-white"
                                : entry.priority === "urgent"
                                ? "bg-amber-500 text-white"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            #{idx + 1}
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-base text-slate-900">
                                {entry.patientName}
                              </h3>

                              {/* Priority Badge */}
                              {entry.priority === "critical" && (
                                <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Flame className="w-3 h-3 text-rose-600" />
                                  <span>{t("reception.priority.critical")}</span>
                                </span>
                              )}
                              {entry.priority === "urgent" && (
                                <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <span>{t("reception.priority.urgent")} (×{entry.urgentMultiplier || 3})</span>
                                </span>
                              )}

                              {/* Paid Status Toggle */}
                              <button
                                onClick={() => handleTogglePaid(entry.id)}
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-colors ${
                                  isPaid
                                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                    : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                }`}
                              >
                                {isPaid ? t("reception.payment.paid") : t("reception.payment.unpaid")}
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <span>الطبيب: {doctor?.name || "د. تامر الشناوي"}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>الانتظار: {waitingMins}</span>
                              </span>
                              {phone && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 font-mono" dir="ltr">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {phone}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: One-Tap Reception Actions (Tablet & touch-friendly min-h-[44px]) */}
                        <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                          {/* Call Next Button */}
                          <button
                            onClick={() => handleCallNext(entry)}
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-sm hover:shadow transition-all min-h-[40px]"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>{t("reception.actions.callNext")}</span>
                          </button>

                          {/* Reorder Button */}
                          <button
                            onClick={() => {
                              setReorderModalEntry(entry);
                              setReorderTargetIndex(idx + 1);
                              setReorderReason("");
                              setReorderError(null);
                            }}
                            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs px-3 py-2 rounded-xl transition-colors min-h-[40px]"
                            title={t("reception.actions.reorder")}
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            <span>{t("reception.actions.reorder")}</span>
                          </button>

                          {/* Priority Change Button */}
                          <button
                            onClick={() => {
                              setPriorityModalEntry(entry);
                              setSelectedPriority(entry.priority);
                              setPriorityReason(entry.urgentReason || "");
                              setPriorityError(null);
                            }}
                            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs px-3 py-2 rounded-xl transition-colors min-h-[40px]"
                            title={t("reception.actions.setPriority")}
                          >
                            <Flame className="w-3.5 h-3.5 text-amber-500" />
                            <span>{t("reception.actions.setPriority")}</span>
                          </button>

                          {/* Mark Left Button */}
                          <button
                            onClick={() => handleMarkLeft(entry)}
                            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-medium text-xs px-3 py-2 rounded-xl transition-colors min-h-[40px]"
                            title={t("reception.actions.markLeft")}
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>{t("reception.actions.markLeft")}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Today's Appointments List */}
        {activeTab === "appointments" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>قائمة مواعيد اليوم المحجوزة</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {appointments.length} موعد مسجل
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-mono font-bold px-2 py-0.5 rounded-lg">
                        {apt.scheduledTime}
                      </span>
                      <h3 className="font-bold text-base text-slate-900">{apt.patientName}</h3>
                      {apt.status === "checked_in" && (
                        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                          تم الحضور (في الطابور)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>الطبيب: {apt.doctorName}</span>
                      <span>•</span>
                      <span className="font-mono" dir="ltr">{apt.guardianPhone}</span>
                      {apt.notes && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600">{apt.notes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {apt.status === "booked" ? (
                      <button
                        onClick={() => handleCheckIn(apt)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-sm transition-all min-h-[40px] flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t("reception.actions.checkIn")}</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        حاضر في الطابور
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Manual Reorder with Reason Enforcement (Scenario 7) */}
      {reorderModalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-blue-600" />
                <span>{t("reception.reorderModal.title")}</span>
              </h3>
              <button
                onClick={() => setReorderModalEntry(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReorderSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 font-medium">
                المريض: <strong className="text-slate-900">{reorderModalEntry.patientName}</strong>
              </p>

              {reorderError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{reorderError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {t("reception.reorderModal.targetPosition")}
                </label>
                <select
                  value={reorderTargetIndex}
                  onChange={(e) => setReorderTargetIndex(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {waitingEntries.map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      المرتبة رقم #{i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {t("reception.reorderModal.reasonLabel")} *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={t("reception.reorderModal.reasonPlaceholder")}
                  value={reorderReason}
                  onChange={(e) => setReorderReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReorderModalEntry(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl min-h-[40px]"
                >
                  {t("reception.reorderModal.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm min-h-[40px]"
                >
                  {t("reception.reorderModal.confirm")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Priority Selection (Paid Urgent & Critical) */}
      {priorityModalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <span>{t("reception.priorityModal.title")}</span>
              </h3>
              <button
                onClick={() => setPriorityModalEntry(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePrioritySubmit} className="space-y-4">
              <p className="text-xs text-slate-600 font-medium">
                المريض: <strong className="text-slate-900">{priorityModalEntry.patientName}</strong>
              </p>

              {priorityError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{priorityError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {t("reception.priorityModal.selectPriority")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["normal", "urgent", "critical"] as QueuePriority[]).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setSelectedPriority(p)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center min-h-[44px] ${
                        selectedPriority === p
                          ? p === "critical"
                            ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                            : p === "urgent"
                            ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                            : "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {t(`reception.priority.${p}`)}
                    </button>
                  ))}
                </div>
              </div>

              {selectedPriority === "urgent" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-3 text-xs">
                  <p className="text-amber-800">
                    {t("reception.priorityModal.urgentNotice", {
                      multiplier: String(settings.urgent_fee_multiplier),
                    })}
                  </p>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">
                      {t("reception.priorityModal.approver")}
                    </label>
                    <input
                      type="text"
                      value={priorityApprover}
                      onChange={(e) => setPriorityApprover(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">
                      {t("reception.priorityModal.reason")} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="سبب الكشف المستعجل..."
                      value={priorityReason}
                      onChange={(e) => setPriorityReason(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPriorityModalEntry(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl min-h-[40px]"
                >
                  {t("reception.priorityModal.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm min-h-[40px]"
                >
                  {t("reception.priorityModal.confirm")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Quick Booking Form */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>{t("reception.bookingModal.title")}</span>
              </h3>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickBookSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">اسم المريض *</label>
                <input
                  type="text"
                  required
                  placeholder="اسم المريض..."
                  value={bookingPatientName}
                  onChange={(e) => setBookingPatientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">رقم هاتف ولي الأمر *</label>
                <input
                  type="tel"
                  required
                  placeholder="+201..."
                  dir="ltr"
                  value={bookingPhone}
                  onChange={(e) => setBookingPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("reception.bookingModal.selectDoctor")}
                  </label>
                  <select
                    value={bookingDoctorId}
                    onChange={(e) => setBookingDoctorId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    {clinicDoctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {t("reception.bookingModal.appointmentTime")}
                  </label>
                  <input
                    type="time"
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {t("reception.bookingModal.notes")}
                </label>
                <input
                  type="text"
                  placeholder="ملاحظات الحجز..."
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl min-h-[40px]"
                >
                  {t("reception.bookingModal.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm min-h-[40px]"
                >
                  {t("reception.bookingModal.saveBooking")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
