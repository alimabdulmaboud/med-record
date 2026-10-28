import type { Family, FamilyMember, Person, EmergencyContact } from "@/types/family";
import type { PersonMeasurement } from "@/types/measurements";
import type { PersonDocument } from "@/types/documents";
import type { PersonMedication, PersonEncounter } from "@/types/medications-encounters";
import type { PersonVaccination } from "@/types/vaccinations";
import type { DoctorReportEntity } from "@/types/reports";
import { createAuditLogger } from "./audit";

export interface FamilyExportPayload {
  schema_version: string;
  platform: string;
  exported_at: string;
  family: Family;
  members: FamilyMember[];
  people: Person[];
  emergency_contacts: EmergencyContact[];
  measurements?: PersonMeasurement[];
  documents?: PersonDocument[];
  medications?: PersonMedication[];
  encounters?: PersonEncounter[];
  vaccinations?: PersonVaccination[];
  doctor_reports?: DoctorReportEntity[];
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

  // Fetch Clinical tables safely (if client implements them)
  let measurements: PersonMeasurement[] = [];
  let documents: PersonDocument[] = [];
  let medications: PersonMedication[] = [];
  let encounters: PersonEncounter[] = [];
  let vaccinations: PersonVaccination[] = [];
  let reports: DoctorReportEntity[] = [];

  try {
    if (personIds.length > 0) {
      const [mRes, dRes, medRes, encRes, vacRes, repRes] = await Promise.all([
        supabaseClient.from("person_measurements")?.select("*")?.in("person_id", personIds),
        supabaseClient.from("person_documents")?.select("*")?.in("person_id", personIds),
        supabaseClient.from("person_medications")?.select("*")?.in("person_id", personIds),
        supabaseClient.from("person_encounters")?.select("*")?.in("person_id", personIds),
        supabaseClient.from("person_vaccinations")?.select("*")?.in("person_id", personIds),
        supabaseClient.from("doctor_reports")?.select("*")?.in("person_id", personIds),
      ]);
      if (mRes?.data) measurements = mRes.data;
      if (dRes?.data) documents = dRes.data;
      if (medRes?.data) medications = medRes.data;
      if (encRes?.data) encounters = encRes.data;
      if (vacRes?.data) vaccinations = vacRes.data;
      if (repRes?.data) reports = repRes.data;
    }
  } catch {
    // Graceful fallback if tables or client mocks don't support clinical calls
  }

  return {
    schema_version: "1.0",
    platform: "Med Health Records (فضاء العائلة)",
    exported_at: new Date().toISOString(),
    family: (family as Family) || { id: familyId, name: "عائلتي", created_at: "", updated_at: "" },
    members: (members as FamilyMember[]) || [],
    people: peopleList,
    emergency_contacts: contacts,
    measurements,
    documents,
    medications,
    encounters,
    vaccinations,
    doctor_reports: reports,
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

  // 2. Delete Family (Postgres ON DELETE CASCADE will clean up family_members, people, emergency_contacts, viewer_grants, clinical tables)
  await supabaseClient.from("families").delete().eq("id", familyId);
}

// ==============================================================================
// UTF-8 BOM CSV Exporter for Arabic Excel Compatibility
// ==============================================================================

export const UTF8_BOM = "\uFEFF";

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return "";
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function exportMeasurementsToCSV(measurements: PersonMeasurement[]): string {
  const headers = [
    "معرف القياس",
    "معرف المريض",
    "تاريخ ووقت القياس",
    "نوع القياس",
    "القيم المسجلة",
    "الوحدة",
    "هل هو شاذ سريرياً؟",
    "ملاحظات",
  ];

  const rows = measurements.map((m) => {
    let valuesDisplay = "";
    if (m.measurement_type === "blood_pressure") {
      valuesDisplay = `${m.values?.systolic}/${m.values?.diastolic}`;
    } else if (m.measurement_type === "blood_glucose") {
      valuesDisplay = String(m.values?.glucose ?? "");
    } else if (m.measurement_type === "growth_entry") {
      valuesDisplay = `وزن: ${m.values?.weight_kg ?? ""}, طول: ${m.values?.height_cm ?? ""}`;
    } else {
      valuesDisplay = String(m.values?.weight_kg ?? m.values?.height_cm ?? m.values?.heart_rate ?? m.values?.temperature_c ?? m.values?.spo2 ?? "");
    }

    return [
      escapeCSV(m.id),
      escapeCSV(m.person_id),
      escapeCSV(m.recorded_at),
      escapeCSV(m.label_ar || m.measurement_type),
      escapeCSV(valuesDisplay),
      escapeCSV(m.unit),
      escapeCSV(m.is_abnormal ? "نعم" : "لا"),
      escapeCSV(m.notes || ""),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\r\n");
}

export function exportMedicationsToCSV(medications: PersonMedication[]): string {
  const headers = [
    "معرف الدواء",
    "معرف المريض",
    "اسم الدواء",
    "الجرعة",
    "التكرار",
    "مواعيد الاستخدام",
    "الحالة",
    "تاريخ البدء",
    "الطبيب المعالج",
    "ملاحظات",
  ];

  const rows = medications.map((med) => [
    escapeCSV(med.id),
    escapeCSV(med.person_id),
    escapeCSV(med.name),
    escapeCSV(med.dose),
    escapeCSV(med.frequency),
    escapeCSV(med.timing_notes || ""),
    escapeCSV(med.status),
    escapeCSV(med.start_date),
    escapeCSV(med.prescribed_by || ""),
    escapeCSV(med.notes || ""),
  ].join(","));

  return [headers.join(","), ...rows].join("\r\n");
}

export function exportEncountersToCSV(encounters: PersonEncounter[]): string {
  const headers = [
    "معرف الكشف",
    "معرف المريض",
    "تاريخ الزيارة",
    "اسم الطبيب",
    "التخصص",
    "العيادة أو المركز",
    "التشخيص",
    "الشكوى الرئيسية",
    "ملاحظات وخطة العلاج",
  ];

  const rows = encounters.map((enc) => [
    escapeCSV(enc.id),
    escapeCSV(enc.person_id),
    escapeCSV(enc.visit_date),
    escapeCSV(enc.doctor_name),
    escapeCSV(enc.specialty),
    escapeCSV(enc.facility_name || ""),
    escapeCSV(enc.diagnosis || ""),
    escapeCSV(enc.chief_complaint || ""),
    escapeCSV(enc.notes || ""),
  ].join(","));

  return [headers.join(","), ...rows].join("\r\n");
}

export function exportVaccinationsToCSV(vaccinations: PersonVaccination[]): string {
  const headers = [
    "معرف التطعيم",
    "معرف الطفل",
    "اسم التطعيم",
    "المرض المستهدف",
    "رقم الجرعة",
    "الحالة",
    "التاريخ المجدول",
    "تاريخ الإعطاء الفعلي",
    "رقم التشغيلة (Batch)",
    "جهة التطعيم",
  ];

  const rows = vaccinations.map((vac) => [
    escapeCSV(vac.id),
    escapeCSV(vac.person_id),
    escapeCSV(vac.vaccine_name),
    escapeCSV(vac.target_disease),
    escapeCSV(vac.dose_number),
    escapeCSV(vac.status),
    escapeCSV(vac.scheduled_date),
    escapeCSV(vac.administered_date || ""),
    escapeCSV(vac.batch_number || ""),
    escapeCSV(vac.administered_by || ""),
  ].join(","));

  return [headers.join(","), ...rows].join("\r\n");
}

export function exportComprehensiveFamilyCSV(payload: FamilyExportPayload): string {
  const sections: string[] = [];

  // 1. Family & People Demographics
  sections.push("=== أفراد العائلة (Family Members) ===");
  const peopleHeaders = ["معرف الفرد", "الاسم الكامل", "تاريخ الميلاد", "النوع", "فصيلة الدم", "الحساسيات", "الأمراض المزمنة"];
  const peopleRows = payload.people.map((p) => [
    escapeCSV(p.id),
    escapeCSV(p.name),
    escapeCSV(p.birth_date),
    escapeCSV(p.sex === "female" ? "أنثى" : "ذكر"),
    escapeCSV(p.blood_type),
    escapeCSV(p.allergies?.join(" | ") || ""),
    escapeCSV(p.chronic_conditions?.join(" | ") || ""),
  ].join(","));
  sections.push([peopleHeaders.join(","), ...peopleRows].join("\r\n"));

  // 2. Emergency Contacts
  if (payload.emergency_contacts && payload.emergency_contacts.length > 0) {
    sections.push("\r\n=== جهات اتصال الطوارئ (Emergency Contacts) ===");
    const ecHeaders = ["معرف جهة الاتصال", "معرف المريض", "الاسم", "صلة القرابة", "رقم الهاتف", "رئيسي؟"];
    const ecRows = payload.emergency_contacts.map((c) => [
      escapeCSV(c.id),
      escapeCSV(c.person_id),
      escapeCSV(c.name),
      escapeCSV(c.relationship),
      escapeCSV(c.phone),
      escapeCSV(c.is_primary ? "نعم" : "لا"),
    ].join(","));
    sections.push([ecHeaders.join(","), ...ecRows].join("\r\n"));
  }

  // 3. Measurements
  if (payload.measurements && payload.measurements.length > 0) {
    sections.push("\r\n=== القياسات الحيوية (Measurements & Vitals) ===");
    sections.push(exportMeasurementsToCSV(payload.measurements));
  }

  // 4. Medications
  if (payload.medications && payload.medications.length > 0) {
    sections.push("\r\n=== الأدوية والعلاجات (Medications) ===");
    sections.push(exportMedicationsToCSV(payload.medications));
  }

  // 5. Encounters
  if (payload.encounters && payload.encounters.length > 0) {
    sections.push("\r\n=== زيارات واستشارات الأطباء (Doctor Consultations) ===");
    sections.push(exportEncountersToCSV(payload.encounters));
  }

  // 6. Vaccinations
  if (payload.vaccinations && payload.vaccinations.length > 0) {
    sections.push("\r\n=== سجل التطعيمات الوقائية (Vaccinations) ===");
    sections.push(exportVaccinationsToCSV(payload.vaccinations));
  }

  return UTF8_BOM + sections.join("\r\n\r\n");
}
