export interface PediatricsModuleConfig {
  id: "pediatrics";
  growthChartsStandard: "WHO" | "CDC";
  enableVaccinations: boolean;
}

export const pediatricsModule = {
  id: "pediatrics" as const,
  name: {
    ar: "وحدة طب الأطفال",
    en: "Pediatrics",
  },
  description: {
    ar: "منحنيات النمو (منظمة الصحة العالمية)، جدول التطعيمات، وتاريخ الولادة والتغذية",
    en: "WHO growth curves, vaccination schedule, birth and infant feeding history",
  },
  isCore: false,
  settingKey: "pediatrics",
};
