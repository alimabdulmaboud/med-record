/**
 * Types for Phase 6: Bilingual Doctor Report Generator & Expiring Share Links (Med Record)
 */

import type { Person } from './family';
import type { PersonMeasurement } from './measurements';
import type { PersonMedication } from './medications-encounters';
import type { PersonEncounter } from './medications-encounters';
import type { PersonDocument } from './documents';
import type { ScheduledVaccine, VaccinationStats } from '@/lib/family/vaccinations-service';

export type ReportSectionId =
  | 'vitals'
  | 'growth'
  | 'medications'
  | 'allergies'
  | 'labs'
  | 'visits'
  | 'vaccinations';

export interface CompiledDoctorReportPayload {
  title: string;
  generated_at: string;
  person: Person;
  date_range: { from: string; to: string };
  included_sections: ReportSectionId[];
  summary_notes?: string | null;
  has_abnormal_vitals: boolean;
  measurements: PersonMeasurement[];
  medications: PersonMedication[];
  encounters: PersonEncounter[];
  documents: PersonDocument[];
  vaccinations?: {
    stats: VaccinationStats;
    recent: ScheduledVaccine[];
  };
}

export interface DoctorReportEntity {
  id: string;
  family_id: string;
  person_id: string;
  title: string;
  summary_notes?: string | null;
  date_range_from: string;
  date_range_to: string;
  included_sections: ReportSectionId[];
  report_data: CompiledDoctorReportPayload;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportShareEntity {
  id: string;
  family_id: string;
  person_id: string;
  report_id: string;
  access_token: string;
  expires_at: string;
  pin_hash?: string | null;
  access_count: number;
  last_accessed_at?: string | null;
  is_revoked: boolean;
  revoked_at?: string | null;
  created_at: string;
}

export interface CreateDoctorReportInput {
  family_id: string;
  person_id: string;
  title?: string;
  summary_notes?: string;
  date_range_from: string;
  date_range_to: string;
  included_sections?: ReportSectionId[];
}

export interface CreateReportShareInput {
  family_id: string;
  person_id: string;
  report_id: string;
  expires_in_hours?: number; // default 72h
  pin?: string;
}
