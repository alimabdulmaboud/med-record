import type { VaccinationStatus } from '@/types/med-record';

export interface ScheduledVaccineTemplate {
  code: string;
  vaccineName: string;
  vaccineNameEn: string;
  targetDisease: string;
  ageMilestoneMonths: number;
  doseNumber: number;
  isMandatory: boolean;
  notes?: string;
}

export const EGYPTIAN_MOH_SCHEDULE: ScheduledVaccineTemplate[] = [
  // Birth
  {
    code: 'BCG',
    vaccineName: 'BCG (الدرن)',
    vaccineNameEn: 'BCG (Tuberculosis)',
    targetDisease: 'الدرن الرئوي',
    ageMilestoneMonths: 0,
    doseNumber: 1,
    isMandatory: true,
    notes: 'خلال أول 15 يوماً من الولادة بالكتف الأيسر',
  },
  {
    code: 'HEPB_0',
    vaccineName: 'الالتهاب الكبدي ب (جرعة صفرية)',
    vaccineNameEn: 'Hepatitis B (Zero Dose)',
    targetDisease: 'التهاب الكبد الوبائي ب',
    ageMilestoneMonths: 0,
    doseNumber: 1,
    isMandatory: true,
    notes: 'خلال أول 24 ساعة بعد الولادة في الفخذ الأيمن',
  },
  {
    code: 'OPV_0',
    vaccineName: 'شلل الأطفال الفموي (سابين صفر)',
    vaccineNameEn: 'Oral Polio Vaccine (Zero Dose)',
    targetDisease: 'شلل الأطفال',
    ageMilestoneMonths: 0,
    doseNumber: 1,
    isMandatory: true,
    notes: 'نقطتان بالفم',
  },

  // 2 Months
  {
    code: 'PENTA_1',
    vaccineName: 'الخماسي الجرعة الأولى (دفتيريا، تيتانوس، سعال ديكي، كبدي ب، أنفلونزا بكتيرية)',
    vaccineNameEn: 'Pentavalent 1 (DTP-HepB-Hib)',
    targetDisease: 'الدفتيريا، التيتانوس، السعال الديكي، الكبدي ب، الهيموفيلس إنفلونزا',
    ageMilestoneMonths: 2,
    doseNumber: 1,
    isMandatory: true,
  },
  {
    code: 'OPV_1',
    vaccineName: 'شلل الأطفال سابين (الجرعة الأولى)',
    vaccineNameEn: 'Oral Polio Vaccine 1',
    targetDisease: 'شلل الأطفال',
    ageMilestoneMonths: 2,
    doseNumber: 2,
    isMandatory: true,
  },
  {
    code: 'IPV_1',
    vaccineName: 'شلل الأطفال المعطل بالحقن سولك (الجرعة الأولى)',
    vaccineNameEn: 'Inactivated Polio Vaccine 1 (IPV)',
    targetDisease: 'شلل الأطفال',
    ageMilestoneMonths: 2,
    doseNumber: 1,
    isMandatory: true,
  },

  // 4 Months
  {
    code: 'PENTA_2',
    vaccineName: 'الخماسي الجرعة الثانية',
    vaccineNameEn: 'Pentavalent 2 (DTP-HepB-Hib)',
    targetDisease: 'الدفتيريا، التيتانوس، السعال الديكي، الكبدي ب، الهيموفيلس إنفلونزا',
    ageMilestoneMonths: 4,
    doseNumber: 2,
    isMandatory: true,
  },
  {
    code: 'OPV_2',
    vaccineName: 'شلل الأطفال سابين (الجرعة الثانية)',
    vaccineNameEn: 'Oral Polio Vaccine 2',
    targetDisease: 'شلل الأطفال',
    ageMilestoneMonths: 4,
    doseNumber: 3,
    isMandatory: true,
  },
  {
    code: 'IPV_2',
    vaccineName: 'شلل الأطفال المعطل سولك (الجرعة الثانية)',
    vaccineNameEn: 'Inactivated Polio Vaccine 2 (IPV)',
    targetDisease: 'شلل الأطفال',
    ageMilestoneMonths: 4,
    doseNumber: 2,
    isMandatory: true,
  },

  // 6 Months
  {
    code: 'PENTA_3',
    vaccineName: 'الخماسي الجرعة الثالثة',
    vaccineNameEn: 'Pentavalent 3 (DTP-HepB-Hib)',
    targetDisease: 'الدفتيريا، التيتانوس، السعال الديكي، الكبدي ب، الهيموفيلس إنفلونزا',
    ageMilestoneMonths: 6,
    doseNumber: 3,
    isMandatory: true,
  },
  {
    code: 'OPV_3',
    vaccineName: 'شلل الأطفال سابين (الجرعة الثالثة)',
    vaccineNameEn: 'Oral Polio Vaccine 3',
    targetDisease: 'شلل الأطفال',
    ageMilestoneMonths: 6,
    doseNumber: 4,
    isMandatory: true,
  },

  // 9 Months
  {
    code: 'OPV_4',
    vaccineName: 'شلل الأطفال سابين (الجرعة الرابعة) + فيتامين أ',
    vaccineNameEn: 'Oral Polio Vaccine 4 + Vitamin A',
    targetDisease: 'شلل الأطفال ونقص فيتامين أ',
    ageMilestoneMonths: 9,
    doseNumber: 5,
    isMandatory: true,
  },

  // 12 Months (1 Year)
  {
    code: 'MMR_1',
    vaccineName: 'الثلاثي الفيروسي MMR (الجرعة الأولى)',
    vaccineNameEn: 'MMR Vaccine 1 (Measles, Mumps, Rubella)',
    targetDisease: 'الحصبة، النكاف، الحصبة الألمانية',
    ageMilestoneMonths: 12,
    doseNumber: 1,
    isMandatory: true,
  },
  {
    code: 'OPV_5',
    vaccineName: 'شلل الأطفال سابين (الجرعة الخامسة)',
    vaccineNameEn: 'Oral Polio Vaccine 5',
    targetDisease: 'شلل الأطفال',
    ageMilestoneMonths: 12,
    doseNumber: 6,
    isMandatory: true,
  },

  // 18 Months
  {
    code: 'DTP_BOOSTER',
    vaccineName: 'الثلاثي البكتيري DTP (جرعة منشطة أولى)',
    vaccineNameEn: 'DTP Booster 1',
    targetDisease: 'الدفتيريا، التيتانوس، السعال الديكي',
    ageMilestoneMonths: 18,
    doseNumber: 1,
    isMandatory: true,
  },
  {
    code: 'MMR_2',
    vaccineName: 'الثلاثي الفيروسي MMR (جرعة منشطة ثانية)',
    vaccineNameEn: 'MMR Booster 2',
    targetDisease: 'الحصبة، النكاف، الحصبة الألمانية',
    ageMilestoneMonths: 18,
    doseNumber: 2,
    isMandatory: true,
  },
  {
    code: 'OPV_BOOSTER',
    vaccineName: 'شلل الأطفال سابين (جرعة منشطة) + فيتامين أ',
    vaccineNameEn: 'Oral Polio Vaccine Booster + Vitamin A',
    targetDisease: 'شلل الأطفال ونقص فيتامين أ',
    ageMilestoneMonths: 18,
    doseNumber: 7,
    isMandatory: true,
  },
];

export interface ScheduledVaccine extends ScheduledVaccineTemplate {
  scheduledDate: string;
  status: VaccinationStatus;
  administeredDate?: string;
  batchNumber?: string;
}

export function getEgyptianVaccineSchedule(
  birthDateStr: string,
  currentDateStr?: string,
  existingVaccinations: Array<{
    vaccineName: string;
    doseNumber?: number;
    status: VaccinationStatus;
    administeredDate?: string;
    batchNumber?: string;
  }> = []
): ScheduledVaccine[] {
  const birthDate = new Date(birthDateStr);
  const curDate = currentDateStr ? new Date(currentDateStr) : new Date();

  return EGYPTIAN_MOH_SCHEDULE.map(template => {
    // Add months to birth date
    const scheduled = new Date(birthDate);
    scheduled.setMonth(scheduled.getMonth() + template.ageMilestoneMonths);
    const scheduledDate = scheduled.toISOString().split('T')[0];

    // Check if recorded as completed in existing vaccinations
    const found = existingVaccinations.find(
      v =>
        (v.vaccineName.toLowerCase().includes(template.code.toLowerCase()) ||
          v.vaccineName.includes(template.vaccineName) ||
          template.vaccineName.includes(v.vaccineName)) &&
        (!v.doseNumber || v.doseNumber === template.doseNumber)
    );

    let status: VaccinationStatus = 'pending';
    let administeredDate: string | undefined = undefined;
    let batchNumber: string | undefined = undefined;

    if (found && found.status === 'completed') {
      status = 'completed';
      administeredDate = found.administeredDate;
      batchNumber = found.batchNumber;
    } else {
      // If overdue: scheduledDate is older than current date plus 30 days grace
      const gracePeriodMs = 30 * 24 * 60 * 60 * 1000;
      if (curDate.getTime() > scheduled.getTime() + gracePeriodMs) {
        status = 'overdue';
      }
    }

    return {
      ...template,
      scheduledDate,
      status,
      administeredDate,
      batchNumber,
    };
  });
}
