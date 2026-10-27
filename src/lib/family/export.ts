import type { Family, FamilyMember, Person, EmergencyContact } from "@/types/family";
import { createAuditLogger } from "./audit";

export interface FamilyExportPayload {
  schema_version: string;
  platform: string;
  exported_at: string;
  family: Family;
  members: FamilyMember[];
  people: Person[];
  emergency_contacts: EmergencyContact[];
}

export async function exportFamilyData(
  familyId: string,
  supabaseClient: any
): Promise<FamilyExportPayload> {
  // Fetch Family
  const { data: family } = await supabaseClient
    .from("families")
    .select("*")
    .eq("id", familyId)
    .single();

  // Fetch Members
  const { data: members } = await supabaseClient
    .from("family_members")
    .select("*")
    .eq("family_id", familyId);

  // Fetch People (including archived people for complete export)
  const { data: people } = await supabaseClient
    .from("people")
    .select("*")
    .eq("family_id", familyId);

  const peopleList: Person[] = (people as Person[]) || [];
  const personIds = peopleList.map((p) => p.id);

  // Fetch Emergency Contacts
  let contacts: EmergencyContact[] = [];
  if (personIds.length > 0) {
    const { data: contactData } = await supabaseClient
      .from("emergency_contacts")
      .select("*")
      .in("person_id", personIds);
    contacts = (contactData as EmergencyContact[]) || [];
  }

  return {
    schema_version: "1.0",
    platform: "Med Health Records (فضاء العائلة)",
    exported_at: new Date().toISOString(),
    family: (family as Family) || { id: familyId, name: "عائلتي", created_at: "", updated_at: "" },
    members: (members as FamilyMember[]) || [],
    people: peopleList,
    emergency_contacts: contacts,
  };
}

export async function deleteFamilyAccountAndData(
  familyId: string,
  actorId: string,
  supabaseClient: any
): Promise<void> {
  const auditLogger = createAuditLogger(supabaseClient);

  // 1. Log the deletion audit event
  await auditLogger.logEvent({
    actorId,
    action: "account_deleted",
    familyId,
    metadata: {
      account_erasure: true,
      timestamp: new Date().toISOString(),
    },
  });

  // 2. Delete Family (Postgres ON DELETE CASCADE will clean up family_members, people, emergency_contacts, viewer_grants)
  await supabaseClient.from("families").delete().eq("id", familyId);
}
