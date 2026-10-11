import { coreModule } from "./core";
import { pediatricsModule } from "./pediatrics";
import { nutritionModule } from "./nutrition";

export type ModuleId = "core" | "pediatrics" | "nutrition";

export interface SpecialtyModule {
  id: ModuleId;
  name: {
    ar: string;
    en: string;
  };
  description: {
    ar: string;
    en: string;
  };
  isCore: boolean;
  settingKey: string | null;
}

/**
 * Registry of all available specialty modules in Med SaaS.
 * Core is always present; specialty modules are enabled per clinic.
 */
export const MODULE_REGISTRY: Record<ModuleId, SpecialtyModule> = {
  core: coreModule,
  pediatrics: pediatricsModule,
  nutrition: nutritionModule,
};

/**
 * Returns an array of all registered modules.
 */
export function getAllModules(): SpecialtyModule[] {
  return Object.values(MODULE_REGISTRY);
}

/**
 * Get module by ID.
 */
export function getModuleById(id: ModuleId): SpecialtyModule | undefined {
  return MODULE_REGISTRY[id];
}

/**
 * Checks whether a module is enabled for a clinic given its enabled_modules array.
 * Core is ALWAYS enabled regardless of clinic settings.
 */
export function isModuleEnabled(
  moduleId: ModuleId,
  enabledModuleIds: string[] = []
): boolean {
  if (moduleId === "core") {
    return true;
  }
  return enabledModuleIds.includes(moduleId);
}

/**
 * Returns all active modules for a clinic.
 */
export function getActiveModulesForClinic(
  enabledModuleIds: string[] = []
): SpecialtyModule[] {
  return getAllModules().filter((mod) =>
    isModuleEnabled(mod.id, enabledModuleIds)
  );
}
