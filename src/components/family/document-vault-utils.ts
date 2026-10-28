import type { DocumentCategory } from '@/types/documents';

export const DOCUMENT_CATEGORIES: Record<
  DocumentCategory,
  { labelAr: string; labelEn: string; color: string; border: string }
> = {
  lab_result: {
    labelAr: 'تحاليل طبية',
    labelEn: 'Lab Results',
    color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-900',
  },
  radiology: {
    labelAr: 'أشعة وسونار',
    labelEn: 'Radiology',
    color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-900',
  },
  prescription: {
    labelAr: 'روشتات طبية',
    labelEn: 'Prescriptions',
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-900',
  },
  hospital_report: {
    labelAr: 'تقارير مستشفى',
    labelEn: 'Hospital Reports',
    color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-900',
  },
  vaccination_card: {
    labelAr: 'كروت تطعيم',
    labelEn: 'Vaccination Cards',
    color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-900',
  },
};

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export interface FileValidationInput {
  name: string;
  size: number;
  type?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  errorAr?: string;
}

export function validateFileUpload(file: FileValidationInput): FileValidationResult {
  const name = file.name.toLowerCase();
  const isAllowedExt =
    name.endsWith('.pdf') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png') ||
    name.endsWith('.webp');

  if (!isAllowedExt) {
    return {
      isValid: false,
      errorAr: 'نوع الملف غير مدعوم. يرجى رفع ملف بصيغة PDF أو صورة (JPEG, PNG, WEBP)',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      errorAr: 'حجم الملف يتجاوز الحد الأقصى المسموح به (15 ميجابايت)',
    };
  }

  return { isValid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1).replace('.0', '')} MB`;
}
