import type { AuditAction } from "@/types/family";

// Strict blacklist of clinical/health fields that must NEVER appear in audit logs
const PROHIBITED_HEALTH_KEYS = new Set([
  "allergies",
  "chronic_conditions",
  "notes",
  "blood_type",
  "medications",
  "measurements",
  "diagnosis",
  "symptoms",
  "prescription",
  "treatment",
  "values",
  "lab_results",
  "vitals",
  "complaint",
  "history",
]);

/**
 * Sanitizes metadata before writing to audit_log.
 * Drops all clinical, health, diagnostic, and note values.
 */
export function sanitizeAuditMetadata(
  metadata: Record<string, any>
): Record<string, any> {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }

  const sanitized: Record<string, any> = {};

  for (const [key, val] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    if (PROHIBITED_HEALTH_KEYS.has(lowerKey)) {
      continue;
    }

    if (val && typeof val === "object" && !Array.isArray(val)) {
      sanitized[key] = sanitizeAuditMetadata(val);
    } else {
      sanitized[key] = val;
    }
  }

  return sanitized;
}

export interface LogFamilyAuditParams {
  actorId: string;
  action: AuditAction;
  personId?: string | null;
  familyId?: string | null;
  entityType?: string;
  metadata?: Record<string, any>;
}

export function createAuditLogger(supabaseClient: any) {
  return {
    async logEvent(params: LogFamilyAuditParams): Promise<void> {
      const sanitizedMeta = sanitizeAuditMetadata(params.metadata || {});
      const entityId = params.personId || params.familyId || null;

      try {
        await supabaseClient.from("audit_log").insert({
          actor_id: params.actorId,
          action: params.action,
          entity_type: params.entityType || "person",
          entity_id: entityId,
          person_id: params.personId || null,
          family_id: params.familyId || null,
          metadata: sanitizedMeta,
        });
      } catch (err) {
        // Fail silently or record operational error without leaking payload
        console.error("Audit log write error:", (err as Error).message);
      }
    },
  };
}
