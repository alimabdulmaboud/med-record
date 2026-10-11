export interface NutritionModuleConfig {
  id: "nutrition";
  defaultBmrFormula: "mifflin_st_jeor" | "harris_benedict";
  enableBodyComposition: boolean;
}

export const nutritionModule = {
  id: "nutrition" as const,
  name: {
    ar: "وحدة التغذية العلاجية",
    en: "Clinical Nutrition",
  },
  description: {
    ar: "التقييم الغذائي، القياسات الجسمانية، حساب السعرات، وبناء خطط الوجبات الأسبوعية",
    en: "Nutritional assessment, anthropometry, energy calculation, and weekly meal planning",
  },
  isCore: false,
  settingKey: "nutrition",
};
