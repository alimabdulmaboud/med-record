import { ClinicSettings, ClinicSettingsSchema } from "./schema";
import { AuditLogEntry, UserRole } from "../invitations/types";

export class SettingsServiceError extends Error {
  constructor(
    public code:
      | "FORBIDDEN"
      | "CLINIC_NOT_FOUND"
      | "VALIDATION_FAILED"
      | "URGENT_CONFIRMATION_REQUIRED",
    message?: string
  ) {
    super(message || code);
    this.name = "SettingsServiceError";
  }
}

export interface IClinicSettingsRepository {
  getClinicSettings(clinicId: string): Promise<ClinicSettings | null>;
  saveClinicSettings(clinicId: string, settings: ClinicSettings): Promise<ClinicSettings>;
  appendAuditLog(entry: AuditLogEntry): Promise<void>;
}

export class ClinicSettingsService {
  constructor(private repo: IClinicSettingsRepository) {}

  private assertCanManageSettings(
    actor: { id: string; clinicId: string | null; roles: UserRole[] },
    targetClinicId: string
  ) {
    const isPlatformAdmin = actor.roles.includes("platform_admin");
    const isOwnerOfClinic =
      actor.roles.includes("clinic_owner") && actor.clinicId === targetClinicId;

    if (!isPlatformAdmin && !isOwnerOfClinic) {
      throw new SettingsServiceError("FORBIDDEN", "Only clinic owners can modify clinic settings.");
    }
  }

  async getSettings(clinicId: string): Promise<ClinicSettings> {
    const settings = await this.repo.getClinicSettings(clinicId);
    if (!settings) {
      throw new SettingsServiceError("CLINIC_NOT_FOUND");
    }
    return settings;
  }

  async updateSettings(params: {
    clinicId: string;
    newSettings: unknown;
    actor: { id: string; clinicId: string | null; roles: UserRole[] };
    urgentConfirmed?: boolean;
  }): Promise<ClinicSettings> {
    const { clinicId, newSettings, actor, urgentConfirmed } = params;

    // 1. Authorize
    this.assertCanManageSettings(actor, clinicId);

    // 2. Fetch existing settings
    const existing = await this.repo.getClinicSettings(clinicId);
    if (!existing) {
      throw new SettingsServiceError("CLINIC_NOT_FOUND");
    }

    // 3. Validate with Zod
    const parseResult = ClinicSettingsSchema.safeParse(newSettings);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      throw new SettingsServiceError("VALIDATION_FAILED", errorMsg);
    }

    const validatedSettings = parseResult.data;

    // 4. Special Rule: Enabling urgent_enabled requires explicit clinic confirmation (PROJECT.md §6)
    const isEnablingUrgent =
      validatedSettings.queue.urgent_enabled && !existing.queue.urgent_enabled;

    if (isEnablingUrgent && !urgentConfirmed) {
      throw new SettingsServiceError(
        "URGENT_CONFIRMATION_REQUIRED",
        "Enabling paid urgent queue requires explicit clinic acknowledgment of responsibility."
      );
    }

    // 5. Persist
    const saved = await this.repo.saveClinicSettings(clinicId, validatedSettings);

    // 6. Append-only Audit Log
    await this.repo.appendAuditLog({
      clinic_id: clinicId,
      actor_id: actor.id,
      action: "UPDATE_CLINIC_SETTINGS",
      entity_type: "clinic_settings",
      entity_id: clinicId,
      before_state: existing as any,
      after_state: saved as any,
      metadata: {
        urgent_queue_activated: isEnablingUrgent,
        updated_by: actor.id,
        timestamp: new Date().toISOString(),
      },
    });

    return saved;
  }
}
