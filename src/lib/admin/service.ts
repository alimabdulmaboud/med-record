import { AuditLogEntry, UserRole } from "../invitations/types";

export interface ClinicSummary {
  id: string;
  name: string;
  status: "active" | "suspended" | "archived";
  settings: Record<string, any>;
  usersCount: number;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
  archived_by?: string | null;
}

export interface AdminUserView {
  id: string;
  email: string;
  fullName: string;
  clinicId: string | null;
  clinicName: string;
  roles: UserRole[];
  isArchived: boolean;
  createdAt: string;
}

export interface AdminInvitationView {
  id: string;
  email: string;
  clinicId: string;
  clinicName: string;
  roles: UserRole[];
  token: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  expiresAt: string;
  createdAt: string;
}

export interface IAdminRepository {
  getClinics(): Promise<ClinicSummary[]>;
  getClinicById(id: string): Promise<ClinicSummary | null>;
  createClinic(name: string, settings?: Record<string, any>): Promise<ClinicSummary>;
  updateClinic(id: string, updates: Partial<ClinicSummary>): Promise<ClinicSummary>;
  getUsers(): Promise<AdminUserView[]>;
  getInvitations(): Promise<AdminInvitationView[]>;
  getAuditLogs(filters?: { clinicId?: string; action?: string; limit?: number }): Promise<AuditLogEntry[]>;
  appendAuditLog(entry: AuditLogEntry): Promise<void>;
}

export class PlatformAdminService {
  constructor(private repo: IAdminRepository) {}

  private assertPlatformAdmin(actor: { id: string; roles: UserRole[] }) {
    if (!actor.roles.includes("platform_admin")) {
      throw new Error("FORBIDDEN_NOT_PLATFORM_ADMIN");
    }
  }

  async listClinics(actor: { id: string; roles: UserRole[] }): Promise<ClinicSummary[]> {
    this.assertPlatformAdmin(actor);
    return this.repo.getClinics();
  }

  async createClinic(
    name: string,
    actor: { id: string; roles: UserRole[] }
  ): Promise<ClinicSummary> {
    this.assertPlatformAdmin(actor);
    if (!name || name.trim().length === 0) {
      throw new Error("INVALID_CLINIC_NAME");
    }

    const clinic = await this.repo.createClinic(name.trim());

    await this.repo.appendAuditLog({
      clinic_id: clinic.id,
      actor_id: actor.id,
      action: "CREATE_CLINIC",
      entity_type: "clinic",
      entity_id: clinic.id,
      before_state: null,
      after_state: { name: clinic.name, status: clinic.status },
      metadata: { clinic_name: clinic.name },
    });

    return clinic;
  }

  async updateClinicName(
    clinicId: string,
    newName: string,
    actor: { id: string; roles: UserRole[] }
  ): Promise<ClinicSummary> {
    this.assertPlatformAdmin(actor);
    const existing = await this.repo.getClinicById(clinicId);
    if (!existing) throw new Error("CLINIC_NOT_FOUND");

    const updated = await this.repo.updateClinic(clinicId, { name: newName.trim() });

    await this.repo.appendAuditLog({
      clinic_id: clinicId,
      actor_id: actor.id,
      action: "UPDATE_CLINIC_NAME",
      entity_type: "clinic",
      entity_id: clinicId,
      before_state: { name: existing.name },
      after_state: { name: newName.trim() },
      metadata: { old_name: existing.name, new_name: newName.trim() },
    });

    return updated;
  }

  async toggleSuspension(
    clinicId: string,
    suspend: boolean,
    actor: { id: string; roles: UserRole[] }
  ): Promise<ClinicSummary> {
    this.assertPlatformAdmin(actor);
    const existing = await this.repo.getClinicById(clinicId);
    if (!existing) throw new Error("CLINIC_NOT_FOUND");

    const newStatus = suspend ? "suspended" : "active";
    const updated = await this.repo.updateClinic(clinicId, { status: newStatus });

    await this.repo.appendAuditLog({
      clinic_id: clinicId,
      actor_id: actor.id,
      action: suspend ? "SUSPEND_CLINIC" : "UNSUSPEND_CLINIC",
      entity_type: "clinic",
      entity_id: clinicId,
      before_state: { status: existing.status },
      after_state: { status: newStatus },
      metadata: { reason: suspend ? "Admin suspension" : "Admin unsuspension" },
    });

    return updated;
  }

  async archiveClinic(
    clinicId: string,
    actor: { id: string; roles: UserRole[] }
  ): Promise<ClinicSummary> {
    this.assertPlatformAdmin(actor);
    const existing = await this.repo.getClinicById(clinicId);
    if (!existing) throw new Error("CLINIC_NOT_FOUND");

    const now = new Date().toISOString();
    const updated = await this.repo.updateClinic(clinicId, {
      status: "archived",
      archived_at: now,
      archived_by: actor.id,
    });

    await this.repo.appendAuditLog({
      clinic_id: clinicId,
      actor_id: actor.id,
      action: "ARCHIVE_CLINIC",
      entity_type: "clinic",
      entity_id: clinicId,
      before_state: { status: existing.status, archived_at: null },
      after_state: { status: "archived", archived_at: now, archived_by: actor.id },
    });

    return updated;
  }

  async restoreClinic(
    clinicId: string,
    actor: { id: string; roles: UserRole[] }
  ): Promise<ClinicSummary> {
    this.assertPlatformAdmin(actor);
    const existing = await this.repo.getClinicById(clinicId);
    if (!existing) throw new Error("CLINIC_NOT_FOUND");

    const updated = await this.repo.updateClinic(clinicId, {
      status: "active",
      archived_at: null,
      archived_by: null,
    });

    await this.repo.appendAuditLog({
      clinic_id: clinicId,
      actor_id: actor.id,
      action: "RESTORE_CLINIC",
      entity_type: "clinic",
      entity_id: clinicId,
      before_state: { status: existing.status, archived_at: existing.archived_at },
      after_state: { status: "active", archived_at: null, archived_by: null },
    });

    return updated;
  }

  async listUsers(actor: { id: string; roles: UserRole[] }): Promise<AdminUserView[]> {
    this.assertPlatformAdmin(actor);
    return this.repo.getUsers();
  }

  async listInvitations(actor: { id: string; roles: UserRole[] }): Promise<AdminInvitationView[]> {
    this.assertPlatformAdmin(actor);
    return this.repo.getInvitations();
  }

  async listAuditLogs(
    actor: { id: string; roles: UserRole[] },
    filters?: { clinicId?: string; action?: string; limit?: number }
  ): Promise<AuditLogEntry[]> {
    this.assertPlatformAdmin(actor);
    return this.repo.getAuditLogs(filters);
  }
}
