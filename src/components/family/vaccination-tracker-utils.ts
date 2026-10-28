/**
 * Pure UI Helper Utilities for Childhood Vaccination Tracker
 */

import type { VaccinationStatus } from '@/types/vaccinations';

export const VACCINE_STATUS_CONFIG: Record<
  VaccinationStatus,
  { labelAr: string; color: string; badgeBg: string }
> = {
  completed: {
    labelAr: 'تم التطعيم',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    badgeBg: 'bg-emerald-500',
  },
  pending: {
    labelAr: 'مستحق لاحقاً',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    badgeBg: 'bg-blue-500',
  },
  overdue: {
    labelAr: 'متأخر / فائت',
    color: 'text-rose-700 bg-rose-50 border-rose-200',
    badgeBg: 'bg-rose-500',
  },
};

export function filterVaccinesByStatus<T extends { status: VaccinationStatus }>(
  vaccines: T[],
  status: 'all' | VaccinationStatus
): T[] {
  if (status === 'all') return vaccines;
  return vaccines.filter((v) => v.status === status);
}
