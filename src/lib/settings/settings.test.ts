import { describe, it, expect, beforeEach } from "vitest";
import { ClinicSettingsService, IClinicSettingsRepository } from "./service";
import { ClinicSettings } from "./schema";
import { AuditLogEntry, UserRole } from "../invitations/types";

class MockSettingsRepository implements IClinicSettingsRepository {
  public store: Map<string, ClinicSettings> = new Map();
  public auditLogs: AuditLogEntry[] = [];

  async getClinicSettings(clinicId: string): Promise<ClinicSettings | null> {
    return this.store.get(clinicId) || null;
  }

  async saveClinicSettings(clinicId: string, settings: ClinicSettings): Promise<ClinicSettings> {
    this.store.set(clinicId, settings);
    return settings;
  }

  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    this.auditLogs.push(entry);
  }
}

describe("Phase 5: Clinic Settings Engine & Validation", () => {
  let repo: MockSettingsRepository;
  let service: ClinicSettingsService;

  const CLINIC_A = "c1000000-0000-0000-0000-000000000001";
  const CLINIC_B = "c2000000-0000-0000-0000-000000000002";

  const OWNER_A = {
    id: "owner-a",
    clinicId: CLINIC_A,
    roles: ["clinic_owner" as UserRole],
  };

  const DOCTOR_A = {
    id: "doctor-a",
    clinicId: CLINIC_A,
    roles: ["doctor" as UserRole],
  };

  const RECEPTIONIST_A = {
    id: "reception-a",
    clinicId: CLINIC_A,
    roles: ["receptionist" as UserRole],
  };

  const defaultSettings: ClinicSettings = {
    name: "عيادة النور لطب الأطفال",
    letterhead: {
      address: "القاهرة، مصر",
      phone: "+201000000000",
      doctors: [{ name: "د. تامر", title: "استشاري", specialty: "طب أطفال" }],
    },
    consultation_prices: {
      new: 350,
      follow_up: 180,
      quick_consult: 100,
    },
    enabled_modules: ["pediatrics"],
    queue: {
      arrive_before_minutes: 15,
      skip_alert_minutes: 60,
      urgent_enabled: false,
      urgent_fee_multiplier: 3,
      end_of_day_time: "22:00",
    },
  };

  beforeEach(() => {
    repo = new MockSettingsRepository();
    repo.store.set(CLINIC_A, defaultSettings);
    service = new ClinicSettingsService(repo);
  });

  describe("Permissions & Read-Only Enforcement", () => {
    it("allows clinic owner to update settings", async () => {
      const updated = await service.updateSettings({
        clinicId: CLINIC_A,
        newSettings: {
          ...defaultSettings,
          consultation_prices: { new: 400, follow_up: 200, quick_consult: 120 },
        },
        actor: OWNER_A,
      });

      expect(updated.consultation_prices.new).toBe(400);
      expect(repo.auditLogs).toHaveLength(1);
      expect(repo.auditLogs[0].action).toBe("UPDATE_CLINIC_SETTINGS");
    });

    it("rejects doctor from updating settings (read-only for non-owners)", async () => {
      await expect(
        service.updateSettings({
          clinicId: CLINIC_A,
          newSettings: defaultSettings,
          actor: DOCTOR_A,
        })
      ).rejects.toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
    });

    it("rejects receptionist from updating settings", async () => {
      await expect(
        service.updateSettings({
          clinicId: CLINIC_A,
          newSettings: defaultSettings,
          actor: RECEPTIONIST_A,
        })
      ).rejects.toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
    });

    it("rejects owner of Clinic A from modifying Clinic B settings (Tenant Isolation)", async () => {
      repo.store.set(CLINIC_B, defaultSettings);

      await expect(
        service.updateSettings({
          clinicId: CLINIC_B,
          newSettings: defaultSettings,
          actor: OWNER_A,
        })
      ).rejects.toThrowError(expect.objectContaining({ code: "FORBIDDEN" }));
    });
  });

  describe("Validation Rules", () => {
    it("rejects negative consultation prices", async () => {
      await expect(
        service.updateSettings({
          clinicId: CLINIC_A,
          newSettings: {
            ...defaultSettings,
            consultation_prices: { new: -50, follow_up: 100, quick_consult: 50 },
          },
          actor: OWNER_A,
        })
      ).rejects.toThrowError(expect.objectContaining({ code: "VALIDATION_FAILED" }));
    });

    it("rejects invalid end_of_day_time format", async () => {
      await expect(
        service.updateSettings({
          clinicId: CLINIC_A,
          newSettings: {
            ...defaultSettings,
            queue: {
              ...defaultSettings.queue,
              end_of_day_time: "25:70", // Invalid hour & minute
            },
          },
          actor: OWNER_A,
        })
      ).rejects.toThrowError(expect.objectContaining({ code: "VALIDATION_FAILED" }));
    });

    it("rejects urgent_fee_multiplier below 1", async () => {
      await expect(
        service.updateSettings({
          clinicId: CLINIC_A,
          newSettings: {
            ...defaultSettings,
            queue: {
              ...defaultSettings.queue,
              urgent_fee_multiplier: 0.5,
            },
          },
          actor: OWNER_A,
        })
      ).rejects.toThrowError(expect.objectContaining({ code: "VALIDATION_FAILED" }));
    });
  });

  describe("Urgent Queue Activation & Explicit Confirmation Rule (PROJECT.md §6)", () => {
    it("fails when enabling urgent_enabled without explicit confirmation", async () => {
      await expect(
        service.updateSettings({
          clinicId: CLINIC_A,
          newSettings: {
            ...defaultSettings,
            queue: {
              ...defaultSettings.queue,
              urgent_enabled: true,
            },
          },
          actor: OWNER_A,
          urgentConfirmed: false, // NOT confirmed
        })
      ).rejects.toThrowError(
        expect.objectContaining({ code: "URGENT_CONFIRMATION_REQUIRED" })
      );
    });

    it("succeeds when enabling urgent_enabled with explicit confirmation and logs to audit", async () => {
      const saved = await service.updateSettings({
        clinicId: CLINIC_A,
        newSettings: {
          ...defaultSettings,
          queue: {
            ...defaultSettings.queue,
            urgent_enabled: true,
          },
        },
        actor: OWNER_A,
        urgentConfirmed: true, // Explicitly confirmed
      });

      expect(saved.queue.urgent_enabled).toBe(true);

      const audit = repo.auditLogs.find((l) => l.action === "UPDATE_CLINIC_SETTINGS");
      expect(audit).toBeDefined();
      expect(audit?.metadata?.urgent_queue_activated).toBe(true);
    });
  });
});
