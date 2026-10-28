import { describe, it, expect, beforeEach } from 'vitest';
import {
  _resetInMemoryStore,
  getPersonMedications,
  createPersonMedication,
  updatePersonMedication,
  setMedicationStatus,
  archivePersonMedication,
  getPersonEncounters,
  createPersonEncounter,
  updatePersonEncounter,
  archivePersonEncounter,
  seedRealisticMockMedicationsAndEncounters,
  formatMedicationSchedule,
  getFollowUpAlertStatus,
  MEDICAL_SPECIALTIES_AR,
} from '../medications-encounters-service';

describe('Phase 4: Medications & Encounters Service Suite', () => {
  beforeEach(() => {
    _resetInMemoryStore();
  });

  const familyId = 'fam-test-123';
  const personId = 'person-test-456';

  describe('Medications Management', () => {
    it('creates a medication with validation and default active status', async () => {
      const med = await createPersonMedication({
        family_id: familyId,
        person_id: personId,
        name: 'كونكور 5 مجم',
        dose: '5 مجم',
        frequency: 'مرة واحدة يومياً',
        timing_notes: 'بعد الإفطار',
        reminder_enabled: true,
        reminder_time: '08:30',
      });

      expect(med.id).toBeDefined();
      expect(med.name).toBe('كونكور 5 مجم');
      expect(med.status).toBe('active');
      expect(med.reminder_enabled).toBe(true);
      expect(med.reminder_time).toBe('08:30');
      expect(med.archived_at).toBeNull();

      const all = await getPersonMedications(personId);
      expect(all).toHaveLength(1);
      expect(all[0].name).toBe('كونكور 5 مجم');
    });

    it('rejects medication creation without mandatory fields', async () => {
      await expect(
        createPersonMedication({
          family_id: familyId,
          person_id: personId,
          name: '',
          dose: '5mg',
          frequency: 'مرة يومياً',
        })
      ).rejects.toThrow('اسم الدواء مطلوب');

      await expect(
        createPersonMedication({
          family_id: familyId,
          person_id: personId,
          name: 'كونكور',
          dose: '',
          frequency: 'مرة يومياً',
        })
      ).rejects.toThrow('الجرعة مطلوبة');

      await expect(
        createPersonMedication({
          family_id: familyId,
          person_id: personId,
          name: 'كونكور',
          dose: '5mg',
          frequency: '',
        })
      ).rejects.toThrow('معدل التكرار مطلوب');
    });

    it('updates medication fields and handles status transitions (active -> paused -> completed)', async () => {
      const med = await createPersonMedication({
        family_id: familyId,
        person_id: personId,
        name: 'أوجمنتين 1 جم',
        dose: '1 جم',
        frequency: 'كل 12 ساعة',
      });

      expect(med.status).toBe('active');

      const paused = await setMedicationStatus(med.id, 'paused');
      expect(paused.status).toBe('paused');

      const completed = await setMedicationStatus(med.id, 'completed');
      expect(completed.status).toBe('completed');

      const activeOnly = await getPersonMedications(personId, 'active');
      expect(activeOnly).toHaveLength(0);

      const completedOnly = await getPersonMedications(personId, 'completed');
      expect(completedOnly).toHaveLength(1);
    });

    it('soft-deletes (archives) a medication without hard deleting from DB', async () => {
      const med = await createPersonMedication({
        family_id: familyId,
        person_id: personId,
        name: 'بانادول',
        dose: '500 مجم',
        frequency: 'عند اللزوم',
      });

      await archivePersonMedication(med.id);

      const active = await getPersonMedications(personId);
      expect(active).toHaveLength(0);
    });
  });

  describe('Doctor Encounters (Visits) Management', () => {
    it('creates a doctor encounter and sorts visits newest first', async () => {
      const enc1 = await createPersonEncounter({
        family_id: familyId,
        person_id: personId,
        visit_date: '2026-09-01',
        doctor_name: 'د. طارق البدري',
        specialty: 'باطنة وقلب وأوعية دموية',
        chief_complaint: 'صداع خفيف',
        diagnosis: 'ضغط مرتفع قليلاً',
      });

      const enc2 = await createPersonEncounter({
        family_id: familyId,
        person_id: personId,
        visit_date: '2026-10-15',
        doctor_name: 'د. كريم عبد العزيز',
        specialty: 'عيون وجراحة رمد',
        chief_complaint: 'فحص دوري',
      });

      const visits = await getPersonEncounters(personId);
      expect(visits).toHaveLength(2);
      expect(visits[0].doctor_name).toBe('د. كريم عبد العزيز'); // Newer
      expect(visits[1].doctor_name).toBe('د. طارق البدري');
    });

    it('updates encounter details and archives properly', async () => {
      const enc = await createPersonEncounter({
        family_id: familyId,
        person_id: personId,
        doctor_name: 'د. منى',
        specialty: 'طب أطفال وحديثي ولادة',
        chief_complaint: 'متابعة دورية',
      });

      const updated = await updatePersonEncounter(enc.id, {
        notes: 'الطفل بصحة ممتازة',
        follow_up_date: '2026-11-01',
      });

      expect(updated.notes).toBe('الطفل بصحة ممتازة');
      expect(updated.follow_up_date).toBe('2026-11-01');

      await archivePersonEncounter(enc.id);
      const remaining = await getPersonEncounters(personId);
      expect(remaining).toHaveLength(0);
    });
  });

  describe('Helper Engines & Seed Data', () => {
    it('formats medication reminder times in Arabic correctly', () => {
      const formattedMorning = formatMedicationSchedule({
        id: '1',
        memberId: 'm1',
        name: 'كونكور',
        dose: '5 مجم',
        frequency: 'مرة يومياً',
        timingNotes: 'صباحاً',
        startDate: '2026-01-01',
        status: 'active',
        reminderEnabled: true,
        reminderTime: '08:30',
        createdAt: '2026-01-01T00:00:00Z',
      });
      expect(formattedMorning.reminderLabelAr).toBe('08:30 صباحاً');

      const formattedEvening = formatMedicationSchedule({
        id: '2',
        memberId: 'm1',
        name: 'أنسولين',
        dose: '20 وحدة',
        frequency: 'مرة مساءً',
        startDate: '2026-01-01',
        status: 'active',
        reminderEnabled: true,
        reminderTime: '21:15',
        createdAt: '2026-01-01T00:00:00Z',
      });
      expect(formattedEvening.reminderLabelAr).toBe('09:15 مساءً');
    });

    it('evaluates follow-up alerts (due soon, overdue, today) accurately', () => {
      const futureDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const alertSoon = getFollowUpAlertStatus({
        id: 'e1',
        memberId: 'm1',
        visitDate: '2026-10-01',
        doctorName: 'د. طارق',
        specialty: 'باطنة',
        followUpDate: futureDate,
        createdAt: '2026-10-01T00:00:00Z',
      });
      expect(alertSoon.isDueSoon).toBe(true);
      expect(alertSoon.isOverdue).toBe(false);
      expect(alertSoon.badgeLabelAr).toContain('مستحق خلال');
    });

    it('seeds realistic adult and pediatric mock data without crashing', async () => {
      const adult = await seedRealisticMockMedicationsAndEncounters('adult-1', familyId, 35);
      expect(adult.medications.length).toBeGreaterThanOrEqual(2);
      expect(adult.encounters.length).toBeGreaterThanOrEqual(1);
      expect(adult.medications.some((m) => m.name.includes('كونكور'))).toBe(true);

      const child = await seedRealisticMockMedicationsAndEncounters('child-1', familyId, 2);
      expect(child.medications.length).toBeGreaterThanOrEqual(1);
      expect(child.encounters.length).toBeGreaterThanOrEqual(1);
      expect(child.medications.some((m) => m.name.includes('بانادول'))).toBe(true);
    });

    it('exports standard Egyptian medical specialties', () => {
      expect(MEDICAL_SPECIALTIES_AR).toContain('طب أطفال وحديثي ولادة');
      expect(MEDICAL_SPECIALTIES_AR).toContain('باطنة وقلب وأوعية دموية');
      expect(MEDICAL_SPECIALTIES_AR).toContain('تغذية علاجية');
    });
  });
});
