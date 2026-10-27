import { describe, it, expect } from 'vitest';
import { evaluateVitalMeasurement } from '../vitals-evaluator';

describe('Vitals & Measurements Evaluator', () => {
  it('evaluates normal blood pressure', () => {
    const evaluation = evaluateVitalMeasurement('blood_pressure', { systolic: 118, diastolic: 76 });
    expect(evaluation.isAbnormal).toBe(false);
    expect(evaluation.severity).toBe('normal');
    expect(evaluation.labelAr).toContain('طبيعي');
  });

  it('evaluates stage 1 hypertension as abnormal', () => {
    const evaluation = evaluateVitalMeasurement('blood_pressure', { systolic: 135, diastolic: 88 });
    expect(evaluation.isAbnormal).toBe(true);
    expect(evaluation.severity).toBe('high');
    expect(evaluation.labelAr).toContain('مرتفع');
  });

  it('evaluates crisis hypertension as critical', () => {
    const evaluation = evaluateVitalMeasurement('blood_pressure', { systolic: 185, diastolic: 115 });
    expect(evaluation.isAbnormal).toBe(true);
    expect(evaluation.severity).toBe('critical');
  });

  it('evaluates fasting blood glucose', () => {
    const normal = evaluateVitalMeasurement('blood_sugar', { glucose: 90, context: 'fasting' });
    expect(normal.isAbnormal).toBe(false);

    const elevated = evaluateVitalMeasurement('blood_sugar', { glucose: 135, context: 'fasting' });
    expect(elevated.isAbnormal).toBe(true);
    expect(elevated.severity).toBe('high');
  });

  it('evaluates oxygen saturation (SpO2)', () => {
    const normal = evaluateVitalMeasurement('oxygen_saturation', { value: 98 });
    expect(normal.isAbnormal).toBe(false);

    const low = evaluateVitalMeasurement('oxygen_saturation', { value: 91 });
    expect(low.isAbnormal).toBe(true);
    expect(low.severity).toBe('critical');
  });
});
