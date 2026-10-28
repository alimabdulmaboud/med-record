import type { Person } from '@/types/family';
import type { MeasurementType, MeasurementValues } from '@/types/measurements';
import { calculatePersonAge } from '@/lib/family/service';

export interface QuickLogDefaults {
  defaultType: MeasurementType;
  availableTypes: MeasurementType[];
}

export interface ValidationResult {
  isValid: boolean;
  values?: MeasurementValues;
  errorAr?: string;
}

export function getQuickLogDefaults(person: Person): QuickLogDefaults {
  const age = calculatePersonAge(person.birth_date);
  if (age.isChild) {
    return {
      defaultType: 'growth_entry',
      availableTypes: [
        'growth_entry',
        'temperature',
        'heart_rate',
        'spo2',
        'weight',
        'height',
        'head_circumference',
      ],
    };
  }

  return {
    defaultType: 'blood_pressure',
    availableTypes: [
      'blood_pressure',
      'blood_glucose',
      'heart_rate',
      'spo2',
      'temperature',
      'weight',
      'height',
    ],
  };
}

export function validateQuickLogValues(
  type: MeasurementType,
  raw: Record<string, string | number | undefined>
): ValidationResult {
  switch (type) {
    case 'blood_pressure': {
      const sys = Number(raw.systolic);
      const dia = Number(raw.diastolic);
      if (isNaN(sys) || isNaN(dia) || sys < 60 || sys > 260 || dia < 40 || dia > 160) {
        return {
          isValid: false,
          errorAr: 'يرجى إدخال قيم ضغط دم منطقية (الانقباضي 60-260، الانبساطي 40-160)',
        };
      }
      return {
        isValid: true,
        values: { systolic: sys, diastolic: dia },
      };
    }

    case 'blood_glucose': {
      const val = Number(raw.glucose);
      const context = (raw.meal_context as any) || 'random';
      if (isNaN(val) || val < 20 || val > 600) {
        return {
          isValid: false,
          errorAr: 'يرجى إدخال قيمة سكر منطقية بين 20 و 600 mg/dL',
        };
      }
      return {
        isValid: true,
        values: { glucose: val, meal_context: context },
      };
    }

    case 'heart_rate': {
      const val = Number(raw.heart_rate ?? raw.value);
      if (isNaN(val) || val < 30 || val > 240) {
        return {
          isValid: false,
          errorAr: 'يرجى إدخال نبض منطقي بين 30 و 240 نبضة/دقيقة',
        };
      }
      return {
        isValid: true,
        values: { heart_rate: val },
      };
    }

    case 'spo2': {
      const val = Number(raw.spo2 ?? raw.value);
      if (isNaN(val) || val < 50 || val > 100) {
        return {
          isValid: false,
          errorAr: 'يرجى إدخال نسبة أكسجين بين 50% و 100%',
        };
      }
      return {
        isValid: true,
        values: { spo2: val },
      };
    }

    case 'temperature': {
      const val = Number(raw.temperature_c ?? raw.value);
      if (isNaN(val) || val < 34 || val > 43) {
        return {
          isValid: false,
          errorAr: 'يرجى إدخال حرارة منطقية بين 34 و 43 درجة مئوية',
        };
      }
      return {
        isValid: true,
        values: { temperature_c: val },
      };
    }

    case 'weight': {
      const val = Number(raw.weight_kg ?? raw.value);
      if (isNaN(val) || val < 1 || val > 300) {
        return {
          isValid: false,
          errorAr: 'يرجى إدخال وزن منطقي بالكيلوجرام (1-300)',
        };
      }
      return {
        isValid: true,
        values: { weight_kg: val },
      };
    }

    case 'height': {
      const val = Number(raw.height_cm ?? raw.value);
      if (isNaN(val) || val < 30 || val > 250) {
        return {
          isValid: false,
          errorAr: 'يرجى إدخال طول منطقي بالسنتيمتر (30-250)',
        };
      }
      return {
        isValid: true,
        values: { height_cm: val },
      };
    }

    case 'head_circumference': {
      const val = Number(raw.head_circumference_cm ?? raw.value);
      if (isNaN(val) || val < 20 || val > 70) {
        return {
          isValid: false,
          errorAr: 'يرجى إدخال محيط رأس منطقي بالسنتيمتر (20-70)',
        };
      }
      return {
        isValid: true,
        values: { head_circumference_cm: val },
      };
    }

    case 'growth_entry': {
      const w = raw.weight_kg !== undefined && raw.weight_kg !== '' ? Number(raw.weight_kg) : undefined;
      const h = raw.height_cm !== undefined && raw.height_cm !== '' ? Number(raw.height_cm) : undefined;
      const hc = raw.head_circumference_cm !== undefined && raw.head_circumference_cm !== '' ? Number(raw.head_circumference_cm) : undefined;

      if (w === undefined && h === undefined && hc === undefined) {
        return {
          isValid: false,
          errorAr: 'يرجى إدخال قياس واحد على الأقل (الوزن أو الطول أو محيط الرأس)',
        };
      }

      if (w !== undefined && (w < 0.5 || w > 150)) {
        return { isValid: false, errorAr: 'قيمة الوزن غير منطقية' };
      }
      if (h !== undefined && (h < 20 || h > 220)) {
        return { isValid: false, errorAr: 'قيمة الطول غير منطقية' };
      }
      if (hc !== undefined && (hc < 20 || hc > 65)) {
        return { isValid: false, errorAr: 'قيمة محيط الرأس غير منطقية' };
      }

      return {
        isValid: true,
        values: {
          weight_kg: w,
          height_cm: h,
          head_circumference_cm: hc,
        },
      };
    }

    default:
      return { isValid: false, errorAr: 'نوع القياس غير مدعوم' };
  }
}
