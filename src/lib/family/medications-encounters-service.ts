/**
 * Medications Regimen & Doctor Visits Journal Service (Med Record Phase 4)
 * Manages active/paused/completed medications, reminder formatting,
 * consultation encounters, and follow-up alert evaluations.
 */

import type {
  PersonMedication,
  CreateMedicationInput,
  UpdateMedicationInput,
  MedicationStatus,
  PersonEncounter,
  CreateEncounterInput,
  UpdateEncounterInput,
} from '@/types/medications-encounters';
import {
  formatMedicationSchedule,
  getFollowUpAlertStatus,
  MEDICAL_SPECIALTIES_AR,
  type FormattedMedication,
  type FollowUpAlert,
} from '@/lib/med-record/medications-visits-helper';
import { recordAuditLog } from './audit';

export {
  formatMedicationSchedule,
  getFollowUpAlertStatus,
  MEDICAL_SPECIALTIES_AR,
  type FormattedMedication,
  type FollowUpAlert,
};

const MEDS_STORAGE_KEY = 'med_family_person_medications';
const ENCOUNTERS_STORAGE_KEY = 'med_family_person_encounters';

let inMemoryMedications: PersonMedication[] = [];
let inMemoryEncounters: PersonEncounter[] = [];

export function _resetInMemoryStore(): void {
  inMemoryMedications = [];
  inMemoryEncounters = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(MEDS_STORAGE_KEY);
      localStorage.removeItem(ENCOUNTERS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

function loadAllMedications(): PersonMedication[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(MEDS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
  }
  return inMemoryMedications;
}

function saveAllMedications(list: PersonMedication[]): void {
  inMemoryMedications = list;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(MEDS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }
}

function loadAllEncounters(): PersonEncounter[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(ENCOUNTERS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
  }
  return inMemoryEncounters;
}

function saveAllEncounters(list: PersonEncounter[]): void {
  inMemoryEncounters = list;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(ENCOUNTERS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }
}

// ==============================================================================
// 1. Medications API
// ==============================================================================

export async function getPersonMedications(
  personId: string,
  statusFilter?: MedicationStatus
): Promise<PersonMedication[]> {
  const all = loadAllMedications();
  return all.filter((m) => {
    if (m.person_id !== personId) return false;
    if (m.archived_at) return false;
    if (statusFilter && m.status !== statusFilter) return false;
    return true;
  });
}

export async function createPersonMedication(
  input: CreateMedicationInput,
  actorUserId: string = 'usr-current'
): Promise<PersonMedication> {
  if (!input.name || !input.name.trim()) {
    throw new Error('اسم الدواء مطلوب');
  }
  if (!input.dose || !input.dose.trim()) {
    throw new Error('الجرعة مطلوبة');
  }
  if (!input.frequency || !input.frequency.trim()) {
    throw new Error('معدل التكرار مطلوب');
  }

  const id = `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newMed: PersonMedication = {
    id,
    family_id: input.family_id,
    person_id: input.person_id,
    name: input.name.trim(),
    dose: input.dose.trim(),
    frequency: input.frequency.trim(),
    timing_notes: input.timing_notes?.trim() || null,
    start_date: input.start_date || new Date().toISOString().split('T')[0],
    end_date: input.end_date || null,
    status: input.status || 'active',
    reminder_enabled: Boolean(input.reminder_enabled),
    reminder_time: input.reminder_time?.trim() || null,
    prescribed_by: input.prescribed_by?.trim() || null,
    notes: input.notes?.trim() || null,
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const list = loadAllMedications();
  list.unshift(newMed);
  saveAllMedications(list);

  try {
    await recordAuditLog({
      family_id: input.family_id,
      actor_id: actorUserId,
      event_type: 'medication_created',
      resource_id: id,
      description: `تمت إضافة دواء جديد: ${newMed.name}`,
    });
  } catch {
    // Non-fatal audit log failure
  }

  return newMed;
}

export async function updatePersonMedication(
  id: string,
  input: UpdateMedicationInput,
  actorUserId: string = 'usr-current'
): Promise<PersonMedication> {
  const list = loadAllMedications();
  const index = list.findIndex((m) => m.id === id);
  if (index === -1) {
    throw new Error('الدواء غير موجود');
  }

  const existing = list[index];
  const updated: PersonMedication = {
    ...existing,
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.dose !== undefined ? { dose: input.dose.trim() } : {}),
    ...(input.frequency !== undefined ? { frequency: input.frequency.trim() } : {}),
    ...(input.timing_notes !== undefined ? { timing_notes: input.timing_notes } : {}),
    ...(input.start_date !== undefined ? { start_date: input.start_date } : {}),
    ...(input.end_date !== undefined ? { end_date: input.end_date } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.reminder_enabled !== undefined ? { reminder_enabled: input.reminder_enabled } : {}),
    ...(input.reminder_time !== undefined ? { reminder_time: input.reminder_time } : {}),
    ...(input.prescribed_by !== undefined ? { prescribed_by: input.prescribed_by } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    updated_at: new Date().toISOString(),
  };

  list[index] = updated;
  saveAllMedications(list);

  try {
    await recordAuditLog({
      family_id: updated.family_id,
      actor_id: actorUserId,
      event_type: 'medication_updated',
      resource_id: id,
      description: `تم تحديث بيانات الدواء: ${updated.name}`,
    });
  } catch {
    // Non-fatal
  }

  return updated;
}

export async function setMedicationStatus(
  id: string,
  status: MedicationStatus,
  actorUserId: string = 'usr-current'
): Promise<PersonMedication> {
  const updated = await updatePersonMedication(id, { status }, actorUserId);

  try {
    await recordAuditLog({
      family_id: updated.family_id,
      actor_id: actorUserId,
      event_type: 'medication_status_changed',
      resource_id: id,
      description: `تم تغيير حالة الدواء إلى: ${status}`,
    });
  } catch {
    // Non-fatal
  }

  return updated;
}

export async function archivePersonMedication(
  id: string,
  actorUserId: string = 'usr-current'
): Promise<void> {
  const list = loadAllMedications();
  const med = list.find((m) => m.id === id);
  if (!med) return;

  med.archived_at = new Date().toISOString();
  saveAllMedications(list);

  try {
    await recordAuditLog({
      family_id: med.family_id,
      actor_id: actorUserId,
      event_type: 'medication_archived',
      resource_id: id,
      description: `تمت أرشفة الدواء: ${med.name}`,
    });
  } catch {
    // Non-fatal
  }
}

// ==============================================================================
// 2. Doctor Encounters (Visits) API
// ==============================================================================

export async function getPersonEncounters(
  personId: string
): Promise<PersonEncounter[]> {
  const all = loadAllEncounters();
  return all
    .filter((e) => e.person_id === personId && !e.archived_at)
    .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
}

export async function createPersonEncounter(
  input: CreateEncounterInput,
  actorUserId: string = 'usr-current'
): Promise<PersonEncounter> {
  if (!input.doctor_name || !input.doctor_name.trim()) {
    throw new Error('اسم الطبيب مطلوب');
  }
  if (!input.specialty || !input.specialty.trim()) {
    throw new Error('التخصص الطبي مطلوب');
  }

  const id = `enc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newEncounter: PersonEncounter = {
    id,
    family_id: input.family_id,
    person_id: input.person_id,
    visit_date: input.visit_date || new Date().toISOString().split('T')[0],
    doctor_name: input.doctor_name.trim(),
    specialty: input.specialty.trim(),
    facility_name: input.facility_name?.trim() || null,
    chief_complaint: input.chief_complaint?.trim() || null,
    diagnosis: input.diagnosis?.trim() || null,
    notes: input.notes?.trim() || null,
    follow_up_date: input.follow_up_date || null,
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const list = loadAllEncounters();
  list.unshift(newEncounter);
  saveAllEncounters(list);

  try {
    await recordAuditLog({
      family_id: input.family_id,
      actor_id: actorUserId,
      event_type: 'encounter_created',
      resource_id: id,
      description: `تم تسجيل كشف طبي لدى: ${newEncounter.doctor_name}`,
    });
  } catch {
    // Non-fatal
  }

  return newEncounter;
}

export async function updatePersonEncounter(
  id: string,
  input: UpdateEncounterInput,
  actorUserId: string = 'usr-current'
): Promise<PersonEncounter> {
  const list = loadAllEncounters();
  const index = list.findIndex((e) => e.id === id);
  if (index === -1) {
    throw new Error('الكشف الطبي غير موجود');
  }

  const existing = list[index];
  const updated: PersonEncounter = {
    ...existing,
    ...(input.doctor_name !== undefined ? { doctor_name: input.doctor_name.trim() } : {}),
    ...(input.specialty !== undefined ? { specialty: input.specialty.trim() } : {}),
    ...(input.facility_name !== undefined ? { facility_name: input.facility_name } : {}),
    ...(input.visit_date !== undefined ? { visit_date: input.visit_date } : {}),
    ...(input.chief_complaint !== undefined ? { chief_complaint: input.chief_complaint } : {}),
    ...(input.diagnosis !== undefined ? { diagnosis: input.diagnosis } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.follow_up_date !== undefined ? { follow_up_date: input.follow_up_date } : {}),
    updated_at: new Date().toISOString(),
  };

  list[index] = updated;
  saveAllEncounters(list);

  try {
    await recordAuditLog({
      family_id: updated.family_id,
      actor_id: actorUserId,
      event_type: 'encounter_updated',
      resource_id: id,
      description: `تم تحديث الكشف الطبي: ${updated.doctor_name}`,
    });
  } catch {
    // Non-fatal
  }

  return updated;
}

export async function archivePersonEncounter(
  id: string,
  actorUserId: string = 'usr-current'
): Promise<void> {
  const list = loadAllEncounters();
  const enc = list.find((e) => e.id === id);
  if (!enc) return;

  enc.archived_at = new Date().toISOString();
  saveAllEncounters(list);

  try {
    await recordAuditLog({
      family_id: enc.family_id,
      actor_id: actorUserId,
      event_type: 'encounter_archived',
      resource_id: id,
      description: `تمت أرشفة الكشف الطبي لدى: ${enc.doctor_name}`,
    });
  } catch {
    // Non-fatal
  }
}

// ==============================================================================
// 3. Realistic Mock Seeding
// ==============================================================================

export async function seedRealisticMockMedicationsAndEncounters(
  personId: string,
  familyId: string,
  ageInYears: number = 30
): Promise<{ medications: PersonMedication[]; encounters: PersonEncounter[] }> {
  // Check if person already has medications
  const existingMeds = await getPersonMedications(personId);
  const existingEncounters = await getPersonEncounters(personId);

  if (existingMeds.length > 0 && existingEncounters.length > 0) {
    return { medications: existingMeds, encounters: existingEncounters };
  }

  const createdMeds: PersonMedication[] = [];
  const createdEncounters: PersonEncounter[] = [];

  if (ageInYears >= 18) {
    // Adult Regimen
    if (existingMeds.length === 0) {
      createdMeds.push(
        await createPersonMedication({
          family_id: familyId,
          person_id: personId,
          name: 'كونكور 5 مجم (Concor 5mg)',
          dose: '5 مجم',
          frequency: 'مرة واحدة يومياً',
          timing_notes: 'بعد وجبة الإفطار',
          status: 'active',
          reminder_enabled: true,
          reminder_time: '08:30',
          prescribed_by: 'د. طارق البدري',
        })
      );

      createdMeds.push(
        await createPersonMedication({
          family_id: familyId,
          person_id: personId,
          name: 'جلوكوفاج 1000 مجم (Glucophage 1000mg)',
          dose: 'قرص واحد',
          frequency: 'مرتين يومياً',
          timing_notes: 'وسط الوجبات الرئيسية',
          status: 'active',
          reminder_enabled: true,
          reminder_time: '14:00',
          prescribed_by: 'د. طارق البدري',
        })
      );

      createdMeds.push(
        await createPersonMedication({
          family_id: familyId,
          person_id: personId,
          name: 'أوجمنتين 1 جم (Augmentin 1g)',
          dose: 'قرص واحد',
          frequency: 'كل 12 ساعة لمدة 7 أيام',
          timing_notes: 'بعد الأكل مباشرة',
          status: 'completed',
          reminder_enabled: false,
          prescribed_by: 'د. أحمد سمير',
        })
      );
    }

    if (existingEncounters.length === 0) {
      // 5 days from now for follow-up alert
      const followUpDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      createdEncounters.push(
        await createPersonEncounter({
          family_id: familyId,
          person_id: personId,
          visit_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          doctor_name: 'د. طارق البدري',
          specialty: 'باطنة وقلب وأوعية دموية',
          facility_name: 'عيادات الصفا التخصصية - المعادي',
          chief_complaint: 'متابعة قياسات الضغط ومراجعة تحليل السكر التراكمي',
          diagnosis: 'ارتفاع ضغط الدم الشرياني منتظم بالعلاج، سكر نوع 2 مستقر',
          notes: 'ضغط الدم 125/80. الاستمرار على كونكور وجلوكوفاج بنفس الجرعات مع عمل تحليل يوريك أسيد قبل المراجعة.',
          follow_up_date: followUpDate,
        })
      );

      createdEncounters.push(
        await createPersonEncounter({
          family_id: familyId,
          person_id: personId,
          visit_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          doctor_name: 'د. كريم عبد العزيز',
          specialty: 'عيون وجراحة رمد',
          facility_name: 'مركز النخبة للعيون',
          chief_complaint: 'فحص قاع العين الدوري لمريض السكر',
          diagnosis: 'شبكية العين سليمة تماماً ولا توجد ارتشاحات',
          notes: 'إعادة الفحص بعد سنة كاملة.',
        })
      );
    }
  } else {
    // Pediatric Regimen
    if (existingMeds.length === 0) {
      createdMeds.push(
        await createPersonMedication({
          family_id: familyId,
          person_id: personId,
          name: 'بانادول شراب للأطفال (Panadol Baby & Infant)',
          dose: '5 مل (ملعقة معيارية)',
          frequency: 'عند اللزوم كل 6 إلى 8 ساعات',
          timing_notes: 'في حال ارتفاع درجة الحرارة فوق 38°C',
          status: 'active',
          reminder_enabled: false,
          prescribed_by: 'د. منى الشريف',
        })
      );

      createdMeds.push(
        await createPersonMedication({
          family_id: familyId,
          person_id: personId,
          name: 'أوتريفين بيبي سالين نقط (Otrivin Baby Saline)',
          dose: 'نقطتان في كل فتحة أنف',
          frequency: '3 مرات يومياً',
          timing_notes: 'قبل الرضاعة لتسهيل التنفس',
          status: 'completed',
          reminder_enabled: false,
          prescribed_by: 'د. منى الشريف',
        })
      );
    }

    if (existingEncounters.length === 0) {
      createdEncounters.push(
        await createPersonEncounter({
          family_id: familyId,
          person_id: personId,
          visit_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          doctor_name: 'د. منى الشريف',
          specialty: 'طب أطفال وحديثي ولادة',
          facility_name: 'عيادة الأطفال التخصصية - مصر الجديدة',
          chief_complaint: 'فحص نمو وتطور دوري + تطعيم الشهر التاسع',
          diagnosis: 'النمو الحركي والجسدي متناسق وفق المنحنيات الدولية',
          notes: 'الوزن والطول على النسبة المئوية 50. تم إعطاء فيتامين د 400 وحدة دولية يومياً.',
          follow_up_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        })
      );
    }
  }

  return {
    medications: await getPersonMedications(personId),
    encounters: await getPersonEncounters(personId),
  };
}
