import { describe, it, expect } from "vitest";
import {
  getAllModules,
  getModuleById,
  isModuleEnabled,
  getActiveModulesForClinic,
} from "./registry";

describe("Module Registry", () => {
  it("registers exactly three modules: core, pediatrics, nutrition", () => {
    const modules = getAllModules();
    expect(modules).toHaveLength(3);
    const ids = modules.map((m) => m.id);
    expect(ids).toContain("core");
    expect(ids).toContain("pediatrics");
    expect(ids).toContain("nutrition");
  });

  it("identifies core module as always enabled", () => {
    expect(isModuleEnabled("core", [])).toBe(true);
    expect(isModuleEnabled("core", ["pediatrics"])).toBe(true);
  });

  it("checks optional specialty module activation based on clinic settings", () => {
    expect(isModuleEnabled("pediatrics", [])).toBe(false);
    expect(isModuleEnabled("pediatrics", ["pediatrics"])).toBe(true);
    expect(isModuleEnabled("nutrition", ["pediatrics"])).toBe(false);
    expect(isModuleEnabled("nutrition", ["nutrition"])).toBe(true);
  });

  it("returns active modules list for a clinic correctly", () => {
    // Clinic with only core
    const clinicNone = getActiveModulesForClinic([]);
    expect(clinicNone.map((m) => m.id)).toEqual(["core"]);

    // Pediatrics clinic
    const clinicPeds = getActiveModulesForClinic(["pediatrics"]);
    expect(clinicPeds.map((m) => m.id)).toEqual(["core", "pediatrics"]);

    // Clinic with both pediatrics and nutrition
    const clinicBoth = getActiveModulesForClinic(["pediatrics", "nutrition"]);
    expect(clinicBoth.map((m) => m.id)).toEqual(["core", "pediatrics", "nutrition"]);
  });

  it("finds module by id", () => {
    const peds = getModuleById("pediatrics");
    expect(peds).toBeDefined();
    expect(peds?.name.ar).toBe("وحدة طب الأطفال");
  });
});
