import { UserRole } from "../invitations/types";
import { logAuditAction } from "../clinical/service";
import {
  ClinicExportData,
  ClinicExportResult,
  ExportedPatient,
  ExportedAppointment,
  ExportedQueueRecord,
  ExportedReminder,
} from "./types";

export class ExportServiceError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "ExportServiceError";
  }
}

// In-memory seed datasets for export simulation
const SEED_EXPORT_PATIENTS: ExportedPatient[] = [
  {
    id: "pat-1",
    fullName: "عمر أحمد خليل",
    dateOfBirth: "2022-06-15",
    gender: "male",
    guardianPhone: "01012345678",
    guardianName: "أحمد خليل",
    createdAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "pat-2",
    fullName: "سارة محمد إبراهيم",
    dateOfBirth: "2024-01-20",
    gender: "female",
    guardianPhone: "01123456789",
    guardianName: "محمد إبراهيم",
    createdAt: "2026-02-14T09:30:00Z",
  },
  {
    id: "pat-3",
    fullName: "ياسين حسام البدري",
    dateOfBirth: "2025-08-01",
    gender: "male",
    guardianPhone: "01298765432",
    guardianName: "حسام البدري",
    createdAt: "2026-03-01T11:00:00Z",
  },
];

const SEED_EXPORT_APPOINTMENTS: ExportedAppointment[] = [
  {
    id: "apt-1",
    patientId: "pat-1",
    doctorId: "doc-sara",
    scheduledTime: "2026-10-10T11:00:00Z",
    status: "checked_in",
  },
  {
    id: "apt-2",
    patientId: "pat-2",
    doctorId: "doc-tamer",
    scheduledTime: "2026-10-10T12:00:00Z",
    status: "booked",
  },
];

const SEED_EXPORT_QUEUE: ExportedQueueRecord[] = [
  {
    id: "q-101",
    patientId: "pat-1",
    doctorId: "doc-sara",
    state: "completed",
    priority: "normal",
    arrivalTime: "2026-10-10T10:45:00Z",
    consultationStartTime: "2026-10-10T11:15:00Z",
    completedTime: "2026-10-10T11:40:00Z",
  },
  {
    id: "q-102",
    patientId: "pat-2",
    doctorId: "doc-tamer",
    state: "waiting",
    priority: "normal",
    arrivalTime: "2026-10-10T11:50:00Z",
    consultationStartTime: null,
    completedTime: null,
  },
];

const SEED_EXPORT_REMINDERS: ExportedReminder[] = [
  {
    id: "rem-1",
    patientId: "pat-1",
    targetDate: "2026-10-11",
    status: "sent",
    channel: "manual",
    sentAt: "2026-10-10T14:00:00Z",
  },
];

export class ClinicExportService {
  /**
   * Asserts actor has owner or platform admin privileges.
   * AGENTS.md Rule #1 (Roles first) & Rule #3 (Tenant isolation).
   */
  public assertExportAccess(
    actor: { id: string; clinicId: string | null; roles: UserRole[] },
    targetClinicId: string
  ): void {
    const isPlatformAdmin = actor.roles.includes("platform_admin");
    const isClinicOwner =
      actor.clinicId === targetClinicId && actor.roles.includes("clinic_owner");

    if (!isPlatformAdmin && !isClinicOwner) {
      throw new ExportServiceError(
        "FORBIDDEN",
        "Only clinic owners or platform admins are permitted to export clinic data."
      );
    }
  }

  /**
   * Generates a complete open-format export (JSON + UTF-8 CSVs) and writes an audit log.
   */
  async exportClinicData(
    actor: { id: string; clinicId: string | null; roles: UserRole[] },
    clinicId: string,
    clinicName: string = "عيادة الشروق"
  ): Promise<ClinicExportResult> {
    this.assertExportAccess(actor, clinicId);

    // Build JSON export
    const exportData: ClinicExportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: actor.id,
        actorRole: actor.roles[0] || "clinic_owner",
        clinicId,
        clinicName,
        version: "1.0",
      },
      clinic: {
        id: clinicId,
        name: clinicName,
        status: "active",
        settings: {
          timezone: "Africa/Cairo",
          baseConsultationPrice: 300,
        },
      },
      patients: SEED_EXPORT_PATIENTS,
      appointments: SEED_EXPORT_APPOINTMENTS,
      queueHistory: SEED_EXPORT_QUEUE,
      reminders: SEED_EXPORT_REMINDERS,
    };

    // Build CSVs with UTF-8 BOM (\uFEFF) for Arabic Excel compatibility
    const csvPatients = this.buildPatientsCsv(exportData.patients);
    const csvAppointments = this.buildAppointmentsCsv(exportData.appointments);
    const csvQueue = this.buildQueueCsv(exportData.queueHistory);

    // AGENTS.md Rule #6: Audit log of clinic export
    logAuditAction({
      clinicId,
      actorId: actor.id,
      actorRole: actor.roles[0] || "clinic_owner",
      action: "CLINIC_DATA_EXPORT",
      entity: "clinic_export",
      entityId: clinicId,
      details: {
        patientsCount: exportData.patients.length,
        appointmentsCount: exportData.appointments.length,
        queueCount: exportData.queueHistory.length,
        timestamp: exportData.metadata.exportedAt,
      },
    });

    return {
      json: exportData,
      csvPatients,
      csvAppointments,
      csvQueue,
    };
  }

  private buildPatientsCsv(patients: ExportedPatient[]): string {
    const lines = ["\uFEFFمعرف المريض,الاسم بالكامل,تاريخ الميلاد,النوع,هاتف ولي الأمر,اسم ولي الأمر,تاريخ التسجيل"];
    for (const p of patients) {
      lines.push(
        `"${p.id}","${p.fullName}","${p.dateOfBirth}","${p.gender}","${p.guardianPhone || ""}","${p.guardianName || ""}","${p.createdAt}"`
      );
    }
    return lines.join("\n");
  }

  private buildAppointmentsCsv(appts: ExportedAppointment[]): string {
    const lines = ["\uFEFFمعرف الموعد,معرف المريض,معرف الطبيب,وقت الموعد,الحالة"];
    for (const a of appts) {
      lines.push(`"${a.id}","${a.patientId}","${a.doctorId}","${a.scheduledTime}","${a.status}"`);
    }
    return lines.join("\n");
  }

  private buildQueueCsv(queue: ExportedQueueRecord[]): string {
    const lines = ["\uFEFFمعرف الطابور,معرف المريض,معرف الطبيب,الحالة,الأولوية,وقت الوصول,بدء الكشف,اكتمال الكشف"];
    for (const q of queue) {
      lines.push(
        `"${q.id}","${q.patientId}","${q.doctorId}","${q.state}","${q.priority}","${q.arrivalTime || ""}","${q.consultationStartTime || ""}","${q.completedTime || ""}"`
      );
    }
    return lines.join("\n");
  }
}
