import { AuditLogEntry, UserRole } from "../invitations/types";

export interface UserProfile {
  id: string;
  clinic_id: string | null;
  full_name: string;
  phone?: string | null;
  archived_at?: string | null;
  archived_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IUserRepository {
  findProfileById(userId: string): Promise<UserProfile | null>;
  setArchiveStatus(userId: string, archivedAt: string | null, archivedBy: string | null): Promise<UserProfile>;
  appendAuditLog(entry: AuditLogEntry): Promise<void>;
}

export class UserService {
  constructor(private repo: IUserRepository) {}

  /**
   * Archives a user (soft-delete). Archived users cannot sign in.
   */
  async archiveUser(
    targetUserId: string,
    actor: { id: string; clinicId: string | null; roles: UserRole[] }
  ): Promise<UserProfile> {
    const profile = await this.repo.findProfileById(targetUserId);
    if (!profile) {
      throw new Error("USER_NOT_FOUND");
    }

    // Tenant check: only platform_admin or clinic_owner of the same clinic can archive
    const isPlatformAdmin = actor.roles.includes("platform_admin");
    const isOwnerOfClinic = actor.roles.includes("clinic_owner") && actor.clinicId === profile.clinic_id;

    if (!isPlatformAdmin && !isOwnerOfClinic) {
      throw new Error("FORBIDDEN");
    }

    const now = new Date().toISOString();
    const updated = await this.repo.setArchiveStatus(targetUserId, now, actor.id);

    await this.repo.appendAuditLog({
      clinic_id: profile.clinic_id,
      actor_id: actor.id,
      action: "ARCHIVE_USER",
      entity_type: "user",
      entity_id: targetUserId,
      before_state: { archived_at: null },
      after_state: { archived_at: now, archived_by: actor.id },
      metadata: { target_user: targetUserId },
    });

    return updated;
  }

  /**
   * Restores an archived user.
   */
  async restoreUser(
    targetUserId: string,
    actor: { id: string; clinicId: string | null; roles: UserRole[] }
  ): Promise<UserProfile> {
    const profile = await this.repo.findProfileById(targetUserId);
    if (!profile) {
      throw new Error("USER_NOT_FOUND");
    }

    const isPlatformAdmin = actor.roles.includes("platform_admin");
    const isOwnerOfClinic = actor.roles.includes("clinic_owner") && actor.clinicId === profile.clinic_id;

    if (!isPlatformAdmin && !isOwnerOfClinic) {
      throw new Error("FORBIDDEN");
    }

    const updated = await this.repo.setArchiveStatus(targetUserId, null, null);

    await this.repo.appendAuditLog({
      clinic_id: profile.clinic_id,
      actor_id: actor.id,
      action: "RESTORE_USER",
      entity_type: "user",
      entity_id: targetUserId,
      before_state: { archived_at: profile.archived_at },
      after_state: { archived_at: null, archived_by: null },
      metadata: { target_user: targetUserId },
    });

    return updated;
  }

  /**
   * Checks whether a user account is allowed to log in.
   * If archived_at is set, login is disallowed.
   */
  canUserSignIn(profile: UserProfile): { allowed: boolean; reason?: "ARCHIVED_ACCOUNT" } {
    if (profile.archived_at) {
      return { allowed: false, reason: "ARCHIVED_ACCOUNT" };
    }
    return { allowed: true };
  }
}

/**
 * Default idle session timeout in minutes (30 minutes per spec).
 */
export const DEFAULT_SESSION_TIMEOUT_MINUTES = 30;
