import { describe, it, expect } from 'vitest';
import {
  formatMedicationSchedule,
  getFollowUpAlertStatus,
  MEDICAL_SPECIALTIES_AR,
} from '../medications-visits-helper';
import type { Encounter, Medication } from '@/types/med-record';

describe('Medications & Doctor Visits Helper Engine', () => {
  it('formats medication regimen and reminder timing cleanly in Arabic', () => {
    const med: Medication = {
      id: '1',
      memberId: 'm1',
      name: 'كونكور 5 مجم',
      dose: '5mg',
      frequency: 'مرة واحدة يومياً',
      timingNotes: 'بعد الإفطار',
      startDate: '2026-01-01',
      status: 'active',
      reminderEnabled: true,
      reminderTime: '08:30',
      createdAt: '2026-01-01T00:00:00Z',
    };

    const formatted = formatMedicationSchedule(med);
    expect(formatted.summaryAr).toContain('5mg');
    expect(formatted.summaryAr).toContain('مرة واحدة يومياً');
    expect(formatted.reminderLabelAr).toBe('08:30 صباحاً');
  });

  it('evaluates doctor visit follow-up alerts accurately', () => {
    // Follow-up due in 3 days
    const upcomingDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const encounter1: Encounter = {
      id: 'e1',
      memberId: 'm1',
      visitDate: '2026-09-01',
      doctorName: 'د. طارق',
      specialty: 'باطنة',
      followUpDate: upcomingDate,
      createdAt: '2026-09-01T00:00:00Z',
    };

    const alertUpcoming = getFollowUpAlertStatus(encounter1);
    expect(alertUpcoming.isDueSoon).toBe(true);
    expect(alertUpcoming.isOverdue).toBe(false);

    // Follow-up was due 10 days ago
    const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const encounter2: Encounter = {
      id: 'e2',
      memberId: 'm1',
      visitDate: '2026-08-01',
      doctorName: 'د. طارق',
      specialty: 'باطنة',
      followUpDate: pastDate,
      createdAt: '2026-08-01T00:00:00Z',
    };

    const alertOverdue = getFollowUpAlertStatus(encounter2);
    expect(alertOverdue.isOverdue).toBe(true);
  });

  it('provides a comprehensive Egyptian clinical specialty taxonomy', () => {
    expect(MEDICAL_SPECIALTIES_AR.length).toBeGreaterThanOrEqual(10);
    expect(MEDICAL_SPECIALTIES_AR).toContain('طب أطفال وحديثي ولادة');
    expect(MEDICAL_SPECIALTIES_AR).toContain('باطنة وقلب وأوعية دموية');
    expect(MEDICAL_SPECIALTIES_AR).toContain('تغذية علاجية');
  });
});
