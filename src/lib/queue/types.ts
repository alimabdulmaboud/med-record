export type QueueState =
  | "booked"
  | "waiting"
  | "in_consultation"
  | "completed"
  | "left"
  | "no_show"
  | "cancelled";

export const TERMINAL_QUEUE_STATES: readonly QueueState[] = [
  "completed",
  "left",
  "no_show",
  "cancelled",
] as const;

export type QueuePriority = "normal" | "urgent" | "critical";

export interface QueueClinicSettings {
  arrive_before_minutes: number; // default 15
  skip_alert_minutes: number;    // default 60
  urgent_enabled: boolean;       // default false
  urgent_fee_multiplier: number; // default 3
  end_of_day_time: string;       // "HH:MM", default "22:00"
}

export interface QueueEntry {
  id: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  doctorId?: string | null;
  appointmentId?: string | null;
  scheduledTime?: string | null;       // ISO string if booked
  arrivalTime?: string | null;         // ISO string when patient arrived
  calledTime?: string | null;          // ISO string when called into consultation
  consultationStartTime?: string | null;
  completedTime?: string | null;
  leftTime?: string | null;
  state: QueueState;
  priority: QueuePriority;
  orderIndex: number;                  // Computed rank/order key
  autoClosed: boolean;
  skippedAt?: string | null;           // ISO timestamp when first skipped by later arrival
  snoozedUntil?: string | null;        // ISO timestamp for skip alert snooze
  urgentMultiplier?: number;
  urgentReason?: string | null;
  urgentApproverId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QueueTransitionEvent {
  id: string;
  clinicId: string;
  queueEntryId: string;
  actorId: string;
  actorRole: string;
  eventType:
    | "STATE_CHANGE"
    | "CHECK_IN"
    | "CALL_NEXT"
    | "COMPLETE"
    | "MANUAL_REORDER"
    | "PRIORITY_CHANGE"
    | "SNOOZE_ALERT"
    | "AUTO_CLOSE"
    | "MARK_LEFT"
    | "NO_SHOW"
    | "CANCEL";
  fromState?: QueueState;
  toState?: QueueState;
  fromOrderIndex?: number;
  toOrderIndex?: number;
  reason?: string | null;
  approverId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface QueueSkipAlert {
  queueEntryId: string;
  patientName: string;
  arrivalTime: string;
  waitingMinutes: number;
  skippedAt: string;
  skippedDurationMinutes: number;
  skippedByPatientId: string;
  snoozedUntil?: string | null;
}

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId?: string | null;
  scheduledTime: string;
  status: "booked" | "completed" | "cancelled" | "no_show";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  archivedBy?: string | null;
}
