import { describe, it, expect } from 'vitest';
import {
  formatTimeSeriesChartData,
  getVitalReferenceBands,
  generateWHOGrowthCurveData,
} from '../chart-formatter';
import type { Measurement, GrowthMeasurement } from '@/types/med-record';

describe('Chart Formatter & Reference Bands Engine', () => {
  it('returns appropriate reference bands for vital signs', () => {
    const bpBands = getVitalReferenceBands('blood_pressure');
    expect(bpBands.systolic).toEqual({ min: 90, max: 120 });
    expect(bpBands.diastolic).toEqual({ min: 60, max: 80 });

    const sugarBands = getVitalReferenceBands('blood_sugar', 'fasting');
    expect(sugarBands.glucose).toEqual({ min: 70, max: 99 });

    const spo2Bands = getVitalReferenceBands('oxygen_saturation');
    expect(spo2Bands.value).toEqual({ min: 95, max: 100 });
  });

  it('formats measurement records for time-series charts chronologically', () => {
    const mockMeasurements: Measurement[] = [
      {
        id: '1',
        memberId: 'm1',
        measurementType: 'blood_pressure',
        values: { systolic: 135, diastolic: 88 },
        unit: 'mmHg',
        isAbnormal: true,
        recordedAt: '2026-10-10T08:00:00Z',
      },
      {
        id: '2',
        memberId: 'm1',
        measurementType: 'blood_pressure',
        values: { systolic: 122, diastolic: 78 },
        unit: 'mmHg',
        isAbnormal: false,
        recordedAt: '2026-10-15T08:00:00Z',
      },
    ];

    const chartPoints = formatTimeSeriesChartData('blood_pressure', mockMeasurements);
    expect(chartPoints.length).toBe(2);
    expect(chartPoints[0].systolic).toBe(135);
    expect(chartPoints[0].diastolic).toBe(88);
    expect(chartPoints[0].isAbnormal).toBe(true);
    expect(chartPoints[1].systolic).toBe(122);
    expect(chartPoints[1].diastolic).toBe(78);
    expect(chartPoints[1].isAbnormal).toBe(false);
  });

  it('generates WHO growth curve points with 3rd, 50th, and 97th percentiles', () => {
    const mockGrowth: GrowthMeasurement[] = [
      {
        id: 'g1',
        memberId: 'c1',
        ageInMonths: 0,
        weightKg: 3.4,
        heightCm: 50.0,
        headCircumferenceCm: 35.0,
        recordedAt: '2026-02-10T00:00:00Z',
      },
      {
        id: 'g2',
        memberId: 'c1',
        ageInMonths: 6,
        weightKg: 7.9,
        heightCm: 67.5,
        headCircumferenceCm: 43.0,
        recordedAt: '2026-08-10T00:00:00Z',
      },
    ];

    const curveData = generateWHOGrowthCurveData('weight', 'male', mockGrowth);
    expect(curveData.length).toBeGreaterThanOrEqual(2);

    // Each point should have age and percentile values
    const firstPoint = curveData[0];
    expect(firstPoint.ageMonths).toBe(0);
    expect(firstPoint.p50).toBeGreaterThan(3.0);
    expect(firstPoint.p3).toBeLessThan(firstPoint.p50);
    expect(firstPoint.p97).toBeGreaterThan(firstPoint.p50);
    // Should have patient's recorded actual value at age 0
    expect(firstPoint.patientValue).toBe(3.4);
  });
});
