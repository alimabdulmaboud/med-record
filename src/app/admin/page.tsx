"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import {
  Building2,
  Users,
  Mail,
  History,
  Plus,
  Ban,
  Archive,
  RefreshCw,
  Edit2,
  Copy,
  Check,
  AlertTriangle,
  Search,
  CheckCircle2,
  ExternalLink,
  Info,
} from "lucide-react";

interface Clinic {
  id: string;
  name: string;
  status: "active" | "suspended" | "archived";
  usersCount: number;
  createdAt: string;
}

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  clinicName: string;
  clinicId: string | null;
  role: string;
  isArchived: boolean;
}

interface InviteItem {
  id: string;
  email: string;
  clinicName: string;
  clinicId: string;
  role: string;
  token: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  expiresAt: string;
}

interface AuditItem {
  id: string;
  actor: string;
  action: string;
  entity: string;
  clinicName: string;
  timestamp: string;
  details: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"clinics" | "users" | "invitations" | "audit">("clinics");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // 1. Clinics State
  const [clinics, setClinics] = useState<Clinic[]>([
    {
      id: "c1000000-0000-0000-0000-000000000001",
      name: "عيادة النور لطب الأطفال",
      status: "active",
      usersCount: 3,
      createdAt: "2026-10-10",
    },
    {
      id: "c2000000-0000-0000-0000-000000000002",
      name: "مركز الحياة للتغذية العلاجية",
      status: "active",
      usersCount: 3,
      createdAt: "2026-10-10",
    },
  ]);

  const [newClinicName, setNewClinicName] = useState("");
  const [showCreateClinic, setShowCreateClinic] = useState(false);
  const [editingClinicId, setEditingClinicId] = useState<string | null>(null);
  const [editClinicName, setEditClinicName] = useState("");

  // 2. Users State
  const [users, setUsers] = useState<UserItem[]>([
    {
      id: "u1",
      fullName: "د. تامر",
      email: "owner.peds@med.local",
      clinicName: "عيادة النور لطب الأطفال",
      clinicId: "c1000000-0000-0000-0000-000000000001",
      role: t("roles.clinic_owner"),
      isArchived: false,
    },
    {
      id: "u2",
      fullName: "د. سارة",
      email: "doctor.peds@med.local",
      clinicName: "عيادة النور لطب الأطفال",
      clinicId: "c1000000-0000-0000-0000-000000000001",
      role: t("roles.doctor"),
      isArchived: false,
    },
    {
      id: "u3",
      fullName: "مريم",
      email: "reception.peds@med.local",
      clinicName: "عيادة النور لطب الأطفال",
      clinicId: "c1000000-0000-0000-0000-000000000001",
      role: t("roles.receptionist"),
      isArchived: false,
    },
    {
      id: "u4",
      fullName: "د. هاني",
      email: "owner.nutrition@med.local",
      clinicName: "مركز الحياة للتغذية العلاجية",
      clinicId: "c2000000-0000-0000-0000-000000000002",
      role: t("roles.clinic_owner"),
      isArchived: false,
    },
    {
      id: "u5",
      fullName: "د. نورهان",
      email: "doctor.nutrition@med.local",
      clinicName: "مركز الحياة للتغذية العلاجية",
      clinicId: "c2000000-0000-0000-0000-000000000002",
      role: t("roles.doctor"),
      isArchived: false,
    },
    {
      id: "u6",
      fullName: "يوسف",
      email: "reception.nutrition@med.local",
      clinicName: "مركز الحياة للتغذية العلاجية",
      clinicId: "c2000000-0000-0000-0000-000000000002",
      role: t("roles.receptionist"),
      isArchived: false,
    },
  ]);

  // 3. Invitations State
  const [invitations, setInvitations] = useState<InviteItem[]>([
    {
      id: "inv-1",
      email: "new.owner@example.com",
      clinicName: "عيادة النور لطب الأطفال",
      clinicId: "c1000000-0000-0000-0000-000000000001",
      role: t("roles.clinic_owner"),
      token: "dev-sample-token-abc12345",
      status: "pending",
      expiresAt: "2026-10-17",
    },
  ]);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteClinicId, setInviteClinicId] = useState(clinics[0]?.id || "");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [justCreatedInvite, setJustCreatedInvite] = useState<{ email: string; link: string } | null>(null);

  // 4. Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([
    {
      id: "log-1",
      actor: "admin@med.local",
      action: "CREATE_CLINIC",
      entity: "عيادة النور لطب الأطفال",
      clinicName: "عيادة النور لطب الأطفال",
      timestamp: "2026-10-10 01:00",
      details: "إنشاء سجل العيادة وتحديد النواة المشتركة",
    },
    {
      id: "log-2",
      actor: "admin@med.local",
      action: "CREATE_CLINIC",
      entity: "مركز الحياة للتغذية العلاجية",
      clinicName: "مركز الحياة للتغذية العلاجية",
      timestamp: "2026-10-10 01:05",
      details: "إنشاء سجل المركز وتفعيل وحدة التغذية",
    },
    {
      id: "log-3",
      actor: "admin@med.local",
      action: "INVITE_USER",
      entity: "new.owner@example.com",
      clinicName: "عيادة النور لطب الأطفال",
      timestamp: "2026-10-10 01:10",
      details: "إصدار رابط دعوة لمالك العيادة بصلاحية 7 أيام",
    },
  ]);

  const [auditFilterAction, setAuditFilterAction] = useState("");

  // Handlers for Clinic Actions
  const handleCreateClinic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicName.trim()) return;

    const id = `clinic-${Date.now()}`;
    const createdClinic: Clinic = {
      id,
      name: newClinicName.trim(),
      status: "active",
      usersCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setClinics([...clinics, createdClinic]);
    setAuditLogs([
      {
        id: `log-${Date.now()}`,
        actor: "admin@med.local",
        action: "CREATE_CLINIC",
        entity: createdClinic.name,
        clinicName: createdClinic.name,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
        details: `إنشاء عيادة جديدة (${createdClinic.name})`,
      },
      ...auditLogs,
    ]);

    setNewClinicName("");
    setShowCreateClinic(false);
  };

  const handleUpdateClinicName = (id: string) => {
    if (!editClinicName.trim()) return;
    setClinics(
      clinics.map((c) => (c.id === id ? { ...c, name: editClinicName.trim() } : c))
    );

    setAuditLogs([
      {
        id: `log-${Date.now()}`,
        actor: "admin@med.local",
        action: "UPDATE_CLINIC_NAME",
        entity: editClinicName.trim(),
        clinicName: editClinicName.trim(),
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
        details: `تعديل اسم العيادة إلى ${editClinicName.trim()}`,
      },
      ...auditLogs,
    ]);

    setEditingClinicId(null);
    setEditClinicName("");
  };

  const handleToggleSuspend = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    setClinics(clinics.map((c) => (c.id === id ? { ...c, status: newStatus as any } : c)));

    setAuditLogs([
      {
        id: `log-${Date.now()}`,
        actor: "admin@med.local",
        action: newStatus === "suspended" ? "SUSPEND_CLINIC" : "UNSUSPEND_CLINIC",
        entity: id,
        clinicName: clinics.find((c) => c.id === id)?.name || "",
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
        details: newStatus === "suspended" ? "تعليق وصول العيادة ومستخدميها" : "إعادة تفعيل وصول العيادة",
      },
      ...auditLogs,
    ]);
  };

  const handleToggleArchiveClinic = (id: string, isArchived: boolean) => {
    const newStatus = isArchived ? "active" : "archived";
    setClinics(clinics.map((c) => (c.id === id ? { ...c, status: newStatus as any } : c)));

    setAuditLogs([
      {
        id: `log-${Date.now()}`,
        actor: "admin@med.local",
        action: isArchived ? "RESTORE_CLINIC" : "ARCHIVE_CLINIC",
        entity: id,
        clinicName: clinics.find((c) => c.id === id)?.name || "",
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
        details: isArchived ? "استعادة العيادة من الأرشيف" : "أرشفة العيادة (حذف غير نهائي)",
      },
      ...auditLogs,
    ]);
  };

  // Handlers for User Actions
  const handleToggleArchiveUser = (id: string, currentlyArchived: boolean) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, isArchived: !currentlyArchived } : u)));

    setAuditLogs([
      {
        id: `log-${Date.now()}`,
        actor: "admin@med.local",
        action: currentlyArchived ? "RESTORE_USER" : "ARCHIVE_USER",
        entity: id,
        clinicName: users.find((u) => u.id === id)?.clinicName || "",
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
        details: currentlyArchived ? "استعادة المستخدم وتفعيل إمكانية دخوله" : "أرشفة حساب المستخدم وتعطيل دخوله",
      },
      ...auditLogs,
    ]);
  };

  // Handlers for Invitation Actions
  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteClinicId) return;

    const clinic = clinics.find((c) => c.id === inviteClinicId);
    const token = `token-${Date.now()}`;
    const newInvite: InviteItem = {
      id: `inv-${Date.now()}`,
      email: inviteEmail.trim(),
      clinicId: inviteClinicId,
      clinicName: clinic?.name || "",
      role: t("roles.clinic_owner"),
      token,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    };

    setInvitations([newInvite, ...invitations]);
    setAuditLogs([
      {
        id: `log-${Date.now()}`,
        actor: "admin@med.local",
        action: "INVITE_USER",
        entity: newInvite.email,
        clinicName: newInvite.clinicName,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
        details: `إصدار رابط دعوة لمالك العيادة (${newInvite.email})`,
      },
      ...auditLogs,
    ]);

    setInviteEmail("");
    setShowInviteModal(false);
    const link = typeof window !== "undefined" ? `${window.location.origin}/invite/accept?token=${token}` : `/invite/accept?token=${token}`;
    setJustCreatedInvite({ email: newInvite.email, link });
  };

  const handleRevokeInvite = (id: string) => {
    setInvitations(
      invitations.map((inv) => (inv.id === id ? { ...inv, status: "revoked" } : inv))
    );

    setAuditLogs([
      {
        id: `log-${Date.now()}`,
        actor: "admin@med.local",
        action: "REVOKE_INVITATION",
        entity: id,
        clinicName: invitations.find((i) => i.id === id)?.clinicName || "",
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
        details: "إلغاء رابط الدعوة وتعطيل صلاحيته",
      },
      ...auditLogs,
    ]);
  };

  const handleCopyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/accept?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const filteredAuditLogs = auditFilterAction
    ? auditLogs.filter((l) => l.action === auditFilterAction)
    : auditLogs;

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("clinics")}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "clinics"
              ? "border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{t("admin.tabs.clinics")}</span>
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-mono">
            {clinics.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "users"
              ? "border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t("admin.tabs.users")}</span>
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-mono">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("invitations")}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "invitations"
              ? "border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>{t("admin.tabs.invitations")}</span>
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-mono">
            {invitations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "audit"
              ? "border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <History className="w-4 h-4" />
          <span>{t("admin.tabs.auditLog")}</span>
          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-mono">
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: CLINICS */}
      {activeTab === "clinics" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {t("admin.clinics.title")}
              </h2>
              <p className="text-xs text-slate-500">
                {t("admin.clinics.suspendedNotice")}
              </p>
            </div>
            <button
              onClick={() => setShowCreateClinic(true)}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg text-sm shadow-sm transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{t("admin.clinics.createClinic")}</span>
            </button>
          </div>

          {/* Create Clinic Inline Form */}
          {showCreateClinic && (
            <form
              onSubmit={handleCreateClinic}
              className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl flex flex-col sm:flex-row gap-3 items-end"
            >
              <div className="flex-1 w-full space-y-1">
                <label className="text-xs font-semibold text-purple-900 block">
                  {t("admin.clinics.clinicName")}
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: عيادة الأمل لجراحة العظام"
                  value={newClinicName}
                  onChange={(e) => setNewClinicName(e.target.value)}
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  className="bg-purple-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {t("common.save")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateClinic(false)}
                  className="bg-white text-slate-700 border border-slate-300 text-sm font-medium py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          )}

          {/* Clinics Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">{t("admin.clinics.clinicName")}</th>
                    <th className="py-3 px-4">{t("admin.clinics.usersCount")}</th>
                    <th className="py-3 px-4">{t("admin.clinics.status")}</th>
                    <th className="py-3 px-4">{t("common.date")}</th>
                    <th className="py-3 px-4 text-center">{t("admin.clinics.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clinics.map((clinic) => (
                    <tr key={clinic.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {editingClinicId === clinic.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editClinicName}
                              onChange={(e) => setEditClinicName(e.target.value)}
                              className="px-2 py-1 border border-slate-300 rounded text-sm w-48"
                            />
                            <button
                              onClick={() => handleUpdateClinicName(clinic.id)}
                              className="text-xs bg-purple-600 text-white px-2 py-1 rounded"
                            >
                              {t("common.save")}
                            </button>
                            <button
                              onClick={() => setEditingClinicId(null)}
                              className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded"
                            >
                              {t("common.cancel")}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{clinic.name}</span>
                            <button
                              onClick={() => {
                                setEditingClinicId(clinic.id);
                                setEditClinicName(clinic.name);
                              }}
                              className="text-slate-400 hover:text-purple-600 transition-colors"
                              title={t("admin.clinics.editName")}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {clinic.usersCount}
                      </td>
                      <td className="py-3.5 px-4">
                        {clinic.status === "active" && (
                          <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {t("admin.clinics.statusActive")}
                          </span>
                        )}
                        {clinic.status === "suspended" && (
                          <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">
                            <Ban className="w-3 h-3 text-amber-600" />
                            {t("admin.clinics.statusSuspended")}
                          </span>
                        )}
                        {clinic.status === "archived" && (
                          <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full font-medium">
                            <Archive className="w-3 h-3 text-slate-500" />
                            {t("admin.clinics.statusArchived")}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                        {clinic.createdAt}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Suspend / Unsuspend */}
                          <button
                            onClick={() => handleToggleSuspend(clinic.id, clinic.status)}
                            className={`text-xs px-2.5 py-1 rounded font-medium border transition-colors ${
                              clinic.status === "suspended"
                                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {clinic.status === "suspended"
                              ? t("admin.clinics.unsuspend")
                              : t("admin.clinics.suspend")}
                          </button>

                          {/* Archive / Restore */}
                          <button
                            onClick={() =>
                              handleToggleArchiveClinic(clinic.id, clinic.status === "archived")
                            }
                            className={`text-xs px-2.5 py-1 rounded font-medium border transition-colors ${
                              clinic.status === "archived"
                                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                            }`}
                          >
                            {clinic.status === "archived"
                              ? t("admin.clinics.restore")
                              : t("admin.clinics.archive")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              {t("admin.users.title")}
            </h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">{t("admin.users.userName")}</th>
                    <th className="py-3 px-4">{t("admin.users.email")}</th>
                    <th className="py-3 px-4">{t("admin.users.clinic")}</th>
                    <th className="py-3 px-4">{t("admin.users.roles")}</th>
                    <th className="py-3 px-4">{t("admin.users.status")}</th>
                    <th className="py-3 px-4 text-center">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {u.fullName}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 select-all" dir="ltr">
                        {u.email}
                      </td>
                      <td className="py-3 px-4 text-slate-700 text-xs">
                        {u.clinicName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-medium">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.isArchived ? (
                          <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-medium">
                            {t("admin.users.statusArchived")}
                          </span>
                        ) : (
                          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                            {t("admin.users.statusActive")}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleArchiveUser(u.id, u.isArchived)}
                          className={`text-xs px-2.5 py-1 rounded font-medium border transition-colors ${
                            u.isArchived
                              ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          }`}
                        >
                          {u.isArchived ? t("admin.users.restoreUser") : t("admin.users.archiveUser")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INVITATIONS */}
      {activeTab === "invitations" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {t("admin.invitations.title")}
              </h2>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg text-sm shadow-sm transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{t("admin.invitations.inviteOwner")}</span>
            </button>
          </div>

          {/* Dev Environment Notice: Direct Links */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-blue-950 mb-1">
                تنبيه بيئة التطوير (Localhost):
              </p>
              <p>
                نظراً لعدم ربط مزود SMTP خارجي فعلي (مثل SendGrid أو AWS SES) في بيئة العمل المحلية، لا يتم إرسال إيميلات عبر الإنترنت إلى صندوق الوارد الخاص بك (Inbox). بدلاً من ذلك، يقوم النظام بتوليد <strong>رابط قبول الدعوة المباشر المشفر</strong>؛ يمكنك الضغط على زر <strong>"نسخ الرابط"</strong> بجوار أي دعوة لفتحه وتعيين كلمة المرور وتفعيل الحساب فوراً.
              </p>
            </div>
          </div>

          {/* Just Created Invite Link Modal */}
          {justCreatedInvite && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 space-y-3 shadow-xs animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>تم إصدار رابط الدعوة للمستخدم ({justCreatedInvite.email}) بنجاح!</span>
                </div>
                <button
                  onClick={() => setJustCreatedInvite(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-emerald-800">
                انسخ الرابط التالي أو افتحه مباشرة في المتصفح لإتمام التسجيل وقبول الدعوة:
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  dir="ltr"
                  value={justCreatedInvite.link}
                  className="text-xs font-mono bg-white border border-emerald-300 rounded-lg p-2.5 flex-1 select-all text-slate-800"
                />
                <button
                  onClick={() => handleCopyInviteLink(justCreatedInvite.link.split("token=")[1])}
                  className="inline-flex items-center justify-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-lg shadow-xs transition-colors shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ الرابط</span>
                </button>
                <a
                  href={justCreatedInvite.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 text-xs bg-white hover:bg-slate-50 text-emerald-800 border border-emerald-300 font-bold px-4 py-2.5 rounded-lg shadow-xs transition-colors shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                  <span>فتح الرابط الآن</span>
                </a>
              </div>
            </div>
          )}

          {/* Invite Modal / Inline Form */}
          {showInviteModal && (
            <form
              onSubmit={handleSendInvite}
              className="p-5 bg-purple-50/50 border border-purple-200 rounded-xl space-y-4"
            >
              <h3 className="text-sm font-bold text-purple-900">
                {t("admin.invitations.inviteOwner")}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t("admin.invitations.selectClinic")}
                  </label>
                  <select
                    value={inviteClinicId}
                    onChange={(e) => setInviteClinicId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {clinics
                      .filter((c) => c.status !== "archived")
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    {t("admin.invitations.recipientEmail")}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="doctor@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="bg-purple-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                  {t("admin.invitations.inviteOwner")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="bg-white text-slate-700 border border-slate-300 text-sm font-medium py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          )}

          {/* Invitations Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">{t("admin.invitations.recipientEmail")}</th>
                    <th className="py-3 px-4">{t("admin.users.clinic")}</th>
                    <th className="py-3 px-4">{t("admin.users.roles")}</th>
                    <th className="py-3 px-4">{t("admin.invitations.status")}</th>
                    <th className="py-3 px-4">{t("admin.invitations.expiry")}</th>
                    <th className="py-3 px-4 text-center">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-900 select-all" dir="ltr">
                        {inv.email}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        {inv.clinicName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded font-medium">
                          {inv.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {inv.status === "pending" && (
                          <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">
                            قيد الانتظار
                          </span>
                        )}
                        {inv.status === "accepted" && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
                            مقبولة
                          </span>
                        )}
                        {inv.status === "revoked" && (
                          <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full font-medium">
                            ملغاة
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                        {inv.expiresAt}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleCopyInviteLink(inv.token)}
                            className="inline-flex items-center gap-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded transition-colors"
                          >
                            {copiedToken === inv.token ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-500" />
                            )}
                            <span>{t("admin.invitations.copyLink")}</span>
                          </button>

                          {inv.status === "pending" && (
                            <button
                              onClick={() => handleRevokeInvite(inv.id)}
                              className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded transition-colors"
                            >
                              {t("admin.invitations.revoke")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              {t("admin.audit.title")}
            </h2>

            {/* Filter by Action */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{t("admin.audit.filterAction")}:</span>
              <select
                value={auditFilterAction}
                onChange={(e) => setAuditFilterAction(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">{t("admin.audit.allActions")}</option>
                <option value="CREATE_CLINIC">CREATE_CLINIC</option>
                <option value="UPDATE_CLINIC_NAME">UPDATE_CLINIC_NAME</option>
                <option value="SUSPEND_CLINIC">SUSPEND_CLINIC</option>
                <option value="UNSUSPEND_CLINIC">UNSUSPEND_CLINIC</option>
                <option value="ARCHIVE_CLINIC">ARCHIVE_CLINIC</option>
                <option value="RESTORE_CLINIC">RESTORE_CLINIC</option>
                <option value="INVITE_USER">INVITE_USER</option>
                <option value="ACCEPT_INVITATION">ACCEPT_INVITATION</option>
                <option value="REVOKE_INVITATION">REVOKE_INVITATION</option>
                <option value="ARCHIVE_USER">ARCHIVE_USER</option>
                <option value="RESTORE_USER">RESTORE_USER</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                  <tr>
                    <th className="py-3 px-4">{t("admin.audit.date")}</th>
                    <th className="py-3 px-4">{t("admin.audit.actor")}</th>
                    <th className="py-3 px-4">{t("admin.audit.action")}</th>
                    <th className="py-3 px-4">{t("admin.audit.entity")}</th>
                    <th className="py-3 px-4">{t("admin.audit.details")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium" dir="ltr">
                        {log.actor}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-sans">
                        {log.entity}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-sans">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
