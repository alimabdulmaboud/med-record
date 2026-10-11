/**
 * Pediatrics Module Domain Types
 */

export type DeliveryType = "vaginal" | "c_section" | "assisted";

export type FeedingType =
  | "exclusive_breastfeeding"
  | "formula"
  | "mixed"
  | "solids_weaned";

export type VaccineAdministrationSite =
  | "right_thigh"
  | "left_thigh"
  | "right_deltoid"
  | "left_deltoid"
  | "oral"
  | "intradermal";

export type VaccinationStatus = "administered" | "scheduled" | "overdue" | "skipped";

export interface BirthHistory {
  id: string;
  clinicId: string;
  patientId: string;
  gestationalAgeWeeks?: number | null;
  deliveryType?: DeliveryType | null;
  birthWeightKg?: number | null;
  birthLengthCm?: number | null;
  birthHeadCircumferenceCm?: number | null;
  apgarScore1min?: number | null;
  apgarScore5min?: number | null;
  nicuStay: boolean;
  nicuDays?: number | null;
  complications?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeedingHistory {
  id: string;
  clinicId: string;
  patientId: string;
  feedingType?: FeedingType | null;
  formulaName?: string | null;
  solidsStartAgeMonths?: number | null;
  vitaminDSupplement: boolean;
  ironSupplement: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VaccineTemplate {
  id: string;
  clinicId: string;
  vaccineName: string;
  targetAgeMonths: number;
  doseNumber: number;
  isMandatory: boolean;
  notes?: string | null;
  isActive: boolean;
}

export interface VaccinationRecord {
  id: string;
  clinicId: string;
  patientId: string;
  vaccineName: string;
  doseNumber: number;
  administeredDate?: string | null;
  batchNumber?: string | null;
  site?: VaccineAdministrationSite | null;
  administeredBy?: string | null;
  status: VaccinationStatus;
  notes?: string | null;
  createdAt: string;
}

export interface MilestoneItem {
  key: string;
  category: "gross_motor" | "fine_motor" | "speech_language" | "cognitive_social";
  ageBand: string;
  titleAr: string;
  titleEn: string;
}

export interface PatientMilestoneRecord {
  id: string;
  clinicId: string;
  patientId: string;
  milestoneKey: string;
  category: "gross_motor" | "fine_motor" | "speech_language" | "cognitive_social";
  ageBand: string;
  achieved: boolean;
  achievedDate?: string | null;
  notes?: string | null;
}

export interface PediatricExam {
  id: string;
  clinicId: string;
  patientId: string;
  visitId?: string | null;
  generalAppearance?: string | null;
  headNeck?: string | null;
  cardiovascular?: string | null;
  respiratory?: string | null;
  abdomen?: string | null;
  neurological?: string | null;
  musculoskeletal?: string | null;
  skin?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface FullPediatricRecord {
  patientId: string;
  birthHistory?: BirthHistory;
  feedingHistory?: FeedingHistory;
  vaccinations: VaccinationRecord[];
  scheduleWithStatus: Array<{
    template: VaccineTemplate;
    record?: VaccinationRecord;
    calculatedStatus: "administered" | "due" | "overdue" | "upcoming";
    dueDate: string;
  }>;
  milestones: Record<string, PatientMilestoneRecord>;
  recentExams: PediatricExam[];
}
