export interface CoreModuleConfig {
  id: "core";
  isCore: true;
}

export const coreModule = {
  id: "core" as const,
  name: {
    ar: "النواة المشتركة",
    en: "Shared Core",
  },
  description: {
    ar: "الوظائف الأساسية لجميع العيادات: الحجز، الطابور، الكشف الطبي العام، والروشتة",
    en: "Foundational features for all clinics: booking, queue, consultation, and prescription",
  },
  isCore: true,
  settingKey: null, // Core is always active and cannot be disabled
};
