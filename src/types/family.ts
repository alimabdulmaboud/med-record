export type FamilyRole = 'manager' | 'viewer';

export type Sex = 'male' | 'female';

export type BloodType =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-'
  | 'unknown';

export interface Family {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: FamilyRole;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  family_id: string;
  name: string;
  birth_date: string;
  sex: Sex;
  blood_type: BloodType;
  allergies: string[];
  chronic_conditions: string[];
  notes?: string | null;
  phone_number?: string | null;
  linked_user_id?: string | null;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmergencyContact {
  id: string;
  person_id: string;
  name: string;
  relationship: string;
  phone: string;
  is_primary: boolean;
  created_at: string;
}

export interface ViewerGrant {
  id: string;
  family_member_id: string;
  person_id: string;
  expires_at: string;
  revoked_at?: string | null;
  created_at: string;
}

export type AuditAction =
  | 'person_read'
  | 'person_created'
  | 'person_updated'
  | 'person_archived'
  | 'person_restored'
  | 'grant_created'
  | 'grant_revoked'
  | 'data_exported'
  | 'account_deleted';

export interface AuditLogEntry {
  id: string;
  actor_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id?: string | null;
  family_id?: string | null;
  person_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Consent {
  id: string;
  user_id: string;
  type: string;
  version: string;
  accepted_at: string;
  user_agent?: string | null;
  ip_hash?: string | null;
}

export interface CreatePersonInput {
  name: string;
  birth_date: string;
  sex: Sex;
  blood_type?: BloodType;
  allergies?: string[];
  chronic_conditions?: string[];
  notes?: string;
  phone_number?: string;
  linked_user_id?: string;
  emergency_contacts?: Omit<EmergencyContact, 'id' | 'person_id' | 'created_at'>[];
}

export interface UpdatePersonInput extends Partial<CreatePersonInput> {
  archived_at?: string | null;
}
