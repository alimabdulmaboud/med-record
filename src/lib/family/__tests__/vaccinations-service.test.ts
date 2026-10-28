import { describe, it, expect, beforeEach } from 'vitest';
import {
  _resetInMemoryStore,
  getRecordedVaccinations,
  getPersonVaccinationsSchedule,
  recordVaccineAdministered,
  archivePersonVaccination,
  seedRealisticMockVaccinations,
  EGYPTIAN_MOH_SCHEDULE,
} from '../vaccinations-service';

describe('Phase 5: Childhood Vaccinations Service Suite', () => {
  beforeEach(() => {
    _resetInMemoryStore();
  });

  const familyId = 'fam-test-123';
  const childId = 'child-test-456';

  it('generates the complete official Egyptian MOH schedule for a newborn', async () => {
    const today = new Date().toISOString().split('T')[0];
    const result = await getPersonVaccinationsSchedule(childId, today);

    expect(result.schedule.length).toBe(EGYPTIAN_MOH_SCHEDULE.length);
    expect(result.milestones.length).toBeGreaterThanOrEqual(7); // Birth, 2m, 4m, 6m, 9m, 12m, 18m
    expect(result.stats.total).toBe(EGYPTIAN_MOH_SCHEDULE.length);
    expect(result.stats.completed).toBe(0);
    expect(result.stats.percentage).toBe(0);

    // Birth vaccines check
    const birthGroup = result.milestones.find((m) => m.milestoneMonths === 0);
    expect(birthGroup).toBeDefined();
    expect(birthGroup?.vaccines.some((v) => v.code === 'BCG')).toBe(true);
    expect(birthGroup?.vaccines.some((v) => v.code === 'HEPB_0')).toBe(true);
    expect(birthGroup?.vaccines.some((v) => v.code === 'OPV_0')).toBe(true);
  });

  it('records an administered vaccine and updates child schedule stats', async () => {
    const birthDate = '2026-01-01';

    const recorded = await recordVaccineAdministered({
      family_id: familyId,
      person_id: childId,
      vaccine_code: 'BCG',
      vaccine_name: 'BCG (الدرن)',
      target_disease: 'الدرن الرئوي',
      dose_number: 1,
      age_milestone_months: 0,
      scheduled_date: '2026-01-01',
      administered_date: '2026-01-03',
      batch_number: 'BCG-2026-X1',
      administered_by: 'مكتب صحة التجمع',
    });

    expect(recorded.id).toBeDefined();
    expect(recorded.status).toBe('completed');
    expect(recorded.administered_date).toBe('2026-01-03');

    const result = await getPersonVaccinationsSchedule(childId, birthDate);
    expect(result.stats.completed).toBe(1);
    expect(result.stats.percentage).toBeGreaterThan(0);

    const bcg = result.schedule.find((v) => v.code === 'BCG');
    expect(bcg?.status).toBe('completed');
    expect(bcg?.administeredDate).toBe('2026-01-03');
  });

  it('soft-archives a vaccination record', async () => {
    const rec = await recordVaccineAdministered({
      family_id: familyId,
      person_id: childId,
      vaccine_code: 'BCG',
      vaccine_name: 'BCG (الدرن)',
      target_disease: 'الدرن الرئوي',
      scheduled_date: '2026-01-01',
      administered_date: '2026-01-02',
    });

    await archivePersonVaccination(rec.id);

    const activeList = await getRecordedVaccinations(childId);
    expect(activeList).toHaveLength(0);
  });

  it('correctly marks overdue vaccines when child age exceeds milestone + grace period', async () => {
    // Child born 5 months ago, has no vaccinations recorded
    const pastBirthDate = new Date(Date.now() - 150 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const result = await getPersonVaccinationsSchedule(childId, pastBirthDate);
    expect(result.stats.overdue).toBeGreaterThan(0);

    const overdueBirth = result.schedule.find((v) => v.code === 'BCG');
    expect(overdueBirth?.status).toBe('overdue');
  });

  it('seeds realistic mock vaccinations based on child age', async () => {
    // Toddler born 2.5 years ago (all vaccines should be completed)
    const toddlerBirth = '2023-01-01';
    const seeded = await seedRealisticMockVaccinations(childId, familyId, toddlerBirth);

    expect(seeded.length).toBe(EGYPTIAN_MOH_SCHEDULE.length);
    expect(seeded.every((v) => v.status === 'completed')).toBe(true);

    const result = await getPersonVaccinationsSchedule(childId, toddlerBirth);
    expect(result.stats.percentage).toBe(100);
    expect(result.stats.overdue).toBe(0);
    expect(result.stats.pending).toBe(0);
  });
});
