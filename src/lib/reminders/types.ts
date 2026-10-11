/**
 * Types and interfaces for Med SaaS Reminders & Notification Channels (Phase 14).
 * Supports pure channel abstraction so WhatsApp or SMS can be added later
 * without modifying UI or database tables.
 */

export type ReminderType = "appointment" | "follow_up";
export type ReminderStatus = "pending" | "sent" | "failed" | "cancelled";
export type ReminderChannel = "manual" | "whatsapp" | "sms";

export interface Reminder {
  id: string;
  clinicId: string;
  appointmentId?: string | null;
  patientId: string;
  patientName: string;
  guardianPhone: string;
  doctorId?: string | null;
  doctorName?: string | null;
  reminderType: ReminderType;
  targetDate: string; // YYYY-MM-DD
  scheduledTime?: string | null; // e.g. "17:00"
  channel: ReminderChannel;
  status: ReminderStatus;
  messageText: string;
  sentAt?: string | null;
  sentBy?: string | null;
  sentByName?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ReminderTemplate {
  id: string;
  clinicId: string;
  reminderType: ReminderType;
  title: string;
  templateBody: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Payload sent to any notification channel.
 */
export interface NotificationPayload {
  recipientPhone: string;
  recipientName: string;
  message: string;
  clinicId: string;
  reminderId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Result returned by an execution channel.
 */
export interface ChannelSendResult {
  success: boolean;
  channel: ReminderChannel | string;
  timestamp: string;
  messageId?: string;
  error?: string;
  isManualCopy?: boolean;
}

/**
 * Interface implemented by all notification channels (manual, WhatsApp, SMS).
 */
export interface INotificationChannel {
  readonly id: ReminderChannel | string;
  readonly name: string;
  send(payload: NotificationPayload): Promise<ChannelSendResult>;
}
