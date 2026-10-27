import type { Medication, Encounter } from '@/types/med-record';

export const MEDICAL_SPECIALTIES_AR = [
  'طب أطفال وحديثي ولادة',
  'باطنة وقلب وأوعية دموية',
  'تغذية علاجية',
  'عظام ومفاصل',
  'أنف وأذن وحنجرة',
  'نساء وتوليد',
  'جلدية وتناسلية',
  'مخ وأعصاب',
  'عيون وجراحة رمد',
  'جهاز هضمي وكبد',
  'مسالك بولية وكلى',
  'صدر وجهاز تنفسي',
  'غدد صماء وسكر',
  'طب وجراحة أسنان',
  'طب عام وعيادة الأسرة',
];

export interface FormattedMedication {
  summaryAr: string;
  reminderLabelAr?: string;
}

export function formatMedicationSchedule(med: Medication): FormattedMedication {
  const parts = [med.dose, med.frequency];
  if (med.timingNotes) {
    parts.push(`(${med.timingNotes})`);
  }

  let reminderLabelAr: string | undefined = undefined;
  if (med.reminderEnabled && med.reminderTime) {
    const [hoursStr, minutesStr] = med.reminderTime.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = minutesStr || '00';

    if (hours === 12) {
      reminderLabelAr = `12:${minutes} ظهراً`;
    } else if (hours === 0) {
      reminderLabelAr = `12:${minutes} منتصف الليل`;
    } else if (hours > 12) {
      reminderLabelAr = `${String(hours - 12).padStart(2, '0')}:${minutes} مساءً`;
    } else {
      reminderLabelAr = `${String(hours).padStart(2, '0')}:${minutes} صباحاً`;
    }
  }

  return {
    summaryAr: parts.join(' - '),
    reminderLabelAr,
  };
}

export interface FollowUpAlert {
  hasFollowUp: boolean;
  followUpDate?: string;
  daysRemaining?: number;
  isDueSoon: boolean;
  isOverdue: boolean;
  badgeLabelAr?: string;
}

export function getFollowUpAlertStatus(
  encounter: Encounter,
  currentDateStr?: string
): FollowUpAlert {
  if (!encounter.followUpDate) {
    return { hasFollowUp: false, isDueSoon: false, isOverdue: false };
  }

  const curDate = currentDateStr ? new Date(currentDateStr) : new Date();
  curDate.setHours(0, 0, 0, 0);

  const followUpDate = new Date(encounter.followUpDate);
  followUpDate.setHours(0, 0, 0, 0);

  const diffTime = followUpDate.getTime() - curDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isOverdue = diffDays < 0;
  const isDueSoon = diffDays >= 0 && diffDays <= 7;

  let badgeLabelAr: string | undefined = undefined;
  if (isOverdue) {
    badgeLabelAr = `فائت منذ ${Math.abs(diffDays)} يوم`;
  } else if (diffDays === 0) {
    badgeLabelAr = 'مستحق اليوم (استشارة)';
  } else if (isDueSoon) {
    badgeLabelAr = `مستحق خلال ${diffDays} أيام`;
  }

  return {
    hasFollowUp: true,
    followUpDate: encounter.followUpDate,
    daysRemaining: diffDays,
    isDueSoon,
    isOverdue,
    badgeLabelAr,
  };
}
