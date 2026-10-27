import type { FamilyRole } from "@/types/family";

export interface FamilyMemberRecord {
  id: string;
  family_id: string;
  user_id: string;
  role: FamilyRole;
}

export interface PersonRecord {
  id: string;
  family_id: string;
  name: string;
  archived_at: string | Date | null;
}

export interface ViewerGrantRecord {
  id: string;
  family_member_id: string;
  person_id: string;
  expires_at: Date;
  revoked_at: Date | null;
}

export interface RLSContext {
  currentUserId: string;
  members: FamilyMemberRecord[];
  grants: ViewerGrantRecord[];
  now?: Date;
}

export function isFamilyManager(ctx: RLSContext, familyId: string): boolean {
  return ctx.members.some(
    (m) =>
      m.family_id === familyId &&
      m.user_id === ctx.currentUserId &&
      m.role === "manager"
  );
}

export function isFamilyMember(ctx: RLSContext, familyId: string): boolean {
  return ctx.members.some(
    (m) => m.family_id === familyId && m.user_id === ctx.currentUserId
  );
}

export function hasActiveViewerGrant(ctx: RLSContext, personId: string): boolean {
  const currentTime = ctx.now || new Date();
  return ctx.grants.some((g) => {
    if (g.person_id !== personId) return false;
    if (g.revoked_at !== null) return false;
    if (g.expires_at.getTime() <= currentTime.getTime()) return false;

    // Check that family_member belongs to current user with role viewer
    const member = ctx.members.find((m) => m.id === g.family_member_id);
    return member && member.user_id === ctx.currentUserId && member.role === "viewer";
  });
}

export interface EvaluateRLSParams {
  context: RLSContext;
  action: "SELECT" | "INSERT" | "UPDATE" | "DELETE";
  table: "families" | "family_members" | "people" | "emergency_contacts" | "viewer_grants" | "audit_log" | "consents";
  record: any;
}

export function evaluateFamilyRLS(params: EvaluateRLSParams): boolean {
  const { context, action, table, record } = params;

  if (table === "people") {
    if (action === "SELECT") {
      return (
        isFamilyManager(context, record.family_id) ||
        hasActiveViewerGrant(context, record.id)
      );
    }
    if (action === "INSERT" || action === "UPDATE" || action === "DELETE") {
      return isFamilyManager(context, record.family_id);
    }
  }

  if (table === "families") {
    if (action === "SELECT") {
      return isFamilyMember(context, record.id);
    }
    if (action === "INSERT") {
      return Boolean(context.currentUserId);
    }
    if (action === "UPDATE" || action === "DELETE") {
      return isFamilyManager(context, record.id);
    }
  }

  if (table === "family_members") {
    if (action === "SELECT") {
      return isFamilyMember(context, record.family_id);
    }
    if (action === "INSERT") {
      return isFamilyManager(context, record.family_id) || record.user_id === context.currentUserId;
    }
    if (action === "UPDATE" || action === "DELETE") {
      return isFamilyManager(context, record.family_id);
    }
  }

  if (table === "audit_log") {
    if (action === "SELECT") {
      return (
        record.actor_id === context.currentUserId ||
        (record.family_id && isFamilyManager(context, record.family_id))
      );
    }
    if (action === "INSERT") {
      return record.actor_id === context.currentUserId;
    }
    if (action === "UPDATE" || action === "DELETE") {
      return false; // Denied to everyone
    }
  }

  if (table === "consents") {
    if (action === "SELECT" || action === "INSERT") {
      return record.user_id === context.currentUserId;
    }
    return false; // Immutable
  }

  return false;
}
