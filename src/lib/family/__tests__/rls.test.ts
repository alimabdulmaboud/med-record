import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  evaluateFamilyRLS,
  type RLSContext,
  type PersonRecord,
  type ViewerGrantRecord,
  type FamilyMemberRecord,
} from "../rls-evaluator";

describe("Phase 1: Family Space Row Level Security (RLS) Tests", () => {
  it("verifies the Phase 1 migration SQL file exists and contains all required tables with RLS enabled", () => {
    const migrationPath = path.join(
      process.cwd(),
      "supabase",
      "migrations",
      "20261027100000_phase1_family_space.sql"
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sql = fs.readFileSync(migrationPath, "utf-8");

    const requiredTables = [
      "families",
      "family_members",
      "people",
      "emergency_contacts",
      "viewer_grants",
      "audit_log",
      "consents",
    ];

    for (const table of requiredTables) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    }
  });

  describe("Rule: Manager Access & Isolation (Family A vs Family B)", () => {
    const familyA = "fam-1111-aaaa";
    const familyB = "fam-2222-bbbb";
    const userManagerA = "user-mgr-a";
    const userManagerB = "user-mgr-b";

    const members: FamilyMemberRecord[] = [
      { id: "fm-1", family_id: familyA, user_id: userManagerA, role: "manager" },
      { id: "fm-2", family_id: familyB, user_id: userManagerB, role: "manager" },
    ];

    const people: PersonRecord[] = [
      { id: "p-a1", family_id: familyA, name: "أحمد مصطفى", archived_at: null },
      { id: "p-a2", family_id: familyA, name: "سارة أحمد", archived_at: null },
      { id: "p-b1", family_id: familyB, name: "كريم شريف", archived_at: null },
    ];

    it("allows manager of Family A to read all people in Family A", () => {
      const ctx: RLSContext = {
        currentUserId: userManagerA,
        members,
        grants: [],
      };

      const readablePeople = people.filter((p) =>
        evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "people", record: p })
      );

      expect(readablePeople.map((p) => p.id)).toEqual(["p-a1", "p-a2"]);
    });

    it("strictly forbids manager of Family A from reading or modifying Family B data", () => {
      const ctx: RLSContext = {
        currentUserId: userManagerA,
        members,
        grants: [],
      };

      const personB = people.find((p) => p.id === "p-b1")!;

      const canRead = evaluateFamilyRLS({
        context: ctx,
        action: "SELECT",
        table: "people",
        record: personB,
      });
      const canUpdate = evaluateFamilyRLS({
        context: ctx,
        action: "UPDATE",
        table: "people",
        record: personB,
      });
      const canDelete = evaluateFamilyRLS({
        context: ctx,
        action: "DELETE",
        table: "people",
        record: personB,
      });

      expect(canRead).toBe(false);
      expect(canUpdate).toBe(false);
      expect(canDelete).toBe(false);
    });
  });

  describe("Rule: Viewer Permissions & Active Grant Gating", () => {
    const familyA = "fam-1111-aaaa";
    const userViewer = "user-viewer-1";
    const now = new Date("2026-10-27T12:00:00Z");

    const members: FamilyMemberRecord[] = [
      { id: "fm-viewer", family_id: familyA, user_id: userViewer, role: "viewer" },
    ];

    const personChild1: PersonRecord = {
      id: "p-child1",
      family_id: familyA,
      name: "سارة أحمد",
      archived_at: null,
    };
    const personChild2: PersonRecord = {
      id: "p-child2",
      family_id: familyA,
      name: "ياسين أحمد",
      archived_at: null,
    };

    it("allows viewer to read a person when having an active, unrevoked grant", () => {
      const activeGrant: ViewerGrantRecord = {
        id: "vg-1",
        family_member_id: "fm-viewer",
        person_id: "p-child1",
        expires_at: new Date("2026-11-01T00:00:00Z"), // future
        revoked_at: null,
      };

      const ctx: RLSContext = {
        currentUserId: userViewer,
        members,
        grants: [activeGrant],
        now,
      };

      const canRead = evaluateFamilyRLS({
        context: ctx,
        action: "SELECT",
        table: "people",
        record: personChild1,
      });
      expect(canRead).toBe(true);
    });

    it("blocks viewer from reading a person if grant is expired", () => {
      const expiredGrant: ViewerGrantRecord = {
        id: "vg-expired",
        family_member_id: "fm-viewer",
        person_id: "p-child1",
        expires_at: new Date("2026-10-20T00:00:00Z"), // past
        revoked_at: null,
      };

      const ctx: RLSContext = {
        currentUserId: userViewer,
        members,
        grants: [expiredGrant],
        now,
      };

      const canRead = evaluateFamilyRLS({
        context: ctx,
        action: "SELECT",
        table: "people",
        record: personChild1,
      });
      expect(canRead).toBe(false);
    });

    it("blocks viewer from reading a person if grant has been revoked", () => {
      const revokedGrant: ViewerGrantRecord = {
        id: "vg-revoked",
        family_member_id: "fm-viewer",
        person_id: "p-child1",
        expires_at: new Date("2026-11-01T00:00:00Z"), // future
        revoked_at: new Date("2026-10-26T00:00:00Z"), // revoked yesterday
      };

      const ctx: RLSContext = {
        currentUserId: userViewer,
        members,
        grants: [revokedGrant],
        now,
      };

      const canRead = evaluateFamilyRLS({
        context: ctx,
        action: "SELECT",
        table: "people",
        record: personChild1,
      });
      expect(canRead).toBe(false);
    });

    it("blocks viewer from reading people in the same family who have no grant", () => {
      const ctx: RLSContext = {
        currentUserId: userViewer,
        members,
        grants: [], // no grant for child 2
        now,
      };

      const canRead = evaluateFamilyRLS({
        context: ctx,
        action: "SELECT",
        table: "people",
        record: personChild2,
      });
      expect(canRead).toBe(false);
    });

    it("strictly blocks viewer from writing (INSERT, UPDATE, DELETE) even with active grant", () => {
      const activeGrant: ViewerGrantRecord = {
        id: "vg-1",
        family_member_id: "fm-viewer",
        person_id: "p-child1",
        expires_at: new Date("2026-11-01T00:00:00Z"),
        revoked_at: null,
      };

      const ctx: RLSContext = {
        currentUserId: userViewer,
        members,
        grants: [activeGrant],
        now,
      };

      const canInsert = evaluateFamilyRLS({
        context: ctx,
        action: "INSERT",
        table: "people",
        record: personChild1,
      });
      const canUpdate = evaluateFamilyRLS({
        context: ctx,
        action: "UPDATE",
        table: "people",
        record: personChild1,
      });
      const canDelete = evaluateFamilyRLS({
        context: ctx,
        action: "DELETE",
        table: "people",
        record: personChild1,
      });

      expect(canInsert).toBe(false);
      expect(canUpdate).toBe(false);
      expect(canDelete).toBe(false);
    });
  });

  describe("Rule: Audit Log & Consents Immutability", () => {
    it("ensures audit_log cannot be updated or deleted by anyone", () => {
      const ctx: RLSContext = {
        currentUserId: "user-mgr-a",
        members: [{ id: "fm-1", family_id: "f-1", user_id: "user-mgr-a", role: "manager" }],
        grants: [],
      };

      const canUpdateAudit = evaluateFamilyRLS({
        context: ctx,
        action: "UPDATE",
        table: "audit_log",
        record: { id: "audit-1", actor_id: "user-mgr-a" },
      });
      const canDeleteAudit = evaluateFamilyRLS({
        context: ctx,
        action: "DELETE",
        table: "audit_log",
        record: { id: "audit-1", actor_id: "user-mgr-a" },
      });

      expect(canUpdateAudit).toBe(false);
      expect(canDeleteAudit).toBe(false);
    });

    it("ensures consents can be created and read by owner, but never updated or deleted", () => {
      const ctx: RLSContext = {
        currentUserId: "user-mgr-a",
        members: [],
        grants: [],
      };

      const canReadOwnConsent = evaluateFamilyRLS({
        context: ctx,
        action: "SELECT",
        table: "consents",
        record: { id: "c-1", user_id: "user-mgr-a" },
      });
      const canReadOtherConsent = evaluateFamilyRLS({
        context: ctx,
        action: "SELECT",
        table: "consents",
        record: { id: "c-2", user_id: "user-other" },
      });
      const canUpdateConsent = evaluateFamilyRLS({
        context: ctx,
        action: "UPDATE",
        table: "consents",
        record: { id: "c-1", user_id: "user-mgr-a" },
      });

      expect(canReadOwnConsent).toBe(true);
      expect(canReadOtherConsent).toBe(false);
      expect(canUpdateConsent).toBe(false);
    });
  });
});
