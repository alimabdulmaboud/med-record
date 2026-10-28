/**
 * Types for Phase 4: Medications Regimen & Doctor Visits Journal (Med Record)
 */

export type MedicationStatus = 'active' | 'paused' | 'completed';

export interface PersonMedication {
  id: string;
  family_id: string;
  person_id: string;
  name: string;
  dose: string;
  frequency: string;
  timing_notes?: string | null;
  start_date: string; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD
  status: MedicationStatus;
  reminder_enabled: boolean;
  reminder_time?: string | null; // HH:MM
  prescribed_by?: string | null;
  notes?: string | null;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMedicationInput {
  family_id: string;
  person_id: string;
  name: string;
  dose: string;
  frequency: string;
  timing_notes?: string;
  start_date?: string;
  end_date?: string;
  status?: MedicationStatus;
  reminder_enabled?: boolean;
  reminder_time?: string;
  prescribed_by?: string;
  notes?: string;
}

export interface UpdateMedicationInput {
  name?: string;
  dose?: string;
  frequency?: string;
  timing_notes?: string | null;
  start_date?: string;
  end_date?: string | null;
  status?: MedicationStatus;
  reminder_enabled?: boolean;
  reminder_time?: string | null;
  prescribed_by?: string | null;
  notes?: string | null;
}

export interface PersonEncounter {
  id: string;
  family_id: string;
  person_id: string;
  visit_date: string; // YYYY-MM-DD
  doctor_name: string;
  specialty: string;
  facility_name?: string | null;
  chief_complaint?: string | null;
  diagnosis?: string | null;
  notes?: string | null;
  follow_up_date?: string | null; // YYYY-MM-DD
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEncounterInput {
  family_id: string;
  person_id: string;
  visit_date?: string;
  doctor_name: string;
  specialty: string;
  facility_name?: string;
  chief_complaint?: string;
  diagnosis?: string;
  notes?: string;
  follow_up_date?: string;
}

export interface UpdateEncounterInput {
  visit_date?: string;
  doctor_name?: string;
  specialty?: string;
  facility_name?: string | null;
  chief_complaint?: string | null;
  diagnosis?: string | null;
  notes?: string | null;
  follow_up_date?: string | null;
}
