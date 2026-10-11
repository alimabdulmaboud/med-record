export type UserRole = "platform_admin" | "clinic_owner" | "doctor" | "receptionist";

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export interface InvitationRecord {
  id: string;
  email: string;
  clinic_id: string;
  roles: UserRole[];
  token: string;
  invited_by: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInvitationInput {
  email: string;
  clinicId: string;
  roles: UserRole[];
  actor: {
    id: string;
    clinicId: string | null;
    roles: UserRole[];
  };
}

export interface AcceptInvitationInput {
  token: string;
  fullName: string;
  password: string;
  phone?: string;
}

export interface AuditLogEntry {
  id?: string;
  clinic_id: string | null;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_state?: Record<string, any> | null;
  after_state?: Record<string, any> | null;
  metadata?: Record<string, any>;
  created_at?: string;
}

export type InvitationErrorCode =
  | "NOT_FOUND"
  | "EXPIRED"
  | "REVOKED"
  | "ALREADY_ACCEPTED"
  | "TENANT_MISMATCH"
  | "INSUFFICIENT_PERMISSIONS"
  | "INVALID_INPUT";
