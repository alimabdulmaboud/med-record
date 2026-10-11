import { describe, it, expect, beforeEach } from "vitest";
import { PatientService, IPatientRepository, calculateAgeFormatted, PatientServiceError } from "./service";
import { Patient, Guardian, PatientGuardianLink } from "./types";
import { AuditLogEntry, UserRole } from "../invitations/types";

class MockPatientRepository implements IPatientRepository {
  public patients: Map<string, Patient> = new Map();
  public guardians: Map<string, Guardian> = new Map();
  public links: PatientGuardianLink[] = [];
  public auditLogs: AuditLogEntry[] = [];

  async createPatient(patient: Omit<Patient, "id" | "created_at" | "updated_at">): Promise<Patient> {
    const id = `pat-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const full: Patient = {
      ...patient,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.patients.set(id, full);
    return full;
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
    const existing = this.patients.get(id);
    if (!existing) throw new Error("Patient not found");
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    this.patients.set(id, updated);
    return updated;
  }

  async findPatientById(id: string): Promise<Patient | null> {
    return this.patients.get(id) || null;
  }

  async createGuardian(guardian: Omit<Guardian, "id" | "created_at" | "updated_at">): Promise<Guardian> {
    const id = `guard-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const full: Guardian = {
      ...guardian,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.guardians.set(id, full);
    return full;
  }

  async findGuardianById(id: string): Promise<Guardian | null> {
    return this.guardians.get(id) || null;
  }

  async findGuardiansByPhone(clinicId: string, phone: string): Promise<Array<{
    guardian: Guardian;
    linkedPatients: Patient[];
  }>> {
    const matches: Array<{ guardian: Guardian; linkedPatients: Patient[] }> = [];
    for (const g of this.guardians.values()) {
      if (g.clinic_id === clinicId && g.phone === phone) {
        const patientIds = this.links.filter((l) => l.guardian_id === g.id).map((l) => l.patient_id);
        const linkedPatients = patientIds.map((pid) => this.patients.get(pid)!).filter(Boolean);
        matches.push({ guardian: g, linkedPatients });
      }
    }
    return matches;
  }

  async linkPatientGuardian(link: Omit<PatientGuardianLink, "id" | "created_at">): Promise<PatientGuardianLink> {
    const full: PatientGuardianLink = {
      ...link,
      id: `link-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      created_at: new Date().toISOString(),
    };
    this.links.push(full);
    return full;
  }

  async getPatientGuardians(patientId: string): Promise<Array<{ guardian: Guardian; relationship: string; is_primary: boolean }>> {
    const patientLinks = this.links.filter((l) => l.patient_id === patientId);
    return patientLinks.map((l) => ({
      guardian: this.guardians.get(l.guardian_id)!,
      relationship: l.relationship,
      is_primary: l.is_primary,
    }));
  }

  async searchPatients(clinicId: string, query: string, includeArchived = false) {
    const results: Array<{ patient: Patient; guardian: Guardian | null; siblingsCount: number }> = [];
    const lowerQuery = query.toLowerCase();

    for (const p of this.patients.values()) {
      if (p.clinic_id !== clinicId) continue;
      if (!includeArchived && p.archived_at) continue;

      const pLinks = this.links.filter((l) => l.patient_id === p.id);
      const primaryLink = pLinks.find((l) => l.is_primary) || pLinks[0];
      const guardian = primaryLink ? this.guardians.get(primaryLink.guardian_id) || null : null;

      const matchesName = p.name.toLowerCase().includes(lowerQuery);
      const matchesPhone = guardian?.phone.includes(query) || false;
      const matchesGuardianName = guardian?.name.toLowerCase().includes(lowerQuery) || false;

      if (!query || matchesName || matchesPhone || matchesGuardianName) {
        // Calculate siblings count (other patients sharing this guardian)
        let siblingsCount = 0;
        if (guardian) {
          const siblingLinks = this.links.filter(
            (l) => l.guardian_id === guardian.id && l.patient_id !== p.id
          );
          siblingsCount = siblingLinks.length;
        }
        results.push({ patient: p, guardian, siblingsCount });
      }
    }

    return results;
  }

  async findDuplicatePatient(
    clinicId: string,
    name: string,
    dateOfBirth: string,
    guardianPhone: string
  ): Promise<Patient | null> {
    const cleanedPhone = guardianPhone.trim().replace(/\s+/g, "");
    const lowerName = name.trim().toLowerCase();
    for (const p of this.patients.values()) {
      if (p.clinic_id !== clinicId) continue;
      if (p.archived_at) continue;
      if (p.date_of_birth === dateOfBirth && p.name.trim().toLowerCase() === lowerName) {
        const pLinks = this.links.filter((l) => l.patient_id === p.id);
        for (const link of pLinks) {
          const g = this.guardians.get(link.guardian_id);
          if (g && g.phone === cleanedPhone) {
            return p;
          }
        }
      }
    }
    return null;
  }

  async appendAuditLog(entry: AuditLogEntry): Promise<void> {
    this.auditLogs.push(entry);
  }
}

describe("Phase 6: Patients, Guardians, and Sibling Management", () => {
  let repo: MockPatientRepository;
  let service: PatientService;

  const CLINIC_PEDS = "c1000000-0000-0000-0000-000000000001";
  const RECEPTIONIST = {
    id: "reception-1",
    clinicId: CLINIC_PEDS,
    roles: ["receptionist" as UserRole],
  };

  const PARENT_PHONE = "+201011112222";

  beforeEach(() => {
    repo = new MockPatientRepository();
    service = new PatientService(repo);
  });

  describe("Unified Registration & Sibling Discovery", () => {
    it("registers a child with a parent", async () => {
      const result = await service.registerPatient({
        patient: {
          name: "عمر أحمد خليل",
          dateOfBirth: "2023-05-15",
          sex: "male",
          notes: "حساسية بسيطة",
        },
        guardian: {
          name: "أحمد خليل",
          phone: PARENT_PHONE,
          relationship: "father",
        },
        actor: RECEPTIONIST,
      });

      expect(result.patient.name).toBe("عمر أحمد خليل");
      expect(result.guardian.name).toBe("أحمد خليل");
      expect(result.guardian.phone).toBe(PARENT_PHONE);
      expect(result.link.is_primary).toBe(true);

      // Audit logged
      expect(repo.auditLogs.some((l) => l.action === "CREATE_PATIENT")).toBe(true);
    });

    it("registers a sibling with the same parent phone and verifies they link to the exact same parent", async () => {
      // 1. Register first child (Omar)
      const child1 = await service.registerPatient({
        patient: {
          name: "عمر أحمد خليل",
          dateOfBirth: "2023-05-15",
          sex: "male",
        },
        guardian: {
          name: "أحمد خليل",
          phone: PARENT_PHONE,
        },
        actor: RECEPTIONIST,
      });

      // 2. Discover parent via phone lookup
      const matches = await service.findGuardiansByPhone(CLINIC_PEDS, PARENT_PHONE, RECEPTIONIST);
      expect(matches).toHaveLength(1);
      expect(matches[0].guardian.id).toBe(child1.guardian.id);
      expect(matches[0].linkedPatients).toHaveLength(1);
      expect(matches[0].linkedPatients[0].name).toBe("عمر أحمد خليل");

      // 3. Register second child (Nour - Sibling) attaching to the existing guardian
      const child2 = await service.registerPatient({
        patient: {
          name: "نور أحمد خليل",
          dateOfBirth: "2025-01-10",
          sex: "female",
        },
        guardian: {
          id: matches[0].guardian.id, // Explicitly linking to sibling's guardian!
          name: "أحمد خليل",
          phone: PARENT_PHONE,
        },
        actor: RECEPTIONIST,
      });

      // Verification: Both children share the SAME guardian ID!
      expect(child2.guardian.id).toBe(child1.guardian.id);
      expect(repo.guardians.size).toBe(1); // Exactly 1 guardian row in DB
      expect(repo.patients.size).toBe(2); // 2 patients

      // 4. Searching by phone finds BOTH siblings!
      const searchResults = await service.searchPatients(CLINIC_PEDS, PARENT_PHONE, RECEPTIONIST);
      expect(searchResults).toHaveLength(2);
      const names = searchResults.map((r) => r.name);
      expect(names).toContain("عمر أحمد خليل");
      expect(names).toContain("نور أحمد خليل");

      // Both show siblingsCount = 1
      expect(searchResults[0].siblingsCount).toBe(1);
      expect(searchResults[1].siblingsCount).toBe(1);
    });
  });

  describe("Search & Archival Lifecycle (Rule #5)", () => {
    it("excludes archived patients from normal search results", async () => {
      const { patient } = await service.registerPatient({
        patient: {
          name: "ياسين كريم",
          dateOfBirth: "2022-08-20",
          sex: "male",
        },
        guardian: {
          name: "كريم شريف",
          phone: "+201099998888",
        },
        actor: RECEPTIONIST,
      });

      // Findable before archive
      const beforeSearch = await service.searchPatients(CLINIC_PEDS, "ياسين", RECEPTIONIST);
      expect(beforeSearch).toHaveLength(1);

      // Archive patient
      await service.archivePatient(patient.id, RECEPTIONIST);

      // Normal search excludes archived
      const afterSearch = await service.searchPatients(CLINIC_PEDS, "ياسين", RECEPTIONIST, false);
      expect(afterSearch).toHaveLength(0);

      // Search with includeArchived returns it
      const archivedSearch = await service.searchPatients(CLINIC_PEDS, "ياسين", RECEPTIONIST, true);
      expect(archivedSearch).toHaveLength(1);

      // Restore patient
      await service.restorePatient(patient.id, RECEPTIONIST);
      const restoredSearch = await service.searchPatients(CLINIC_PEDS, "ياسين", RECEPTIONIST, false);
      expect(restoredSearch).toHaveLength(1);
    });

    it("allows receptionist to edit patient demographics", async () => {
      const { patient } = await service.registerPatient({
        patient: {
          name: "حمزة طارق",
          dateOfBirth: "2024-02-01",
          sex: "male",
        },
        guardian: {
          name: "طارق زياد",
          phone: "+201077776666",
        },
        actor: RECEPTIONIST,
      });

      const updated = await service.updatePatient(
        patient.id,
        { name: "حمزة طارق زياد", notes: "تم تعديل الاسم بناء على طلب الأب" },
        RECEPTIONIST
      );

      expect(updated.name).toBe("حمزة طارق زياد");
      expect(updated.notes).toBe("تم تعديل الاسم بناء على طلب الأب");
      expect(repo.auditLogs.some((l) => l.action === "UPDATE_PATIENT")).toBe(true);
    });
  });

  describe("Duplicate Detection & Prevention", () => {
    it("detects existing duplicate before submission via checkDuplicatePatient", async () => {
      await service.registerPatient({
        patient: {
          name: "علي محمود",
          dateOfBirth: "2021-03-10",
          sex: "male",
        },
        guardian: {
          name: "محمود حسن",
          phone: "+201012345678",
        },
        actor: RECEPTIONIST,
      });

      const duplicate = await service.checkDuplicatePatient(
        CLINIC_PEDS,
        "علي محمود",
        "2021-03-10",
        "+201012345678",
        RECEPTIONIST
      );

      expect(duplicate).not.toBeNull();
      expect(duplicate?.name).toBe("علي محمود");
    });

    it("throws DUPLICATE_PATIENT on attempting to register identical patient without allowDuplicate", async () => {
      await service.registerPatient({
        patient: {
          name: "علي محمود",
          dateOfBirth: "2021-03-10",
          sex: "male",
        },
        guardian: {
          name: "محمود حسن",
          phone: "+201012345678",
        },
        actor: RECEPTIONIST,
      });

      await expect(
        service.registerPatient({
          patient: {
            name: "علي محمود",
            dateOfBirth: "2021-03-10",
            sex: "male",
          },
          guardian: {
            name: "محمود حسن",
            phone: "+201012345678",
          },
          actor: RECEPTIONIST,
        })
      ).rejects.toThrow(PatientServiceError);
    });

    it("allows registration of duplicate if allowDuplicate flag is true", async () => {
      await service.registerPatient({
        patient: {
          name: "علي محمود",
          dateOfBirth: "2021-03-10",
          sex: "male",
        },
        guardian: {
          name: "محمود حسن",
          phone: "+201012345678",
        },
        actor: RECEPTIONIST,
      });

      const result = await service.registerPatient({
        patient: {
          name: "علي محمود",
          dateOfBirth: "2021-03-10",
          sex: "male",
        },
        guardian: {
          name: "محمود حسن",
          phone: "+201012345678",
        },
        allowDuplicate: true,
        actor: RECEPTIONIST,
      });

      expect(result.patient.id).toBeDefined();
    });
  });

  describe("Age Calculation Rules (Spec: Under 2y months, Under 5y y+m, >=5y years)", () => {
    it("formats age correctly for newborn (under 1 month) in days", () => {
      const fixedNow = new Date("2026-10-10");
      const dob = "2026-09-28"; // 12 days ago
      expect(calculateAgeFormatted(dob, fixedNow)).toBe("12 يوم");
    });

    it("formats age in months for infants under 2 years", () => {
      const fixedNow = new Date("2026-10-10");
      const dob = "2025-06-10"; // ~16 months ago
      expect(calculateAgeFormatted(dob, fixedNow)).toBe("16 شهر");
    });

    it("formats age in years and months for children between 2 and 5 years", () => {
      const fixedNow = new Date("2026-10-10");
      const dob = "2023-06-10"; // ~3 years and 4 months ago
      expect(calculateAgeFormatted(dob, fixedNow)).toBe("3 سنة و 4 شهر");
    });

    it("formats age in years afterwards (>= 5 years)", () => {
      const fixedNow = new Date("2026-10-10");
      const dob = "2018-01-01"; // ~8 years ago
      expect(calculateAgeFormatted(dob, fixedNow)).toBe("8 سنة");
    });
  });

  describe("Adult Patients Self-Contact & Partial Search", () => {
    it("registers an adult patient with guardian of type self", async () => {
      const result = await service.registerPatient({
        patient: {
          name: "سارة إبراهيم الشريف",
          dateOfBirth: "1995-04-12",
          sex: "female",
          notes: "متابعة حمية غذائية",
        },
        guardian: {
          name: "سارة إبراهيم الشريف",
          phone: "+201055554444",
          relationship: "self",
        },
        actor: RECEPTIONIST,
      });

      expect(result.patient.name).toBe("سارة إبراهيم الشريف");
      expect(result.guardian.name).toBe("سارة إبراهيم الشريف");
      expect(result.link.relationship).toBe("self");
    });

    it("finds patient by partial phone number search", async () => {
      await service.registerPatient({
        patient: {
          name: "كريم يحيى",
          dateOfBirth: "2020-01-01",
          sex: "male",
        },
        guardian: {
          name: "يحيى فتحي",
          phone: "+201144433322",
        },
        actor: RECEPTIONIST,
      });

      const results = await service.searchPatients(CLINIC_PEDS, "444333", RECEPTIONIST);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((r) => r.name === "كريم يحيى")).toBe(true);
    });
  });
});
