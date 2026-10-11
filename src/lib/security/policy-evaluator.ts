import fs from "fs";
import path from "path";

export interface ParsedTable {
  name: string;
  hasRLS: boolean;
  policies: ParsedPolicy[];
  hasPreventMutationTrigger: boolean;
}

export interface ParsedPolicy {
  name: string;
  table: string;
  command: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "ALL";
  roles: string[];
  usingClause?: string;
  withCheckClause?: string;
}

/**
 * Parses Supabase SQL migrations to verify RLS configurations and security policies statically.
 */
export function parseMigrationSecurity(migrationSql: string): {
  tables: Map<string, ParsedTable>;
  triggers: string[];
} {
  const tables = new Map<string, ParsedTable>();
  const triggers: string[] = [];

  // Match CREATE TABLE public.<name>
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.([a-zA-Z0-9_]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = createTableRegex.exec(migrationSql)) !== null) {
    const tableName = match[1];
    tables.set(tableName, {
      name: tableName,
      hasRLS: false,
      policies: [],
      hasPreventMutationTrigger: false,
    });
  }

  // Match ALTER TABLE public.<name> ENABLE ROW LEVEL SECURITY
  const rlsRegex = /ALTER\s+TABLE\s+public\.([a-zA-Z0-9_]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;
  while ((match = rlsRegex.exec(migrationSql)) !== null) {
    const tableName = match[1];
    const table = tables.get(tableName);
    if (table) {
      table.hasRLS = true;
    }
  }

  // Match CREATE TRIGGER trg_prevent_audit_log_mutation
  const triggerRegex = /CREATE\s+TRIGGER\s+([a-zA-Z0-9_]+)\s+(?:BEFORE|AFTER)\s+(UPDATE|DELETE|INSERT)/gi;
  while ((match = triggerRegex.exec(migrationSql)) !== null) {
    triggers.push(match[1]);
    if (migrationSql.includes("trg_prevent_audit_log_mutation ON public.audit_log")) {
      const auditTable = tables.get("audit_log");
      if (auditTable) {
        auditTable.hasPreventMutationTrigger = true;
      }
    }
  }

  // Match CREATE POLICY
  const policyRegex =
    /CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+public\.([a-zA-Z0-9_]+)\s+FOR\s+([A-Z]+)\s+TO\s+([a-zA-Z0-9_]+)/gi;
  while ((match = policyRegex.exec(migrationSql)) !== null) {
    const policyName = match[1];
    const tableName = match[2];
    const command = match[3] as any;
    const roleTarget = match[4];

    const table = tables.get(tableName);
    if (table) {
      table.policies.push({
        name: policyName,
        table: tableName,
        command,
        roles: [roleTarget],
      });
    }
  }

  return { tables, triggers };
}

/**
 * Loads and parses the latest security migrations from the supabase/migrations folder.
 */
export function loadSecurityMigration(): {
  tables: Map<string, ParsedTable>;
  triggers: string[];
} {
  const migrationsDir = path.resolve(process.cwd(), "supabase", "migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
  let combinedSql = "";

  for (const file of files) {
    combinedSql += "\n" + fs.readFileSync(path.join(migrationsDir, file), "utf-8");
  }

  return parseMigrationSecurity(combinedSql);
}
