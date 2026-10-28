import { describe, it, expect } from 'vitest';
import {
  MEDICATION_FREQUENCY_PRESETS,
  MEDICATION_TIMING_PRESETS,
  STATUS_LABELS_AR,
  filterMedicationsByTab,
} from '../medications-encounters-utils';
import {
  formatMedicationSchedule,
  getFollowUpAlertStatus,
  MEDICAL_SPECIALTIES_AR,
} from '@/lib/family/medications-encounters-service';
import type { PersonMedication, PersonEncounter } from '@/types/medications-encounters';

describe('Phase 4: Medications & Encounters UI Utils and Formatting', () => {
  it('correctly filters medications by status tab', () => {
    const list: Array<{ status: 'active' | 'paused' | 'completed' }> = [
      { status: 'active' },
      { status: 'active' },
      { status: 'paused' },
      { status: 'completed' },
    ];

    expect(filterMedicationsByTab(list, 'all')).toHaveLength(4);
    expect(filterMedicationsByTab(list, 'active')).toHaveLength(2);
    expect(filterMedicationsByTab(list, 'paused')).toHaveLength(1);
    expect(filterMedicationsByTab(list, 'completed')).toHaveLength(1);
  });

  it('provides Arabic presets for frequency and timing', () => {
    expect(MEDICATION_FREQUENCY_PRESETS).toContain('مرة واحدة يومياً');
    expect(MEDICATION_FREQUENCY_PRESETS).toContain('مرتين يومياً (كل ١٢ ساعة)');
    expect(MEDICATION_TIMING_PRESETS).toContain('بعد الأكل');
    expect(MEDICATION_TIMING_PRESETS).toContain('على الريق صباحاً');
  });

  it('defines Arabic status labels with color styling', () => {
    expect(STATUS_LABELS_AR.active.label).toBe('ساري حالياً');
    expect(STATUS_LABELS_AR.paused.label).toBe('موقوف مؤقتاً');
    expect(STATUS_LABELS_AR.completed.label).toBe('منتهي / مكتمل');
  });

  it('formats schedule text and reminder timing correctly', () => {
    const med: PersonMedication = {
      id: 'm-1',
      family_id: 'f-1',
      person_id: 'p-1',
      name: 'جلوكوفاج',
      dose: '1000 مجم',
      frequency: 'مرتين يومياً',
      timing_notes: 'وسط الوجبات',
      start_date: '2026-01-01',
      status: 'active',
      reminder_enabled: true,
      reminder_time: '14:30',
      created_at: '',
      updated_at: '',
    };

    const formatted = formatMedicationSchedule({
      id: med.id,
      memberId: med.person_id,
      name: med.name,
      dose: med.dose,
      frequency: med.frequency,
      timingNotes: med.timing_notes || undefined,
      startDate: med.start_date,
      status: med.status,
      reminderEnabled: med.reminder_enabled,
      reminderTime: med.reminder_time || undefined,
      createdAt: med.created_at,
    });

    expect(formatted.summaryAr).toContain('1000 مجم');
    expect(formatted.summaryAr).toContain('مرتين يومياً');
    expect(formatted.reminderLabelAr).toBe('02:30 مساءً');
  });

  it('accurately tags overdue, today, and upcoming follow-ups', () => {
    const today = new Date().toISOString().split('T')[0];
    const encounterToday: PersonEncounter = {
      id: 'e-today',
      family_id: 'f-1',
      person_id: 'p-1',
      visit_date: '2026-10-01',
      doctor_name: 'د. طارق',
      specialty: 'باطنة',
      follow_up_date: today,
      created_at: '',
      updated_at: '',
    };

    const alertToday = getFollowUpAlertStatus({
      id: encounterToday.id,
      memberId: encounterToday.person_id,
      visitDate: encounterToday.visit_date,
      doctorName: encounterToday.doctor_name,
      specialty: encounterToday.specialty,
      followUpDate: encounterToday.follow_up_date || undefined,
      createdAt: '',
    });

    expect(alertToday.isDueSoon).toBe(true);
    expect(alertToday.badgeLabelAr).toBe('مستحق اليوم (استشارة)');
  });
});
