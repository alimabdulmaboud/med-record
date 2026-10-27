import type {
  Person,
  CreatePersonInput,
  UpdatePersonInput,
  EmergencyContact,
} from "@/types/family";
import { createAuditLogger } from "./audit";

export interface AgeCalculation {
  years: number;
  months: number;
  totalMonths: number;
  displayAr: string;
  isChild: boolean;
}

/**
 * Calculates age and formats according to pediatric/adult conventions:
 * - < 2 years: formatted in months (e.g. "14 شهر")
 * - 2 to 5 years: formatted in years and months (e.g. "3 سنوات و 6 أشهر")
 * - >= 5 years: formatted in years (e.g. "38 سنة")
 */
export function calculatePersonAge(
  birthDateStr: string,
  referenceDate: Date = new Date()
): AgeCalculation {
  const birth = new Date(birthDateStr);
  const now = referenceDate;

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  const days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = years * 12 + months;
  const isChild = years < 18;

  let displayAr = "";
  if (totalMonths < 24) {
    displayAr = `${totalMonths} شهر`;
  } else if (years < 5) {
    if (months > 0) {
      displayAr = `${years} سنوات و ${months} أشهر`;
    } else {
      displayAr = `${years} سنوات`;
    }
  } else if (years === 1) {
    displayAr = "سنة واحدة";
  } else if (years === 2) {
    displayAr = "سنتان";
  } else if (years >= 3 && years <= 10) {
    displayAr = `${years} سنوات`;
  } else {
    displayAr = `${years} سنة`;
  }

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    totalMonths: Math.max(0, totalMonths),
    displayAr,
    isChild,
  };
}

export function createFamilyService(supabaseClient: any) {
  const auditLogger = createAuditLogger(supabaseClient);

  return {
    async getFamilyPersons(familyId: string): Promise<Person[]> {
      try {
        const { data, error } = await supabaseClient
          .from("people")
          .select("*")
          .eq("family_id", familyId)
          .is("archived_at", null)
          .order("birth_date", { ascending: true });

        if (error || !data) return [];
        return data as Person[];
      } catch {
        return [];
      }
    },

    async getPersonById(personId: string): Promise<Person | null> {
      try {
        const { data, error } = await supabaseClient
          .from("people")
          .select("*")
          .eq("id", personId)
          .maybeSingle();

        if (error || !data) return null;
        return data as Person;
      } catch {
        return null;
      }
    },

    async getEmergencyContacts(personId: string): Promise<EmergencyContact[]> {
      try {
        const { data, error } = await supabaseClient
          .from("emergency_contacts")
          .select("*")
          .eq("person_id", personId);

        if (error || !data) return [];
        return data as EmergencyContact[];
      } catch {
        return [];
      }
    },

    async createPerson(
      familyId: string,
      input: CreatePersonInput,
      actorId: string
    ): Promise<Person> {
      const { emergency_contacts, ...personFields } = input;

      const { data, error } = await supabaseClient
        .from("people")
        .insert({
          family_id: familyId,
          name: personFields.name,
          birth_date: personFields.birth_date,
          sex: personFields.sex,
          blood_type: personFields.blood_type || "unknown",
          allergies: personFields.allergies || [],
          chronic_conditions: personFields.chronic_conditions || [],
          notes: personFields.notes || null,
          phone_number: personFields.phone_number || null,
          linked_user_id: personFields.linked_user_id || null,
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(`Failed to create person: ${error?.message || "unknown"}`);
      }

      const createdPerson = data as Person;

      // Insert emergency contacts if provided
      if (emergency_contacts && emergency_contacts.length > 0) {
        const contactRows = emergency_contacts.map((c) => ({
          person_id: createdPerson.id,
          name: c.name,
          relationship: c.relationship,
          phone: c.phone,
          is_primary: Boolean(c.is_primary),
        }));
        await supabaseClient.from("emergency_contacts").insert(contactRows);
      }

      // Log sanitized audit event (NO health data)
      await auditLogger.logEvent({
        actorId,
        action: "person_created",
        personId: createdPerson.id,
        familyId,
        metadata: {
          person_name_initial: createdPerson.name.charAt(0),
          is_child: calculatePersonAge(createdPerson.birth_date).isChild,
        },
      });

      return createdPerson;
    },

    async updatePerson(
      personId: string,
      input: UpdatePersonInput,
      actorId: string,
      familyId?: string
    ): Promise<Person> {
      const { emergency_contacts, ...fieldsToUpdate } = input;

      const { data, error } = await supabaseClient
        .from("people")
        .update(fieldsToUpdate)
        .eq("id", personId)
        .select()
        .single();

      if (error || !data) {
        throw new Error(`Failed to update person: ${error?.message || "unknown"}`);
      }

      const updated = data as Person;

      // Log sanitized audit event
      await auditLogger.logEvent({
        actorId,
        action: "person_updated",
        personId,
        familyId: familyId || updated.family_id,
        metadata: {
          fields_changed: Object.keys(fieldsToUpdate),
        },
      });

      return updated;
    },

    async archivePerson(
      personId: string,
      actorId: string,
      familyId?: string
    ): Promise<void> {
      const now = new Date().toISOString();
      const { error } = await supabaseClient
        .from("people")
        .update({ archived_at: now })
        .eq("id", personId);

      if (error) {
        throw new Error(`Failed to archive person: ${error.message}`);
      }

      await auditLogger.logEvent({
        actorId,
        action: "person_archived",
        personId,
        familyId,
        metadata: { archived: true },
      });
    },

    async restorePerson(
      personId: string,
      actorId: string,
      familyId?: string
    ): Promise<void> {
      const { error } = await supabaseClient
        .from("people")
        .update({ archived_at: null })
        .eq("id", personId);

      if (error) {
        throw new Error(`Failed to restore person: ${error.message}`);
      }

      await auditLogger.logEvent({
        actorId,
        action: "person_restored",
        personId,
        familyId,
        metadata: { restored: true },
      });
    },
  };
}
