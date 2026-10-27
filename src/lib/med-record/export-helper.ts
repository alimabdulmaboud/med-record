import type {
  FamilyMember,
  Measurement,
  GrowthMeasurement,
  Medication,
  Encounter,
  MedicalDocument,
  Vaccination,
  DoctorReport,
} from '@/types/med-record';
import type { InMemoryMedRecordRepository } from './repository';
import { formatMeasurementValue } from './quick-log-helper';

export interface UserHealthExportData {
  system: string;
  version: string;
  exportedAt: string;
  userId: string;
  members: FamilyMember[];
  measurements: Measurement[];
  growthMeasurements: GrowthMeasurement[];
  medications: Medication[];
  encounters: Encounter[];
  documents: MedicalDocument[];
  vaccinations: Vaccination[];
  reports: DoctorReport[];
}

export async function exportUserDataAsJson(
  userId: string,
  repo: InMemoryMedRecordRepository
): Promise<string> {
  const members = await repo.getFamilyMembers(userId);
  const memberIds = members.map(m => m.id);

  const measurements: Measurement[] = [];
  const growthMeasurements: GrowthMeasurement[] = [];
  const medications: Medication[] = [];
  const encounters: Encounter[] = [];
  const documents: MedicalDocument[] = [];
  const vaccinations: Vaccination[] = [];

  for (const id of memberIds) {
    const [meas, growth, meds, encs, docs, vacs] = await Promise.all([
      repo.getMeasurements(id),
      repo.getGrowthMeasurements(id),
      repo.getMedications(id),
      repo.getEncounters(id),
      repo.getDocuments(id),
      repo.getVaccinations(id),
    ]);
    measurements.push(...meas);
    growthMeasurements.push(...growth);
    medications.push(...meds);
    encounters.push(...encs);
    documents.push(...docs);
    vaccinations.push(...vacs);
  }

  // Reports
  const reports = repo['reports'].filter((r: any) => memberIds.includes(r.memberId));

  const exportObj: UserHealthExportData = {
    system: 'Med Record (سجلي الطبي)',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    userId,
    members,
    measurements,
    growthMeasurements,
    medications,
    encounters,
    documents,
    vaccinations,
    reports,
  };

  return JSON.stringify(exportObj, null, 2);
}

function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportMeasurementsAsCsv(measurements: Measurement[]): string {
  const headers = ['id', 'member_id', 'type', 'values', 'unit', 'is_abnormal', 'recorded_at'];
  const rows = measurements.map(m => {
    const formattedVal = formatMeasurementValue(m.measurementType, m.values);
    return [
      escapeCsvField(m.id),
      escapeCsvField(m.memberId),
      escapeCsvField(m.measurementType),
      escapeCsvField(formattedVal),
      escapeCsvField(m.unit),
      escapeCsvField(Boolean(m.isAbnormal)),
      escapeCsvField(m.recordedAt),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function exportMedicationsAsCsv(medications: Medication[]): string {
  const headers = ['id', 'member_id', 'name', 'dose', 'frequency', 'status', 'start_date', 'timing_notes'];
  const rows = medications.map(med => [
    escapeCsvField(med.id),
    escapeCsvField(med.memberId),
    escapeCsvField(med.name),
    escapeCsvField(med.dose),
    escapeCsvField(med.frequency),
    escapeCsvField(med.status),
    escapeCsvField(med.startDate),
    escapeCsvField(med.timingNotes || ''),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function exportEncountersAsCsv(encounters: Encounter[]): string {
  const headers = ['id', 'member_id', 'doctor_name', 'specialty', 'facility_name', 'visit_date', 'diagnosis', 'notes'];
  const rows = encounters.map(enc => [
    escapeCsvField(enc.id),
    escapeCsvField(enc.memberId),
    escapeCsvField(enc.doctorName),
    escapeCsvField(enc.specialty),
    escapeCsvField(enc.facilityName || ''),
    escapeCsvField(enc.visitDate),
    escapeCsvField(enc.diagnosis || ''),
    escapeCsvField(enc.notes || ''),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}
