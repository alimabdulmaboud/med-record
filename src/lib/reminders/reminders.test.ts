import { describe, it, expect } from "vitest";
import {
  renderReminderTemplate,
  ManualNotificationChannel,
  WhatsAppNotificationChannel,
  SmsNotificationChannel,
  NotificationChannelRegistry,
} from "./channels";
import {
  RemindersService,
  RemindersServiceError,
  MockRemindersRepository,
  getTomorrowDateString,
} from "./service";
import { Reminder } from "./types";

describe("Reminders & Notification Channels — Unit Tests (Phase 14)", () => {
  describe("Template Engine & Placeholder Rendering", () => {
    it("renders all placeholders accurately into Arabic message text", () => {
      const template =
        "مرحباً {patient_name}، موعدك مع {doctor_name} في {clinic_name} يوم {date} الساعة {time}. هاتف: {phone}";
      const vars = {
        patient_name: "زينب محمود",
        doctor_name: "د. سارة أحمد",
        clinic_name: "عيادة الشروق",
        date: "2026-10-12",
        time: "17:30",
        phone: "01012345678",
      };

      const result = renderReminderTemplate(template, vars);

      expect(result).toBe(
        "مرحباً زينب محمود، موعدك مع د. سارة أحمد في عيادة الشروق يوم 2026-10-12 الساعة 17:30. هاتف: 01012345678"
      );
    });

    it("handles multiple occurrences of same placeholder", () => {
      const template = "أهلاً {patient_name}، نتمنى لك السلامة يا {patient_name}.";
      const result = renderReminderTemplate(template, { patient_name: "علي" });
      expect(result).toBe("أهلاً علي، نتمنى لك السلامة يا علي.");
    });

    it("replaces missing variables with empty string safely", () => {
      const template = "مرحباً {patient_name} في {clinic_name}. العنوان: {address}";
      const result = renderReminderTemplate(template, {
        patient_name: "عمر",
        clinic_name: "عيادة الشروق",
      });
      expect(result).toBe("مرحباً عمر في عيادة الشروق. العنوان: ");
    });
  });

  describe("Notification Channel Abstraction & Extensibility", () => {
    it("executes ManualNotificationChannel successfully for copy-to-clipboard", async () => {
      const manual = new ManualNotificationChannel();
      expect(manual.id).toBe("manual");

      const result = await manual.send({
        recipientPhone: "01098765432",
        recipientName: "زينب محمود",
        message: "رسالة تذكير تجريبية",
        clinicId: "clinic-1",
        reminderId: "rem-1",
      });

      expect(result.success).toBe(true);
      expect(result.channel).toBe("manual");
      expect(result.isManualCopy).toBe(true);
      expect(result.timestamp).toBeDefined();
    });

    it("rejects manual send when recipient phone or message is empty", async () => {
      const manual = new ManualNotificationChannel();
      const result = await manual.send({
        recipientPhone: "",
        recipientName: "مريض",
        message: "",
        clinicId: "clinic-1",
        reminderId: "rem-1",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Missing");
    });

    it("demonstrates WhatsApp channel stub behaviour without changing client interface", async () => {
      const waWithoutKey = new WhatsAppNotificationChannel();
      const failRes = await waWithoutKey.send({
        recipientPhone: "01000000000",
        recipientName: "مريض",
        message: "نص",
        clinicId: "c1",
        reminderId: "r1",
      });
      expect(failRes.success).toBe(false);

      const waWithKey = new WhatsAppNotificationChannel("meta_test_token_123");
      const successRes = await waWithKey.send({
        recipientPhone: "01000000000",
        recipientName: "مريض",
        message: "نص",
        clinicId: "c1",
        reminderId: "r1",
      });
      expect(successRes.success).toBe(true);
      expect(successRes.channel).toBe("whatsapp");
      expect(successRes.messageId).toBeDefined();
    });

    it("supports dynamic registration in ChannelRegistry with manual fallback", () => {
      const registry = new NotificationChannelRegistry();
      expect(registry.get("manual").id).toBe("manual");

      // Requesting an unknown channel gracefully returns manual channel
      expect(registry.get("unknown_channel").id).toBe("manual");

      // Registering new channel
      registry.register(new SmsNotificationChannel("https://sms.gateway.local"));
      expect(registry.get("sms").id).toBe("sms");
      expect(registry.getAll().length).toBe(2);
    });
  });

  describe("Reminders Service Operations & Access Control", () => {
    const tomorrow = getTomorrowDateString();

    const mockSeed: Reminder[] = [
      {
        id: "rem-test-1",
        clinicId: "clinic-pediatrics",
        appointmentId: "apt-1",
        patientId: "pat-1",
        patientName: "زينب محمود",
        guardianPhone: "01098765432",
        reminderType: "appointment",
        targetDate: tomorrow,
        scheduledTime: "17:30",
        channel: "manual",
        status: "pending",
        messageText: "رسالة تذكير موعد",
        createdAt: "2026-10-10T10:00:00Z",
      },
      {
        id: "rem-test-2",
        clinicId: "clinic-pediatrics",
        appointmentId: "apt-2",
        patientId: "pat-2",
        patientName: "عمر خالد",
        guardianPhone: "01123456789",
        reminderType: "follow_up",
        targetDate: tomorrow,
        scheduledTime: "18:00",
        channel: "manual",
        status: "pending",
        messageText: "رسالة تذكير متابعة",
        createdAt: "2026-10-10T10:00:00Z",
      },
    ];

    it("allows receptionist to view daily reminders for tomorrow", async () => {
      const repo = new MockRemindersRepository(mockSeed);
      const service = new RemindersService(repo);

      const receptionist = {
        id: "rec-1",
        clinicId: "clinic-pediatrics",
        roles: ["receptionist" as const],
      };

      const reminders = await service.getDailyReminders(
        receptionist,
        "clinic-pediatrics",
        tomorrow
      );

      expect(reminders.length).toBe(2);
      expect(reminders[0].patientName).toBe("زينب محمود");
      expect(reminders[1].reminderType).toBe("follow_up");
    });

    it("allows clinic_owner and doctor to view reminders as well", async () => {
      const repo = new MockRemindersRepository(mockSeed);
      const service = new RemindersService(repo);

      const owner = {
        id: "owner-1",
        clinicId: "clinic-pediatrics",
        roles: ["clinic_owner" as const],
      };
      const doctor = {
        id: "doc-1",
        clinicId: "clinic-pediatrics",
        roles: ["doctor" as const],
      };

      const ownerList = await service.getDailyReminders(owner, "clinic-pediatrics", tomorrow);
      const docList = await service.getDailyReminders(doctor, "clinic-pediatrics", tomorrow);

      expect(ownerList.length).toBe(2);
      expect(docList.length).toBe(2);
    });

    it("denies access when user belongs to a different clinic", async () => {
      const repo = new MockRemindersRepository(mockSeed);
      const service = new RemindersService(repo);

      const foreignStaff = {
        id: "rec-other",
        clinicId: "clinic-other",
        roles: ["receptionist" as const],
      };

      await expect(
        service.getDailyReminders(foreignStaff, "clinic-pediatrics", tomorrow)
      ).rejects.toThrowError(RemindersServiceError);
    });

    it("marks reminder sent with timestamp, actor name, and status transition", async () => {
      const repo = new MockRemindersRepository(mockSeed);
      const service = new RemindersService(repo);

      const receptionist = {
        id: "rec-1",
        name: "مريم فؤاد",
        clinicId: "clinic-pediatrics",
        roles: ["receptionist" as const],
      };

      const updated = await service.markReminderSent(
        receptionist,
        "clinic-pediatrics",
        "rem-test-1",
        "manual"
      );

      expect(updated.status).toBe("sent");
      expect(updated.sentBy).toBe("rec-1");
      expect(updated.sentByName).toBe("مريم فؤاد");
      expect(updated.sentAt).toBeDefined();
      expect(updated.channel).toBe("manual");
    });

    it("manages and customizes clinic reminder templates", async () => {
      const repo = new MockRemindersRepository(mockSeed);
      const service = new RemindersService(repo);

      const owner = {
        id: "owner-1",
        clinicId: "clinic-pediatrics",
        roles: ["clinic_owner" as const],
      };

      const templates = await service.getTemplates(owner, "clinic-pediatrics");
      expect(templates.length).toBeGreaterThan(0);

      const saved = await service.saveTemplate(owner, "clinic-pediatrics", {
        id: "tpl-custom-1",
        clinicId: "clinic-pediatrics",
        reminderType: "appointment",
        title: "قالب مخصص لكبار السن",
        templateBody: "نرحب بحضرتك يا {patient_name} في موعدك غداً الساعة {time}.",
        isDefault: false,
      });

      expect(saved.id).toBe("tpl-custom-1");
      expect(saved.title).toBe("قالب مخصص لكبار السن");
    });
  });
});
