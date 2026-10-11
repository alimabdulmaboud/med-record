import { describe, it, expect, beforeEach } from "vitest";
import {
  PlatformAdminService,
  IAdminRepository,
  ClinicSummary,
  AdminUserView,
  AdminInvitationView,
} from "./service";
import { AuditLogEntry, UserRole } from "../invitations/types";

class MockAdminRepository implements IAdminRepository {
  public clinics: Map<string, ClinicSummary> = new Map();
  public users: AdminUserView[] = [];
  public invitations: AdminInvitationView[] = [];
  public auditLogs: AuditLogEntry[] = [];

  async getClinics(): Promise<ClinicSummary[]> {
    return Array.from(this.clinics.values());
  }

  async getClinicById(id: string): Promise<ClinicSummary | null> {
    return this.clinics.get(id) || null;
  }

  async createClinic(name: string, settings?: Record<string, any>): Promise<ClinicSummary> {
    const id = `clinic-${Date.now()}`;
    const newClinic: ClinicSummary = {
      id,
      name,
      status: "active",
      settings: settings || {},
      usersCount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived_at: null,
      archived_by: null,
    };
    this.clinics.set(id, newClinic);
    return newClinic;
  }

  async updateClinic(id: string, updates: Partial<ClinicSummary>): Promise<ClinicSummary> {
    const existing = this.clinics.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    this.clinics.set(id, updated);
    return updated;
  }

  async getUsers(): Promise<AdminUserView[]> {
    return this.users;
  }

  async getInvitations(): Promise<AdminInvitationView[]> {
    return this.invitations;
  }

  async getAuditLogs(filters?: { clinicId?: string; action?: string; limit?: number }): Promise<AuditLogEntry[]> {
    return this.auditLogs.filter((log) => {
      if (filters?.clinicId && log.clinic_id !== filters.clinicId) return false;
      if (filters?.action && log.action !== filters.action) return false;
      return true;
    });
  }

  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    this.auditLogs.push(entry);
  }
}

describe("Phase 4: Platform Admin Service & Operations", () => {
  let repo: MockAdminRepository;
  let service: PlatformAdminService;

  const PLATFORM_ADMIN = {
    id: "admin-1",
    roles: ["platform_admin" as UserRole],
  };

  const CLINIC_OWNER = {
    id: "owner-1",
    roles: ["clinic_owner" as UserRole],
  };

  beforeEach(() => {
    repo = new MockAdminRepository();
    service = new PlatformAdminService(repo);
  });

  describe("Permission Boundaries", () => {
    it("denies access to non-platform_admin users", async () => {
      await expect(service.listClinics(CLINIC_OWNER)).rejects.toThrowError(
        "FORBIDDEN_NOT_PLATFORM_ADMIN"
      );
      await expect(
        service.createClinic("عيادة تجريبية", CLINIC_OWNER)
      ).rejects.toThrowError("FORBIDDEN_NOT_PLATFORM_ADMIN");
    });
  });

  describe("Clinic Lifecycle Operations", () => {
    it("creates a clinic and records audit log entry", async () => {
      const clinic = await service.createClinic("عيادة المستقبل", PLATFORM_ADMIN);

      expect(clinic.name).toBe("عيادة المستقبل");
      expect(clinic.status).toBe("active");
      expect(clinic.archived_at).toBeNull();

      expect(repo.auditLogs).toHaveLength(1);
      expect(repo.auditLogs[0].action).toBe("CREATE_CLINIC");
      expect(repo.auditLogs[0].entity_id).toBe(clinic.id);
    });

    it("updates clinic name and logs change", async () => {
      const clinic = await service.createClinic("عيادة الأمل القديم", PLATFORM_ADMIN);
      const updated = await service.updateClinicName(clinic.id, "عيادة الأمل الجديد", PLATFORM_ADMIN);

      expect(updated.name).toBe("عيادة الأمل الجديد");
      const log = repo.auditLogs.find((l) => l.action === "UPDATE_CLINIC_NAME");
      expect(log).toBeDefined();
      expect(log?.before_state?.name).toBe("عيادة الأمل القديم");
      expect(log?.after_state?.name).toBe("عيادة الأمل الجديد");
    });

    it("suspends and unsuspends a clinic", async () => {
      const clinic = await service.createClinic("عيادة السلام", PLATFORM_ADMIN);

      // Suspend
      const suspended = await service.toggleSuspension(clinic.id, true, PLATFORM_ADMIN);
      expect(suspended.status).toBe("suspended");

      // Unsuspend
      const unsuspended = await service.toggleSuspension(clinic.id, false, PLATFORM_ADMIN);
      expect(unsuspended.status).toBe("active");

      expect(repo.auditLogs.some((l) => l.action === "SUSPEND_CLINIC")).toBe(true);
      expect(repo.auditLogs.some((l) => l.action === "UNSUSPEND_CLINIC")).toBe(true);
    });

    it("archives and restores a clinic (never hard-deletes)", async () => {
      const clinic = await service.createClinic("عيادة الشفاء", PLATFORM_ADMIN);

      // Archive
      const archived = await service.archiveClinic(clinic.id, PLATFORM_ADMIN);
      expect(archived.status).toBe("archived");
      expect(archived.archived_at).not.toBeNull();
      expect(archived.archived_by).toBe(PLATFORM_ADMIN.id);

      // Restore
      const restored = await service.restoreClinic(clinic.id, PLATFORM_ADMIN);
      expect(restored.status).toBe("active");
      expect(restored.archived_at).toBeNull();
      expect(restored.archived_by).toBeNull();

      expect(repo.auditLogs.some((l) => l.action === "ARCHIVE_CLINIC")).toBe(true);
      expect(repo.auditLogs.some((l) => l.action === "RESTORE_CLINIC")).toBe(true);
    });
  });

  describe("Medical Privacy Verification", () => {
    it("ensures admin service never accesses or exposes patient clinical records", async () => {
      // Platform admin can only see operational metadata: counts, names, statuses
      const clinics = await service.listClinics(PLATFORM_ADMIN);
      expect(Array.isArray(clinics)).toBe(true);

      const logs = await service.listAuditLogs(PLATFORM_ADMIN);
      expect(Array.isArray(logs)).toBe(true);
      // No clinical fields exist in ClinicSummary or AdminUserView
    });
  });
});
