import type {
  PersonMeasurement,
  CreateMeasurementInput,
  MeasurementFilter,
  PersonVitalsSummary,
  MeasurementType,
  GrowthPercentilesData,
} from '@/types/measurements';
import type { Person } from '@/types/family';
import { calculateGrowthPercentiles } from '@/lib/med-record/who-growth';
import { evaluateVitalMeasurement } from '@/lib/med-record/vitals-evaluator';
import { calculatePersonAge } from '@/lib/family/service';

const STORAGE_KEY = 'med_person_measurements';

// In-memory fallback for test execution & SSR
let inMemoryMeasurements: PersonMeasurement[] = [];

function getStandardUnit(type: MeasurementType): string {
  switch (type) {
    case 'blood_pressure':
      return 'mmHg';
    case 'blood_glucose':
      return 'mg/dL';
    case 'heart_rate':
      return 'bpm';
    case 'spo2':
      return '%';
    case 'temperature':
      return '°C';
    case 'weight':
      return 'kg';
    case 'height':
      return 'cm';
    case 'head_circumference':
      return 'cm';
    case 'growth_entry':
      return 'kg / cm';
    default:
      return '';
  }
}

export function clearMeasurementsStore(): void {
  inMemoryMeasurements = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

function loadAllMeasurements(): PersonMeasurement[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
  }
  return inMemoryMeasurements;
}

function saveAllMeasurements(list: PersonMeasurement[]): void {
  inMemoryMeasurements = list;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }
}

export async function addPersonMeasurement(
  input: CreateMeasurementInput,
  person: Person
): Promise<PersonMeasurement> {
  const recordedAt = input.recorded_at || new Date().toISOString();
  const unit = input.unit || getStandardUnit(input.measurement_type);

  // 1. Evaluate vital abnormality if applicable
  let isAbnormal = false;
  let severity: 'normal' | 'low' | 'high' | 'critical' = 'normal';
  let labelAr: string | undefined;
  let labelEn: string | undefined;
  let normalRange: string | undefined;
  let adviceAr: string | undefined;

  if (
    input.measurement_type === 'blood_pressure' ||
    input.measurement_type === 'blood_glucose' ||
    input.measurement_type === 'heart_rate' ||
    input.measurement_type === 'spo2' ||
    input.measurement_type === 'temperature'
  ) {
    const evalType =
      input.measurement_type === 'blood_glucose' ? 'blood_sugar' : input.measurement_type;
    const evalValues: Record<string, any> = {
      ...input.values,
      context: input.values.meal_context || 'random',
    };

    const evalResult = evaluateVitalMeasurement(
      evalType as any,
      evalValues as any
    );
    isAbnormal = evalResult.isAbnormal;
    severity = evalResult.severity;
    labelAr = evalResult.labelAr;
    labelEn = evalResult.labelEn;
    normalRange = evalResult.normalRange;
    adviceAr = evalResult.adviceAr;
  }

  // 2. Compute WHO Growth Percentiles if child
  let percentiles: GrowthPercentilesData | null = null;
  const age = calculatePersonAge(person.birth_date);

  const hasGrowthValues =
    input.values.weight_kg !== undefined ||
    input.values.height_cm !== undefined ||
    input.values.head_circumference_cm !== undefined;

  if (hasGrowthValues && age.isChild) {
    const growthRes = calculateGrowthPercentiles({
      birthDate: person.birth_date,
      evaluationDate: recordedAt,
      sex: person.sex,
      weightKg: input.values.weight_kg,
      heightCm: input.values.height_cm,
      headCircumferenceCm: input.values.head_circumference_cm,
    });

    percentiles = {
      age_in_days: growthRes.ageInDays,
      age_in_months: growthRes.ageInMonths,
      weight_for_age_percentile: growthRes.weightForAgePercentile,
      height_for_age_percentile: growthRes.heightForAgePercentile,
      head_circumference_percentile: growthRes.headCircumferencePercentile,
      weight_for_age_zscore: growthRes.weightForAgeZScore,
      height_for_age_zscore: growthRes.heightForAgeZScore,
      head_circumference_zscore: growthRes.headCircumferenceZScore,
      classification: {
        weight: growthRes.classification.weight,
        height: growthRes.classification.height,
        head_circumference: growthRes.classification.headCircumference,
      },
    };

    if (growthRes.isAbnormal) {
      isAbnormal = true;
      severity = 'high';
    }
  }

  const newMeasurement: PersonMeasurement = {
    id: `meas-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    family_id: input.family_id,
    person_id: input.person_id,
    measurement_type: input.measurement_type,
    values: input.values,
    unit,
    is_abnormal: isAbnormal,
    severity,
    label_ar: labelAr,
    label_en: labelEn,
    normal_range: normalRange,
    advice_ar: adviceAr,
    percentiles,
    notes: input.notes || null,
    recorded_at: recordedAt,
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const list = loadAllMeasurements();
  list.unshift(newMeasurement);
  saveAllMeasurements(list);

  return newMeasurement;
}

export async function getPersonMeasurements(
  personId: string,
  filter?: MeasurementFilter
): Promise<PersonMeasurement[]> {
  const all = loadAllMeasurements();
  let filtered = all.filter((m) => m.person_id === personId && !m.archived_at);

  if (filter?.type) {
    filtered = filtered.filter((m) => m.measurement_type === filter.type);
  }

  if (filter?.startDate) {
    const start = new Date(filter.startDate).getTime();
    filtered = filtered.filter((m) => new Date(m.recorded_at).getTime() >= start);
  }

  if (filter?.endDate) {
    const end = new Date(filter.endDate).getTime();
    filtered = filtered.filter((m) => new Date(m.recorded_at).getTime() <= end);
  }

  filtered.sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );

  if (filter?.limit && filter.limit > 0) {
    filtered = filtered.slice(0, filter.limit);
  }

  return filtered;
}

export async function archivePersonMeasurement(measurementId: string): Promise<boolean> {
  const all = loadAllMeasurements();
  const item = all.find((m) => m.id === measurementId);
  if (!item) return false;

  item.archived_at = new Date().toISOString();
  item.updated_at = new Date().toISOString();
  saveAllMeasurements(all);
  return true;
}

export async function getLatestVitalsSummary(personId: string): Promise<PersonVitalsSummary> {
  const measurements = await getPersonMeasurements(personId);

  const summary: PersonVitalsSummary = {
    person_id: personId,
    has_abnormal: false,
    abnormal_count: 0,
  };

  for (const m of measurements) {
    if (!summary.latest_bp && m.measurement_type === 'blood_pressure') {
      summary.latest_bp = m;
    }
    if (!summary.latest_glucose && m.measurement_type === 'blood_glucose') {
      summary.latest_glucose = m;
    }
    if (!summary.latest_heart_rate && m.measurement_type === 'heart_rate') {
      summary.latest_heart_rate = m;
    }
    if (!summary.latest_spo2 && m.measurement_type === 'spo2') {
      summary.latest_spo2 = m;
    }
    if (!summary.latest_temperature && m.measurement_type === 'temperature') {
      summary.latest_temperature = m;
    }
    if (!summary.latest_weight && m.measurement_type === 'weight') {
      summary.latest_weight = m;
    }
    if (!summary.latest_height && m.measurement_type === 'height') {
      summary.latest_height = m;
    }
    if (!summary.latest_head_circumference && m.measurement_type === 'head_circumference') {
      summary.latest_head_circumference = m;
    }
    if (!summary.latest_growth && m.measurement_type === 'growth_entry') {
      summary.latest_growth = m;
    }

    if (m.is_abnormal) {
      summary.has_abnormal = true;
      summary.abnormal_count += 1;
    }
  }

  return summary;
}

export async function seedRealisticMockMeasurements(people: Person[]): Promise<void> {
  const existing = loadAllMeasurements();
  if (existing.length > 0) return;

  const ahmed = people.find((p) => p.name.includes('أحمد مصطفى'));
  const sara = people.find((p) => p.name.includes('سارة'));
  const yassin = people.find((p) => p.name.includes('ياسين'));

  if (ahmed) {
    // History of blood pressure & glucose for Ahmed
    const bpHistory = [
      { sys: 142, dia: 92, date: '2026-10-20T08:30:00Z' },
      { sys: 138, dia: 88, date: '2026-10-22T08:30:00Z' },
      { sys: 130, dia: 85, date: '2026-10-25T08:30:00Z' },
      { sys: 124, dia: 82, date: '2026-10-27T08:30:00Z' },
      { sys: 120, dia: 80, date: '2026-10-28T07:45:00Z' },
    ];
    for (const item of bpHistory) {
      await addPersonMeasurement(
        {
          family_id: ahmed.family_id,
          person_id: ahmed.id,
          measurement_type: 'blood_pressure',
          values: { systolic: item.sys, diastolic: item.dia },
          recorded_at: item.date,
        },
        ahmed
      );
    }

    await addPersonMeasurement(
      {
        family_id: ahmed.family_id,
        person_id: ahmed.id,
        measurement_type: 'blood_glucose',
        values: { glucose: 105, meal_context: 'fasting' },
        recorded_at: '2026-10-28T07:30:00Z',
      },
      ahmed
    );

    await addPersonMeasurement(
      {
        family_id: ahmed.family_id,
        person_id: ahmed.id,
        measurement_type: 'heart_rate',
        values: { heart_rate: 74 },
        recorded_at: '2026-10-28T07:45:00Z',
      },
      ahmed
    );
  }

  if (sara) {
    // Growth history for Sara (5 years old)
    const saraGrowth = [
      { w: 14.2, h: 98, hc: 49.5, date: '2025-04-10T10:00:00Z' },
      { w: 15.5, h: 102, hc: 50.0, date: '2025-10-15T10:00:00Z' },
      { w: 16.8, h: 106, hc: 50.5, date: '2026-04-12T10:00:00Z' },
      { w: 17.6, h: 109, hc: 51.0, date: '2026-10-20T10:00:00Z' },
    ];
    for (const g of saraGrowth) {
      await addPersonMeasurement(
        {
          family_id: sara.family_id,
          person_id: sara.id,
          measurement_type: 'growth_entry',
          values: {
            weight_kg: g.w,
            height_cm: g.h,
            head_circumference_cm: g.hc,
          },
          recorded_at: g.date,
        },
        sara
      );
    }
  }

  if (yassin) {
    // Growth history for baby Yassin (14 months)
    const yassinGrowth = [
      { w: 3.4, h: 50, hc: 35.0, date: '2025-08-20T08:00:00Z' },
      { w: 5.8, h: 60, hc: 39.5, date: '2025-11-20T09:00:00Z' },
      { w: 7.9, h: 68, hc: 43.0, date: '2026-02-20T10:00:00Z' },
      { w: 9.6, h: 74, hc: 45.5, date: '2026-05-20T10:00:00Z' },
      { w: 10.8, h: 79, hc: 47.0, date: '2026-08-20T10:00:00Z' },
      { w: 11.4, h: 81, hc: 47.5, date: '2026-10-25T11:00:00Z' },
    ];
    for (const g of yassinGrowth) {
      await addPersonMeasurement(
        {
          family_id: yassin.family_id,
          person_id: yassin.id,
          measurement_type: 'growth_entry',
          values: {
            weight_kg: g.w,
            height_cm: g.h,
            head_circumference_cm: g.hc,
          },
          recorded_at: g.date,
        },
        yassin
      );
    }
  }
}
