import { describe, it, expect, vi } from "vitest";
import { sanitizeAuditMetadata, createAuditLogger } from "../audit";

describe("Phase 1: Audit Logger & Medical Privacy Sanitizer", () => {
  it("scrubs all sensitive health fields (allergies, chronic_conditions, notes, blood_type) from metadata", () => {
    const rawMetadata = {
      action_source: "web_ui",
      field_names_changed: ["name", "allergies"],
      allergies: ["بنسلين"],
      chronic_conditions: ["ضغط الدم"],
      notes: "المريض يعاني من حساسية شديدة",
      blood_type: "A+",
      count: 2,
    };

    const sanitized = sanitizeAuditMetadata(rawMetadata);

    expect(sanitized).toEqual({
      action_source: "web_ui",
      field_names_changed: ["name", "allergies"],
      count: 2,
    });

    expect(sanitized).not.toHaveProperty("allergies");
    expect(sanitized).not.toHaveProperty("chronic_conditions");
    expect(sanitized).not.toHaveProperty("notes");
    expect(sanitized).not.toHaveProperty("blood_type");
  });

  it("successfully persists sanitized audit event without leaking medical values", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockClient = {
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
      }),
    };

    const auditLogger = createAuditLogger(mockClient as any);

    await auditLogger.logEvent({
      actorId: "usr-123",
      action: "person_updated",
      personId: "p-456",
      familyId: "fam-789",
      metadata: {
        fields: ["name"],
        notes: "سري للغاية", // Prohibited
      },
    });

    expect(mockClient.from).toHaveBeenCalledWith("audit_log");
    expect(mockInsert).toHaveBeenCalledWith({
      actor_id: "usr-123",
      action: "person_updated",
      entity_type: "person",
      entity_id: "p-456",
      person_id: "p-456",
      family_id: "fam-789",
      metadata: { fields: ["name"] },
    });
  });
});
