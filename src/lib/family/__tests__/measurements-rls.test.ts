import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  evaluateFamilyRLS,
  type RLSContext,
  type FamilyMemberRecord,
  type ViewerGrantRecord,
} from "../rls-evaluator";

describe("Phase 2: Person Measurements Row Level Security (RLS) Tests", () => {
  it("verifies the Phase 2 migration SQL file exists and creates person_measurements with RLS enabled", () => {
    const migrationPath = path.join(
      process.cwd(),
      "supabase",
      "migrations",
      "20261028110000_phase2_measurements.sql"
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.person_measurements");
    expect(sql).toContain("ALTER TABLE public.person_measurements ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("CREATE POLICY");
  });

  describe("Measurement RLS Isolation & Role Enforcement", () => {
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

    const measurementP1 = {
      id: "m-1",
      family_id: familyA,
      person_id: "p-a1",
      measurement_type: "blood_pressure",
      values: { systolic: 120, diastolic: 80 },
    };

    const measurementP2 = {
      id: "m-2",
      family_id: familyA,
      person_id: "p-a2", // not in grant
      measurement_type: "temperature",
      values: { temperature_c: 37.1 },
    };

    const measurementFamilyB = {
      id: "m-3",
      family_id: familyB,
      person_id: "p-b1",
      measurement_type: "blood_glucose",
      values: { glucose: 95 },
    };

    it("allows manager of Family A to SELECT measurements of any person in Family A", () => {
      const ctx: RLSContext = { currentUserId: userManagerA, members, grants };
      const canReadP1 = evaluateFamilyRLS({
        context: ctx,
        action: "SELECT",
        table: "person_measurements" as any,
        record: measurementP1,
      });
      const canReadP2 = evaluateFamilyRLS({
        context: ctx,
        action: "SELECT",
        table: "person_measurements" as any,
        record: measurementP2,
      });

      expect(canReadP1).toBe(true);
      expect(canReadP2).toBe(true);
    });

    it("denies manager of Family A from reading measurements belonging to Family B", () => {
      const ctx: RLSContext = { currentUserId: userManagerA, members, grants };
      const canRead = evaluateFamilyRLS({
        context: ctx,
        action: "SELECT",
        table: "person_measurements" as any,
        record: measurementFamilyB,
      });
      expect(canRead).toBe(false);
    });

    it("allows viewer with active grant on person to SELECT their measurements", () => {
      const ctx: RLSContext = { currentUserId: userViewerA, members, grants };
      const canReadGranted = evaluateFamilyRLS({
        context: ctx,
        action: "SELECT",
        table: "person_measurements" as any,
        record: measurementP1,
      });
      expect(canReadGranted).toBe(true);
    });

    it("denies viewer from reading measurements of a person they lack a grant for", () => {
      const ctx: RLSContext = { currentUserId: userViewerA, members, grants };
      const canReadUngranted = evaluateFamilyRLS({
        context: ctx,
        action: "SELECT",
        table: "person_measurements" as any,
        record: measurementP2,
      });
      expect(canReadUngranted).toBe(false);
    });

    it("allows manager to INSERT, UPDATE, or DELETE measurements in their family", () => {
      const ctx: RLSContext = { currentUserId: userManagerA, members, grants };
      const canInsert = evaluateFamilyRLS({
        context: ctx,
        action: "INSERT",
        table: "person_measurements" as any,
        record: measurementP1,
      });
      const canUpdate = evaluateFamilyRLS({
        context: ctx,
        action: "UPDATE",
        table: "person_measurements" as any,
        record: measurementP1,
      });
      const canDelete = evaluateFamilyRLS({
        context: ctx,
        action: "DELETE",
        table: "person_measurements" as any,
        record: measurementP1,
      });

      expect(canInsert).toBe(true);
      expect(canUpdate).toBe(true);
      expect(canDelete).toBe(true);
    });

    it("strictly denies viewer from INSERT, UPDATE, or DELETE operations on measurements", () => {
      const ctx: RLSContext = { currentUserId: userViewerA, members, grants };
      const canInsert = evaluateFamilyRLS({
        context: ctx,
        action: "INSERT",
        table: "person_measurements" as any,
        record: measurementP1,
      });
      const canUpdate = evaluateFamilyRLS({
        context: ctx,
        action: "UPDATE",
        table: "person_measurements" as any,
        record: measurementP1,
      });
      const canDelete = evaluateFamilyRLS({
        context: ctx,
        action: "DELETE",
        table: "person_measurements" as any,
        record: measurementP1,
      });

      expect(canInsert).toBe(false);
      expect(canUpdate).toBe(false);
      expect(canDelete).toBe(false);
    });
  });
});
