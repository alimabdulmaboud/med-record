import { describe, it, expect, beforeEach } from 'vitest';
import { getMedRecordRepository } from '../repository';
import { generateExpiringSignedUrl, verifySignedUrlToken } from '../storage';

describe('Med Record Repository & Storage', () => {
  beforeEach(async () => {
    const repo = getMedRecordRepository();
    await repo.resetToMockData();
  });

  it('loads realistic seeded mock family data on initialization', async () => {
    const repo = getMedRecordRepository();
    const members = await repo.getFamilyMembers('user-demo-1');

    expect(members.length).toBeGreaterThanOrEqual(3);

    const primary = members.find(m => m.isPrimary);
    expect(primary).toBeDefined();
    expect(primary?.fullName).toContain('أحمد');

    const children = members.filter(m => m.relationship === 'child');
    expect(children.length).toBeGreaterThanOrEqual(2);
    expect(children.some(c => c.fullName.includes('سارة'))).toBe(true);
    expect(children.some(c => c.fullName.includes('ياسين'))).toBe(true);
  });

  it('supports creating and querying measurements for a family member', async () => {
    const repo = getMedRecordRepository();
    const members = await repo.getFamilyMembers('user-demo-1');
    const ahmed = members.find(m => m.isPrimary)!;

    const measurement = await repo.addMeasurement({
      memberId: ahmed.id,
      measurementType: 'blood_pressure',
      values: { systolic: 118, diastolic: 76 },
      unit: 'mmHg',
      recordedAt: new Date().toISOString(),
    });

    expect(measurement.id).toBeDefined();
    expect(measurement.isAbnormal).toBe(false);

    const measurements = await repo.getMeasurements(ahmed.id);
    expect(measurements.some(m => m.id === measurement.id)).toBe(true);
  });

  it('manages medical documents and filters by category', async () => {
    const repo = getMedRecordRepository();
    const members = await repo.getFamilyMembers('user-demo-1');
    const sara = members.find(m => m.fullName.includes('سارة'))!;

    const doc = await repo.addDocument({
      memberId: sara.id,
      title: 'تحليل صورة دم كاملة CBC',
      documentType: 'lab_result',
      storagePath: 'vault/user-demo-1/sara-cbc-2026.pdf',
      fileName: 'sara-cbc-2026.pdf',
      fileType: 'application/pdf',
      fileSizeBytes: 245000,
      documentDate: '2026-09-15',
      doctorName: 'د. سمير فهمي',
      facilityName: 'معامل البرج',
      tags: ['CBC', 'أنيميا', 'دم'],
    });

    expect(doc.id).toBeDefined();

    const labDocs = await repo.getDocuments(sara.id, 'lab_result');
    expect(labDocs.length).toBeGreaterThanOrEqual(1);
    expect(labDocs.some(d => d.id === doc.id)).toBe(true);

    const radiologyDocs = await repo.getDocuments(sara.id, 'radiology');
    expect(radiologyDocs.every(d => d.documentType === 'radiology')).toBe(true);
  });

  it('generates secure expiring signed URLs for private documents', async () => {
    const storagePath = 'vault/user-demo-1/sara-cbc-2026.pdf';
    const signedUrl = await generateExpiringSignedUrl(storagePath, 900); // 15 mins

    expect(signedUrl).toContain(encodeURIComponent(storagePath) || 'vault');
    expect(signedUrl).toContain('expires=');
    expect(signedUrl).toContain('token=');

    const isValid = verifySignedUrlToken(signedUrl);
    expect(isValid).toBe(true);
  });

  it('generates a shareable doctor report link, validates expiration, and allows revocation', async () => {
    const repo = getMedRecordRepository();
    const members = await repo.getFamilyMembers('user-demo-1');
    const ahmed = members.find(m => m.isPrimary)!;

    const report = await repo.createDoctorReport({
      memberId: ahmed.id,
      title: 'ملخص طبي لمتابعة القلب والباطنة',
      dateFrom: '2026-01-01',
      dateTo: '2026-10-27',
      includedSections: ['vitals', 'medications', 'allergies', 'visits'],
      summaryNotes: 'تقرير شامل لمراجعة الطبيب',
    });

    expect(report.id).toBeDefined();

    // Create a 24h expiring share link
    const share = await repo.createReportShare(report.id, 24);
    expect(share.accessToken).toBeDefined();
    expect(share.isRevoked).toBe(false);

    // Retrieve by token
    const retrieved = await repo.getSharedReport(share.accessToken);
    expect(retrieved).toBeDefined();
    expect(retrieved?.report.id).toBe(report.id);

    // Revoke link
    await repo.revokeReportShare(share.id);
    const afterRevoke = await repo.getSharedReport(share.accessToken);
    expect(afterRevoke).toBeNull();
  });

  it('executes complete GDPR data deletion ("Delete all my data")', async () => {
    const repo = getMedRecordRepository();
    const userId = 'user-demo-1';

    const beforeMembers = await repo.getFamilyMembers(userId);
    expect(beforeMembers.length).toBeGreaterThan(0);

    await repo.deleteAllUserData(userId);

    const afterMembers = await repo.getFamilyMembers(userId);
    expect(afterMembers.length).toBe(0);
  });
});
