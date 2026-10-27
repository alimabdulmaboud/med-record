import { describe, it, expect } from 'vitest';
import {
  validateDocumentUpload,
  filterDocuments,
  DOCUMENT_CATEGORIES,
} from '../document-vault-helper';
import type { MedicalDocument } from '@/types/med-record';

describe('Secure Document Vault & Upload Validation', () => {
  it('validates supported file types (PDF, JPEG, PNG)', () => {
    const validPdf = validateDocumentUpload({
      fileName: 'lab-results-2026.pdf',
      fileType: 'application/pdf',
      fileSizeBytes: 2 * 1024 * 1024, // 2MB
    });
    expect(validPdf.isValid).toBe(true);

    const validJpg = validateDocumentUpload({
      fileName: 'prescription.jpg',
      fileType: 'image/jpeg',
      fileSizeBytes: 1.5 * 1024 * 1024,
    });
    expect(validJpg.isValid).toBe(true);
  });

  it('rejects disallowed file types and oversized files', () => {
    const invalidExe = validateDocumentUpload({
      fileName: 'malicious.exe',
      fileType: 'application/x-msdownload',
      fileSizeBytes: 1024,
    });
    expect(invalidExe.isValid).toBe(false);
    expect(invalidExe.errorAr).toContain('نوع الملف غير مدعوم');

    const oversized = validateDocumentUpload({
      fileName: 'massive-scan.pdf',
      fileType: 'application/pdf',
      fileSizeBytes: 25 * 1024 * 1024, // 25MB exceeds 15MB limit
    });
    expect(oversized.isValid).toBe(false);
    expect(oversized.errorAr).toContain('حجم الملف يتجاوز');
  });

  it('filters documents by category and multi-field keyword search', () => {
    const docs: MedicalDocument[] = [
      {
        id: '1',
        memberId: 'm1',
        title: 'تحليل وظائف كلى وكبد',
        documentType: 'lab_result',
        storagePath: 'vault/m1/lab1.pdf',
        fileName: 'lab1.pdf',
        fileType: 'application/pdf',
        fileSizeBytes: 200000,
        documentDate: '2026-09-01',
        doctorName: 'د. خالد عبد الرحمن',
        facilityName: 'معامل البرج',
        tags: ['كلى', 'كبد'],
        createdAt: '2026-09-01T00:00:00Z',
      },
      {
        id: '2',
        memberId: 'm1',
        title: 'أشعة رنين مغناطيسي على الفقرات',
        documentType: 'radiology',
        storagePath: 'vault/m1/mri1.pdf',
        fileName: 'mri1.pdf',
        fileType: 'application/pdf',
        fileSizeBytes: 1200000,
        documentDate: '2026-08-15',
        doctorName: 'د. تامر شاكر',
        facilityName: 'مركز كايرو سكان',
        tags: ['ظهر', 'فقرات', 'رنين'],
        createdAt: '2026-08-15T00:00:00Z',
      },
    ];

    // Filter by category
    const labsOnly = filterDocuments(docs, { category: 'lab_result' });
    expect(labsOnly.length).toBe(1);
    expect(labsOnly[0].id).toBe('1');

    // Filter by search query
    const searchResult = filterDocuments(docs, { search: 'كايرو سكان' });
    expect(searchResult.length).toBe(1);
    expect(searchResult[0].id).toBe('2');

    // Filter by tag
    const tagResult = filterDocuments(docs, { search: 'فقرات' });
    expect(tagResult.length).toBe(1);
    expect(tagResult[0].id).toBe('2');
  });
});
