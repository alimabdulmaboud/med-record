import type { Gender } from '@/types/med-record';

export type MeasurementType =
  | 'blood_pressure'
  | 'blood_glucose'
  | 'heart_rate'
  | 'spo2'
  | 'temperature'
  | 'weight'
  | 'height'
  | 'head_circumference'
  | 'growth_entry';

export interface MeasurementValues {
  systolic?: number;
  diastolic?: number;
  glucose?: number;
  meal_context?: 'fasting' | 'post_prandial' | 'random' | 'bedtime';
  hba1c?: number;
  heart_rate?: number;
  spo2?: number;
  temperature_c?: number;
  weight_kg?: number;
  height_cm?: number;
  head_circumference_cm?: number;
  bmi?: number;
}

export interface GrowthPercentilesData {
  age_in_days: number;
  age_in_months: number;
  weight_for_age_percentile?: number;
  height_for_age_percentile?: number;
  head_circumference_percentile?: number;
  bmi_for_age_percentile?: number;
  weight_for_age_zscore?: number;
  height_for_age_zscore?: number;
  head_circumference_zscore?: number;
  classification?: {
    weight?: string;
    height?: string;
    head_circumference?: string;
  };
}

export interface PersonMeasurement {
  id: string;
  family_id: string;
  person_id: string;
  measurement_type: MeasurementType;
  values: MeasurementValues;
  unit: string;
  is_abnormal: boolean;
  severity?: 'normal' | 'low' | 'high' | 'critical';
  label_ar?: string;
  label_en?: string;
  normal_range?: string;
  advice_ar?: string;
  percentiles?: GrowthPercentilesData | null;
  notes?: string | null;
  recorded_at: string;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMeasurementInput {
  family_id: string;
  person_id: string;
  measurement_type: MeasurementType;
  values: MeasurementValues;
  unit?: string;
  notes?: string;
  recorded_at?: string;
}

export interface MeasurementFilter {
  type?: MeasurementType;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface PersonVitalsSummary {
  person_id: string;
  latest_bp?: PersonMeasurement;
  latest_glucose?: PersonMeasurement;
  latest_heart_rate?: PersonMeasurement;
  latest_spo2?: PersonMeasurement;
  latest_temperature?: PersonMeasurement;
  latest_weight?: PersonMeasurement;
  latest_height?: PersonMeasurement;
  latest_head_circumference?: PersonMeasurement;
  latest_growth?: PersonMeasurement;
  has_abnormal: boolean;
  abnormal_count: number;
}
