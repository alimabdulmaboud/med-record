import { z } from "zod";

export const DoctorLetterheadSchema = z.object({
  name: z.string().min(2, "اسم الطبيب مطلوب"),
  title: z.string().min(2, "اللقب المهني مطلوب"),
  specialty: z.string().min(2, "التخصص مطلوب"),
});

export const ClinicSettingsSchema = z.object({
  name: z.string().min(2, "اسم العيادة يجب ألا يقل عن حرفين"),
  letterhead: z.object({
    address: z.string().default(""),
    phone: z.string().default(""),
    logo_url: z.string().nullable().optional(),
    doctors: z.array(DoctorLetterheadSchema).default([]),
  }),
  consultation_prices: z.object({
    new: z.number().nonnegative("سعر الكشف الجديد يجب ألا يكون سالباً").default(300),
    follow_up: z.number().nonnegative("سعر الاستشارة يجب ألا يكون سالباً").default(150),
    quick_consult: z.number().nonnegative("سعر الكشف السريع يجب ألا يكون سالباً").default(100),
  }),
  enabled_modules: z.array(z.enum(["pediatrics", "nutrition"])).default([]),
  queue: z.object({
    arrive_before_minutes: z
      .number()
      .int()
      .min(0, "المهلة لا يمكن أن تكون سالبة")
      .max(120, "المهلة لا يمكن أن تتجاوز 120 دقيقة")
      .default(15),
    skip_alert_minutes: z
      .number()
      .int()
      .min(10, "تنبيه التخطي لا يمكن أن يقل عن 10 دقائق")
      .max(300, "تنبيه التخطي لا يمكن أن يتجاوز 300 دقيقة")
      .default(60),
    urgent_enabled: z.boolean().default(false),
    urgent_fee_multiplier: z
      .number()
      .min(1, "مضاعف رسوم المستعجل يجب ألا يقل عن 1")
      .max(10, "مضاعف رسوم المستعجل يجب ألا يتجاوز 10")
      .default(3),
    end_of_day_time: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "صيغة الوقت يجب أن تكون HH:MM (مثال 22:00)")
      .default("22:00"),
  }),
});

export type ClinicSettings = z.infer<typeof ClinicSettingsSchema>;
export type DoctorLetterhead = z.infer<typeof DoctorLetterheadSchema>;
