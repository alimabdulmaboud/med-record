/**
 * Clinical domain types for Med SaaS.
 * 
 * Rules:
 * - AGENTS.md Rule #2: Medical privacy (clinical data inaccessible to receptionist & platform_admin)
 * - AGENTS.md Rule #6: Audit log on opening a patient clinical record
 * - AGENTS.md Rule #8: Do not auto-edit clinical text. What doctor types is what is stored.
 */

export type VisitType = "new" | "follow_up" | "consultation";
export type AllergySeverity = "mild" | "moderate" | "severe";
export type MedicalConditionType = "chronic" | "past_illness" | "surgical" | "family";
export type LabOrderStatus = "requested" | "completed" | "cancelled";
export type TemplateType = "visit" | "prescription" | "diagnosis";

export interface Measurement {
  id: string;
  clinicId: string;
  patientId: string;
  visitId?: string | null;
  recordedAt: string;
  weightKg?: number | null;
  heightCm?: number | null;
  temperatureC?: number | null;
  pulseBpm?: number | null;
  systolicBp?: number | null;
  diastolicBp?: number | null;
  oxygenSaturation?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Allergy {
  id: string;
  clinicId: string;
  patientId: string;
  allergen: string;
  severity: AllergySeverity;
  reaction?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface MedicalHistoryCondition {
  id: string;
  clinicId: string;
  patientId: string;
  conditionName: string;
  conditionType: MedicalConditionType;
  diagnosedDate?: string | null;
  currentMedication?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface PrescriptionItem {
  id: string;
  prescriptionId?: string;
  medicationName: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  clinicId: string;
  visitId: string;
  patientId: string;
  doctorId: string;
  items: PrescriptionItem[];
  notes?: string | null;
  createdAt: string;
}

export interface LabOrder {
  id: string;
  clinicId: string;
  visitId?: string | null;
  patientId: string;
  testName: string;
  requestedDate: string;
  status: LabOrderStatus;
}

export interface LabResult {
  id: string;
  clinicId: string;
  labOrderId?: string | null;
  patientId: string;
  testName: string;
  resultValue: string;
  unit?: string | null;
  referenceRange?: string | null;
  resultDate: string;
  notes?: string | null;
}

export interface Visit {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  queueEntryId?: string | null;
  visitDate: string;
  visitType: VisitType;
  chiefComplaint: string;
  diagnosis?: string | null;
  price: number;
  isPaid: boolean;
  followUpDate?: string | null;
  notes?: string | null;
  prescription?: Prescription;
  measurements?: Measurement;
  labOrders?: LabOrder[];
  labResults?: LabResult[];
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalTemplate {
  id: string;
  clinicId: string;
  doctorId?: string | null;
  templateType: TemplateType;
  name: string;
  content: {
    chiefComplaint?: string;
    diagnosis?: string;
    prescriptionItems?: Omit<PrescriptionItem, "id">[];
    notes?: string;
    commonDiagnoses?: string[];
  };
}

export interface PatientClinicalSummary {
  patientId: string;
  patientName: string;
  dateOfBirth?: string;
  gender?: string;
  allergies: Allergy[];
  chronicConditions: MedicalHistoryCondition[];
  currentMedications: string[];
  visits: Visit[];
  measurementsTimeline: Measurement[];
  labResults: LabResult[];
}

export interface SaveVisitInput {
  clinicId: string;
  patientId: string;
  doctorId: string;
  queueEntryId?: string | null;
  visitType: VisitType;
  chiefComplaint: string;
  diagnosis?: string;
  price: number;
  isPaid: boolean;
  followUpDate?: string;
  notes?: string;
  measurements?: {
    weightKg?: number;
    heightCm?: number;
    temperatureC?: number;
    pulseBpm?: number;
    systolicBp?: number;
    diastolicBp?: number;
    oxygenSaturation?: number;
  };
  prescriptionItems?: {
    medicationName: string;
    dose: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }[];
  labOrders?: {
    testName: string;
  }[];
  labResults?: {
    testName: string;
    resultValue: string;
    unit?: string;
    referenceRange?: string;
  }[];
}
