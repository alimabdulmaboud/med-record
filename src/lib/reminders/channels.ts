import {
  INotificationChannel,
  NotificationPayload,
  ChannelSendResult,
  ReminderChannel,
} from "./types";

/**
 * Pure template renderer for reminder messages.
 * Replaces placeholders like {patient_name}, {doctor_name}, {clinic_name}, {date}, {time}.
 */
export function renderReminderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{${key}\\}`, "g");
    result = result.replace(pattern, value || "");
  }
  // Strip any remaining unreplaced {placeholders}
  result = result.replace(/\{[a-zA-Z0-9_]+\}/g, "");
  return result;
}

/**
 * Manual channel implementation:
 * Formats message ready for receptionist to copy and send via phone/personal WhatsApp.
 */
export class ManualNotificationChannel implements INotificationChannel {
  public readonly id = "manual";
  public readonly name = "يدوي (نسخ ولصق)";

  async send(payload: NotificationPayload): Promise<ChannelSendResult> {
    if (!payload.recipientPhone || !payload.message) {
      return {
        success: false,
        channel: this.id,
        timestamp: new Date().toISOString(),
        error: "Missing recipient phone number or message text",
      };
    }

    return {
      success: true,
      channel: this.id,
      timestamp: new Date().toISOString(),
      isManualCopy: true,
    };
  }
}

/**
 * WhatsApp channel provider stub (Extensible for post-v1 integration).
 */
export class WhatsAppNotificationChannel implements INotificationChannel {
  public readonly id = "whatsapp";
  public readonly name = "واتساب آلي (Cloud API)";

  constructor(private apiKey?: string) {}

  async send(payload: NotificationPayload): Promise<ChannelSendResult> {
    if (!this.apiKey) {
      return {
        success: false,
        channel: this.id,
        timestamp: new Date().toISOString(),
        error: "WhatsApp API key not configured for this clinic",
      };
    }

    // Post-v1: Integration with Meta WhatsApp Cloud API or Infobip
    return {
      success: true,
      channel: this.id,
      timestamp: new Date().toISOString(),
      messageId: `wa-${Date.now()}`,
    };
  }
}

/**
 * SMS channel provider stub (Extensible for post-v1 integration).
 */
export class SmsNotificationChannel implements INotificationChannel {
  public readonly id = "sms";
  public readonly name = "رسائل SMS قصيرة";

  constructor(private providerUrl?: string) {}

  async send(payload: NotificationPayload): Promise<ChannelSendResult> {
    if (!this.providerUrl) {
      return {
        success: false,
        channel: this.id,
        timestamp: new Date().toISOString(),
        error: "SMS provider not configured",
      };
    }

    return {
      success: true,
      channel: this.id,
      timestamp: new Date().toISOString(),
      messageId: `sms-${Date.now()}`,
    };
  }
}

/**
 * Global Channel Registry for dispatching reminders.
 */
export class NotificationChannelRegistry {
  private channels = new Map<string, INotificationChannel>();

  constructor() {
    this.register(new ManualNotificationChannel());
  }

  register(channel: INotificationChannel): void {
    this.channels.set(channel.id, channel);
  }

  get(channelId: string = "manual"): INotificationChannel {
    const channel = this.channels.get(channelId);
    if (!channel) {
      // Fallback to manual channel
      return this.channels.get("manual")!;
    }
    return channel;
  }

  getAll(): INotificationChannel[] {
    return Array.from(this.channels.values());
  }
}

export const defaultChannelRegistry = new NotificationChannelRegistry();
