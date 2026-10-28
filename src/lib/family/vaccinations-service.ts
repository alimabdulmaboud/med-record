/**
 * Childhood Vaccination Tracker Service (Med Record Phase 5)
 * Combines the official Egyptian Ministry of Health & Population (MOH) schedule
 * with family vaccination records, milestone grouping, and overdue alerts.
 */

import type {
  PersonVaccination,
  CreateVaccinationInput,
  UpdateVaccinationInput,
  VaccinationStatus,
} from '@/types/vaccinations';
import {
  EGYPTIAN_MOH_SCHEDULE,
  getEgyptianVaccineSchedule,
  type ScheduledVaccine,
} from '@/lib/med-record/vaccine-schedule';
import {
  groupVaccinesByMilestone,
  calculateVaccinationStats,
  type MilestoneGroup,
  type VaccinationStats,
} from '@/lib/med-record/vaccination-view-helper';
import { sanitizeAuditMetadata } from './audit';

export {
  EGYPTIAN_MOH_SCHEDULE,
  getEgyptianVaccineSchedule,
  groupVaccinesByMilestone,
  calculateVaccinationStats,
  type ScheduledVaccine,
  type MilestoneGroup,
  type VaccinationStats,
};

const VACCINATIONS_STORAGE_KEY = 'med_family_person_vaccinations';

let inMemoryVaccinations: PersonVaccination[] = [];

export function _resetInMemoryStore(): void {
  inMemoryVaccinations = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(VACCINATIONS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

function loadAllVaccinations(): PersonVaccination[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(VACCINATIONS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
  }
  return inMemoryVaccinations;
}

function saveAllVaccinations(list: PersonVaccination[]): void {
  inMemoryVaccinations = list;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(VACCINATIONS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }
}

async function logAudit(params: {
  family_id: string;
  actor_id: string;
  event_type: string;
  resource_id: string;
  description?: string;
}): Promise<void> {
  sanitizeAuditMetadata({
    event_type: params.event_type,
    resource_id: params.resource_id,
    description: params.description,
  });
}

// ==============================================================================
// 1. Vaccinations API
// ==============================================================================

export async function getRecordedVaccinations(
  personId: string
): Promise<PersonVaccination[]> {
  const all = loadAllVaccinations();
  return all.filter((v) => v.person_id === personId && !v.archived_at);
}

export async function getPersonVaccinationsSchedule(
  personId: string,
  birthDate: string,
  currentDateStr?: string
): Promise<{
  schedule: ScheduledVaccine[];
  milestones: MilestoneGroup[];
  stats: VaccinationStats;
  recorded: PersonVaccination[];
}> {
  const recorded = await getRecordedVaccinations(personId);

  // Map recorded to helper format
  const mapped = recorded.map((r) => ({
    vaccineName: r.vaccine_name,
    doseNumber: r.dose_number,
    status: r.status,
    administeredDate: r.administered_date || undefined,
    batchNumber: r.batch_number || undefined,
  }));

  const schedule = getEgyptianVaccineSchedule(birthDate, currentDateStr, mapped);
  const milestones = groupVaccinesByMilestone(schedule);
  const stats = calculateVaccinationStats(schedule);

  return {
    schedule,
    milestones,
    stats,
    recorded,
  };
}

export async function recordVaccineAdministered(
  input: {
    family_id: string;
    person_id: string;
    vaccine_code: string;
    vaccine_name: string;
    target_disease: string;
    dose_number?: number;
    age_milestone_months?: number;
    scheduled_date: string;
    administered_date: string;
    batch_number?: string;
    administered_by?: string;
    notes?: string;
  },
  actorUserId: string = 'usr-current'
): Promise<PersonVaccination> {
  if (!input.administered_date) {
    throw new Error('تاريخ إعطاء التطعيم مطلوب');
  }

  const list = loadAllVaccinations();
  const existingIndex = list.findIndex(
    (v) =>
      v.person_id === input.person_id &&
      v.vaccine_code === input.vaccine_code &&
      !v.archived_at
  );

  let record: PersonVaccination;

  if (existingIndex !== -1) {
    const existing = list[existingIndex];
    record = {
      ...existing,
      status: 'completed',
      administered_date: input.administered_date,
      batch_number: input.batch_number?.trim() || existing.batch_number || null,
      administered_by: input.administered_by?.trim() || existing.administered_by || null,
      notes: input.notes?.trim() || existing.notes || null,
      updated_at: new Date().toISOString(),
    };
    list[existingIndex] = record;
  } else {
    const id = `vac-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    record = {
      id,
      family_id: input.family_id,
      person_id: input.person_id,
      vaccine_code: input.vaccine_code,
      vaccine_name: input.vaccine_name,
      target_disease: input.target_disease,
      dose_number: input.dose_number ?? 1,
      age_milestone_months: input.age_milestone_months ?? 0,
      scheduled_date: input.scheduled_date,
      administered_date: input.administered_date,
      status: 'completed',
      batch_number: input.batch_number?.trim() || null,
      administered_by: input.administered_by?.trim() || null,
      notes: input.notes?.trim() || null,
      archived_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(record);
  }

  saveAllVaccinations(list);

  try {
    await logAudit({
      family_id: input.family_id,
      actor_id: actorUserId,
      event_type: 'vaccine_administered',
      resource_id: record.id,
      description: `تم تسجيل إعطاء التطعيم: ${record.vaccine_name}`,
    });
  } catch {
    // Non-fatal
  }

  return record;
}

export async function archivePersonVaccination(
  id: string,
  actorUserId: string = 'usr-current'
): Promise<void> {
  const list = loadAllVaccinations();
  const v = list.find((item) => item.id === id);
  if (!v) return;

  v.archived_at = new Date().toISOString();
  saveAllVaccinations(list);

  try {
    await logAudit({
      family_id: v.family_id,
      actor_id: actorUserId,
      event_type: 'vaccination_archived',
      resource_id: id,
      description: `تمت أرشفة سجل تطعيم: ${v.vaccine_name}`,
    });
  } catch {
    // Non-fatal
  }
}

// ==============================================================================
// 2. Realistic Mock Seeding
// ==============================================================================

export async function seedRealisticMockVaccinations(
  personId: string,
  familyId: string,
  birthDateStr: string
): Promise<PersonVaccination[]> {
  const existing = await getRecordedVaccinations(personId);
  if (existing.length > 0) {
    return existing;
  }

  const birthDate = new Date(birthDateStr);
  const now = new Date();
  const ageInMonths = Math.floor(
    (now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)
  );

  const created: PersonVaccination[] = [];

  // Iterate over template: mark completed if child is older than milestone month
  for (const template of EGYPTIAN_MOH_SCHEDULE) {
    if (ageInMonths >= template.ageMilestoneMonths) {
      const scheduledDateObj = new Date(birthDate);
      scheduledDateObj.setMonth(scheduledDateObj.getMonth() + template.ageMilestoneMonths);
      const scheduledDate = scheduledDateObj.toISOString().split('T')[0];

      // Administered around scheduled date
      const adminDateObj = new Date(scheduledDateObj);
      adminDateObj.setDate(adminDateObj.getDate() + 2);
      const administeredDate = adminDateObj.toISOString().split('T')[0];

      const record = await recordVaccineAdministered({
        family_id: familyId,
        person_id: personId,
        vaccine_code: template.code,
        vaccine_name: template.vaccineName,
        target_disease: template.targetDisease,
        dose_number: template.doseNumber,
        age_milestone_months: template.ageMilestoneMonths,
        scheduled_date: scheduledDate,
        administered_date: administeredDate,
        batch_number: `EG-MOH-${Math.floor(10000 + Math.random() * 90000)}`,
        administered_by: 'مكتب صحة التجمع الخامس - القاهرة',
        notes: template.notes,
      });

      created.push(record);
    }
  }

  return created;
}
