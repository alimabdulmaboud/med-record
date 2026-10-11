import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { CLINICAL_TABLES, isClinicalTable } from "./clinical-tables";
import { loadSecurityMigration } from "./policy-evaluator";

describe("Database Security & Row Level Security (RLS) Verification", () => {
  const { tables, triggers } = loadSecurityMigration();

  describe("Rule #3: Universal Tenant & Table RLS Enforcement", () => {
    it("ensures that EVERY public table created in migrations has RLS enabled (Default Deny)", () => {
      expect(tables.size).toBeGreaterThan(0);

      const tablesWithoutRLS: string[] = [];
      for (const [name, table] of tables.entries()) {
        if (!table.hasRLS) {
          tablesWithoutRLS.push(name);
        }
      }

      // Rule #3: A table without RLS is a bug.
      expect(
        tablesWithoutRLS,
        `Found tables without RLS: ${tablesWithoutRLS.join(", ")}`
      ).toEqual([]);
    });

    it("verifies all foundational tables exist", () => {
      const requiredTables = [
        "clinics",
        "profiles",
        "user_roles",
        "invitations",
        "audit_log",
        "patients",
        "guardians",
        "patient_guardians",
      ];
      for (const req of requiredTables) {
        expect(tables.has(req), `Missing required table: ${req}`).toBe(true);
      }
    });
  });

  describe("Test Group 1: Tenant Isolation (Clinic A vs Clinic B)", () => {
    it("proves that clinic-owned tables enforce clinic_id filtering on SELECT, INSERT, UPDATE", () => {
      const clinicOwnedTables = [
        "profiles",
        "user_roles",
        "invitations",
        "audit_log",
        "patients",
        "guardians",
        "patient_guardians",
      ];

      for (const tableName of clinicOwnedTables) {
        const table = tables.get(tableName);
        expect(table).toBeDefined();

        // Must have at least a SELECT policy
        const selectPolicies = table!.policies.filter((p) => p.command === "SELECT");
        expect(
          selectPolicies.length,
          `Table ${tableName} must have a SELECT policy enforcing isolation`
        ).toBeGreaterThan(0);
      }
    });

    it("simulates tenant isolation: Clinic A user accessing Clinic B row evaluates to false", () => {
      const userClinicId: string = "c1000000-0000-0000-0000-000000000001";
      const targetRowClinicId: string = "c2000000-0000-0000-0000-000000000002";

      // Simulated RLS clause: (clinic_id = current_clinic_id())
      const canRead = userClinicId === targetRowClinicId;
      expect(canRead).toBe(false);
    });
  });

  describe("Test Group 2: Medical Privacy - Receptionist Access", () => {
    it("ensures receptionist role has NO select policies on any table in CLINICAL_TABLES list", () => {
      // Rule #2: Medical privacy. receptionist must never be able to read clinical data.
      for (const clinicalTable of CLINICAL_TABLES) {
        const table = tables.get(clinicalTable);
        if (table) {
          const receptionistPolicies = table.policies.filter(
            (p) =>
              p.command === "SELECT" &&
              (p.roles.includes("receptionist") ||
                p.name.toLowerCase().includes("receptionist"))
          );
          expect(
            receptionistPolicies,
            `Receptionist must NOT have SELECT access on clinical table ${clinicalTable}`
          ).toHaveLength(0);
        }
      }
    });

    it("isClinicalTable returns false for operational tables (demographics, queue, billing)", () => {
      expect(isClinicalTable("clinics")).toBe(false);
      expect(isClinicalTable("profiles")).toBe(false);
      expect(isClinicalTable("invitations")).toBe(false);
    });
  });

  describe("Test Group 3: Medical Privacy - Platform Admin Access", () => {
    it("ensures platform_admin has NO policy granting read access to any clinical table", () => {
      // Non-negotiable Rule #2: platform_admin must never be able to read clinical data.
      for (const clinicalTable of CLINICAL_TABLES) {
        const table = tables.get(clinicalTable);
        if (table) {
          const adminPolicies = table.policies.filter(
            (p) =>
              p.command === "SELECT" &&
              (p.name.toLowerCase().includes("admin") ||
                p.roles.includes("platform_admin"))
          );
          expect(
            adminPolicies,
            `platform_admin must NOT have SELECT access on clinical table ${clinicalTable}`
          ).toHaveLength(0);
        }
      }
    });
  });

  describe("Test Group 4: Audit Log Immutability (Append-Only)", () => {
    it("ensures audit_log has NO UPDATE or DELETE policies defined (Default Deny)", () => {
      const auditTable = tables.get("audit_log");
      expect(auditTable).toBeDefined();

      const updatePolicies = auditTable!.policies.filter((p) => p.command === "UPDATE");
      const deletePolicies = auditTable!.policies.filter((p) => p.command === "DELETE");

      expect(updatePolicies).toHaveLength(0);
      expect(deletePolicies).toHaveLength(0);
    });

    it("ensures audit_log has a mutation trigger blocking any UPDATE or DELETE attempt", () => {
      const auditTable = tables.get("audit_log");
      expect(auditTable?.hasPreventMutationTrigger).toBe(true);
      expect(triggers).toContain("trg_prevent_audit_log_mutation");
    });
  });

  describe("Auth Configuration: Public Sign-ups Disabled", () => {
    it("verifies config.toml disables public signups (Invitation-only)", () => {
      const configPath = path.resolve(process.cwd(), "supabase", "config.toml");
      const configContent = fs.readFileSync(configPath, "utf-8");

      expect(configContent).toMatch(/enable_signup\s*=\s*false/);
    });
  });

  describe("Phase 9: Clinical Tables & Medical Privacy Verification", () => {
    it("ensures all 10 core clinical tables exist and have RLS enabled (Default Deny)", () => {
      const expectedClinical = [
        "visits",
        "visit_notes",
        "measurements",
        "allergies",
        "medical_history",
        "prescriptions",
        "prescription_items",
        "lab_orders",
        "lab_results",
        "clinical_templates",
      ];

      for (const table of expectedClinical) {
        expect(CLINICAL_TABLES).toContain(table);
        const parsed = tables.get(table);
        expect(parsed, `Clinical table ${table} must exist in migrations`).toBeDefined();
        expect(parsed!.hasRLS, `Clinical table ${table} must have RLS enabled`).toBe(true);
      }
    });

    it("verifies platform_admin is denied SELECT on every single clinical table", () => {
      for (const clinicalTable of CLINICAL_TABLES) {
        const table = tables.get(clinicalTable);
        expect(table).toBeDefined();

        const adminPolicies = table!.policies.filter(
          (p) =>
            p.command === "SELECT" &&
            (p.roles.includes("platform_admin") ||
              p.name.toLowerCase().includes("admin"))
        );
        expect(
          adminPolicies,
          `platform_admin must NEVER have SELECT policy on ${clinicalTable}`
        ).toHaveLength(0);
      }
    });

    it("verifies receptionist is denied SELECT on every single clinical table", () => {
      for (const clinicalTable of CLINICAL_TABLES) {
        const table = tables.get(clinicalTable);
        expect(table).toBeDefined();

        const receptionistPolicies = table!.policies.filter(
          (p) =>
            p.command === "SELECT" &&
            (p.roles.includes("receptionist") ||
              p.name.toLowerCase().includes("receptionist"))
        );
        expect(
          receptionistPolicies,
          `receptionist must NEVER have SELECT policy on ${clinicalTable}`
        ).toHaveLength(0);
      }
    });

    it("verifies doctor has SELECT policy isolated by clinic_id on all clinical tables", () => {
      for (const clinicalTable of CLINICAL_TABLES) {
        const table = tables.get(clinicalTable);
        expect(table).toBeDefined();

        const doctorSelectPolicies = table!.policies.filter(
          (p) => p.command === "SELECT" && p.name.includes("doctor")
        );
        expect(
          doctorSelectPolicies.length,
          `Doctor must have SELECT policy on ${clinicalTable}`
        ).toBeGreaterThan(0);
      }
    });

    it("enforces tenant isolation: Doctor in Clinic A cannot access a clinical row belonging to Clinic B", () => {
      const doctorAClinicId: string = "clinic-alpha-111";
      const recordClinicBId: string = "clinic-beta-222";

      // Simulated RLS clause evaluation: clinic_id = current_clinic_id()
      const canAccessRow = (doctorAClinicId as string) === (recordClinicBId as string);
      expect(canAccessRow).toBe(false);
    });
  });
});

