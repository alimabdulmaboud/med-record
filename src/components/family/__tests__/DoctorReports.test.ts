import { describe, it, expect } from 'vitest';
import {
  DATE_PRESET_OPTIONS,
  calculateAgeAr,
  formatDateRangeAr,
  validateReportInput,
  getSectionDisplayDetails,
} from '../doctor-reports-utils';
import { ALL_REPORT_SECTIONS } from '@/lib/family/reports-service';

describe('Phase 6: Doctor Reports UI Utils and Form Validation', () => {
  it('provides all 5 date preset options with Arabic labels', () => {
    expect(DATE_PRESET_OPTIONS).toHaveLength(5);
    expect(DATE_PRESET_OPTIONS.map((o) => o.id)).toEqual(['30d', '90d', '1y', 'all', 'custom']);
    expect(DATE_PRESET_OPTIONS[0].labelAr).toBe('آخر شهر');
  });

  it('calculates age in Arabic for adults and children', () => {
    // Child: 6 months
    const childAge = calculateAgeAr('2026-04-15', '2026-10-15');
    expect(childAge).toBe('6 شهر');

    // Adult: 30 years
    const adultAge = calculateAgeAr('1996-01-01', '2026-10-15');
    expect(adultAge).toBe('30 سنة');
  });

  it('formats Arabic date range description', () => {
    expect(formatDateRangeAr('2026-01-01', '2026-10-28')).toBe('من 2026-01-01 إلى 2026-10-28');
    expect(formatDateRangeAr('', '')).toBe('كامل السجل السريري');
  });

  it('validates doctor report creation input', () => {
    // Valid input
    const valid = validateReportInput({
      family_id: 'fam-1',
      person_id: 'p-1',
      date_range_from: '2026-01-01',
      date_range_to: '2026-10-28',
      included_sections: ['vitals', 'medications'],
    });
    expect(valid.isValid).toBe(true);

    // Invalid date order: from > to
    const invalidDates = validateReportInput({
      family_id: 'fam-1',
      person_id: 'p-1',
      date_range_from: '2026-12-01',
      date_range_to: '2026-01-01',
    });
    expect(invalidDates.isValid).toBe(false);
    expect(invalidDates.errorAr).toContain('تاريخ البداية');

    // Empty sections
    const emptySections = validateReportInput({
      family_id: 'fam-1',
      person_id: 'p-1',
      date_range_from: '2026-01-01',
      date_range_to: '2026-10-01',
      included_sections: [],
    });
    expect(emptySections.isValid).toBe(false);
    expect(emptySections.errorAr).toContain('قسم واحد على الأقل');
  });

  it('retrieves bilingual display details for sections', () => {
    const details = getSectionDisplayDetails(['vitals', 'growth', 'vaccinations']);
    expect(details).toHaveLength(3);
    expect(details[0].labelAr).toBe('القياسات والمؤشرات الحيوية');
    expect(details[0].labelEn).toBe('Vital Signs & Measurements');
    expect(details[1].labelAr).toBe('مخططات ومنحنيات النمو (للأطفال)');
    expect(details[2].labelAr).toBe('التطعيمات الوقائية ومناعة الطفل');
  });
});
