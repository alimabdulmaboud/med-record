import type { Person } from "@/types/family";
import { _resetInMemoryStore as resetMedsAndEncountersStore } from "@/lib/family/medications-encounters-service";
import { _resetInMemoryStore as resetVaccinationsStore } from "@/lib/family/vaccinations-service";

export const DEMO_CLEARED_KEY = "med_demo_cleared";
export const PEOPLE_STORAGE_KEY = "med_family_people";
export const FAMILY_NAME_KEY = "med_family_name";

export const INITIAL_DEMO_PEOPLE: Person[] = [
  {
    id: "p-ahmed",
    family_id: "fam-demo",
    name: "أحمد مصطفى إبراهيم",
    birth_date: "1988-06-15",
    sex: "male",
    blood_type: "A+",
    allergies: ["بنسلين (Penicillin)"],
    chronic_conditions: ["ارتفاع ضغط الدم (Hypertension)"],
    phone_number: "+201012345678",
    linked_user_id: "usr-ahmed",
    notes: "متابعة دورية لقياسات الضغط",
    archived_at: null,
    created_at: "2026-01-01T10:00:00.000Z",
    updated_at: "2026-01-01T10:00:00.000Z",
  },
  {
    id: "p-sara",
    family_id: "fam-demo",
    name: "سارة أحمد مصطفى",
    birth_date: "2021-04-10",
    sex: "female",
    blood_type: "A+",
    allergies: ["الفول السوداني (Peanuts)"],
    chronic_conditions: [],
    phone_number: null,
    linked_user_id: null,
    notes: "حساسية شديدة من الفول السوداني",
    archived_at: null,
    created_at: "2026-01-01T10:00:00.000Z",
    updated_at: "2026-01-01T10:00:00.000Z",
  },
  {
    id: "p-yassin",
    family_id: "fam-demo",
    name: "ياسين أحمد مصطفى",
    birth_date: "2025-08-20",
    sex: "male",
    blood_type: "O+",
    allergies: [],
    chronic_conditions: [],
    phone_number: null,
    linked_user_id: null,
    notes: "متابعة جدول التطعيمات الإلزامية",
    archived_at: null,
    created_at: "2026-01-01T10:00:00.000Z",
    updated_at: "2026-01-01T10:00:00.000Z",
  },
];

export const DEFAULT_DEMO_FAMILY_NAME = "عائلة أحمد مصطفى";
export const DEFAULT_CLEAN_FAMILY_NAME = "سجل عائلتي الصحي";

/**
 * Returns true if the app is currently in demo mode with fake/mock seed data.
 */
export function isDemoModeActive(): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }

  const isCleared = localStorage.getItem(DEMO_CLEARED_KEY) === "true";
  if (isCleared) {
    return false;
  }

  const storedPeople = localStorage.getItem(PEOPLE_STORAGE_KEY);
  if (!storedPeople) {
    // If not cleared and nothing stored yet, demo mode will seed
    return true;
  }

  try {
    const list: Person[] = JSON.parse(storedPeople);
    if (list.length === 0) return false;
    // Check if contains default demo people
    return list.some((p) => p.id === "p-ahmed" || p.id === "p-sara" || p.id === "p-yassin");
  } catch {
    return false;
  }
}

/**
 * Retrieves the stored list of people, respecting the demo cleared flag.
 */
export function getStoredPeople(): Person[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return INITIAL_DEMO_PEOPLE;
  }

  const isCleared = localStorage.getItem(DEMO_CLEARED_KEY) === "true";
  const stored = localStorage.getItem(PEOPLE_STORAGE_KEY);

  if (isCleared) {
    if (!stored) return [];
    try {
      const list: Person[] = JSON.parse(stored);
      return list.filter((p) => !p.archived_at);
    } catch {
      return [];
    }
  }

  // Not explicitly cleared
  if (stored) {
    try {
      const list: Person[] = JSON.parse(stored);
      return list.filter((p) => !p.archived_at);
    } catch {
      return INITIAL_DEMO_PEOPLE;
    }
  }

  // First time visitor: seed demo people
  try {
    localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_PEOPLE));
  } catch {
    // ignore
  }
  return INITIAL_DEMO_PEOPLE;
}

/**
 * Saves the updated list of people into localStorage.
 */
export function saveStoredPeople(people: Person[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people));
  } catch {
    // ignore
  }
}

/**
 * Retrieves the current family name.
 */
export function getFamilyName(): string {
  if (typeof window === "undefined" || !window.localStorage) {
    return DEFAULT_DEMO_FAMILY_NAME;
  }

  const stored = localStorage.getItem(FAMILY_NAME_KEY);
  if (stored) return stored;

  return isDemoModeActive() ? DEFAULT_DEMO_FAMILY_NAME : DEFAULT_CLEAN_FAMILY_NAME;
}

/**
 * Saves a custom family name.
 */
export function saveFamilyName(name: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(FAMILY_NAME_KEY, name);
  } catch {
    // ignore
  }
}

/**
 * Completely purges all demo data:
 * - Empties family members
 * - Removes mock measurements, documents, prescriptions, visits, vaccinations, reports
 * - Sets the demo_cleared flag so mock data never auto-seeds again
 */
export function clearDemoData(): void {
  if (typeof window === "undefined" || !window.localStorage) return;

  try {
    localStorage.setItem(DEMO_CLEARED_KEY, "true");
    localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(FAMILY_NAME_KEY, DEFAULT_CLEAN_FAMILY_NAME);

    // Remove all mock health data
    localStorage.removeItem("med_person_measurements");
    localStorage.removeItem("med_person_documents");
    localStorage.removeItem("med_family_person_medications");
    localStorage.removeItem("med_family_person_encounters");
    localStorage.removeItem("med_family_person_vaccinations");
    localStorage.removeItem("med_family_doctor_reports");
    localStorage.removeItem("med_family_report_shares");
  } catch (err) {
    console.error("Failed to clear demo data:", err);
  }

  // Clear in-memory service caches
  try {
    resetMedsAndEncountersStore();
    resetVaccinationsStore();
  } catch {
    // ignore
  }
}

/**
 * Restores demo data (for testing or previewing features).
 */
export function restoreDemoData(): void {
  if (typeof window === "undefined" || !window.localStorage) return;

  try {
    localStorage.removeItem(DEMO_CLEARED_KEY);
    localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_PEOPLE));
    localStorage.setItem(FAMILY_NAME_KEY, DEFAULT_DEMO_FAMILY_NAME);

    // Reset health data stores so realistic seeds can re-populate
    localStorage.removeItem("med_person_measurements");
    localStorage.removeItem("med_person_documents");
    localStorage.removeItem("med_family_person_medications");
    localStorage.removeItem("med_family_person_encounters");
    localStorage.removeItem("med_family_person_vaccinations");
    localStorage.removeItem("med_family_doctor_reports");
    localStorage.removeItem("med_family_report_shares");
  } catch (err) {
    console.error("Failed to restore demo data:", err);
  }

  try {
    resetMedsAndEncountersStore();
    resetVaccinationsStore();
  } catch {
    // ignore
  }
}
