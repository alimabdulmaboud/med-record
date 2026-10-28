import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  evaluateFamilyRLS,
  type RLSContext,
  type FamilyMemberRecord,
  type ViewerGrantRecord,
} from "../rls-evaluator";

describe("Phase 6: Doctor Reports & Report Shares Row Level Security (RLS) Tests", () => {
  it("verifies the Phase 6 migration SQL file exists and creates doctor_reports and report_shares with RLS enabled", () => {
    const migrationPath = path.join(
      process.cwd(),
      "supabase",
      "migrations",
      "20261028150000_phase6_reports.sql"
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.doctor_reports");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.report_shares");
    expect(sql).toContain("ALTER TABLE public.doctor_reports ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("ALTER TABLE public.report_shares ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("CREATE POLICY");
  });

  describe("Doctor Reports RLS Isolation & Role Enforcement", () => {
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

    const reportP1 = {
      id: "rep-1",
      family_id: familyA,
      person_id: "p-a1",
      title: "Comprehensive Pediatric Summary",
    };

    const reportP2 = {
      id: "rep-2",
      family_id: familyA,
      person_id: "p-a2", // No grant for viewer
      title: "Adult Health Summary",
    };

    it("allows family managers to SELECT, INSERT, UPDATE, and DELETE doctor reports in their family", () => {
      const ctx: RLSContext = {
        currentUserId: userManagerA,
        members,
        grants,
      };

      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "doctor_reports", record: reportP1 })).toBe(true);
      expect(evaluateFamilyRLS({ context: ctx, action: "INSERT", table: "doctor_reports", record: reportP1 })).toBe(true);
      expect(evaluateFamilyRLS({ context: ctx, action: "UPDATE", table: "doctor_reports", record: reportP1 })).toBe(true);
      expect(evaluateFamilyRLS({ context: ctx, action: "DELETE", table: "doctor_reports", record: reportP1 })).toBe(true);
    });

    it("allows viewers with active grants to SELECT reports only for the granted person", () => {
      const ctx: RLSContext = {
        currentUserId: userViewerA,
        members,
        grants,
      };

      // p-a1 has grant -> allowed
      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "doctor_reports", record: reportP1 })).toBe(true);
      // p-a2 has NO grant -> denied
      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "doctor_reports", record: reportP2 })).toBe(false);
    });

    it("denies viewers from mutating doctor reports (INSERT, UPDATE, DELETE)", () => {
      const ctx: RLSContext = {
        currentUserId: userViewerA,
        members,
        grants,
      };

      expect(evaluateFamilyRLS({ context: ctx, action: "INSERT", table: "doctor_reports", record: reportP1 })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctx, action: "UPDATE", table: "doctor_reports", record: reportP1 })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctx, action: "DELETE", table: "doctor_reports", record: reportP1 })).toBe(false);
    });

    it("strictly isolates families: manager of Family B cannot access reports in Family A", () => {
      const ctx: RLSContext = {
        currentUserId: userManagerB,
        members,
        grants,
      };

      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "doctor_reports", record: reportP1 })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctx, action: "INSERT", table: "doctor_reports", record: reportP1 })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctx, action: "UPDATE", table: "doctor_reports", record: reportP1 })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctx, action: "DELETE", table: "doctor_reports", record: reportP1 })).toBe(false);
    });
  });

  describe("Report Shares RLS & Token Verification", () => {
    const familyA = "fam-1111-aaaa";
    const userManagerA = "user-mgr-a";
    const userOther = "user-stranger";

    const members: FamilyMemberRecord[] = [
      { id: "fm-1", family_id: familyA, user_id: userManagerA, role: "manager" },
    ];

    const activeShare = {
      id: "sh-1",
      family_id: familyA,
      person_id: "p-a1",
      report_id: "rep-1",
      access_token: "tok-valid-72h",
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
      is_revoked: false,
    };

    const expiredShare = {
      id: "sh-2",
      family_id: familyA,
      person_id: "p-a1",
      report_id: "rep-1",
      access_token: "tok-expired",
      expires_at: new Date(Date.now() - 1000 * 60).toISOString(),
      is_revoked: false,
    };

    const revokedShare = {
      id: "sh-3",
      family_id: familyA,
      person_id: "p-a1",
      report_id: "rep-1",
      access_token: "tok-revoked",
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
      is_revoked: true,
    };

    it("allows managers full control over report shares in their family", () => {
      const ctx: RLSContext = {
        currentUserId: userManagerA,
        members,
        grants: [],
      };

      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "report_shares", record: activeShare })).toBe(true);
      expect(evaluateFamilyRLS({ context: ctx, action: "INSERT", table: "report_shares", record: activeShare })).toBe(true);
      expect(evaluateFamilyRLS({ context: ctx, action: "UPDATE", table: "report_shares", record: activeShare })).toBe(true);
      expect(evaluateFamilyRLS({ context: ctx, action: "DELETE", table: "report_shares", record: activeShare })).toBe(true);
    });

    it("allows public/external bearer to SELECT active unrevoked unexpired share", () => {
      const ctx: RLSContext = {
        currentUserId: userOther,
        members: [],
        grants: [],
      };

      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "report_shares", record: activeShare })).toBe(true);
    });

    it("denies public/external bearer SELECT if share is expired or revoked", () => {
      const ctx: RLSContext = {
        currentUserId: userOther,
        members: [],
        grants: [],
      };

      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "report_shares", record: expiredShare })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctx, action: "SELECT", table: "report_shares", record: revokedShare })).toBe(false);
    });

    it("denies public/external bearer any mutation on report shares", () => {
      const ctx: RLSContext = {
        currentUserId: userOther,
        members: [],
        grants: [],
      };

      expect(evaluateFamilyRLS({ context: ctx, action: "INSERT", table: "report_shares", record: activeShare })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctx, action: "UPDATE", table: "report_shares", record: activeShare })).toBe(false);
      expect(evaluateFamilyRLS({ context: ctx, action: "DELETE", table: "report_shares", record: activeShare })).toBe(false);
    });
  });
});
