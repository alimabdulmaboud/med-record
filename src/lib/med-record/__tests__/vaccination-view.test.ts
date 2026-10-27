import { describe, it, expect } from 'vitest';
import {
  calculateVaccinationStats,
  groupVaccinesByMilestone,
} from '../vaccination-view-helper';
import { getEgyptianVaccineSchedule } from '../vaccine-schedule';

describe('Childhood Vaccination Tracker Helper', () => {
  it('groups vaccines by age milestones in months', () => {
    const schedule = getEgyptianVaccineSchedule('2026-01-01');
    const grouped = groupVaccinesByMilestone(schedule);

    expect(grouped.length).toBeGreaterThanOrEqual(7);

    const birthGroup = grouped.find(g => g.milestoneMonths === 0);
    expect(birthGroup).toBeDefined();
    expect(birthGroup?.labelAr).toContain('الولادة');
    expect(birthGroup?.vaccines.length).toBeGreaterThanOrEqual(2);

    const month18Group = grouped.find(g => g.milestoneMonths === 18);
    expect(month18Group).toBeDefined();
    expect(month18Group?.labelAr).toContain('18');
  });

  it('calculates completion statistics and progress percentage', () => {
    const schedule = getEgyptianVaccineSchedule('2026-01-01', '2026-10-01', [
      {
        vaccineName: 'BCG (الدرن)',
        doseNumber: 1,
        status: 'completed',
        administeredDate: '2026-01-02',
      },
      {
        vaccineName: 'الالتهاب الكبدي ب (جرعة صفرية)',
        doseNumber: 1,
        status: 'completed',
        administeredDate: '2026-01-01',
      },
    ]);

    const stats = calculateVaccinationStats(schedule);
    expect(stats.total).toBe(schedule.length);
    expect(stats.completed).toBe(2);
    expect(stats.overdue).toBeGreaterThan(0);
    expect(stats.percentage).toBeGreaterThan(0);
  });
});
