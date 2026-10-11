import { UserRole } from "../invitations/types";
import {
  ReportFilter,
  ReportInputRecord,
  OwnerReportSummary,
} from "./types";
import { computeOwnerReport, exportReportToCsv } from "./engine";

export interface IReportsRepository {
  getQueueAndVisitRecords(
    clinicId: string,
    filter?: ReportFilter
  ): Promise<ReportInputRecord[]>;
}

export class ReportsServiceError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "ReportsServiceError";
  }
}

/**
 * Seed/mock data generator for development and testing.
 * Provides realistic operational and billing records with zero clinical details.
 */
export const SEED_REPORT_RECORDS: ReportInputRecord[] = [
  {
    id: "rec-1",
    clinicId: "clinic-pediatrics",
    doctorId: "doc-sara",
    doctorName: "د. سارة أحمد",
    priority: "normal",
    state: "completed",
    arrivalTime: "2026-10-10T09:00:00Z",
    consultationStartTime: "2026-10-10T09:15:00Z",
    completedTime: "2026-10-10T09:35:00Z",
    visitType: "new",
    price: 300,
    isPaid: true,
  },
  {
    id: "rec-2",
    clinicId: "clinic-pediatrics",
    doctorId: "doc-sara",
    doctorName: "د. سارة أحمد",
    priority: "urgent",
    state: "completed",
    arrivalTime: "2026-10-10T09:30:00Z",
    consultationStartTime: "2026-10-10T09:40:00Z",
    completedTime: "2026-10-10T10:05:00Z",
    visitType: "new",
    price: 900,
    isPaid: true,
  },
  {
    id: "rec-3",
    clinicId: "clinic-pediatrics",
    doctorId: "doc-tamer",
    doctorName: "د. تامر فوزي",
    priority: "normal",
    state: "completed",
    arrivalTime: "2026-10-10T10:00:00Z",
    consultationStartTime: "2026-10-10T10:40:00Z",
    completedTime: "2026-10-10T11:00:00Z",
    visitType: "follow_up",
    price: 150,
    isPaid: true,
  },
  {
    id: "rec-4",
    clinicId: "clinic-pediatrics",
    doctorId: "doc-tamer",
    doctorName: "د. تامر فوزي",
    priority: "normal",
    state: "left",
    arrivalTime: "2026-10-10T10:15:00Z",
    consultationStartTime: null,
    completedTime: null,
    autoClosed: false,
    visitType: "new",
    price: 300,
    isPaid: false,
  },
  {
    id: "rec-5",
    clinicId: "clinic-pediatrics",
    doctorId: "doc-sara",
    doctorName: "د. سارة أحمد",
    priority: "normal",
    state: "left",
    arrivalTime: "2026-10-10T11:00:00Z",
    consultationStartTime: null,
    completedTime: null,
    autoClosed: true,
    visitType: "new",
    price: 300,
    isPaid: false,
  },
  {
    id: "rec-6",
    clinicId: "clinic-pediatrics",
    doctorId: "doc-tamer",
    doctorName: "د. تامر فوزي",
    priority: "normal",
    state: "completed",
    arrivalTime: "2026-10-10T11:15:00Z",
    consultationStartTime: "2026-10-10T11:35:00Z",
    completedTime: "2026-10-10T11:55:00Z",
    visitType: "new",
    price: 300,
    isPaid: false, // Unpaid balance
  },
  {
    id: "rec-7",
    clinicId: "clinic-pediatrics",
    doctorId: "doc-sara",
    doctorName: "د. سارة أحمد",
    priority: "normal",
    state: "no_show",
    arrivalTime: null,
    consultationStartTime: null,
    completedTime: null,
    appointmentId: "appt-7",
    visitType: "new",
    price: 300,
    isPaid: false,
  },
  {
    id: "rec-8",
    clinicId: "clinic-pediatrics",
    doctorId: "doc-sara",
    doctorName: "د. سارة أحمد",
    priority: "normal",
    state: "completed",
    arrivalTime: "2026-10-10T12:00:00Z",
    consultationStartTime: "2026-10-10T12:20:00Z",
    completedTime: "2026-10-10T12:45:00Z",
    appointmentId: "appt-8",
    visitType: "follow_up",
    price: 150,
    isPaid: true,
  },
  {
    id: "rec-9",
    clinicId: "clinic-pediatrics",
    doctorId: "doc-tamer",
    doctorName: "د. تامر فوزي",
    priority: "urgent",
    state: "completed",
    arrivalTime: "2026-10-10T12:10:00Z",
    consultationStartTime: "2026-10-10T12:25:00Z",
    completedTime: "2026-10-10T12:50:00Z",
    visitType: "new",
    price: 900,
    isPaid: true,
  },
  {
    id: "rec-10",
    clinicId: "clinic-pediatrics",
    doctorId: "doc-sara",
    doctorName: "د. سارة أحمد",
    priority: "normal",
    state: "completed",
    arrivalTime: "2026-10-10T13:00:00Z",
    consultationStartTime: "2026-10-10T13:50:00Z",
    completedTime: "2026-10-10T14:15:00Z",
    visitType: "new",
    price: 300,
    isPaid: true,
  },
];

export class MockReportsRepository implements IReportsRepository {
  private records: ReportInputRecord[];

  constructor(initialRecords: ReportInputRecord[] = SEED_REPORT_RECORDS) {
    this.records = [...initialRecords];
  }

  async getQueueAndVisitRecords(
    clinicId: string,
    filter?: ReportFilter
  ): Promise<ReportInputRecord[]> {
    return this.records.filter((r) => {
      if (r.clinicId !== clinicId) return false;
      if (filter?.doctorId && r.doctorId !== filter.doctorId) return false;
      if (filter?.startDate && r.arrivalTime && r.arrivalTime < filter.startDate) {
        return false;
      }
      if (
        filter?.endDate &&
        r.arrivalTime &&
        r.arrivalTime > `${filter.endDate}T23:59:59Z`
      ) {
        return false;
      }
      return true;
    });
  }
}

export class ReportsService {
  constructor(private repo: IReportsRepository = new MockReportsRepository()) {}

  /**
   * Asserts actor has owner or platform admin privileges for the given clinic.
   * AGENTS.md Rule #1 (Roles first) & Rule #2 (Medical privacy).
   */
  public assertOwnerAccess(
    actor: { id: string; clinicId: string | null; roles: UserRole[] },
    targetClinicId: string
  ): void {
    const isPlatformAdmin = actor.roles.includes("platform_admin");
    const isClinicOwner =
      actor.clinicId === targetClinicId && actor.roles.includes("clinic_owner");

    if (!isPlatformAdmin && !isClinicOwner) {
      throw new ReportsServiceError(
        "FORBIDDEN",
        "Only clinic owners or platform admins can view operational reports."
      );
    }
  }

  /**
   * Retrieves aggregated operational report for a clinic.
   */
  async getOwnerReport(
    actor: { id: string; clinicId: string | null; roles: UserRole[] },
    clinicId: string,
    filter?: ReportFilter,
    options?: { baseConsultationPrice?: number; urgentFeeMultiplier?: number }
  ): Promise<OwnerReportSummary> {
    this.assertOwnerAccess(actor, clinicId);

    const records = await this.repo.getQueueAndVisitRecords(clinicId, filter);

    return computeOwnerReport(records, {
      clinicId,
      baseConsultationPrice: options?.baseConsultationPrice,
      urgentFeeMultiplier: options?.urgentFeeMultiplier,
      periodLabel: filter?.startDate
        ? `${filter.startDate} إلى ${filter.endDate || filter.startDate}`
        : "اليوم",
    });
  }

  /**
   * Formats report summary into a downloadable UTF-8 CSV string with BOM.
   */
  exportCsv(report: OwnerReportSummary): string {
    return exportReportToCsv(report);
  }
}
