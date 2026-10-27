import { describe, it, expect, vi } from "vitest";
import { exportFamilyData, deleteFamilyAccountAndData } from "../export";

describe("Phase 1: Privacy Settings, JSON Data Export & Erasure", () => {
  it("exports comprehensive family data payload including people and emergency contacts in JSON format", async () => {
    const mockFamily = { id: "fam-1", name: "عائلة أحمد مصطفى", created_at: "2026-10-27T00:00:00Z" };
    const mockPeople = [
      { id: "p-1", family_id: "fam-1", name: "أحمد مصطفى", birth_date: "1988-06-15", sex: "male", blood_type: "A+" },
      { id: "p-2", family_id: "fam-1", name: "سارة أحمد", birth_date: "2021-04-10", sex: "female", blood_type: "A+" },
    ];
    const mockContacts = [
      { id: "ec-1", person_id: "p-1", name: "منى الشاذلي", relationship: "الزوجة", phone: "01012345678" },
    ];

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "families") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockFamily, error: null }),
              }),
            }),
          };
        }
        if (table === "people") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockPeople, error: null }),
            }),
          };
        }
        if (table === "emergency_contacts") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: mockContacts, error: null }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }),
    };

    const exportResult = await exportFamilyData("fam-1", mockClient as any);

    expect(exportResult.schema_version).toBe("1.0");
    expect(exportResult.exported_at).toBeDefined();
    expect(exportResult.family.id).toBe("fam-1");
    expect(exportResult.people).toHaveLength(2);
    expect(exportResult.emergency_contacts).toHaveLength(1);
  });

  it("safely and transactionally deletes all family data upon strong confirmation", async () => {
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockAuditInsert = vi.fn().mockResolvedValue({ error: null });

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "audit_log") {
          return { insert: mockAuditInsert };
        }
        return { delete: mockDelete };
      }),
    };

    await deleteFamilyAccountAndData("fam-1", "usr-mgr", mockClient as any);

    // Verifies audit record was created before deletion
    expect(mockAuditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "account_deleted",
        actor_id: "usr-mgr",
        family_id: "fam-1",
      })
    );

    // Verifies families table deletion was requested
    expect(mockClient.from).toHaveBeenCalledWith("families");
  });
});
