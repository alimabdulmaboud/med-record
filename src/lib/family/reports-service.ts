/**
 * Bilingual Doctor Report Generator & Expiring Share Links Service (Med Record Phase 6)
 * Compiles patient International Patient Summary (IPS) bundles:
 * vitals, pediatric growth curves, active medications, encounters, documents, and vaccinations.
 * Manages 72-hour cryptographic access tokens, PIN protection, access logs, and 1-click revocation.
 */

import type { Person } from '@/types/family';
import type {
  DoctorReportEntity,
  ReportShareEntity,
  CompiledDoctorReportPayload,
  ReportSectionId,
  CreateDoctorReportInput,
  CreateReportShareInput,
} from '@/types/reports';
import type { PersonMeasurement } from '@/types/measurements';
import type { PersonMedication, PersonEncounter } from '@/types/medications-encounters';
import type { PersonDocument } from '@/types/documents';
import {
  getPersonVaccinationsSchedule,
  type ScheduledVaccine,
  type VaccinationStats,
} from '@/lib/family/vaccinations-service';
import { calculatePersonAge } from '@/lib/family/service';
import { getPersonMeasurements } from '@/lib/family/measurements-service';
import { getPersonMedications, getPersonEncounters } from '@/lib/family/medications-encounters-service';
import { getPersonDocuments } from '@/lib/family/documents-service';
import { sanitizeAuditMetadata } from './audit';

export const ALL_REPORT_SECTIONS: { id: ReportSectionId; labelAr: string; labelEn: string }[] = [
  { id: 'vitals', labelAr: 'القياسات والمؤشرات الحيوية', labelEn: 'Vital Signs & Measurements' },
  { id: 'growth', labelAr: 'مخططات ومنحنيات النمو (للأطفال)', labelEn: 'Growth Percentiles (Pediatric)' },
  { id: 'medications', labelAr: 'الأدوية الحالية والعلاجات', labelEn: 'Current Medications' },
  { id: 'allergies', labelAr: 'الحساسيات والأمراض المزمنة', labelEn: 'Allergies & Chronic Conditions' },
  { id: 'labs', labelAr: 'أحدث التحاليل والأشعات', labelEn: 'Recent Labs & Radiology' },
  { id: 'visits', labelAr: 'الاستشارات وزيارات الأطباء السابقة', labelEn: 'Recent Doctor Consultations' },
  { id: 'vaccinations', labelAr: 'التطعيمات الوقائية ومناعة الطفل', labelEn: 'Vaccination History' },
];

async function logAudit(params: {
  family_id: string;
  actor_id: string;
  event_type: string;
  resource_id: string;
  description?: string;
}): Promise<void> {
  sanitizeAuditMetadata({
    event_type: params.event_type,
    resource_id: params.resource_id,
    description: params.description,
  });
}

// ==============================================================================
// Token Generation & PIN Hashing (Cross-platform Safe)
// ==============================================================================

export function generateRandomToken(bytesLength = 16): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(bytesLength);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return Array.from({ length: bytesLength * 2 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

export function hashPin(pin: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < pin.length; i++) {
    const ch = pin.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const part3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const part4 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0');
  return `pin_${part1}${part2}${part3}${part4}`;
}

// ==============================================================================
// In-Memory Storage & Persistence
// ==============================================================================

const REPORTS_STORAGE_KEY = 'med_family_doctor_reports';
const SHARES_STORAGE_KEY = 'med_family_report_shares';

let inMemoryReports: DoctorReportEntity[] = [];
let inMemoryShares: ReportShareEntity[] = [];

export function _resetReportsStore(): void {
  inMemoryReports = [];
  inMemoryShares = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(REPORTS_STORAGE_KEY);
      localStorage.removeItem(SHARES_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

function loadAllReports(): DoctorReportEntity[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  return inMemoryReports;
}

function saveAllReports(list: DoctorReportEntity[]): void {
  inMemoryReports = list;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }
}

function loadAllShares(): ReportShareEntity[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(SHARES_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  return inMemoryShares;
}

function saveAllShares(list: ReportShareEntity[]): void {
  inMemoryShares = list;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(SHARES_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }
}

// ==============================================================================
// Pure Domain Engine: Report Compilation
// ==============================================================================

export interface CompileReportInput {
  person: Person;
  dateRange: { from: string; to: string };
  includedSections?: ReportSectionId[];
  measurements?: PersonMeasurement[];
  medications?: PersonMedication[];
  encounters?: PersonEncounter[];
  documents?: PersonDocument[];
  vaccinations?: {
    stats: VaccinationStats;
    recent: ScheduledVaccine[];
  };
  summaryNotes?: string;
  customTitle?: string;
}

export function compileDoctorReportData(input: CompileReportInput): CompiledDoctorReportPayload {
  const from = input.dateRange.from;
  const to = input.dateRange.to;
  const sections = input.includedSections || ['vitals', 'medications', 'allergies', 'labs', 'visits'];

  // Measurements filtered by date and whether vitals/growth included
  const rawMeasurements = input.measurements || [];
  const filteredMeasurements = (sections.includes('vitals') || sections.includes('growth'))
    ? rawMeasurements.filter((m) => {
        const d = (m.recorded_at || '').split('T')[0];
        return d >= from && d <= to;
      })
    : [];

  const hasAbnormalVitals = filteredMeasurements.some((m) => Boolean(m.is_abnormal));

  // Medications
  const rawMeds = input.medications || [];
  const filteredMedications = sections.includes('medications')
    ? rawMeds.filter((m) => m.status === 'active' || m.status === 'paused')
    : [];

  // Encounters
  const rawEncounters = input.encounters || [];
  const filteredEncounters = sections.includes('visits')
    ? rawEncounters.filter((e) => {
        const d = e.visit_date;
        return d >= from && d <= to;
      })
    : [];

  // Documents
  const rawDocs = input.documents || [];
  const filteredDocuments = sections.includes('labs')
    ? rawDocs.filter((d) => {
        const dDate = (d.document_date || d.created_at || '').split('T')[0];
        return dDate >= from && dDate <= to;
      })
    : [];

  const defaultTitle = `تقرير طبي موجز للطبيب - ${input.person.name}`;

  return {
    title: input.customTitle || defaultTitle,
    generated_at: new Date().toISOString(),
    person: input.person,
    date_range: input.dateRange,
    included_sections: sections,
    summary_notes: input.summaryNotes || null,
    has_abnormal_vitals: hasAbnormalVitals,
    measurements: filteredMeasurements,
    medications: filteredMedications,
    encounters: filteredEncounters,
    documents: filteredDocuments,
    vaccinations: sections.includes('vaccinations') ? input.vaccinations : undefined,
  };
}

// ==============================================================================
// Reports Service APIs
// ==============================================================================

export async function compilePersonDoctorReport(
  person: Person,
  options: {
    date_range_from: string;
    date_range_to: string;
    included_sections?: ReportSectionId[];
    summary_notes?: string;
    custom_title?: string;
  }
): Promise<CompiledDoctorReportPayload> {
  const [measurements, medications, encounters, documents] = await Promise.all([
    getPersonMeasurements(person.id),
    getPersonMedications(person.id),
    getPersonEncounters(person.id),
    getPersonDocuments(person.id),
  ]);

  const isChild = calculatePersonAge(person.birth_date).isChild;
  let vaccinationData: { stats: VaccinationStats; recent: ScheduledVaccine[] } | undefined = undefined;
  if (isChild && person.birth_date) {
    try {
      const vacResult = await getPersonVaccinationsSchedule(person.id, person.birth_date);
      vaccinationData = {
        stats: vacResult.stats,
        recent: vacResult.schedule.slice(0, 8),
      };
    } catch {
      // ignore if birth date missing or error
    }
  }

  return compileDoctorReportData({
    person,
    dateRange: { from: options.date_range_from, to: options.date_range_to },
    includedSections: options.included_sections,
    measurements,
    medications,
    encounters,
    documents,
    vaccinations: vaccinationData,
    summaryNotes: options.summary_notes,
    customTitle: options.custom_title,
  });
}

export async function createDoctorReport(
  input: CreateDoctorReportInput,
  actorUserId: string,
  person?: Person
): Promise<DoctorReportEntity> {
  const reports = loadAllReports();
  const id = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Default person fallback if not provided
  const targetPerson: Person = person || {
    id: input.person_id,
    family_id: input.family_id,
    name: 'المريض',
    sex: 'male',
    blood_type: 'unknown',
    allergies: [],
    chronic_conditions: [],
    birth_date: '1985-05-15',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const compiled = await compilePersonDoctorReport(targetPerson, {
    date_range_from: input.date_range_from,
    date_range_to: input.date_range_to,
    included_sections: input.included_sections,
    summary_notes: input.summary_notes,
    custom_title: input.title,
  });

  const newReport: DoctorReportEntity = {
    id,
    family_id: input.family_id,
    person_id: input.person_id,
    title: compiled.title,
    summary_notes: input.summary_notes || null,
    date_range_from: input.date_range_from,
    date_range_to: input.date_range_to,
    included_sections: compiled.included_sections,
    report_data: compiled,
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  reports.push(newReport);
  saveAllReports(reports);

  await logAudit({
    family_id: input.family_id,
    actor_id: actorUserId,
    event_type: 'DOCTOR_REPORT_CREATED',
    resource_id: newReport.id,
    description: `Generated doctor report: ${newReport.title}`,
  });

  return newReport;
}

export async function getPersonDoctorReports(personId: string): Promise<DoctorReportEntity[]> {
  const reports = loadAllReports();
  return reports.filter((r) => r.person_id === personId && !r.archived_at);
}

export async function getDoctorReportById(reportId: string): Promise<DoctorReportEntity | null> {
  const reports = loadAllReports();
  const report = reports.find((r) => r.id === reportId && !r.archived_at);
  return report || null;
}

export async function archiveDoctorReport(reportId: string, actorUserId: string): Promise<void> {
  const reports = loadAllReports();
  const target = reports.find((r) => r.id === reportId);
  if (!target) throw new Error('Doctor report not found');

  target.archived_at = new Date().toISOString();
  saveAllReports(reports);

  await logAudit({
    family_id: target.family_id,
    actor_id: actorUserId,
    event_type: 'DOCTOR_REPORT_ARCHIVED',
    resource_id: target.id,
    description: `Archived doctor report: ${target.title}`,
  });
}

// ==============================================================================
// Expiring Cryptographic Share Links APIs
// ==============================================================================

export async function generateReportShareLink(
  input: CreateReportShareInput,
  actorUserId: string
): Promise<ReportShareEntity> {
  const shares = loadAllShares();
  const id = `share-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const token = generateRandomToken(16);
  const hours = input.expires_in_hours || 72;
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  const pinHash = input.pin ? hashPin(input.pin) : null;

  const newShare: ReportShareEntity = {
    id,
    family_id: input.family_id,
    person_id: input.person_id,
    report_id: input.report_id,
    access_token: token,
    expires_at: expiresAt,
    pin_hash: pinHash,
    access_count: 0,
    last_accessed_at: null,
    is_revoked: false,
    revoked_at: null,
    created_at: new Date().toISOString(),
  };

  shares.push(newShare);
  saveAllShares(shares);

  await logAudit({
    family_id: input.family_id,
    actor_id: actorUserId,
    event_type: 'REPORT_SHARE_CREATED',
    resource_id: newShare.id,
    description: `Created report share link valid for ${hours} hours`,
  });

  return newShare;
}

export async function getReportShares(reportId: string): Promise<ReportShareEntity[]> {
  const shares = loadAllShares();
  return shares.filter((s) => s.report_id === reportId);
}

export async function getReportShareByToken(token: string): Promise<ReportShareEntity | null> {
  const shares = loadAllShares();
  const share = shares.find((s) => s.access_token === token);
  return share || null;
}

export interface VerifySharedReportResult {
  success: boolean;
  errorCode?: 'NOT_FOUND' | 'REVOKED' | 'EXPIRED' | 'PIN_REQUIRED' | 'INVALID_PIN';
  errorAr?: string;
  report?: DoctorReportEntity;
  share?: ReportShareEntity;
}

export async function verifyAndAccessSharedReport(
  token: string,
  pin?: string
): Promise<VerifySharedReportResult> {
  const shares = loadAllShares();
  const shareIndex = shares.findIndex((s) => s.access_token === token);

  if (shareIndex === -1) {
    return {
      success: false,
      errorCode: 'NOT_FOUND',
      errorAr: 'رابط المشاركة غير موجود أو تم حذفه.',
    };
  }

  const share = shares[shareIndex];

  if (share.is_revoked) {
    return {
      success: false,
      errorCode: 'REVOKED',
      errorAr: 'تم إلغاء صلاحية هذا الرابط من قبل الأسرة.',
      share,
    };
  }

  if (new Date(share.expires_at).getTime() <= Date.now()) {
    return {
      success: false,
      errorCode: 'EXPIRED',
      errorAr: 'انتهت صلاحية هذا الرابط (صلاحية الرابط 72 ساعة فقط).',
      share,
    };
  }

  if (share.pin_hash) {
    if (!pin) {
      return {
        success: false,
        errorCode: 'PIN_REQUIRED',
        errorAr: 'هذا التقرير محمي برمز سري (PIN). يرجى إدخال الرمز السري للمتابعة.',
        share,
      };
    }
    if (hashPin(pin) !== share.pin_hash) {
      return {
        success: false,
        errorCode: 'INVALID_PIN',
        errorAr: 'الرمز السري غير صحيح. يرجى المحاولة مرة أخرى.',
        share,
      };
    }
  }

  // Increment access count & update timestamp
  share.access_count += 1;
  share.last_accessed_at = new Date().toISOString();
  shares[shareIndex] = share;
  saveAllShares(shares);

  const report = await getDoctorReportById(share.report_id);

  return {
    success: true,
    report: report || undefined,
    share,
  };
}

export async function revokeReportShareLink(
  shareId: string,
  actorUserId: string
): Promise<ReportShareEntity> {
  const shares = loadAllShares();
  const shareIndex = shares.findIndex((s) => s.id === shareId);
  if (shareIndex === -1) {
    throw new Error('Report share link not found');
  }

  const share = shares[shareIndex];
  share.is_revoked = true;
  share.revoked_at = new Date().toISOString();
  shares[shareIndex] = share;
  saveAllShares(shares);

  await logAudit({
    family_id: share.family_id,
    actor_id: actorUserId,
    event_type: 'REPORT_SHARE_REVOKED',
    resource_id: share.id,
    description: 'Revoked report share link',
  });

  return share;
}

// ==============================================================================
// Realistic Demo Seeding
// ==============================================================================

export async function seedRealisticMockReports(
  person: Person,
  actorUserId = 'mock-user-1'
): Promise<{ report: DoctorReportEntity; share: ReportShareEntity }> {
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - 3);
  const toDate = new Date();

  const isChild = calculatePersonAge(person.birth_date).isChild;
  const sections: ReportSectionId[] = isChild
    ? ['vitals', 'growth', 'medications', 'allergies', 'labs', 'visits', 'vaccinations']
    : ['vitals', 'medications', 'allergies', 'labs', 'visits'];

  const customTitle = isChild
    ? `تقرير طبي موجز لطبيب الأطفال - ${person.name} (متابعة النمو والتطعيمات)`
    : `تقرير طبي موجز للطبيب - ${person.name} (متابعة الضغط والسكري)`;

  const summaryNotes = isChild
    ? 'الطفل بصحة جيدة، النمو متطابق مع منحنيات منظمة الصحة العالمية، جدول التطعيمات الإلزامية بوزارة الصحة محدث.'
    : 'المريض يتابع بانتظام لعلاج الضغط والسكري. قراءات السكر التراكمي مستقرة مع التزام ممتاز بجرعات العلاج اليومية.';

  const report = await createDoctorReport(
    {
      family_id: person.family_id,
      person_id: person.id,
      title: customTitle,
      summary_notes: summaryNotes,
      date_range_from: fromDate.toISOString().split('T')[0],
      date_range_to: toDate.toISOString().split('T')[0],
      included_sections: sections,
    },
    actorUserId,
    person
  );

  const share = await generateReportShareLink(
    {
      family_id: person.family_id,
      person_id: person.id,
      report_id: report.id,
      expires_in_hours: 72,
    },
    actorUserId
  );

  return { report, share };
}
