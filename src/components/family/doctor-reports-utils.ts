import type { ReportSectionId, CreateDoctorReportInput } from '@/types/reports';
import { ALL_REPORT_SECTIONS } from '@/lib/family/reports-service';

export interface DatePresetOption {
  id: '30d' | '90d' | '1y' | 'all' | 'custom';
  labelAr: string;
}

export const DATE_PRESET_OPTIONS: DatePresetOption[] = [
  { id: '30d', labelAr: 'آخر شهر' },
  { id: '90d', labelAr: 'آخر 3 شهور' },
  { id: '1y', labelAr: 'آخر سنة' },
  { id: 'all', labelAr: 'كل السجل' },
  { id: 'custom', labelAr: 'فترة مخصصة' },
];

export function calculateAgeAr(birthDateStr?: string, referenceDateStr?: string): string {
  if (!birthDateStr) return '';
  const birth = new Date(birthDateStr);
  const ref = referenceDateStr ? new Date(referenceDateStr) : new Date();

  const years = ref.getFullYear() - birth.getFullYear();
  const months = ref.getMonth() - birth.getMonth();

  if (years <= 0) {
    const totalMonths = Math.max(0, months + years * 12);
    return `${totalMonths} شهر`;
  }
  return `${years} سنة`;
}

export function formatDateRangeAr(from: string, to: string): string {
  if (!from && !to) return 'كامل السجل السريري';
  if (!from) return `حتى ${to}`;
  if (!to) return `من ${from}`;
  return `من ${from} إلى ${to}`;
}

export function validateReportInput(input: CreateDoctorReportInput): {
  isValid: boolean;
  errorAr?: string;
} {
  if (!input.person_id) {
    return { isValid: false, errorAr: 'يجب تحديد المريض أولاً' };
  }
  if (!input.family_id) {
    return { isValid: false, errorAr: 'معرف الأسرة مطلوب' };
  }
  if (input.date_range_from && input.date_range_to && input.date_range_from > input.date_range_to) {
    return { isValid: false, errorAr: 'تاريخ البداية يجب أن يكون قبل أو يطابق تاريخ النهاية' };
  }
  if (input.included_sections && input.included_sections.length === 0) {
    return { isValid: false, errorAr: 'يجب اختيار قسم واحد على الأقل لتضمينه في التقرير' };
  }
  return { isValid: true };
}

export function getSectionDisplayDetails(sections: ReportSectionId[]) {
  return sections.map((secId) => {
    const found = ALL_REPORT_SECTIONS.find((s) => s.id === secId);
    return {
      id: secId,
      labelAr: found?.labelAr || secId,
      labelEn: found?.labelEn || secId,
    };
  });
}
