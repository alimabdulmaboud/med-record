export type BloodType =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-'
  | 'unknown';

export type RelationshipType = 'self' | 'child' | 'spouse' | 'parent';

export type Gender = 'male' | 'female';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export interface FamilyMember {
  id: string;
  userId: string;
  fullName: string;
  relationship: RelationshipType;
  birthDate: string; // YYYY-MM-DD
  sex: Gender;
  bloodType: BloodType;
  isPrimary?: boolean;
  avatarColor?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContacts?: EmergencyContact[];
  createdAt: string;
  archivedAt?: string;
}

export type MeasurementType =
  | 'blood_pressure'
  | 'heart_rate'
  | 'blood_sugar'
  | 'weight'
  | 'height'
  | 'head_circumference'
  | 'temperature'
  | 'oxygen_saturation';

export interface MeasurementValues {
  systolic?: number;
  diastolic?: number;
  glucose?: number;
  context?: 'fasting' | 'post_prandial' | 'random' | 'hba1c';
  value?: number;
}

export interface Measurement {
  id: string;
  memberId: string;
  measurementType: MeasurementType;
  values: MeasurementValues;
  unit: string;
  loincCode?: string;
  isAbnormal?: boolean;
  notes?: string;
  recordedAt: string;
}

export interface GrowthMeasurement {
  id: string;
  memberId: string;
  ageInMonths: number;
  weightKg?: number;
  heightCm?: number;
  headCircumferenceCm?: number;
  weightForAgePercentile?: number;
  heightForAgePercentile?: number;
  headCircumferencePercentile?: number;
  bmiForAgePercentile?: number;
  weightForAgeZScore?: number;
  heightForAgeZScore?: number;
  recordedAt: string;
}

export type MedicationStatus = 'active' | 'paused' | 'completed';

export interface Medication {
  id: string;
  memberId: string;
  name: string;
  dose: string;
  frequency: string;
  timingNotes?: string;
  startDate: string;
  endDate?: string;
  status: MedicationStatus;
  reminderEnabled?: boolean;
  reminderTime?: string;
  createdAt: string;
}

export type DocumentCategory =
  | 'lab_result'
  | 'radiology'
  | 'prescription'
  | 'hospital_report'
  | 'vaccination_card';

export interface MedicalDocument {
  id: string;
  memberId: string;
  title: string;
  documentType: DocumentCategory;
  storagePath: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  documentDate: string;
  doctorName?: string;
  facilityName?: string;
  tags?: string[];
  extractedSummary?: string;
  createdAt: string;
}

export interface Encounter {
  id: string;
  memberId: string;
  visitDate: string;
  doctorName: string;
  specialty: string;
  facilityName?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  notes?: string;
  followUpDate?: string;
  createdAt: string;
}

export type VaccinationStatus = 'completed' | 'pending' | 'overdue';

export interface Vaccination {
  id: string;
  memberId: string;
  vaccineName: string;
  targetDisease: string;
  doseNumber: number;
  scheduledDate: string;
  administeredDate?: string;
  status: VaccinationStatus;
  batchNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface DoctorReportData {
  reportTitle: string;
  generatedAt: string;
  dateRange: { from: string; to: string };
  measurements: Measurement[];
  medications: Medication[];
  encounters: Encounter[];
  documents?: MedicalDocument[];
  vaccinations?: Vaccination[];
  summaryNotes?: string;
}

export interface DoctorReport {
  id: string;
  memberId: string;
  title: string;
  dateFrom: string;
  dateTo: string;
  includedSections: string[];
  snapshotData: DoctorReportData;
  summaryNotes?: string;
  createdAt: string;
}

export interface ReportShare {
  id: string;
  reportId: string;
  accessToken: string;
  pinHash?: string;
  expiresAt: string;
  isRevoked: boolean;
  viewCount: number;
  lastViewedAt?: string;
  createdAt: string;
}
