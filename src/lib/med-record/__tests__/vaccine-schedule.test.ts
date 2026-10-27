import { describe, it, expect } from 'vitest';
import { getEgyptianVaccineSchedule } from '../vaccine-schedule';

describe('Egyptian MOH Childhood Vaccine Schedule Engine', () => {
  it('generates the complete mandatory Egyptian vaccination schedule based on birth date', () => {
    const birthDate = '2026-01-01';
    const schedule = getEgyptianVaccineSchedule(birthDate);

    expect(schedule.length).toBeGreaterThanOrEqual(8);

    // Birth vaccines
    const birthVaccines = schedule.filter(v => v.ageMilestoneMonths === 0);
    expect(birthVaccines.length).toBeGreaterThanOrEqual(2); // BCG and Hepatitis B (Zero dose)
    expect(birthVaccines.some(v => v.vaccineName.includes('BCG'))).toBe(true);
    expect(birthVaccines.some(v => v.vaccineName.includes('Hepatitis B') || v.vaccineName.includes('الكبدي ب'))).toBe(true);

    // 2 Months, 4 Months, 6 Months (Pentavalent + Oral Polio)
    const month2 = schedule.filter(v => v.ageMilestoneMonths === 2);
    expect(month2.length).toBeGreaterThanOrEqual(1);

    // 9 Months, 12 Months (MMR), 18 Months (Booster)
    const month18 = schedule.find(v => v.ageMilestoneMonths === 18);
    expect(month18).toBeDefined();
  });

  it('correctly calculates status (completed, pending, overdue) given a current date and records', () => {
    // Child born 5 months ago
    const birthDate = '2026-05-01';
    const currentDate = '2026-10-01'; // 5 months old

    const existingVaccinations = [
      {
        vaccineName: 'BCG (الدرن)',
        doseNumber: 1,
        status: 'completed' as const,
        administeredDate: '2026-05-02',
      },
    ];

    const schedule = getEgyptianVaccineSchedule(birthDate, currentDate, existingVaccinations);

    const bcg = schedule.find(v => v.vaccineName.includes('BCG'));
    expect(bcg?.status).toBe('completed');

    // 2-month vaccine should be overdue if not completed by 5 months
    const month2Vaccine = schedule.find(v => v.ageMilestoneMonths === 2);
    expect(month2Vaccine?.status).toBe('overdue');

    // 9-month vaccine should still be pending
    const month9Vaccine = schedule.find(v => v.ageMilestoneMonths === 9);
    expect(month9Vaccine?.status).toBe('pending');
  });
});
