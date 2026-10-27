import type { MeasurementType, MeasurementValues } from '@/types/med-record';

export interface ValidationResult {
  isValid: boolean;
  values?: MeasurementValues;
  unit: string;
  errorAr?: string;
  errorEn?: string;
}

export function validateMeasurementInput(
  type: MeasurementType,
  raw: Record<string, string>
): ValidationResult {
  switch (type) {
    case 'blood_pressure': {
      const sys = parseFloat(raw.systolic);
      const dia = parseFloat(raw.diastolic);

      if (isNaN(sys) || isNaN(dia)) {
        return {
          isValid: false,
          unit: 'mmHg',
          errorAr: 'يرجى إدخال الضغط الانقباضي والانبساطي بشكل صحيح',
          errorEn: 'Please enter systolic and diastolic values',
        };
      }
      if (sys < 50 || sys > 260 || dia < 30 || dia > 180) {
        return {
          isValid: false,
          unit: 'mmHg',
          errorAr: 'قيمة ضغط الدم غير منطقية أو خارج النطاق الفسيولوجي الممكن',
          errorEn: 'Blood pressure values out of physiologic range',
        };
      }
      return {
        isValid: true,
        unit: 'mmHg',
        values: { systolic: Math.round(sys), diastolic: Math.round(dia) },
      };
    }

    case 'blood_sugar': {
      const glucose = parseFloat(raw.glucose || raw.value);
      const context = (raw.context as MeasurementValues['context']) || 'random';

      if (isNaN(glucose)) {
        return {
          isValid: false,
          unit: context === 'hba1c' ? '%' : 'mg/dL',
          errorAr: 'يرجى إدخال قيمة السكر بشكل صحيح',
          errorEn: 'Please enter a valid glucose value',
        };
      }

      if (context === 'hba1c') {
        if (glucose < 3 || glucose > 20) {
          return {
            isValid: false,
            unit: '%',
            errorAr: 'قيمة السكر التراكمي غير منطقية (المعدل المعتاد 4% - 15%)',
            errorEn: 'HbA1c value out of realistic range',
          };
        }
        return {
          isValid: true,
          unit: '%',
          values: { glucose: Number(glucose.toFixed(1)), context },
        };
      }

      if (glucose < 20 || glucose > 800) {
        return {
          isValid: false,
          unit: 'mg/dL',
          errorAr: 'قيمة السكر غير منطقية (بين 20 و 800 ملجم/دسل)',
          errorEn: 'Glucose value out of realistic range',
        };
      }
      return {
        isValid: true,
        unit: 'mg/dL',
        values: { glucose: Math.round(glucose), context },
      };
    }

    case 'heart_rate': {
      const hr = parseFloat(raw.value);
      if (isNaN(hr) || hr < 30 || hr > 240) {
        return {
          isValid: false,
          unit: 'bpm',
          errorAr: 'معدل النبض غير منطقي (بين 30 و 240 نبضة/دقيقة)',
          errorEn: 'Heart rate out of range',
        };
      }
      return {
        isValid: true,
        unit: 'bpm',
        values: { value: Math.round(hr) },
      };
    }

    case 'oxygen_saturation': {
      const spo2 = parseFloat(raw.value);
      if (isNaN(spo2) || spo2 < 50 || spo2 > 100) {
        return {
          isValid: false,
          unit: '%',
          errorAr: 'نسبة الأكسجين غير منطقية (بين 50% و 100%)',
          errorEn: 'SpO2 out of range',
        };
      }
      return {
        isValid: true,
        unit: '%',
        values: { value: Math.round(spo2) },
      };
    }

    case 'temperature': {
      const temp = parseFloat(raw.value);
      if (isNaN(temp) || temp < 32 || temp > 43) {
        return {
          isValid: false,
          unit: '°C',
          errorAr: 'درجة الحرارة غير منطقية (بين 32 و 43 مئوية)',
          errorEn: 'Temperature out of range',
        };
      }
      return {
        isValid: true,
        unit: '°C',
        values: { value: Number(temp.toFixed(1)) },
      };
    }

    case 'weight': {
      const wt = parseFloat(raw.value);
      if (isNaN(wt) || wt < 1 || wt > 300) {
        return {
          isValid: false,
          unit: 'kg',
          errorAr: 'الوزن غير منطقي (بين 1 و 300 كجم)',
          errorEn: 'Weight out of range',
        };
      }
      return {
        isValid: true,
        unit: 'kg',
        values: { value: Number(wt.toFixed(2)) },
      };
    }

    case 'height': {
      const ht = parseFloat(raw.value);
      if (isNaN(ht) || ht < 30 || ht > 250) {
        return {
          isValid: false,
          unit: 'cm',
          errorAr: 'الطول غير منطقي (بين 30 و 250 سم)',
          errorEn: 'Height out of range',
        };
      }
      return {
        isValid: true,
        unit: 'cm',
        values: { value: Number(ht.toFixed(1)) },
      };
    }

    case 'head_circumference': {
      const hc = parseFloat(raw.value);
      if (isNaN(hc) || hc < 25 || hc > 65) {
        return {
          isValid: false,
          unit: 'cm',
          errorAr: 'محيط الرأس غير منطقي (بين 25 و 65 سم)',
          errorEn: 'Head circumference out of range',
        };
      }
      return {
        isValid: true,
        unit: 'cm',
        values: { value: Number(hc.toFixed(1)) },
      };
    }

    default:
      return {
        isValid: false,
        unit: '',
        errorAr: 'نوع القياس غير مدعوم',
      };
  }
}

export function formatMeasurementValue(type: MeasurementType, values: MeasurementValues): string {
  if (type === 'blood_pressure') {
    return `${values.systolic || '--'} / ${values.diastolic || '--'} mmHg`;
  }
  if (type === 'blood_sugar') {
    const val = values.glucose ?? values.value ?? '--';
    if (values.context === 'hba1c') return `${val}%`;
    return `${val} mg/dL`;
  }
  if (type === 'temperature') {
    return `${values.value || '--'} °C`;
  }
  if (type === 'oxygen_saturation') {
    return `${values.value || '--'}%`;
  }
  if (type === 'heart_rate') {
    return `${values.value || '--'} bpm`;
  }
  if (type === 'weight') {
    return `${values.value || '--'} kg`;
  }
  if (type === 'height' || type === 'head_circumference') {
    return `${values.value || '--'} cm`;
  }
  return String(values.value ?? '--');
}
