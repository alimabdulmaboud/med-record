import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryMedRecordRepository } from '../repository';
import { DEMO_USER_ID } from '../mock-data';
import {
  exportUserDataAsJson,
  exportMeasurementsAsCsv,
  exportMedicationsAsCsv,
  exportEncountersAsCsv,
} from '../export-helper';
import type { Measurement, Medication, Encounter } from '@/types/med-record';

describe('Data Sovereignty & Export Engine', () => {
  let repo: InMemoryMedRecordRepository;

  beforeEach(() => {
    repo = new InMemoryMedRecordRepository();
  });

  it('exports comprehensive user data as formatted JSON', async () => {
    const jsonStr = await exportUserDataAsJson(DEMO_USER_ID, repo);
    expect(jsonStr).toBeTypeOf('string');

    const parsed = JSON.parse(jsonStr);
    expect(parsed.exportedAt).toBeDefined();
    expect(parsed.system).toBe('Med Record (سجلي الطبي)');
    expect(Array.isArray(parsed.members)).toBe(true);
    expect(parsed.members.length).toBeGreaterThan(0);
    expect(Array.isArray(parsed.measurements)).toBe(true);
    expect(Array.isArray(parsed.medications)).toBe(true);
    expect(Array.isArray(parsed.encounters)).toBe(true);
    expect(Array.isArray(parsed.documents)).toBe(true);
  });

  it('exports measurements as structured CSV with header row', () => {
    const mockMeas: Measurement[] = [
      {
        id: 'm-1',
        memberId: 'mem-1',
        measurementType: 'blood_pressure',
        values: { systolic: 120, diastolic: 80 },
        unit: 'mmHg',
        isAbnormal: false,
        recordedAt: '2026-10-27T10:00:00Z',
      },
    ];

    const csv = exportMeasurementsAsCsv(mockMeas);
    expect(csv).toContain('id,member_id,type,values,unit,is_abnormal,recorded_at');
    expect(csv).toContain('m-1,mem-1,blood_pressure,120 / 80 mmHg,mmHg,false,2026-10-27T10:00:00Z');
  });

  it('exports medications as structured CSV', () => {
    const mockMeds: Medication[] = [
      {
        id: 'med-1',
        memberId: 'mem-1',
        name: 'Concor 5mg',
        dose: '5mg',
        frequency: 'مرة يومياً',
        startDate: '2026-01-01',
        status: 'active',
        timingNotes: 'صباحاً قبل الإفطار',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];

    const csv = exportMedicationsAsCsv(mockMeds);
    expect(csv).toContain('id,member_id,name,dose,frequency,status,start_date,timing_notes');
    expect(csv).toContain('med-1,mem-1,Concor 5mg,5mg,مرة يومياً,active,2026-01-01,صباحاً قبل الإفطار');
  });

  it('wipes all user records permanently when requested', async () => {
    // Before wiping
    const membersBefore = await repo.getFamilyMembers(DEMO_USER_ID);
    expect(membersBefore.length).toBeGreaterThan(0);

    // Wipe
    await repo.deleteAllUserData(DEMO_USER_ID);

    // After wiping
    const membersAfter = await repo.getFamilyMembers(DEMO_USER_ID);
    expect(membersAfter.length).toBe(0);
    const measurementsAfter = await repo.getMeasurements(membersBefore[0].id);
    expect(measurementsAfter.length).toBe(0);
  });
});
