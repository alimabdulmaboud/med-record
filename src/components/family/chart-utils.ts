import {
  generateWHOGrowthCurveData,
  type WHOCurvePoint,
  type TimeSeriesPoint,
  getVitalReferenceBands,
  type VitalReferenceBands,
} from '@/lib/med-record/chart-formatter';
import type { PersonMeasurement, MeasurementType } from '@/types/measurements';
import type { Gender } from '@/types/med-record';

export interface ChartPoint {
  id: string;
  date: string;
  formattedDate: string;
  systolic?: number;
  diastolic?: number;
  glucose?: number;
  value?: number;
  isAbnormal?: boolean;
}

export function transformMeasurementsToChartPoints(
  type: MeasurementType,
  measurements: PersonMeasurement[]
): ChartPoint[] {
  const sorted = [...measurements].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );

  return sorted.map((m) => {
    const d = new Date(m.recorded_at);
    const formattedDate = `${d.getMonth() + 1}/${d.getDate()}`;

    const pt: ChartPoint = {
      id: m.id,
      date: m.recorded_at,
      formattedDate,
      isAbnormal: m.is_abnormal,
    };

    if (type === 'blood_pressure') {
      pt.systolic = m.values.systolic;
      pt.diastolic = m.values.diastolic;
    } else if (type === 'blood_glucose') {
      pt.glucose = m.values.glucose;
      pt.value = m.values.glucose;
    } else if (type === 'heart_rate') {
      pt.value = m.values.heart_rate;
    } else if (type === 'spo2') {
      pt.value = m.values.spo2;
    } else if (type === 'temperature') {
      pt.value = m.values.temperature_c;
    } else if (type === 'weight') {
      pt.value = m.values.weight_kg;
    } else if (type === 'height') {
      pt.value = m.values.height_cm;
    } else if (type === 'head_circumference') {
      pt.value = m.values.head_circumference_cm;
    }

    return pt;
  });
}

export function transformGrowthToWHOCurves(
  metric: 'weight' | 'height' | 'head_circumference',
  sex: Gender,
  records: PersonMeasurement[]
): WHOCurvePoint[] {
  // Map PersonMeasurement[] into format expected by generateWHOGrowthCurveData
  const growthRecords = records
    .filter((r) => r.measurement_type === 'growth_entry' || r.measurement_type === metric)
    .map((r) => ({
      id: r.id,
      memberId: r.person_id,
      ageInMonths: r.percentiles?.age_in_months ?? 0,
      weightKg: r.values.weight_kg,
      heightCm: r.values.height_cm,
      headCircumferenceCm: r.values.head_circumference_cm,
      recordedAt: r.recorded_at,
    }));

  return generateWHOGrowthCurveData(metric, sex, growthRecords);
}

export { getVitalReferenceBands, type VitalReferenceBands };
