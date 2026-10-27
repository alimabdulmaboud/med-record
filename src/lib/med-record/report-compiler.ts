import type {
  FamilyMember,
  Measurement,
  Medication,
  Encounter,
  MedicalDocument,
  ReportShare,
} from '@/types/med-record';

export const REPORT_SECTIONS = [
  { id: 'vitals', labelAr: 'القياسات والمؤشرات الحيوية', labelEn: 'Vital Signs & Measurements' },
  { id: 'medications', labelAr: 'الأدوية الحالية والعلاجات', labelEn: 'Current Medications' },
  { id: 'allergies', labelAr: 'الحساسيات والأمراض المزمنة', labelEn: 'Allergies & Chronic Conditions' },
  { id: 'labs', labelAr: 'أحدث التحاليل والأشعات', labelEn: 'Recent Labs & Radiology' },
  { id: 'visits', labelAr: 'الاستشارات وزيارات الأطباء السابقة', labelEn: 'Recent Doctor Consultations' },
] as const;

export interface CompileReportInput {
  member: FamilyMember;
  dateRange: { from: string; to: string };
  includedSections: string[];
  measurements: Measurement[];
  medications: Medication[];
  encounters: Encounter[];
  documents: MedicalDocument[];
  summaryNotes?: string;
}

export interface CompiledDoctorReport {
  title: string;
  generatedAt: string;
  member: FamilyMember;
  dateRange: { from: string; to: string };
  includedSections: string[];
  hasAbnormalVitals: boolean;
  measurements: Measurement[];
  medications: Medication[];
  allergies?: string[];
  chronicConditions?: string[];
  encounters: Encounter[];
  documents: MedicalDocument[];
  summaryNotes?: string;
}

export function compileDoctorReportData(input: CompileReportInput): CompiledDoctorReport {
  const from = input.dateRange.from;
  const to = input.dateRange.to;

  const filteredMeasurements = input.includedSections.includes('vitals')
    ? input.measurements.filter(m => {
        const d = m.recordedAt.split('T')[0];
        return d >= from && d <= to;
      })
    : [];

  const hasAbnormalVitals = filteredMeasurements.some(m => m.isAbnormal);

  const filteredMedications = input.includedSections.includes('medications')
    ? input.medications.filter(m => m.status === 'active')
    : [];

  const filteredEncounters = input.includedSections.includes('visits')
    ? input.encounters.filter(e => e.visitDate >= from && e.visitDate <= to)
    : [];

  const filteredDocuments = input.includedSections.includes('labs')
    ? input.documents.filter(d => d.documentDate >= from && d.documentDate <= to)
    : [];

  return {
    title: `تقرير طبي موجز للطبيب - ${input.member.fullName}`,
    generatedAt: new Date().toISOString(),
    member: input.member,
    dateRange: input.dateRange,
    includedSections: input.includedSections,
    hasAbnormalVitals,
    measurements: filteredMeasurements,
    medications: filteredMedications,
    allergies: input.includedSections.includes('allergies') ? input.member.allergies : undefined,
    chronicConditions: input.includedSections.includes('allergies') ? input.member.chronicConditions : undefined,
    encounters: filteredEncounters,
    documents: filteredDocuments,
    summaryNotes: input.summaryNotes,
  };
}

export interface ShareTokenValidationResult {
  isAllowed: boolean;
  errorCode?: 'REVOKED' | 'EXPIRED' | 'INVALID_PIN' | 'NOT_FOUND';
  errorAr?: string;
}

export function validateShareTokenAccess(
  share: ReportShare,
  providedPin?: string
): ShareTokenValidationResult {
  if (share.isRevoked) {
    return {
      isAllowed: false,
      errorCode: 'REVOKED',
      errorAr: 'تم إيقاف صلاحية هذا الرابط من قبل صاحب السجل الطبي (Link Revoked)',
    };
  }

  const isExpired = new Date(share.expiresAt).getTime() < Date.now();
  if (isExpired) {
    return {
      isAllowed: false,
      errorCode: 'EXPIRED',
      errorAr: 'انتهت فترة صلاحية هذا الرابط الطبي المشترك (Link Expired)',
    };
  }

  if (share.pinHash && share.pinHash !== providedPin) {
    return {
      isAllowed: false,
      errorCode: 'INVALID_PIN',
      errorAr: 'رمز الدخول السري (PIN) غير صحيح',
    };
  }

  return { isAllowed: true };
}
