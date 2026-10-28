import { describe, it, expect } from "vitest";
import {
  compileEmergencyCard,
  EGYPTIAN_EMERGENCY_HOTLINES,
  DEMO_EMERGENCY_CONTACTS,
} from "@/lib/family/emergency-service";
import type { Person } from "@/types/family";

describe("Phase 7: Emergency Medical ID Component & Logic Tests", () => {
  const mockAdult: Person = {
    id: "p-ahmed",
    family_id: "fam-1",
    name: "أحمد مصطفى إبراهيم",
    birth_date: "1988-06-15",
    sex: "male",
    blood_type: "A+",
    allergies: ["بنسلين (Penicillin)"],
    chronic_conditions: ["ارتفاع ضغط الدم (Hypertension)"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockPersonNoAllergies: Person = {
    id: "p-clean",
    family_id: "fam-1",
    name: "منى علي",
    birth_date: "1990-01-01",
    sex: "female",
    blood_type: "B+",
    allergies: [],
    chronic_conditions: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it("verifies emergency contacts have valid tel URI protocol compatibility", () => {
    const ahmedContacts = DEMO_EMERGENCY_CONTACTS["p-ahmed"];
    expect(ahmedContacts).toBeDefined();
    ahmedContacts.forEach((c) => {
      expect(c.phone).toMatch(/^\+?[0-9]+$/);
      const telUri = `tel:${c.phone}`;
      expect(telUri.startsWith("tel:")).toBe(true);
    });
  });

  it("verifies Egyptian ambulance and police hotline dialing targets", () => {
    const amb = EGYPTIAN_EMERGENCY_HOTLINES.find((h) => h.number === "123");
    expect(amb).toBeDefined();
    expect(`tel:${amb?.number}`).toBe("tel:123");

    const police = EGYPTIAN_EMERGENCY_HOTLINES.find((h) => h.number === "122");
    expect(police).toBeDefined();
    expect(`tel:${police?.number}`).toBe("tel:122");
  });

  it("compiles emergency card with high-contrast blood group and allergy alerts", async () => {
    const card = await compileEmergencyCard(mockAdult);

    expect(card.blood_type).toBe("A+");
    expect(card.severe_allergies).toHaveLength(1);
    expect(card.severe_allergies[0]).toContain("بنسلين");
    expect(card.chronic_conditions[0]).toContain("ارتفاع ضغط الدم");
  });

  it("handles patients without allergies gracefully", async () => {
    const card = await compileEmergencyCard(mockPersonNoAllergies);

    expect(card.blood_type).toBe("B+");
    expect(card.severe_allergies).toHaveLength(0);
  });
});
