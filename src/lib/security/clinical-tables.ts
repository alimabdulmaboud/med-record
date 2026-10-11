/**
 * Authoritative registry of clinical tables in Med SaaS.
 * 
 * Non-negotiable Rule #2 (AGENTS.md):
 * "Medical privacy. platform_admin and receptionist must never be able to read clinical data.
 *  Keep the 'clinical tables' list in code up to date; every new clinical table is added to it
 *  and covered by the RLS tests."
 * 
 * In Phase 9, all core clinical tables are activated and covered by RLS verification tests.
 */
export const CLINICAL_TABLES: readonly string[] = [
  // Core Clinical Tables (Phase 9)
  "visits",
  "visit_notes",
  "measurements",
  "allergies",
  "medical_history",
  "prescriptions",
  "prescription_items",
  "lab_orders",
  "lab_results",
  "clinical_templates",

  // Pediatrics Specialty Tables (Phase 11)
  "birth_history",
  "feeding_history",
  "vaccine_templates",
  "vaccinations",
  "milestones",
  "pediatric_exams",

  // Nutrition Specialty Tables (Phase 12)
  "nutrition_assessments",
  "anthropometry",
  "body_composition",
  "energy_plans",
  "diet_history",
  "meal_plans",
  "meal_plan_templates",
] as const;

/**
 * Returns true if a table is classified as containing medical/clinical data.
 */
export function isClinicalTable(tableName: string): boolean {
  return CLINICAL_TABLES.includes(tableName as any);
}
