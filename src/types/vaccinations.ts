/**
 * Types for Phase 5: Childhood Vaccination Tracker (Med Record)
 */

export type VaccinationStatus = 'completed' | 'pending' | 'overdue';

export interface PersonVaccination {
  id: string;
  family_id: string;
  person_id: string;
  vaccine_code: string;
  vaccine_name: string;
  target_disease: string;
  dose_number: number;
  age_milestone_months: number;
  scheduled_date: string; // YYYY-MM-DD
  administered_date?: string | null; // YYYY-MM-DD
  status: VaccinationStatus;
  batch_number?: string | null;
  administered_by?: string | null;
  notes?: string | null;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVaccinationInput {
  family_id: string;
  person_id: string;
  vaccine_code: string;
  vaccine_name: string;
  target_disease: string;
  dose_number?: number;
  age_milestone_months?: number;
  scheduled_date: string;
  administered_date?: string;
  status?: VaccinationStatus;
  batch_number?: string;
  administered_by?: string;
  notes?: string;
}

export interface UpdateVaccinationInput {
  administered_date?: string | null;
  status?: VaccinationStatus;
  batch_number?: string | null;
  administered_by?: string | null;
  notes?: string | null;
}
