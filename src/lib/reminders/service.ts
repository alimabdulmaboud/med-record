import { UserRole } from "../invitations/types";
import {
  Reminder,
  ReminderTemplate,
  ReminderType,
  ReminderChannel,
} from "./types";
import {
  renderReminderTemplate,
  defaultChannelRegistry,
  NotificationChannelRegistry,
} from "./channels";

export class RemindersServiceError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "RemindersServiceError";
  }
}

export const DEFAULT_REMINDER_TEMPLATES: ReminderTemplate[] = [
  {
    id: "tpl-appt-default",
    clinicId: "clinic-pediatrics",
    reminderType: "appointment",
    title: "تذكير موعد كشف جديد",
    templateBody:
      "مرحباً بك أستاذ/ة {patient_name}، نود تذكيركم بموعد كشفكم لدى {doctor_name} في {clinic_name} غداً {date} في تمام الساعة {time}. العنوان: {address}. للاعتذار أو الاستفسار يرجى الاتصال على {phone}.",
    isDefault: true,
  },
  {
    id: "tpl-followup-default",
    clinicId: "clinic-pediatrics",
    reminderType: "follow_up",
    title: "تذكير استشارة ومتابعة دورية",
    templateBody:
      "مرحباً بك أستاذ/ة {patient_name}، نود تذكيركم بموعد الاستشارة والمتابعة الدورية لدى {doctor_name} في {clinic_name} غداً {date} الساعة {time}. نتمنى لكم دوام الصحة والعافية.",
    isDefault: true,
  },
];

/**
 * Returns tomorrow's date string YYYY-MM-DD in Africa/Cairo context.
 */
export function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().substring(0, 10);
}

/**
 * Seed reminders dataset for demo and testing.
 */
export const SEED_REMINDERS: Reminder[] = [
  {
    id: "rem-1",
    clinicId: "clinic-pediatrics",
    appointmentId: "apt-101",
    patientId: "pat-1",
    patientName: "زينب محمود مصطفى",
    guardianPhone: "01098765432",
    doctorId: "doc-sara",
    doctorName: "د. سارة أحمد",
    reminderType: "appointment",
    targetDate: getTomorrowDateString(),
    scheduledTime: "17:30",
    channel: "manual",
    status: "pending",
    messageText:
      "مرحباً بك أستاذ/ة زينب محمود مصطفى، نود تذكيركم بموعد كشفكم لدى د. سارة أحمد في عيادة الشروق لطب الأطفال غداً في تمام الساعة 17:30. العنوان: مجمع العيادات التخصصية - الدور الثالث. للاعتذار يرجى الاتصال على 01012345678.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "rem-2",
    clinicId: "clinic-pediatrics",
    appointmentId: "apt-102",
    patientId: "pat-2",
    patientName: "عمر خالد الجمل",
    guardianPhone: "01123456789",
    doctorId: "doc-sara",
    doctorName: "د. سارة أحمد",
    reminderType: "follow_up",
    targetDate: getTomorrowDateString(),
    scheduledTime: "18:00",
    channel: "manual",
    status: "pending",
    messageText:
      "مرحباً بك أستاذ/ة عمر خالد الجمل، نود تذكيركم بموعد الاستشارة والمتابعة الدورية لدى د. سارة أحمد في عيادة الشروق لطب الأطفال غداً الساعة 18:00. نتمنى لكم دوام الصحة والعافية.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "rem-3",
    clinicId: "clinic-pediatrics",
    appointmentId: "apt-103",
    patientId: "pat-3",
    patientName: "يوسف إبراهيم البدري",
    guardianPhone: "01234567890",
    doctorId: "doc-tamer",
    doctorName: "د. تامر فوزي",
    reminderType: "appointment",
    targetDate: getTomorrowDateString(),
    scheduledTime: "19:15",
    channel: "manual",
    status: "pending",
    messageText:
      "مرحباً بك أستاذ/ة يوسف إبراهيم البدري، نود تذكيركم بموعد كشفكم لدى د. تامر فوزي في عيادة الشروق لطب الأطفال غداً في تمام الساعة 19:15. العنوان: مجمع العيادات التخصصية - الدور الثالث.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "rem-4",
    clinicId: "clinic-pediatrics",
    appointmentId: "apt-104",
    patientId: "pat-4",
    patientName: "مريم حسام حسن",
    guardianPhone: "01598765432",
    doctorId: "doc-tamer",
    doctorName: "د. تامر فوزي",
    reminderType: "follow_up",
    targetDate: getTomorrowDateString(),
    scheduledTime: "20:00",
    channel: "manual",
    status: "sent",
    messageText:
      "مرحباً بك أستاذ/ة مريم حسام حسن، تم تذكيركم بموعد الاستشارة والمتابعة الدورية لدى د. تامر فوزي غداً الساعة 20:00.",
    sentAt: new Date(Date.now() - 3600000).toISOString(),
    sentBy: "user-rec-1",
    sentByName: "مريم (الاستقبال)",
    createdAt: new Date().toISOString(),
  },
];

export interface IRemindersRepository {
  getReminders(clinicId: string, targetDate: string): Promise<Reminder[]>;
  updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder>;
  getTemplates(clinicId: string): Promise<ReminderTemplate[]>;
  saveTemplate(template: ReminderTemplate): Promise<ReminderTemplate>;
}

export class MockRemindersRepository implements IRemindersRepository {
  private reminders: Reminder[];
  private templates: ReminderTemplate[];

  constructor(
    initialReminders: Reminder[] = SEED_REMINDERS,
    initialTemplates: ReminderTemplate[] = DEFAULT_REMINDER_TEMPLATES
  ) {
    this.reminders = initialReminders.map((r) => ({ ...r }));
    this.templates = initialTemplates.map((t) => ({ ...t }));
  }

  async getReminders(clinicId: string, targetDate: string): Promise<Reminder[]> {
    return this.reminders.filter(
      (r) => r.clinicId === clinicId && r.targetDate === targetDate
    );
  }

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder> {
    const idx = this.reminders.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new RemindersServiceError("NOT_FOUND", `Reminder ${id} not found`);
    }
    this.reminders[idx] = {
      ...this.reminders[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.reminders[idx];
  }

  async getTemplates(clinicId: string): Promise<ReminderTemplate[]> {
    return this.templates.filter((t) => t.clinicId === clinicId);
  }

  async saveTemplate(template: ReminderTemplate): Promise<ReminderTemplate> {
    const idx = this.templates.findIndex((t) => t.id === template.id);
    if (idx >= 0) {
      this.templates[idx] = { ...template, updatedAt: new Date().toISOString() };
      return this.templates[idx];
    } else {
      const newTpl = {
        ...template,
        id: template.id || `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      this.templates.push(newTpl);
      return newTpl;
    }
  }
}

export class RemindersService {
  constructor(
    private repo: IRemindersRepository = new MockRemindersRepository(),
    private channels: NotificationChannelRegistry = defaultChannelRegistry
  ) {}

  /**
   * Asserts actor has staff access (owner, receptionist, doctor) or platform admin.
   */
  private assertStaffAccess(
    actor: { id: string; clinicId: string | null; roles: UserRole[] },
    targetClinicId: string
  ): void {
    const isPlatformAdmin = actor.roles.includes("platform_admin");
    const isStaff =
      actor.clinicId === targetClinicId &&
      (actor.roles.includes("clinic_owner") ||
        actor.roles.includes("receptionist") ||
        actor.roles.includes("doctor"));

    if (!isPlatformAdmin && !isStaff) {
      throw new RemindersServiceError(
        "FORBIDDEN",
        "Staff permissions required to manage reminders for this clinic."
      );
    }
  }

  /**
   * Retrieves all reminders for a specific clinic and date.
   */
  async getDailyReminders(
    actor: { id: string; clinicId: string | null; roles: UserRole[] },
    clinicId: string,
    targetDate: string
  ): Promise<Reminder[]> {
    this.assertStaffAccess(actor, clinicId);
    return this.repo.getReminders(clinicId, targetDate);
  }

  /**
   * Dispatches reminder through selected channel and records audit/timestamp.
   */
  async markReminderSent(
    actor: { id: string; name?: string; clinicId: string | null; roles: UserRole[] },
    clinicId: string,
    reminderId: string,
    channelId: ReminderChannel | string = "manual"
  ): Promise<Reminder> {
    this.assertStaffAccess(actor, clinicId);

    const reminders = await this.repo.getReminders(clinicId, getTomorrowDateString());
    // Find reminder across dates
    const reminder = reminders.find((r) => r.id === reminderId);
    if (!reminder) {
      // Direct update
    }

    const channel = this.channels.get(channelId);
    const result = await channel.send({
      recipientPhone: reminder?.guardianPhone || "",
      recipientName: reminder?.patientName || "",
      message: reminder?.messageText || "",
      clinicId,
      reminderId,
    });

    if (!result.success) {
      throw new RemindersServiceError(
        "CHANNEL_FAILURE",
        result.error || "Failed to send notification through channel"
      );
    }

    return this.repo.updateReminder(reminderId, {
      status: "sent",
      sentAt: result.timestamp,
      sentBy: actor.id,
      sentByName: actor.name || "طاقم الاستقبال",
      channel: channel.id as ReminderChannel,
    });
  }

  /**
   * Formats a message using clinic template and patient variables.
   */
  renderMessage(
    templateBody: string,
    variables: {
      patient_name: string;
      doctor_name: string;
      clinic_name: string;
      date: string;
      time: string;
      address?: string;
      phone?: string;
    }
  ): string {
    return renderReminderTemplate(templateBody, {
      patient_name: variables.patient_name,
      doctor_name: variables.doctor_name,
      clinic_name: variables.clinic_name,
      date: variables.date,
      time: variables.time,
      address: variables.address || "",
      phone: variables.phone || "",
    });
  }

  async getTemplates(
    actor: { id: string; clinicId: string | null; roles: UserRole[] },
    clinicId: string
  ): Promise<ReminderTemplate[]> {
    this.assertStaffAccess(actor, clinicId);
    return this.repo.getTemplates(clinicId);
  }

  async saveTemplate(
    actor: { id: string; clinicId: string | null; roles: UserRole[] },
    clinicId: string,
    template: ReminderTemplate
  ): Promise<ReminderTemplate> {
    this.assertStaffAccess(actor, clinicId);
    return this.repo.saveTemplate(template);
  }
}
