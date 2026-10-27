import { describe, it, expect, vi } from "vitest";
import {
  calculatePersonAge,
  createFamilyService,
} from "../service";
import type { CreatePersonInput, UpdatePersonInput } from "@/types/family";

describe("Phase 1: Family Service & Age Calculation Tests", () => {
  describe("Age Calculation & Formatter", () => {
    const refDate = new Date("2026-10-27T12:00:00Z");

    it("formats age in months for children under 2 years old", () => {
      // Born 2025-08-20 -> exactly 14 months from 2026-10-27
      const age = calculatePersonAge("2025-08-20", refDate);
      expect(age.years).toBe(1);
      expect(age.totalMonths).toBe(14);
      expect(age.displayAr).toBe("14 شهر");
      expect(age.isChild).toBe(true);
    });

    it("formats age in years and months for young children between 2 and 5 years", () => {
      // Born 2023-04-10 -> 3 years, 6 months from 2026-10-27
      const age = calculatePersonAge("2023-04-10", refDate);
      expect(age.years).toBe(3);
      expect(age.displayAr).toContain("3 سنوات");
      expect(age.isChild).toBe(true);
    });

    it("formats age in years for adults and older children", () => {
      // Born 1988-06-15 -> 38 years
      const age = calculatePersonAge("1988-06-15", refDate);
      expect(age.years).toBe(38);
      expect(age.displayAr).toBe("38 سنة");
      expect(age.isChild).toBe(false);
    });
  });

  describe("Person CRUD & Soft Archive Operations", () => {
    it("creates a person with default blood type and logs audit event without clinical data", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "p-new",
              family_id: "fam-1",
              name: "سارة أحمد",
              birth_date: "2021-04-10",
              sex: "female",
              blood_type: "A+",
              allergies: ["فول سوداني"],
              chronic_conditions: [],
              archived_at: null,
            },
            error: null,
          }),
        }),
      });

      const mockAuditInsert = vi.fn().mockResolvedValue({ data: null, error: null });

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === "people") {
            return { insert: mockInsert };
          }
          if (table === "audit_log") {
            return { insert: mockAuditInsert };
          }
          if (table === "emergency_contacts") {
            return { insert: vi.fn().mockResolvedValue({ error: null }) };
          }
          return {};
        }),
      };

      const service = createFamilyService(mockClient as any);
      const input: CreatePersonInput = {
        name: "سارة أحمد",
        birth_date: "2021-04-10",
        sex: "female",
        blood_type: "A+",
        allergies: ["فول سوداني"],
      };

      const result = await service.createPerson("fam-1", input, "usr-mgr");
      expect(result.id).toBe("p-new");
      expect(result.name).toBe("سارة أحمد");

      // Verify audit log has no health data
      expect(mockAuditInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "person_created",
          metadata: expect.not.objectContaining({
            allergies: expect.anything(),
          }),
        })
      );
    });

    it("soft-archives a person by updating archived_at instead of deleting row", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
      const mockAuditInsert = vi.fn().mockResolvedValue({ data: null, error: null });

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === "people") {
            return { update: mockUpdate };
          }
          if (table === "audit_log") {
            return { insert: mockAuditInsert };
          }
          return {};
        }),
      };

      const service = createFamilyService(mockClient as any);
      await service.archivePerson("p-to-archive", "usr-mgr", "fam-1");

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          archived_at: expect.any(String),
        })
      );
    });
  });
});
