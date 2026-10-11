import { UserRole } from "../invitations/types";

export type Sex = "male" | "female";

export interface Patient {
  id: string;
  clinic_id: string;
  name: string;
  date_of_birth: string;
  sex: Sex;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
  archived_by?: string | null;
}

export interface Guardian {
  id: string;
  clinic_id: string;
  name: string;
  phone: string;
  relation_notes?: string | null;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
  archived_by?: string | null;
}

export interface PatientGuardianLink {
  id: string;
  clinic_id: string;
  patient_id: string;
  guardian_id: string;
  relationship: string;
  is_primary: boolean;
  created_at: string;
}

export interface PatientSearchResult {
  id: string;
  name: string;
  dateOfBirth: string;
  sex: Sex;
  ageFormatted: string;
  primaryGuardian: {
    id: string;
    name: string;
    phone: string;
    relationship: string;
  } | null;
  siblingsCount: number;
}

export interface RegisterPatientInput {
  patient: {
    name: string;
    dateOfBirth: string;
    sex: Sex;
    notes?: string;
  };
  guardian: {
    id?: string; // If linking to an existing discovered guardian
    name: string;
    phone: string;
    relationNotes?: string;
    relationship?: string;
  };
  allowDuplicate?: boolean;
  actor: {
    id: string;
    clinicId: string;
    roles: UserRole[];
  };
}
