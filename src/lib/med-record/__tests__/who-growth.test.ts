import { describe, it, expect } from 'vitest';
import { calculateGrowthPercentiles } from '../who-growth';

describe('WHO Growth Calculation Engine', () => {
  it('calculates accurate percentiles and Z-scores for a 12-month male infant', () => {
    // 12 months = 365 days. Typical male median weight is ~9.6kg, height ~75.7cm, head circumference ~46.1cm
    const result = calculateGrowthPercentiles({
      birthDate: '2025-10-27',
      evaluationDate: '2026-10-27',
      sex: 'male',
      weightKg: 9.6,
      heightCm: 75.7,
      headCircumferenceCm: 46.1,
    });

    expect(result.ageInMonths).toBeCloseTo(12, 0);
    // Median values should be close to 50th percentile (Z-score near 0)
    expect(result.weightForAgePercentile).toBeGreaterThan(40);
    expect(result.weightForAgePercentile).toBeLessThan(60);
    expect(result.heightForAgePercentile).toBeGreaterThan(40);
    expect(result.heightForAgePercentile).toBeLessThan(60);
    expect(result.headCircumferencePercentile).toBeGreaterThan(40);
    expect(result.headCircumferencePercentile).toBeLessThan(60);

    expect(result.weightForAgeZScore).toBeCloseTo(0, 0);
    expect(result.heightForAgeZScore).toBeCloseTo(0, 0);
    expect(result.isAbnormal).toBe(false);
  });

  it('flags severely low weight as abnormal', () => {
    const result = calculateGrowthPercentiles({
      birthDate: '2025-10-27',
      evaluationDate: '2026-10-27',
      sex: 'female',
      weightKg: 6.0, // severely underweight for a 1-year-old girl
    });

    expect(result.weightForAgePercentile).toBeLessThan(5);
    expect(result.weightForAgeZScore).toBeLessThan(-2);
    expect(result.isAbnormal).toBe(true);
    expect(['low', 'severely low']).toContain(result.classification.weight);
  });
});
