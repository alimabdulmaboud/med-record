import type { DocumentCategory, MedicalDocument } from '@/types/med-record';

export const DOCUMENT_CATEGORIES: Record<
  DocumentCategory,
  { labelAr: string; labelEn: string; color: string }
> = {
  lab_result: {
    labelAr: 'تحاليل طبية',
    labelEn: 'Lab Results',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  radiology: {
    labelAr: 'أشعة وسونار ورنين',
    labelEn: 'Radiology & Imaging',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  prescription: {
    labelAr: 'روشتات طبية',
    labelEn: 'Prescriptions',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  hospital_report: {
    labelAr: 'تقارير مستشفى وخروج',
    labelEn: 'Hospital Reports',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  vaccination_card: {
    labelAr: 'شهادات وكروت تطعيم',
    labelEn: 'Vaccination Cards',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
  },
};

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export interface FileValidationInput {
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
}

export interface FileValidationResult {
  isValid: boolean;
  errorAr?: string;
  errorEn?: string;
}

export function validateDocumentUpload(file: FileValidationInput): FileValidationResult {
  // Check extension or MIME type
  const isAllowedType =
    ALLOWED_FILE_TYPES.includes(file.fileType) ||
    file.fileName.toLowerCase().endsWith('.pdf') ||
    file.fileName.toLowerCase().endsWith('.jpg') ||
    file.fileName.toLowerCase().endsWith('.jpeg') ||
    file.fileName.toLowerCase().endsWith('.png') ||
    file.fileName.toLowerCase().endsWith('.webp');

  if (!isAllowedType) {
    return {
      isValid: false,
      errorAr: 'نوع الملف غير مدعوم. يرجى رفع ملف بصيغة PDF أو صورة (JPEG, PNG, WEBP)',
      errorEn: 'Unsupported file type. Please upload a PDF or image (JPEG, PNG, WEBP)',
    };
  }

  if (file.fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      errorAr: 'حجم الملف يتجاوز الحد الأقصى المسموح به (15 ميجابايت)',
      errorEn: 'File size exceeds maximum allowed limit (15MB)',
    };
  }

  return { isValid: true };
}

export interface DocumentFilterOptions {
  category?: DocumentCategory | 'all';
  search?: string;
}

export function filterDocuments(
  docs: MedicalDocument[],
  options: DocumentFilterOptions
): MedicalDocument[] {
  return docs.filter(doc => {
    if (options.category && options.category !== 'all' && doc.documentType !== options.category) {
      return false;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchDoctor = doc.doctorName?.toLowerCase().includes(q);
      const matchFacility = doc.facilityName?.toLowerCase().includes(q);
      const matchTags = doc.tags?.some(tag => tag.toLowerCase().includes(q));
      const matchSummary = doc.extractedSummary?.toLowerCase().includes(q);

      if (!matchTitle && !matchDoctor && !matchFacility && !matchTags && !matchSummary) {
        return false;
      }
    }

    return true;
  });
}
