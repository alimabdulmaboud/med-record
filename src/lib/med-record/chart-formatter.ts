import { valueAtZScore } from 'who-growth-standards';
import type {
  Measurement,
  GrowthMeasurement,
  MeasurementType,
  Gender,
} from '@/types/med-record';

export interface VitalReferenceBand {
  min: number;
  max: number;
}

export interface VitalReferenceBands {
  systolic?: VitalReferenceBand;
  diastolic?: VitalReferenceBand;
  glucose?: VitalReferenceBand;
  value?: VitalReferenceBand;
}

export function getVitalReferenceBands(
  type: MeasurementType,
  context?: string
): VitalReferenceBands {
  switch (type) {
    case 'blood_pressure':
      return {
        systolic: { min: 90, max: 120 },
        diastolic: { min: 60, max: 80 },
      };
    case 'blood_sugar':
      if (context === 'fasting') {
        return { glucose: { min: 70, max: 99 } };
      }
      return { glucose: { min: 70, max: 140 } };
    case 'oxygen_saturation':
      return { value: { min: 95, max: 100 } };
    case 'heart_rate':
      return { value: { min: 60, max: 100 } };
    case 'temperature':
      return { value: { min: 36.5, max: 37.5 } };
    default:
      return {};
  }
}

export interface TimeSeriesPoint {
  date: string;
  formattedDate: string;
  systolic?: number;
  diastolic?: number;
  glucose?: number;
  value?: number;
  isAbnormal?: boolean;
}

export function formatTimeSeriesChartData(
  type: MeasurementType,
  measurements: Measurement[]
): TimeSeriesPoint[] {
  return measurements
    .filter(m => m.measurementType === type)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    .map(m => {
      const d = new Date(m.recordedAt);
      const formattedDate = `${d.getDate()}/${d.getMonth() + 1}`;

      const point: TimeSeriesPoint = {
        date: m.recordedAt,
        formattedDate,
        isAbnormal: m.isAbnormal,
      };

      if (type === 'blood_pressure') {
        point.systolic = m.values.systolic;
        point.diastolic = m.values.diastolic;
      } else if (type === 'blood_sugar') {
        point.glucose = m.values.glucose ?? m.values.value;
      } else {
        point.value = m.values.value;
      }

      return point;
    });
}

export interface WHOCurvePoint {
  ageMonths: number;
  p3: number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
  patientValue?: number;
}

export function generateWHOGrowthCurveData(
  metric: 'weight' | 'height' | 'head_circumference',
  sex: Gender,
  patientRecords: GrowthMeasurement[] = []
): WHOCurvePoint[] {
  const indicator =
    metric === 'weight' ? 'wfa' : metric === 'height' ? 'lhfa' : 'hcfa';

  const monthSteps = [0, 2, 4, 6, 8, 10, 12, 15, 18, 21, 24, 30, 36, 48, 60];
  const curvePoints: WHOCurvePoint[] = [];

  for (const m of monthSteps) {
    const days = Math.round(m * 30.4375);

    try {
      const p3 = Number(valueAtZScore(indicator, sex, -1.88, days, { clamp: true }).toFixed(2));
      const p15 = Number(valueAtZScore(indicator, sex, -1.04, days, { clamp: true }).toFixed(2));
      const p50 = Number(valueAtZScore(indicator, sex, 0, days, { clamp: true }).toFixed(2));
      const p85 = Number(valueAtZScore(indicator, sex, 1.04, days, { clamp: true }).toFixed(2));
      const p97 = Number(valueAtZScore(indicator, sex, 1.88, days, { clamp: true }).toFixed(2));

      // Match patient record
      const match = patientRecords.find(r => Math.abs(r.ageInMonths - m) < 1.0);
      let patientVal: number | undefined = undefined;
      if (match) {
        if (metric === 'weight') patientVal = match.weightKg;
        else if (metric === 'height') patientVal = match.heightCm;
        else if (metric === 'head_circumference') patientVal = match.headCircumferenceCm;
      }

      curvePoints.push({
        ageMonths: m,
        p3,
        p15,
        p50,
        p85,
        p97,
        patientValue: patientVal,
      });
    } catch {
      // Ignored if out of bounds
    }
  }

  return curvePoints;
}
