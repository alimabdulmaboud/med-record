import { describe, it, expect } from 'vitest';
import {
  compileDoctorReportData,
  validateShareTokenAccess,
  REPORT_SECTIONS,
} from '../report-compiler';
import type { FamilyMember, Measurement, Medication, Encounter, MedicalDocument, ReportShare } from '@/types/med-record';

describe('Doctor Report Compiler & Share Verification', () => {
  const mockMember: FamilyMember = {
    id: 'm1',
    userId: 'u1',
    fullName: 'أحمد مصطفى',
    relationship: 'self',
    birthDate: '1986-04-15',
    sex: 'male',
    bloodType: 'A+',
    allergies: ['Penicillin'],
    chronicConditions: ['Hypertension'],
    createdAt: '2026-01-01T00:00:00Z',
  };

  const mockMeasurements: Measurement[] = [
    {
      id: 'm1',
      memberId: 'm1',
      measurementType: 'blood_pressure',
      values: { systolic: 145, diastolic: 92 },
      unit: 'mmHg',
      isAbnormal: true,
      recordedAt: '2026-10-01T08:00:00Z',
    },
    {
      id: 'm2',
      memberId: 'm1',
      measurementType: 'blood_pressure',
      values: { systolic: 120, diastolic: 78 },
      unit: 'mmHg',
      isAbnormal: false,
      recordedAt: '2026-10-15T08:00:00Z',
    },
    {
      id: 'm3_old',
      memberId: 'm1',
      measurementType: 'blood_pressure',
      values: { systolic: 120, diastolic: 80 },
      unit: 'mmHg',
      recordedAt: '2025-01-01T08:00:00Z', // Out of range
    },
  ];

  it('compiles report data filtering by chosen date range and sections', () => {
    const report = compileDoctorReportData({
      member: mockMember,
      dateRange: { from: '2026-09-01', to: '2026-10-27' },
      includedSections: ['vitals', 'medications', 'allergies'],
      measurements: mockMeasurements,
      medications: [
        {
          id: 'med1',
          memberId: 'm1',
          name: 'Concor 5mg',
          dose: '5mg',
          frequency: 'مرة يومياً',
          startDate: '2026-01-01',
          status: 'active',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      encounters: [],
      documents: [],
    });

    expect(report.title).toContain('أحمد مصطفى');
    expect(report.measurements.length).toBe(2); // Only the 2 in range
    expect(report.hasAbnormalVitals).toBe(true);
    expect(report.medications.length).toBe(1);
    expect(report.allergies).toContain('Penicillin');
  });

  it('verifies expiring share link access, PIN validation, and revocation', () => {
    const activeShare: ReportShare = {
      id: 's1',
      reportId: 'rep1',
      accessToken: 'valid-token-123',
      pinHash: '1234',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      isRevoked: false,
      viewCount: 0,
      createdAt: new Date().toISOString(),
    };

    // Valid token + correct PIN
    const accessOk = validateShareTokenAccess(activeShare, '1234');
    expect(accessOk.isAllowed).toBe(true);

    // Invalid PIN
    const wrongPin = validateShareTokenAccess(activeShare, '9999');
    expect(wrongPin.isAllowed).toBe(false);
    expect(wrongPin.errorCode).toBe('INVALID_PIN');

    // Revoked share
    const revokedShare: ReportShare = { ...activeShare, isRevoked: true };
    const accessRevoked = validateShareTokenAccess(revokedShare, '1234');
    expect(accessRevoked.isAllowed).toBe(false);
    expect(accessRevoked.errorCode).toBe('REVOKED');

    // Expired share
    const expiredShare: ReportShare = {
      ...activeShare,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };
    const accessExpired = validateShareTokenAccess(expiredShare, '1234');
    expect(accessExpired.isAllowed).toBe(false);
    expect(accessExpired.errorCode).toBe('EXPIRED');
  });
});
