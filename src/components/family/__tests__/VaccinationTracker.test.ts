import { describe, it, expect } from 'vitest';
import {
  VACCINE_STATUS_CONFIG,
  filterVaccinesByStatus,
} from '../vaccination-tracker-utils';
import type { VaccinationStatus } from '@/types/vaccinations';

describe('Phase 5: Vaccination Tracker UI Utilities', () => {
  it('defines Arabic status labels and configurations correctly', () => {
    expect(VACCINE_STATUS_CONFIG.completed.labelAr).toBe('تم التطعيم');
    expect(VACCINE_STATUS_CONFIG.pending.labelAr).toBe('مستحق لاحقاً');
    expect(VACCINE_STATUS_CONFIG.overdue.labelAr).toBe('متأخر / فائت');
  });

  it('filters vaccines by status tab', () => {
    const list: Array<{ code: string; status: VaccinationStatus }> = [
      { code: 'BCG', status: 'completed' },
      { code: 'OPV_0', status: 'completed' },
      { code: 'PENTA_1', status: 'overdue' },
      { code: 'MMR_1', status: 'pending' },
    ];

    expect(filterVaccinesByStatus(list, 'all')).toHaveLength(4);
    expect(filterVaccinesByStatus(list, 'completed')).toHaveLength(2);
    expect(filterVaccinesByStatus(list, 'overdue')).toHaveLength(1);
    expect(filterVaccinesByStatus(list, 'pending')).toHaveLength(1);
  });
});
