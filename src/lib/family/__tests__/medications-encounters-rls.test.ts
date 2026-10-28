import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  evaluateFamilyRLS,
  type RLSContext,
  type FamilyMemberRecord,
  type ViewerGrantRecord,
} from "../rls-evaluator";

describe("Phase 4: Person Medications & Encounters Row Level Security (RLS) Tests", () => {
  it("verifies the Phase 4 migration SQL file exists and creates person_medications and person_encounters with RLS enabled", () => {
    const migrationPath = path.join(
      process.cwd(),
      "supabase",
      "migrations",
      "20261028130000_phase4_medications_encounters.sql"
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.person_medications");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.person_encounters");
    expect(sql).toContain("ALTER TABLE public.person_medications ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("ALTER TABLE public.person_encounters ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("CREATE POLICY");
  });

  describe("Medications & Encounters RLS Isolation & Role Enforcement", () => {
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

    const medP1 = {
      id: "med-1",
      family_id: familyA,
      person_id: "p-a1",
      name: "كونكور 5 مجم",
      dose: "5mg",
      frequency: "مرة يومياً",
      status: "active",
    };

    const medP2 = {
      id: "med-2",
      family_id: familyA,
      person_id: "p-a2", // not granted to viewer
      name: "أنسولين لانتوس",
      dose: "20 وحدة",
      frequency: "مرة مساءً",
      status: "active",
    };

    const encP1 = {
      id: "enc-1",
      family_id: familyA,
      person_id: "p-a1",
      doctor_name: "د. طارق البدري",
      specialty: "باطنة وقلب وأوعية دموية",
      visit_date: "2026-10-15",
    };

    const encP2 = {
      id: "enc-2",
      family_id: familyA,
      person_id: "p-a2",
      doctor_name: "د. منى الشريف",
      specialty: "طب أطفال وحديثي ولادة",
      visit_date: "2026-10-20",
    };

    const medFamilyB = {
      id: "med-3",
      family_id: familyB,
      person_id: "p-b1",
      name: "أوجمنتين 1 جم",
      dose: "1g",
      frequency: "مرتين يومياً",
      status: "active",
    };

    it("allows family manager to SELECT, INSERT, UPDATE, and DELETE medications and encounters in their own family", () => {
      const ctx: RLSContext = {
        currentUserId: userManagerA,
        members,
        grants,
      };

      // SELECT
      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "person_medications" as any, record: medP1 })).toBe(true);
      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "person_medications" as any, record: medP2 })).toBe(true);
      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "person_encounters" as any, record: encP1 })).toBe(true);
      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "person_encounters" as any, record: encP2 })).toBe(true);

      // INSERT / UPDATE / DELETE
      expect(evaluateFamilyRLS({ context: ctx, action: "INSERT", table: "person_medications" as any, record: medP1 })).toBe(true);
      expect(evaluateFamilyRLS({ context: ctx, action: "UPDATE", table: "person_medications" as any, record: medP1 })).toBe(true);
      expect(evaluateFamilyRLS({ context: ctx, action: "DELETE", table: "person_medications" as any, record: medP1 })).toBe(true);

      expect(evaluateFamilyRLS({ context: ctx, action: "INSERT", table: "person_encounters" as any, record: encP1 })).toBe(true);
      expect(evaluateFamilyRLS({ context: ctx, action: "UPDATE", table: "person_encounters" as any, record: encP1 })).toBe(true);
      expect(evaluateFamilyRLS({ context: ctx, action: "DELETE", table: "person_encounters" as any, record: encP1 })).toBe(true);
    });

    it("allows viewer with active unrevoked grant to SELECT medications and encounters for granted person only", () => {
      const ctx: RLSContext = {
        currentUserId: userViewerA,
        members,
        grants,
      };

      // Can read granted person p-a1
      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "person_medications" as any, record: medP1 })).toBe(true);
      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "person_encounters" as any, record: encP1 })).toBe(true);

      // CANNOT read non-granted person p-a2
      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "person_medications" as any, record: medP2 })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "person_encounters" as any, record: encP2 })).toBe(false);
    });

    it("STRICTLY DENIES viewer from INSERT, UPDATE, or DELETE on medications and encounters", () => {
      const ctx: RLSContext = {
        currentUserId: userViewerA,
        members,
        grants,
      };

      expect(evaluateFamilyRLS({ context: ctx, action: "INSERT", table: "person_medications" as any, record: medP1 })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctx, action: "UPDATE", table: "person_medications" as any, record: medP1 })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctx, action: "DELETE", table: "person_medications" as any, record: medP1 })).toBe(false);

      expect(evaluateFamilyRLS({ context: ctx, action: "INSERT", table: "person_encounters" as any, record: encP1 })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctx, action: "UPDATE", table: "person_encounters" as any, record: encP1 })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctx, action: "DELETE", table: "person_encounters" as any, record: encP1 })).toBe(false);
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
      expect(evaluateFamilyRLS({ context: ctxExpired, action: "SELECT", table: "person_medications" as any, record: medP1 })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctxExpired, action: "SELECT", table: "person_encounters" as any, record: encP1 })).toBe(false);

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
      expect(evaluateFamilyRLS({ context: ctxRevoked, action: "SELECT", table: "person_medications" as any, record: medP1 })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctxRevoked, action: "SELECT", table: "person_encounters" as any, record: encP1 })).toBe(false);
    });

    it("DENIES access across families (cross-tenant isolation)", () => {
      const ctxA: RLSContext = {
        currentUserId: userManagerA,
        members,
        grants,
      };

      // Manager A cannot access Family B's medications or encounters
      expect(evaluateFamilyRLS({ context: ctxA, action: "SELECT", table: "person_medications" as any, record: medFamilyB })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctxA, action: "INSERT", table: "person_medications" as any, record: medFamilyB })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctxA, action: "SELECT", table: "person_encounters" as any, record: { ...encP1, family_id: familyB } })).toBe(false);
    });

    it("DENIES anonymous or unauthenticated users completely", () => {
      const anonCtx: RLSContext = {
        currentUserId: "",
        members,
        grants,
      };

      expect(evaluateFamilyRLS({ context: anonCtx, action: "SELECT", table: "person_medications" as any, record: medP1 })).toBe(false);
      expect(evaluateFamilyRLS({ context: anonCtx, action: "INSERT", table: "person_medications" as any, record: medP1 })).toBe(false);
      expect(evaluateFamilyRLS({ context: anonCtx, action: "SELECT", table: "person_encounters" as any, record: encP1 })).toBe(false);
      expect(evaluateFamilyRLS({ context: anonCtx, action: "INSERT", table: "person_encounters" as any, record: encP1 })).toBe(false);
    });
  });
});
