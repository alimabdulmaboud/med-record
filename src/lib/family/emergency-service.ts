/**
 * Emergency Medical ID Service (Med Record Phase 7)
 * Compiles a high-contrast, one-screen emergency card for first responders & emergency rooms:
 * Blood group, direct 1-tap emergency contacts, severe allergies, active medications, and national hotlines.
 */

import type { Person, EmergencyContact } from "@/types/family";
import { calculatePersonAge } from "@/lib/family/service";
import { getPersonMedications } from "@/lib/family/medications-encounters-service";
import { getLatestVitalsSummary } from "@/lib/family/measurements-service";

export interface EmergencyHotline {
  nameAr: string;
  nameEn: string;
  number: string;
  descriptionAr: string;
}

export const EGYPTIAN_EMERGENCY_HOTLINES: EmergencyHotline[] = [
  {
    nameAr: "هيئة الإسعاف المصرية",
    nameEn: "Egyptian Ambulance",
    number: "123",
    descriptionAr: "طوارئ الإسعاف ونقل الحالات الحرجة",
  },
  {
    nameAr: "شرطة النجدة",
    nameEn: "Police Emergency",
    number: "122",
    descriptionAr: "الاستجابة الأمنية الفورية والنجدة",
  },
  {
    nameAr: "طوارئ وزارة الصحة",
    nameEn: "MOH Emergency Hotline",
    number: "105",
    descriptionAr: "استشارات الطوارئ والغرف المركزية",
  },
  {
    nameAr: "مركز السموم الوطني (قصر العيني)",
    nameEn: "National Poison Control",
    number: "0223643129",
    descriptionAr: "حالات التسمم الدوائي والغذائي ولدغات الحشرات",
  },
];

export interface EmergencyCardPayload {
  person: Person;
  age_display: string;
  is_child: boolean;
  blood_type: string;
  emergency_contacts: EmergencyContact[];
  severe_allergies: string[];
  chronic_conditions: string[];
  active_medications: Array<{
    id: string;
    name: string;
    dose: string;
    frequency: string;
    timing_notes?: string | null;
  }>;
  recent_vitals?: {
    blood_pressure?: string;
    blood_sugar?: string;
    heart_rate?: string;
    recorded_at?: string;
  };
  notes?: string | null;
  hotlines: EmergencyHotline[];
}

export const DEMO_EMERGENCY_CONTACTS: Record<string, EmergencyContact[]> = {
  "p-ahmed": [
    {
      id: "ec-1",
      person_id: "p-ahmed",
      name: "منى الشاذلي",
      relationship: "الزوجة",
      phone: "+201012345678",
      is_primary: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "ec-2",
      person_id: "p-ahmed",
      name: "د. طارق البدري (طبيب الأسرة)",
      relationship: "الطبيب المعالج",
      phone: "+201098765432",
      is_primary: false,
      created_at: new Date().toISOString(),
    },
  ],
  "p-sara": [
    {
      id: "ec-3",
      person_id: "p-sara",
      name: "أحمد مصطفى (الأب)",
      relationship: "الأب",
      phone: "+201012345678",
      is_primary: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "ec-4",
      person_id: "p-sara",
      name: "منى الشاذلي (الأم)",
      relationship: "الأم",
      phone: "+201098765432",
      is_primary: false,
      created_at: new Date().toISOString(),
    },
  ],
};

export async function compileEmergencyCard(
  person: Person,
  explicitContacts?: EmergencyContact[]
): Promise<EmergencyCardPayload> {
  const age = calculatePersonAge(person.birth_date);

  // 1. Emergency contacts (explicit -> demo -> fallback)
  let contacts: EmergencyContact[] = explicitContacts || [];
  if (contacts.length === 0 && DEMO_EMERGENCY_CONTACTS[person.id]) {
    contacts = DEMO_EMERGENCY_CONTACTS[person.id];
  }

  // 2. Active medications
  let activeMeds: Array<{
    id: string;
    name: string;
    dose: string;
    frequency: string;
    timing_notes?: string | null;
  }> = [];

  try {
    const meds = await getPersonMedications(person.id);
    activeMeds = meds
      .filter((m) => m.status === "active")
      .map((m) => ({
        id: m.id,
        name: m.name,
        dose: m.dose,
        frequency: m.frequency,
        timing_notes: m.timing_notes,
      }));
  } catch {
    // ignore
  }

  // 3. Recent Vitals
  let recentVitals: EmergencyCardPayload["recent_vitals"] = undefined;
  try {
    const summary = await getLatestVitalsSummary(person.id);
    if (summary) {
      recentVitals = {
        blood_pressure: summary.latest_bp
          ? `${summary.latest_bp.values.systolic}/${summary.latest_bp.values.diastolic} mmHg`
          : undefined,
        blood_sugar: summary.latest_glucose
          ? `${summary.latest_glucose.values.glucose} ${summary.latest_glucose.unit || "mg/dL"}`
          : undefined,
        heart_rate: summary.latest_heart_rate
          ? `${summary.latest_heart_rate.values.heart_rate} bpm`
          : undefined,
      };
    }
  } catch {
    // ignore
  }

  return {
    person,
    age_display: age.displayAr,
    is_child: age.isChild,
    blood_type: person.blood_type || "unknown",
    emergency_contacts: contacts,
    severe_allergies: person.allergies || [],
    chronic_conditions: person.chronic_conditions || [],
    active_medications: activeMeds,
    recent_vitals: recentVitals,
    notes: person.notes || null,
    hotlines: EGYPTIAN_EMERGENCY_HOTLINES,
  };
}
