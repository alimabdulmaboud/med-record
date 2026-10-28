import { describe, it, expect, beforeEach } from "vitest";
import {
  compileEmergencyCard,
  EGYPTIAN_EMERGENCY_HOTLINES,
} from "../emergency-service";
import type { Person, EmergencyContact } from "@/types/family";
import {
  createPersonMedication,
  _resetInMemoryStore as resetMeds,
} from "../medications-encounters-service";

describe("Phase 7: Emergency Medical ID Service Tests", () => {
  beforeEach(() => {
    resetMeds();
  });

  const mockAhmed: Person = {
    id: "p-ahmed",
    family_id: "fam-1",
    name: "أحمد مصطفى إبراهيم",
    birth_date: "1988-06-15",
    sex: "male",
    blood_type: "A+",
    allergies: ["بنسلين (Penicillin)", "سلفا (Sulfa)"],
    chronic_conditions: ["ارتفاع ضغط الدم (Hypertension)"],
    notes: "حساسية مفرطة من البنسلين",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockSaraChild: Person = {
    id: "p-sara",
    family_id: "fam-1",
    name: "سارة أحمد مصطفى",
    birth_date: "2021-04-10",
    sex: "female",
    blood_type: "O+",
    allergies: ["الفول السوداني"],
    chronic_conditions: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it("provides official Egyptian emergency hotlines (123 Ambulance, 122 Police, 105 MOH)", () => {
    expect(EGYPTIAN_EMERGENCY_HOTLINES).toHaveLength(4);
    const ambulance = EGYPTIAN_EMERGENCY_HOTLINES.find((h) => h.number === "123");
    expect(ambulance?.nameAr).toContain("الإسعاف");
    const police = EGYPTIAN_EMERGENCY_HOTLINES.find((h) => h.number === "122");
    expect(police?.nameAr).toContain("النجدة");
  });

  it("compiles emergency card payload with blood type, allergies, and contacts", async () => {
    await createPersonMedication({
      family_id: mockAhmed.family_id,
      person_id: mockAhmed.id,
      name: "كونكور 5 مجم",
      dose: "5 مجم",
      frequency: "مرة يومياً",
      status: "active",
      timing_notes: "صباحاً قبل الإفطار",
    });

    await createPersonMedication({
      family_id: mockAhmed.family_id,
      person_id: mockAhmed.id,
      name: "دواء قديم منتهي",
      dose: "10 مجم",
      frequency: "مرة يومياً",
      status: "completed",
    });

    const card = await compileEmergencyCard(mockAhmed);

    expect(card.person.name).toBe("أحمد مصطفى إبراهيم");
    expect(card.blood_type).toBe("A+");
    expect(card.is_child).toBe(false);
    expect(card.severe_allergies).toContain("بنسلين (Penicillin)");
    expect(card.chronic_conditions).toContain("ارتفاع ضغط الدم (Hypertension)");
    expect(card.emergency_contacts.length).toBeGreaterThanOrEqual(1);
    expect(card.active_medications).toHaveLength(1);
    expect(card.active_medications[0].name).toBe("كونكور 5 مجم");
  });

  it("correctly identifies child profiles and custom emergency contacts", async () => {
    const customContacts: EmergencyContact[] = [
      {
        id: "ec-custom",
        person_id: mockSaraChild.id,
        name: "خال الطفل د. سامي",
        relationship: "خال",
        phone: "+201000000000",
        is_primary: true,
        created_at: "",
      },
    ];

    const card = await compileEmergencyCard(mockSaraChild, customContacts);

    expect(card.is_child).toBe(true);
    expect(card.blood_type).toBe("O+");
    expect(card.emergency_contacts).toHaveLength(1);
    expect(card.emergency_contacts[0].name).toBe("خال الطفل د. سامي");
  });
});
