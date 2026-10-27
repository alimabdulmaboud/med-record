import type { MeasurementType, MeasurementValues } from '@/types/med-record';

export type VitalSeverity = 'normal' | 'low' | 'high' | 'critical';

export interface VitalEvaluation {
  isAbnormal: boolean;
  severity: VitalSeverity;
  labelAr: string;
  labelEn: string;
  normalRange: string;
  adviceAr?: string;
}

export function evaluateVitalMeasurement(
  type: MeasurementType,
  values: MeasurementValues
): VitalEvaluation {
  switch (type) {
    case 'blood_pressure': {
      const sys = values.systolic ?? 120;
      const dia = values.diastolic ?? 80;

      if (sys >= 180 || dia >= 120) {
        return {
          isAbnormal: true,
          severity: 'critical',
          labelAr: 'أزمة ارتفاع ضغط دم (طارئ)',
          labelEn: 'Hypertensive Crisis',
          normalRange: '< 120 / < 80 mmHg',
          adviceAr: 'يرجى مراجعة الطوارئ أو الطبيب فوراً',
        };
      }
      if (sys >= 140 || dia >= 90) {
        return {
          isAbnormal: true,
          severity: 'high',
          labelAr: 'ضغط دم مرتفع (المرحلة 2)',
          labelEn: 'Stage 2 Hypertension',
          normalRange: '< 120 / < 80 mmHg',
        };
      }
      if (sys >= 130 || dia >= 80) {
        return {
          isAbnormal: true,
          severity: 'high',
          labelAr: 'ضغط دم مرتفع (المرحلة 1)',
          labelEn: 'Stage 1 Hypertension',
          normalRange: '< 120 / < 80 mmHg',
        };
      }
      if (sys >= 120 && dia < 80) {
        return {
          isAbnormal: false,
          severity: 'normal',
          labelAr: 'ضغط دم مرتفع طفيفاً',
          labelEn: 'Elevated Blood Pressure',
          normalRange: '< 120 / < 80 mmHg',
        };
      }
      if (sys < 90 || dia < 60) {
        return {
          isAbnormal: true,
          severity: 'low',
          labelAr: 'ضغط دم منخفض',
          labelEn: 'Low Blood Pressure',
          normalRange: '90-120 / 60-80 mmHg',
        };
      }
      return {
        isAbnormal: false,
        severity: 'normal',
        labelAr: 'ضغط دم طبيعي ومثالي',
        labelEn: 'Normal Blood Pressure',
        normalRange: '90-120 / 60-80 mmHg',
      };
    }

    case 'blood_sugar': {
      const glucose = values.glucose ?? values.value ?? 100;
      const context = values.context || 'random';

      if (context === 'hba1c') {
        const hba1c = glucose; // e.g. 5.6 or 7.2
        if (hba1c >= 6.5) {
          return {
            isAbnormal: true,
            severity: 'high',
            labelAr: 'تراكمي مرتفع (نطاق السكري)',
            labelEn: 'Diabetes range',
            normalRange: '< 5.7%',
          };
        }
        if (hba1c >= 5.7) {
          return {
            isAbnormal: true,
            severity: 'high',
            labelAr: 'مرحلة ما قبل السكري',
            labelEn: 'Prediabetes range',
            normalRange: '< 5.7%',
          };
        }
        return {
          isAbnormal: false,
          severity: 'normal',
          labelAr: 'تراكمي طبيعي',
          labelEn: 'Normal HbA1c',
          normalRange: '< 5.7%',
        };
      }

      if (context === 'fasting') {
        if (glucose >= 126) {
          return {
            isAbnormal: true,
            severity: 'high',
            labelAr: 'سكر صائم مرتفع (نطاق السكري)',
            labelEn: 'High Fasting Blood Sugar',
            normalRange: '70 - 99 mg/dL',
          };
        }
        if (glucose >= 100) {
          return {
            isAbnormal: true,
            severity: 'high',
            labelAr: 'سكر صائم مرحلة ما قبل السكري',
            labelEn: 'Prediabetic Fasting Sugar',
            normalRange: '70 - 99 mg/dL',
          };
        }
        if (glucose < 70) {
          return {
            isAbnormal: true,
            severity: 'critical',
            labelAr: 'هبوط حاد في مستوى السكر',
            labelEn: 'Hypoglycemia',
            normalRange: '70 - 99 mg/dL',
            adviceAr: 'تناول عصير سكري فوراً واعد القياس بعد 15 دقيقة',
          };
        }
        return {
          isAbnormal: false,
          severity: 'normal',
          labelAr: 'سكر صائم طبيعي',
          labelEn: 'Normal Fasting Blood Sugar',
          normalRange: '70 - 99 mg/dL',
        };
      }

      // Random or post-meal
      if (glucose >= 200) {
        return {
          isAbnormal: true,
          severity: 'high',
          labelAr: 'سكر مرتفع بعد الأكل',
          labelEn: 'High Post-prandial Glucose',
          normalRange: '< 140 mg/dL',
        };
      }
      if (glucose >= 140) {
        return {
          isAbnormal: true,
          severity: 'high',
          labelAr: 'سكر بعد الأكل فوق الطبيعي',
          labelEn: 'Elevated Post-prandial Glucose',
          normalRange: '< 140 mg/dL',
        };
      }
      if (glucose < 70) {
        return {
          isAbnormal: true,
          severity: 'critical',
          labelAr: 'هبوط في مستوى السكر',
          labelEn: 'Low Blood Sugar',
          normalRange: '70 - 140 mg/dL',
        };
      }
      return {
        isAbnormal: false,
        severity: 'normal',
        labelAr: 'مستوى سكر طبيعي',
        labelEn: 'Normal Glucose',
        normalRange: '70 - 140 mg/dL',
      };
    }

    case 'oxygen_saturation': {
      const spo2 = values.value ?? 98;
      if (spo2 < 92) {
        return {
          isAbnormal: true,
          severity: 'critical',
          labelAr: 'نقص أكسجين حاد',
          labelEn: 'Severe Hypoxemia',
          normalRange: '95 - 100%',
          adviceAr: 'يرجى مراجعة الطوارئ فوراً أو استخدام جلسة أكسجين',
        };
      }
      if (spo2 < 95) {
        return {
          isAbnormal: true,
          severity: 'high',
          labelAr: 'نسبة أكسجين منخفضة طفيفاً',
          labelEn: 'Mild Hypoxemia',
          normalRange: '95 - 100%',
        };
      }
      return {
        isAbnormal: false,
        severity: 'normal',
        labelAr: 'نسبة أكسجين ممتازة',
        labelEn: 'Normal Oxygen Saturation',
        normalRange: '95 - 100%',
      };
    }

    case 'heart_rate': {
      const hr = values.value ?? 75;
      if (hr > 100) {
        return {
          isAbnormal: true,
          severity: 'high',
          labelAr: 'تسارع في ضربات القلب',
          labelEn: 'Tachycardia',
          normalRange: '60 - 100 bpm',
        };
      }
      if (hr < 50) {
        return {
          isAbnormal: true,
          severity: 'low',
          labelAr: 'تباطؤ في ضربات القلب',
          labelEn: 'Bradycardia',
          normalRange: '60 - 100 bpm',
        };
      }
      return {
        isAbnormal: false,
        severity: 'normal',
        labelAr: 'نبض طبيعي',
        labelEn: 'Normal Heart Rate',
        normalRange: '60 - 100 bpm',
      };
    }

    case 'temperature': {
      const temp = values.value ?? 37;
      if (temp >= 38.5) {
        return {
          isAbnormal: true,
          severity: 'critical',
          labelAr: 'حمى وارتفاع شديد في الحرارة',
          labelEn: 'High Fever',
          normalRange: '36.5 - 37.5 °C',
        };
      }
      if (temp > 37.5) {
        return {
          isAbnormal: true,
          severity: 'high',
          labelAr: 'سخونية وحرارة مرتفعة',
          labelEn: 'Fever',
          normalRange: '36.5 - 37.5 °C',
        };
      }
      if (temp < 35.5) {
        return {
          isAbnormal: true,
          severity: 'low',
          labelAr: 'انخفاض في درجة الحرارة',
          labelEn: 'Hypothermia',
          normalRange: '36.5 - 37.5 °C',
        };
      }
      return {
        isAbnormal: false,
        severity: 'normal',
        labelAr: 'حرارة طبيعية',
        labelEn: 'Normal Temperature',
        normalRange: '36.5 - 37.5 °C',
      };
    }

    default:
      return {
        isAbnormal: false,
        severity: 'normal',
        labelAr: 'قياس مسجل',
        labelEn: 'Recorded',
        normalRange: '',
      };
  }
}
