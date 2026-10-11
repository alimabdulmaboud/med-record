import { describe, it, expect, beforeEach } from "vitest";
import {
  InvitationService,
  IInvitationRepository,
  InvitationServiceError,
} from "./service";
import { UserService, IUserRepository, UserProfile } from "../auth/users";
import { InvitationRecord, AuditLogEntry, UserRole } from "./types";

// In-memory mock repositories for testing
class MockInvitationRepository implements IInvitationRepository {
  public invitations: Map<string, InvitationRecord> = new Map();
  public users: Map<string, { id: string; email: string; fullName: string; roles: UserRole[] }> = new Map();
  public auditLogs: AuditLogEntry[] = [];

  async createInvitation(
    record: Omit<InvitationRecord, "id" | "created_at" | "updated_at">
  ): Promise<InvitationRecord> {
    const id = `inv-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const fullRecord: InvitationRecord = {
      ...record,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.invitations.set(id, fullRecord);
    return fullRecord;
  }

  async findInvitationByToken(token: string): Promise<InvitationRecord | null> {
    for (const inv of this.invitations.values()) {
      if (inv.token === token) return inv;
    }
    return null;
  }

  async findInvitationById(id: string): Promise<InvitationRecord | null> {
    return this.invitations.get(id) || null;
  }

  async updateInvitationStatus(
    id: string,
    status: InvitationRecord["status"],
    extra?: Partial<InvitationRecord>
  ): Promise<InvitationRecord> {
    const inv = this.invitations.get(id);
    if (!inv) throw new Error("Not found");
    const updated = { ...inv, status, ...extra, updated_at: new Date().toISOString() };
    this.invitations.set(id, updated);
    return updated;
  }

  async createUserWithRoles(params: {
    email: string;
    fullName: string;
    password: string;
    clinicId: string;
    roles: UserRole[];
  }): Promise<{ id: string; email: string }> {
    const id = `user-${Date.now()}`;
    this.users.set(id, {
      id,
      email: params.email,
      fullName: params.fullName,
      roles: params.roles,
    });
    return { id, email: params.email };
  }

  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    this.auditLogs.push({ ...entry, id: `audit-${Date.now()}` });
  }
}

class MockUserRepository implements IUserRepository {
  public profiles: Map<string, UserProfile> = new Map();
  public auditLogs: AuditLogEntry[] = [];

  async findProfileById(userId: string): Promise<UserProfile | null> {
    return this.profiles.get(userId) || null;
  }

  async setArchiveStatus(
    userId: string,
    archivedAt: string | null,
    archivedBy: string | null
  ): Promise<UserProfile> {
    const profile = this.profiles.get(userId);
    if (!profile) throw new Error("Not found");
    const updated: UserProfile = {
      ...profile,
      archived_at: archivedAt,
      archived_by: archivedBy,
      updated_at: new Date().toISOString(),
    };
    this.profiles.set(userId, updated);
    return updated;
  }

  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    this.auditLogs.push(entry);
  }
}

describe("Phase 3: Invitations and Authentication Engine", () => {
  let invRepo: MockInvitationRepository;
  let userRepo: MockUserRepository;
  let invService: InvitationService;
  let userService: UserService;

  const CLINIC_A = "c1000000-0000-0000-0000-000000000001";
  const CLINIC_B = "c2000000-0000-0000-0000-000000000002";

  const PLATFORM_ADMIN = {
    id: "admin-1",
    clinicId: null,
    roles: ["platform_admin" as UserRole],
  };

  const OWNER_A = {
    id: "owner-a",
    clinicId: CLINIC_A,
    roles: ["clinic_owner" as UserRole],
  };

  const RECEPTIONIST_A = {
    id: "reception-a",
    clinicId: CLINIC_A,
    roles: ["receptionist" as UserRole],
  };

  beforeEach(() => {
    invRepo = new MockInvitationRepository();
    userRepo = new MockUserRepository();
    invService = new InvitationService(invRepo);
    userService = new UserService(userRepo);
  });

  describe("Permission Matrix on Inviting", () => {
    it("allows platform_admin to invite a clinic_owner for any clinic", async () => {
      const result = await invService.createInvitation({
        email: "new.owner@example.com",
        clinicId: CLINIC_A,
        roles: ["clinic_owner"],
        actor: PLATFORM_ADMIN,
      });

      expect(result.invitation.email).toBe("new.owner@example.com");
      expect(result.invitation.status).toBe("pending");
      expect(result.inviteUrl).toContain("token=");

      // Verifies audit log record was written
      expect(invRepo.auditLogs).toHaveLength(1);
      expect(invRepo.auditLogs[0].action).toBe("INVITE_USER");
    });

    it("allows clinic_owner to invite doctor and receptionist for their own clinic", async () => {
      const result = await invService.createInvitation({
        email: "new.doctor@example.com",
        clinicId: CLINIC_A,
        roles: ["doctor"],
        actor: OWNER_A,
      });

      expect(result.invitation.email).toBe("new.doctor@example.com");
      expect(invRepo.auditLogs[0].action).toBe("INVITE_USER");
    });

    it("fails when clinic_owner tries to invite into another clinic (TENANT_MISMATCH)", async () => {
      await expect(
        invService.createInvitation({
          email: "intruder@example.com",
          clinicId: CLINIC_B, // Different clinic!
          roles: ["doctor"],
          actor: OWNER_A,
        })
      ).rejects.toThrowError(
        expect.objectContaining({ code: "TENANT_MISMATCH" })
      );
    });

    it("fails when a receptionist tries to invite anyone (INSUFFICIENT_PERMISSIONS)", async () => {
      await expect(
        invService.createInvitation({
          email: "friend@example.com",
          clinicId: CLINIC_A,
          roles: ["receptionist"],
          actor: RECEPTIONIST_A,
        })
      ).rejects.toThrowError(
        expect.objectContaining({ code: "INSUFFICIENT_PERMISSIONS" })
      );
    });
  });

  describe("Token Validation & Acceptance Lifecycle", () => {
    it("validates a pending token correctly", async () => {
      const { invitation } = await invService.createInvitation({
        email: "doc@example.com",
        clinicId: CLINIC_A,
        roles: ["doctor"],
        actor: OWNER_A,
      });

      const validated = await invService.validateToken(invitation.token);
      expect(validated.id).toBe(invitation.id);
      expect(validated.status).toBe("pending");
    });

    it("fails with EXPIRED when token expires_at is in the past", async () => {
      const { invitation } = await invService.createInvitation({
        email: "late@example.com",
        clinicId: CLINIC_A,
        roles: ["doctor"],
        actor: OWNER_A,
      });

      // Simulate token expiration by setting expires_at to 1 hour ago
      const expiredDate = new Date(Date.now() - 3600 * 1000).toISOString();
      await invRepo.updateInvitationStatus(invitation.id, "pending", {
        expires_at: expiredDate,
      });

      await expect(invService.validateToken(invitation.token)).rejects.toThrowError(
        expect.objectContaining({ code: "EXPIRED" })
      );
    });

    it("fails with REVOKED when token has been revoked", async () => {
      const { invitation } = await invService.createInvitation({
        email: "cancelled@example.com",
        clinicId: CLINIC_A,
        roles: ["doctor"],
        actor: OWNER_A,
      });

      await invService.revokeInvitation(invitation.id, OWNER_A);

      await expect(invService.validateToken(invitation.token)).rejects.toThrowError(
        expect.objectContaining({ code: "REVOKED" })
      );
    });

    it("successfully accepts invitation and creates user account", async () => {
      const { invitation } = await invService.createInvitation({
        email: "doctor.new@example.com",
        clinicId: CLINIC_A,
        roles: ["doctor"],
        actor: OWNER_A,
      });

      const acceptResult = await invService.acceptInvitation({
        token: invitation.token,
        fullName: "د. أحمد خليل",
        password: "SecurePassword123!",
      });

      expect(acceptResult.userId).toBeDefined();

      // Verify invitation status changed to accepted
      const updatedInv = await invRepo.findInvitationById(invitation.id);
      expect(updatedInv?.status).toBe("accepted");

      // Verify user created with correct roles
      const createdUser = invRepo.users.get(acceptResult.userId);
      expect(createdUser?.fullName).toBe("د. أحمد خليل");
      expect(createdUser?.roles).toContain("doctor");

      // Verify audit log has ACCEPT_INVITATION entry
      const acceptAudit = invRepo.auditLogs.find(
        (l) => l.action === "ACCEPT_INVITATION"
      );
      expect(acceptAudit).toBeDefined();
    });

    it("fails with ALREADY_ACCEPTED when attempting to accept twice", async () => {
      const { invitation } = await invService.createInvitation({
        email: "twice@example.com",
        clinicId: CLINIC_A,
        roles: ["doctor"],
        actor: OWNER_A,
      });

      // First acceptance
      await invService.acceptInvitation({
        token: invitation.token,
        fullName: "د. أحمد خليل",
        password: "SecurePassword123!",
      });

      // Second acceptance attempt MUST fail
      await expect(
        invService.acceptInvitation({
          token: invitation.token,
          fullName: "د. أحمد خليل",
          password: "SecurePassword123!",
        })
      ).rejects.toThrowError(
        expect.objectContaining({ code: "ALREADY_ACCEPTED" })
      );
    });
  });

  describe("User Archival and Login Blocking (Rule #5)", () => {
    it("archives a user and verifies canUserSignIn disallows them", async () => {
      const targetUser: UserProfile = {
        id: "target-1",
        clinic_id: CLINIC_A,
        full_name: "موظف سابق",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      userRepo.profiles.set(targetUser.id, targetUser);

      // Initially can sign in
      expect(userService.canUserSignIn(targetUser).allowed).toBe(true);

      // Archive user
      const archived = await userService.archiveUser(targetUser.id, OWNER_A);
      expect(archived.archived_at).not.toBeNull();
      expect(archived.archived_by).toBe(OWNER_A.id);

      // Check login eligibility
      const check = userService.canUserSignIn(archived);
      expect(check.allowed).toBe(false);
      expect(check.reason).toBe("ARCHIVED_ACCOUNT");

      // Audit logged
      expect(userRepo.auditLogs).toHaveLength(1);
      expect(userRepo.auditLogs[0].action).toBe("ARCHIVE_USER");
    });

    it("restores an archived user and permits login again", async () => {
      const targetUser: UserProfile = {
        id: "target-2",
        clinic_id: CLINIC_A,
        full_name: "طبيب مستعاد",
        archived_at: new Date().toISOString(),
        archived_by: OWNER_A.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      userRepo.profiles.set(targetUser.id, targetUser);

      // Initially blocked
      expect(userService.canUserSignIn(targetUser).allowed).toBe(false);

      // Restore
      const restored = await userService.restoreUser(targetUser.id, OWNER_A);
      expect(restored.archived_at).toBeNull();
      expect(userService.canUserSignIn(restored).allowed).toBe(true);
      expect(userRepo.auditLogs[0].action).toBe("RESTORE_USER");
    });
  });
});
