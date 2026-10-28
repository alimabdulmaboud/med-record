/**
 * Pure UI Helper Utilities for Medications & Doctor Visits Journal
 */

import type { MedicationStatus } from '@/types/medications-encounters';

export const MEDICATION_FREQUENCY_PRESETS = [
  'مرة واحدة يومياً',
  'مرتين يومياً (كل ١٢ ساعة)',
  '٣ مرات يومياً (كل ٨ ساعات)',
  '٤ مرات يومياً (كل ٦ ساعات)',
  'عند اللزوم (PRN)',
  'يوم بعد يوم',
  'مرة أسبوعياً',
];

export const MEDICATION_TIMING_PRESETS = [
  'بعد الأكل',
  'قبل الأكل بنصف ساعة',
  'مع الأكل',
  'على الريق صباحاً',
  'قبل النوم',
  'عند ارتفاع الحرارة',
];

export const STATUS_LABELS_AR: Record<MedicationStatus, { label: string; color: string; badgeBg: string }> = {
  active: {
    label: 'ساري حالياً',
    color: 'text-emerald-700 border-emerald-300 bg-emerald-50',
    badgeBg: 'bg-emerald-500',
  },
  paused: {
    label: 'موقوف مؤقتاً',
    color: 'text-amber-700 border-amber-300 bg-amber-50',
    badgeBg: 'bg-amber-500',
  },
  completed: {
    label: 'منتهي / مكتمل',
    color: 'text-slate-600 border-slate-300 bg-slate-100',
    badgeBg: 'bg-slate-400',
  },
};

export function filterMedicationsByTab<T extends { status: MedicationStatus }>(
  medications: T[],
  tab: 'all' | MedicationStatus
): T[] {
  if (tab === 'all') return medications;
  return medications.filter((m) => m.status === tab);
}
