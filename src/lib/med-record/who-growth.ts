import {
  weightForAge,
  heightForAge,
  headCircumferenceForAge,
  ageInDays,
  classify,
} from 'who-growth-standards';
import type { Gender } from '@/types/med-record';

export interface GrowthInput {
  birthDate: string | Date;
  evaluationDate?: string | Date;
  sex: Gender;
  weightKg?: number;
  heightCm?: number;
  headCircumferenceCm?: number;
}

export interface GrowthPercentilesResult {
  ageInDays: number;
  ageInMonths: number;
  weightForAgePercentile?: number;
  heightForAgePercentile?: number;
  headCircumferencePercentile?: number;
  weightForAgeZScore?: number;
  heightForAgeZScore?: number;
  headCircumferenceZScore?: number;
  isAbnormal: boolean;
  classification: {
    weight?: 'severely low' | 'low' | 'normal' | 'high' | 'severely high';
    height?: 'severely low' | 'low' | 'normal' | 'high' | 'severely high';
    headCircumference?: 'severely low' | 'low' | 'normal' | 'high' | 'severely high';
  };
}

export function calculateGrowthPercentiles(input: GrowthInput): GrowthPercentilesResult {
  const bDate = typeof input.birthDate === 'string' ? new Date(input.birthDate) : input.birthDate;
  const eDate = input.evaluationDate
    ? typeof input.evaluationDate === 'string'
      ? new Date(input.evaluationDate)
      : input.evaluationDate
    : new Date();

  const days = Math.max(0, ageInDays(bDate, eDate));
  const months = Number((days / 30.4375).toFixed(1));

  const result: GrowthPercentilesResult = {
    ageInDays: days,
    ageInMonths: months,
    isAbnormal: false,
    classification: {},
  };

  // 1. Weight-for-age
  if (typeof input.weightKg === 'number' && input.weightKg > 0) {
    try {
      const res = weightForAge(input.weightKg, { sex: input.sex, ageDays: days, clamp: true });
      const cls = classify(res.zScore);
      result.weightForAgeZScore = Number(res.zScore.toFixed(2));
      result.weightForAgePercentile = Number(res.percentile.toFixed(1));
      result.classification.weight = cls;
      if (cls !== 'normal') result.isAbnormal = true;
    } catch {
      // Ignored if out of bounds
    }
  }

  // 2. Height-for-age
  if (typeof input.heightCm === 'number' && input.heightCm > 0) {
    try {
      const res = heightForAge(input.heightCm, { sex: input.sex, ageDays: days, clamp: true });
      const cls = classify(res.zScore);
      result.heightForAgeZScore = Number(res.zScore.toFixed(2));
      result.heightForAgePercentile = Number(res.percentile.toFixed(1));
      result.classification.height = cls;
      if (cls !== 'normal') result.isAbnormal = true;
    } catch {
      // Ignored if out of bounds
    }
  }

  // 3. Head circumference-for-age
  if (typeof input.headCircumferenceCm === 'number' && input.headCircumferenceCm > 0) {
    try {
      const res = headCircumferenceForAge(input.headCircumferenceCm, { sex: input.sex, ageDays: days, clamp: true });
      const cls = classify(res.zScore);
      result.headCircumferenceZScore = Number(res.zScore.toFixed(2));
      result.headCircumferencePercentile = Number(res.percentile.toFixed(1));
      result.classification.headCircumference = cls;
      if (cls !== 'normal') result.isAbnormal = true;
    } catch {
      // Ignored if out of bounds
    }
  }

  return result;
}
