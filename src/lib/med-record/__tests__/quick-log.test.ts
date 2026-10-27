import { describe, it, expect } from 'vitest';
import { validateMeasurementInput, formatMeasurementValue } from '../quick-log-helper';

describe('Quick Measurement Logging Helper (< 10s Entry)', () => {
  it('validates and formats normal blood pressure entry', () => {
    const result = validateMeasurementInput('blood_pressure', {
      systolic: '120',
      diastolic: '80',
    });

    expect(result.isValid).toBe(true);
    expect(result.values?.systolic).toBe(120);
    expect(result.values?.diastolic).toBe(80);
    expect(result.unit).toBe('mmHg');
  });

  it('rejects out-of-range blood pressure values', () => {
    const result = validateMeasurementInput('blood_pressure', {
      systolic: '350', // impossible
      diastolic: '80',
    });

    expect(result.isValid).toBe(false);
    expect(result.errorAr).toContain('غير منطقي');
  });

  it('validates fasting blood glucose with context', () => {
    const result = validateMeasurementInput('blood_sugar', {
      glucose: '95',
      context: 'fasting',
    });

    expect(result.isValid).toBe(true);
    expect(result.values?.glucose).toBe(95);
    expect(result.values?.context).toBe('fasting');
    expect(result.unit).toBe('mg/dL');
  });

  it('formats measurement values cleanly for Arabic display', () => {
    const bpFormatted = formatMeasurementValue('blood_pressure', { systolic: 125, diastolic: 82 });
    expect(bpFormatted).toBe('125 / 82 mmHg');

    const tempFormatted = formatMeasurementValue('temperature', { value: 37.2 });
    expect(tempFormatted).toBe('37.2 °C');

    const spo2Formatted = formatMeasurementValue('oxygen_saturation', { value: 98 });
    expect(spo2Formatted).toBe('98%');
  });
});
