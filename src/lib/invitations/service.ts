import crypto from "crypto";
import {
  CreateInvitationInput,
  AcceptInvitationInput,
  InvitationRecord,
  AuditLogEntry,
  UserRole,
} from "./types";

export class InvitationServiceError extends Error {
  constructor(
    public code:
      | "NOT_FOUND"
      | "EXPIRED"
      | "REVOKED"
      | "ALREADY_ACCEPTED"
      | "TENANT_MISMATCH"
      | "INSUFFICIENT_PERMISSIONS"
      | "INVALID_INPUT",
    message?: string
  ) {
    super(message || code);
    this.name = "InvitationServiceError";
  }
}

export interface IInvitationRepository {
  createInvitation(record: Omit<InvitationRecord, "id" | "created_at" | "updated_at">): Promise<InvitationRecord>;
  findInvitationByToken(token: string): Promise<InvitationRecord | null>;
  findInvitationById(id: string): Promise<InvitationRecord | null>;
  updateInvitationStatus(id: string, status: InvitationRecord["status"], extra?: Partial<InvitationRecord>): Promise<InvitationRecord>;
  createUserWithRoles(params: {
    email: string;
    fullName: string;
    password: string;
    phone?: string;
    clinicId: string;
    roles: UserRole[];
  }): Promise<{ id: string; email: string }>;
  appendAuditLog(entry: AuditLogEntry): Promise<void>;
}

/**
 * Checks whether an actor has permission to issue invitations for a given clinic.
 * - platform_admin: Can invite for any clinic.
 * - clinic_owner: Can ONLY invite for their own clinic.
 * - doctor / receptionist: Cannot invite anyone.
 */
export function canActorInvite(
  actor: { id: string; clinicId: string | null; roles: UserRole[] },
  targetClinicId: string
): { allowed: boolean; reason?: "TENANT_MISMATCH" | "INSUFFICIENT_PERMISSIONS" } {
  if (actor.roles.includes("platform_admin")) {
    return { allowed: true };
  }

  if (actor.roles.includes("clinic_owner")) {
    if (actor.clinicId === targetClinicId) {
      return { allowed: true };
    }
    return { allowed: false, reason: "TENANT_MISMATCH" };
  }

  return { allowed: false, reason: "INSUFFICIENT_PERMISSIONS" };
}

/**
 * Generates a cryptographically secure 32-byte hex token.
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export class InvitationService {
  constructor(private repo: IInvitationRepository) {}

  /**
   * Creates a new staff invitation with 7-day expiry and writes to audit log.
   */
  async createInvitation(input: CreateInvitationInput): Promise<{ invitation: InvitationRecord; inviteUrl: string }> {
    const permission = canActorInvite(input.actor, input.clinicId);
    if (!permission.allowed) {
      throw new InvitationServiceError(permission.reason!);
    }

    if (!input.email || !input.roles || input.roles.length === 0) {
      throw new InvitationServiceError("INVALID_INPUT", "Email and at least one role are required.");
    }

    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const invitation = await this.repo.createInvitation({
      email: input.email.trim().toLowerCase(),
      clinic_id: input.clinicId,
      roles: input.roles,
      token,
      invited_by: input.actor.id,
      status: "pending",
      expires_at: expiresAt,
    });

    await this.repo.appendAuditLog({
      clinic_id: input.clinicId,
      actor_id: input.actor.id,
      action: "INVITE_USER",
      entity_type: "invitation",
      entity_id: invitation.id,
      before_state: null,
      after_state: {
        email: invitation.email,
        roles: invitation.roles,
        expires_at: invitation.expires_at,
      },
      metadata: {
        invited_email: invitation.email,
      },
    });

    const inviteUrl = `/invite/accept?token=${token}`;
    return { invitation, inviteUrl };
  }

  /**
   * Validates a token and returns the invitation record.
   * Handles expired, revoked, and already accepted states.
   */
  async validateToken(token: string): Promise<InvitationRecord> {
    const invitation = await this.repo.findInvitationByToken(token);
    if (!invitation) {
      throw new InvitationServiceError("NOT_FOUND");
    }

    if (invitation.status === "accepted") {
      throw new InvitationServiceError("ALREADY_ACCEPTED");
    }

    if (invitation.status === "revoked") {
      throw new InvitationServiceError("REVOKED");
    }

    if (new Date(invitation.expires_at).getTime() < Date.now()) {
      if (invitation.status !== "expired") {
        await this.repo.updateInvitationStatus(invitation.id, "expired");
      }
      throw new InvitationServiceError("EXPIRED");
    }

    return invitation;
  }

  /**
   * Accepts an invitation, creates profile & roles, updates status, and logs to audit.
   */
  async acceptInvitation(input: AcceptInvitationInput): Promise<{ userId: string }> {
    const invitation = await this.validateToken(input.token);

    if (!input.fullName || !input.password || input.password.length < 8) {
      throw new InvitationServiceError("INVALID_INPUT", "Full name and password (min 8 chars) are required.");
    }

    // Create user and roles
    const user = await this.repo.createUserWithRoles({
      email: invitation.email,
      fullName: input.fullName.trim(),
      password: input.password,
      phone: input.phone,
      clinicId: invitation.clinic_id,
      roles: invitation.roles,
    });

    // Mark invitation accepted
    await this.repo.updateInvitationStatus(invitation.id, "accepted");

    // Audit log
    await this.repo.appendAuditLog({
      clinic_id: invitation.clinic_id,
      actor_id: user.id,
      action: "ACCEPT_INVITATION",
      entity_type: "user",
      entity_id: user.id,
      before_state: { invitation_status: "pending" },
      after_state: {
        invitation_status: "accepted",
        roles: invitation.roles,
        full_name: input.fullName,
      },
      metadata: {
        email: invitation.email,
      },
    });

    return { userId: user.id };
  }

  /**
   * Revokes an existing pending invitation.
   */
  async revokeInvitation(invitationId: string, actor: { id: string; clinicId: string | null; roles: UserRole[] }): Promise<void> {
    const invitation = await this.repo.findInvitationById(invitationId);
    if (!invitation) {
      throw new InvitationServiceError("NOT_FOUND");
    }

    const permission = canActorInvite(actor, invitation.clinic_id);
    if (!permission.allowed) {
      throw new InvitationServiceError(permission.reason!);
    }

    await this.repo.updateInvitationStatus(invitationId, "revoked");

    await this.repo.appendAuditLog({
      clinic_id: invitation.clinic_id,
      actor_id: actor.id,
      action: "REVOKE_INVITATION",
      entity_type: "invitation",
      entity_id: invitationId,
      before_state: { status: invitation.status },
      after_state: { status: "revoked" },
      metadata: { email: invitation.email },
    });
  }
}
