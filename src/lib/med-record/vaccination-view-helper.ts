import type { ScheduledVaccine } from './vaccine-schedule';

export interface MilestoneGroup {
  milestoneMonths: number;
  labelAr: string;
  vaccines: ScheduledVaccine[];
}

export function groupVaccinesByMilestone(schedule: ScheduledVaccine[]): MilestoneGroup[] {
  const milestoneMap = new Map<number, ScheduledVaccine[]>();

  schedule.forEach(v => {
    const list = milestoneMap.get(v.ageMilestoneMonths) || [];
    list.push(v);
    milestoneMap.set(v.ageMilestoneMonths, list);
  });

  const milestones = Array.from(milestoneMap.keys()).sort((a, b) => a - b);

  return milestones.map(m => {
    let labelAr = '';
    if (m === 0) labelAr = 'تطعيمات عند الولادة (أول 24-48 ساعة)';
    else if (m === 2) labelAr = 'تطعيمات الشهر الثاني (عمر شهرين)';
    else if (m === 4) labelAr = 'تطعيمات الشهر الرابع (عمر 4 أشهر)';
    else if (m === 6) labelAr = 'تطعيمات الشهر السادس (عمر 6 أشهر)';
    else if (m === 9) labelAr = 'تطعيمات الشهر التاسع (عمر 9 أشهر)';
    else if (m === 12) labelAr = 'تطعيمات إتمام السنة الأولى (12 شهراً)';
    else if (m === 18) labelAr = 'جرعات منشطة عند سنة ونصف (18 شهراً)';
    else labelAr = `تطعيمات عمر ${m} شهراً`;

    return {
      milestoneMonths: m,
      labelAr,
      vaccines: milestoneMap.get(m) || [],
    };
  });
}

export interface VaccinationStats {
  total: number;
  completed: number;
  overdue: number;
  pending: number;
  percentage: number;
}

export function calculateVaccinationStats(schedule: ScheduledVaccine[]): VaccinationStats {
  const total = schedule.length;
  const completed = schedule.filter(v => v.status === 'completed').length;
  const overdue = schedule.filter(v => v.status === 'overdue').length;
  const pending = schedule.filter(v => v.status === 'pending').length;
  const percentage = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;

  return {
    total,
    completed,
    overdue,
    pending,
    percentage,
  };
}
