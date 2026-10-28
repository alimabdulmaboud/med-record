import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  evaluateFamilyRLS,
  type RLSContext,
  type FamilyMemberRecord,
  type ViewerGrantRecord,
} from "../rls-evaluator";

describe("Phase 5: Person Vaccinations Row Level Security (RLS) Tests", () => {
  it("verifies the Phase 5 migration SQL file exists and creates person_vaccinations with RLS enabled", () => {
    const migrationPath = path.join(
      process.cwd(),
      "supabase",
      "migrations",
      "20261028140000_phase5_vaccinations.sql"
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.person_vaccinations");
    expect(sql).toContain("ALTER TABLE public.person_vaccinations ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("CREATE POLICY");
  });

  describe("Vaccinations RLS Isolation & Role Enforcement", () => {
    const familyA = "fam-1111-aaaa";
    const familyB = "fam-2222-bbbb";
    const userManagerA = "user-mgr-a";
    const userViewerA = "user-vwr-a";
    const userManagerB = "user-mgr-b";

    const members: FamilyMemberRecord[] = [
      { id: "fm-1", family_id: familyA, user_id: userManagerA, role: "manager" },
      { id: "fm-2", family_id: familyA, user_id: userViewerA, role: "viewer" },
      { id: "fm-3", family_id: familyB, user_id: userManagerB, role: "manager" },
    ];

    const grants: ViewerGrantRecord[] = [
      {
        id: "grant-1",
        family_member_id: "fm-2",
        person_id: "p-a1",
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h future
        revoked_at: null,
      },
    ];

    const vacP1 = {
      id: "vac-1",
      family_id: familyA,
      person_id: "p-a1",
      vaccine_code: "BCG",
      vaccine_name: "BCG (الدرن)",
      status: "completed",
    };

    const vacP2 = {
      id: "vac-2",
      family_id: familyA,
      person_id: "p-a2", // not granted to viewer
      vaccine_code: "MMR_1",
      vaccine_name: "الثلاثي الفيروسي MMR",
      status: "pending",
    };

    const vacFamilyB = {
      id: "vac-3",
      family_id: familyB,
      person_id: "p-b1",
      vaccine_code: "OPV_0",
      vaccine_name: "شلل الأطفال الفموي",
      status: "completed",
    };

    it("allows family manager to SELECT, INSERT, UPDATE, and DELETE vaccinations in their own family", () => {
      const ctx: RLSContext = {
        currentUserId: userManagerA,
        members,
        grants,
      };

      // SELECT
      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "person_vaccinations", record: vacP1 })).toBe(true);
      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "person_vaccinations", record: vacP2 })).toBe(true);

      // INSERT / UPDATE / DELETE
      expect(evaluateFamilyRLS({ context: ctx, action: "INSERT", table: "person_vaccinations", record: vacP1 })).toBe(true);
      expect(evaluateFamilyRLS({ context: ctx, action: "UPDATE", table: "person_vaccinations", record: vacP1 })).toBe(true);
      expect(evaluateFamilyRLS({ context: ctx, action: "DELETE", table: "person_vaccinations", record: vacP1 })).toBe(true);
    });

    it("allows viewer with active unrevoked grant to SELECT vaccinations for granted child only", () => {
      const ctx: RLSContext = {
        currentUserId: userViewerA,
        members,
        grants,
      };

      // Can read granted child p-a1
      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "person_vaccinations", record: vacP1 })).toBe(true);

      // CANNOT read non-granted child p-a2
      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "person_vaccinations", record: vacP2 })).toBe(false);
    });

    it("STRICTLY DENIES viewer from INSERT, UPDATE, or DELETE on vaccinations", () => {
      const ctx: RLSContext = {
        currentUserId: userViewerA,
        members,
        grants,
      };

      expect(evaluateFamilyRLS({ context: ctx, action: "INSERT", table: "person_vaccinations", record: vacP1 })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctx, action: "UPDATE", table: "person_vaccinations", record: vacP1 })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctx, action: "DELETE", table: "person_vaccinations", record: vacP1 })).toBe(false);
    });

    it("DENIES viewer access if grant is expired or revoked", () => {
      const expiredGrant: ViewerGrantRecord = {
        id: "grant-expired",
        family_member_id: "fm-2",
        person_id: "p-a1",
        expires_at: new Date(Date.now() - 1000 * 60), // expired 1 min ago
        revoked_at: null,
      };

      const ctxExpired: RLSContext = {
        currentUserId: userViewerA,
        members,
        grants: [expiredGrant],
      };
      expect(evaluateFamilyRLS({ context: ctxExpired, action: "SELECT", table: "person_vaccinations", record: vacP1 })).toBe(false);

      const revokedGrant: ViewerGrantRecord = {
        id: "grant-revoked",
        family_member_id: "fm-2",
        person_id: "p-a1",
        expires_at: new Date(Date.now() + 1000 * 60 * 60),
        revoked_at: new Date(),
      };

      const ctxRevoked: RLSContext = {
        currentUserId: userViewerA,
        members,
        grants: [revokedGrant],
      };
      expect(evaluateFamilyRLS({ context: ctxRevoked, action: "SELECT", table: "person_vaccinations", record: vacP1 })).toBe(false);
    });

    it("DENIES access across families (cross-tenant isolation)", () => {
      const ctxA: RLSContext = {
        currentUserId: userManagerA,
        members,
        grants,
      };

      // Manager A cannot access Family B's vaccinations
      expect(evaluateFamilyRLS({ context: ctxA, action: "SELECT", table: "person_vaccinations", record: vacFamilyB })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctxA, action: "INSERT", table: "person_vaccinations", record: vacFamilyB })).toBe(false);
    });

    it("DENIES anonymous or unauthenticated users completely", () => {
      const anonCtx: RLSContext = {
        currentUserId: "",
        members,
        grants,
      };

      expect(evaluateFamilyRLS({ context: anonCtx, action: "SELECT", table: "person_vaccinations", record: vacP1 })).toBe(false);
      expect(evaluateFamilyRLS({ context: anonCtx, action: "INSERT", table: "person_vaccinations", record: vacP1 })).toBe(false);
    });
  });
});
