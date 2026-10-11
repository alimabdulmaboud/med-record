"use client";

import { useState, useMemo } from "react";
import { t } from "@/lib/i18n";
import { Reminder, ReminderTemplate } from "@/lib/reminders/types";
import {
  SEED_REMINDERS,
  DEFAULT_REMINDER_TEMPLATES,
  getTomorrowDateString,
  RemindersService,
} from "@/lib/reminders/service";
import {
  Bell,
  Check,
  Copy,
  Clock,
  Phone,
  Calendar,
  UserCheck,
  AlertCircle,
  Edit3,
  Sparkles,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface RemindersWorkspaceProps {
  actor?: {
    id: string;
    name: string;
    clinicId: string | null;
    roles: any[];
  };
}

export function RemindersWorkspace({ actor }: RemindersWorkspaceProps) {
  const currentActor = actor || {
    id: "user-rec-1",
    name: "مريم فؤاد (الاستقبال)",
    clinicId: "clinic-pediatrics",
    roles: ["receptionist"],
  };

  const tomorrowStr = useMemo(() => getTomorrowDateString(), []);
  const todayStr = useMemo(() => new Date().toISOString().substring(0, 10), []);

  const [selectedDate, setSelectedDate] = useState<string>(tomorrowStr);
  const [reminders, setReminders] = useState<Reminder[]>(SEED_REMINDERS);
  const [templates, setTemplates] = useState<ReminderTemplate[]>(DEFAULT_REMINDER_TEMPLATES);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedReminderForEdit, setSelectedReminderForEdit] = useState<Reminder | null>(null);
  const [editedMessage, setEditedMessage] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter reminders for the selected target date
  const filteredReminders = useMemo(() => {
    return reminders.filter((r) => r.targetDate === selectedDate);
  }, [reminders, selectedDate]);

  // Status counts
  const pendingCount = useMemo(
    () => filteredReminders.filter((r) => r.status === "pending").length,
    [filteredReminders]
  );
  const sentCount = useMemo(
    () => filteredReminders.filter((r) => r.status === "sent").length,
    [filteredReminders]
  );

  // Copy message to clipboard
  const handleCopyMessage = async (reminder: Reminder) => {
    try {
      await navigator.clipboard.writeText(reminder.messageText);
      setCopiedId(reminder.id);
      showToast(t("reminders.copied"));
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // Fallback
      showToast("تعذر النسخ للحافظة");
    }
  };

  // Mark reminder as sent (One-tap action)
  const handleMarkSent = (reminder: Reminder) => {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === reminder.id) {
          return {
            ...r,
            status: "sent",
            sentAt: now.toISOString(),
            sentBy: currentActor.id,
            sentByName: currentActor.name,
          };
        }
        return r;
      })
    );

    showToast(`${t("reminders.sentSuccess")} - ${reminder.patientName}`);
  };

  // Open edit message modal
  const handleOpenEdit = (reminder: Reminder) => {
    setSelectedReminderForEdit(reminder);
    setEditedMessage(reminder.messageText);
  };

  // Save edited message
  const handleSaveEditedMessage = () => {
    if (!selectedReminderForEdit) return;
    setReminders((prev) =>
      prev.map((r) =>
        r.id === selectedReminderForEdit.id ? { ...r, messageText: editedMessage } : r
      )
    );
    setSelectedReminderForEdit(null);
    showToast("تم تحديث نص التذكير بنجاح");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <span>{t("reminders.title")}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("reminders.subtitle")}
          </p>
        </div>

        {/* Date Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedDate(tomorrowStr)}
            className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all ${
              selectedDate === tomorrowStr
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {t("reminders.tomorrow")} ({tomorrowStr})
          </button>
          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all ${
              selectedDate === todayStr
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {t("reminders.today")} ({todayStr})
          </button>
        </div>
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            {t("reminders.totalReminders")}
          </span>
          <p className="text-2xl font-extrabold text-slate-900 font-mono">
            {filteredReminders.length}
          </p>
          <span className="text-[11px] text-slate-400">مواعيد مسجلة بالتاريخ</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            {t("reminders.pendingCount")}
          </span>
          <p className="text-2xl font-extrabold text-amber-600 font-mono">
            {pendingCount}
          </p>
          <span className="text-[11px] text-amber-600/80 font-medium">
            تتطلب اتصال أو نسخ رسالة
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            {t("reminders.sentCount")}
          </span>
          <p className="text-2xl font-extrabold text-emerald-600 font-mono">
            {sentCount}
          </p>
          <span className="text-[11px] text-emerald-600/80 font-medium">
            تم توثيق تذكيرهم
          </span>
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {filteredReminders.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">{t("reminders.noReminders")}</p>
            <p className="text-xs text-slate-500">
              جميع مواعيد هذا اليوم خالية أو تمت معالجتها بالكامل.
            </p>
          </div>
        ) : (
          filteredReminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all shadow-sm space-y-4 ${
                reminder.status === "sent"
                  ? "border-emerald-200 bg-emerald-50/20"
                  : "border-slate-200 hover:border-blue-300"
              }`}
            >
              {/* Top row: Patient Info & Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">
                      {reminder.patientName}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                        reminder.reminderType === "appointment"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {reminder.reminderType === "appointment"
                        ? t("reminders.appointment")
                        : t("reminders.followUp")}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-mono" dir="ltr">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {reminder.guardianPhone}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {reminder.scheduledTime || "17:00"}
                    </span>
                    <span>•</span>
                    <span>الطبيب: {reminder.doctorName || "عيادة الأطفال"}</span>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-2 shrink-0">
                  {reminder.status === "sent" ? (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                        <Check className="w-3.5 h-3.5" />
                        <span>{t("reminders.sentCount")}</span>
                      </span>
                      {reminder.sentAt && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          بواسطة: {reminder.sentByName || "الاستقبال"}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full border border-amber-200">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{t("reminders.pendingCount")}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Message Box (Ready Arabic text to copy) */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-sans relative group">
                <p className="line-clamp-2 select-all">{reminder.messageText}</p>
              </div>

              {/* Action Buttons: 1-Tap Copy & 1-Tap Mark Sent */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  قناة الإرسال: {t("reminders.manualChannel")}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(reminder)}
                    title="تعديل نص الرسالة"
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-transparent transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleCopyMessage(reminder)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs hover:border-slate-400 transition-all min-h-[38px]"
                  >
                    {copiedId === reminder.id ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">{t("reminders.copied")}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-blue-600" />
                        <span>{t("reminders.copyMessage")}</span>
                      </>
                    )}
                  </button>

                  {reminder.status !== "sent" && (
                    <button
                      onClick={() => handleMarkSent(reminder)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all min-h-[38px]"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{t("reminders.markSent")}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Reminder Message Modal */}
      {selectedReminderForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                تعديل نص التذكير للمريض: {selectedReminderForEdit.patientName}
              </h3>
              <button
                onClick={() => setSelectedReminderForEdit(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                نص الرسالة المجهز:
              </label>
              <textarea
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                rows={4}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
              />
              <p className="text-[11px] text-slate-400">
                {t("reminders.templateHelp")}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedReminderForEdit(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveEditedMessage}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                حفظ التعديل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
