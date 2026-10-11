/**
 * Types and interfaces for Clinic Owner Aggregate Reports (Phase 13).
 * Zero clinical content exposed.
 */

import { QueueState, QueuePriority } from "../queue/types";

export interface ReportFilter {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  doctorId?: string;
}

export interface ReportInputRecord {
  id: string;
  clinicId: string;
  doctorId: string;
  doctorName?: string;
  priority: QueuePriority;
  state: QueueState;
  arrivalTime?: string | null;
  consultationStartTime?: string | null;
  completedTime?: string | null;
  autoClosed?: boolean;
  appointmentId?: string | null;
  visitType?: "new" | "follow_up" | "consultation";
  price: number;
  isPaid: boolean;
}

export interface WaitingTimeSummary {
  averageMinutes: number;
  medianMinutes: number;
  byHour: Array<{
    hour: string; // e.g., "10:00", "11:00"
    patientsCount: number;
    avgMinutes: number;
  }>;
  byDoctor: Array<{
    doctorId: string;
    doctorName: string;
    patientsCount: number;
    avgMinutes: number;
    medianMinutes: number;
  }>;
}

export interface LeftBeforeSeenSummary {
  totalLeft: number;
  leftRatePct: number;
  manualLeftCount: number;
  autoClosedCount: number;
}

export interface AppointmentNoShowSummary {
  totalAppointments: number;
  noShowCount: number;
  noShowRatePct: number;
}

export interface LostRevenueSummary {
  estimatedLostRevenue: number;
  baseConsultationPrice: number;
  disclaimer: string;
}

export interface BillingSummary {
  totalBilled: number;
  paidTotal: number;
  unpaidTotal: number;
  paidRatePct: number;
}

export interface PaidUrgentSummary {
  count: number;
  sharePct: number;
  estimatedExtraRevenue: number;
}

export interface DoctorPerformanceBreakdown {
  doctorId: string;
  doctorName: string;
  patientsSeen: number;
  newVisits: number;
  followUpVisits: number;
  avgWaitMinutes: number;
  paidTotal: number;
  unpaidTotal: number;
}

export interface OwnerReportSummary {
  clinicId: string;
  periodLabel: string;
  totalQueueEntries: number;
  patientsSeenCount: number;
  newVisitsCount: number;
  followUpVisitsCount: number;
  waitingTime: WaitingTimeSummary;
  leftBeforeSeen: LeftBeforeSeenSummary;
  appointmentNoShow: AppointmentNoShowSummary;
  lostRevenue: LostRevenueSummary;
  billing: BillingSummary;
  paidUrgent: PaidUrgentSummary;
  doctorBreakdown: DoctorPerformanceBreakdown[];
}
