/**
 * Types and interfaces for Clinic Open Data Export (Phase 15).
 * Generates open formats (JSON and UTF-8 CSV) for clinic owners on request.
 * Strictly audited and privacy-compliant.
 */

export interface ClinicExportMetadata {
  exportedAt: string;
  exportedBy: string;
  actorRole: string;
  clinicId: string;
  clinicName: string;
  version: string;
}

export interface ExportedPatient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  guardianPhone?: string;
  guardianName?: string;
  createdAt: string;
}

export interface ExportedAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledTime: string;
  status: string;
}

export interface ExportedQueueRecord {
  id: string;
  patientId: string;
  doctorId: string;
  state: string;
  priority: string;
  arrivalTime?: string | null;
  consultationStartTime?: string | null;
  completedTime?: string | null;
}

export interface ExportedReminder {
  id: string;
  patientId: string;
  targetDate: string;
  status: string;
  channel: string;
  sentAt?: string | null;
}

export interface ClinicExportData {
  metadata: ClinicExportMetadata;
  clinic: {
    id: string;
    name: string;
    status: string;
    settings: Record<string, unknown>;
  };
  patients: ExportedPatient[];
  appointments: ExportedAppointment[];
  queueHistory: ExportedQueueRecord[];
  reminders: ExportedReminder[];
}

export interface ClinicExportResult {
  json: ClinicExportData;
  csvPatients: string;
  csvAppointments: string;
  csvQueue: string;
}
