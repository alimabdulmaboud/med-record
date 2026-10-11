import {
  Patient,
  Guardian,
  PatientGuardianLink,
  RegisterPatientInput,
  PatientSearchResult,
  Sex,
} from "./types";
import { AuditLogEntry, UserRole } from "../invitations/types";

export class PatientServiceError extends Error {
  constructor(
    public code:
      | "FORBIDDEN"
      | "PATIENT_NOT_FOUND"
      | "GUARDIAN_NOT_FOUND"
      | "INVALID_INPUT"
      | "DUPLICATE_PATIENT",
    message?: string
  ) {
    super(message || code);
    this.name = "PatientServiceError";
  }
}

export interface IPatientRepository {
  createPatient(patient: Omit<Patient, "id" | "created_at" | "updated_at">): Promise<Patient>;
  updatePatient(id: string, updates: Partial<Patient>): Promise<Patient>;
  findPatientById(id: string): Promise<Patient | null>;
  searchPatients(clinicId: string, query: string, includeArchived?: boolean): Promise<Array<{
    patient: Patient;
    guardian: Guardian | null;
    siblingsCount: number;
  }>>;

  findGuardiansByPhone(clinicId: string, phone: string): Promise<Array<{
    guardian: Guardian;
    linkedPatients: Patient[];
  }>>;
  createGuardian(guardian: Omit<Guardian, "id" | "created_at" | "updated_at">): Promise<Guardian>;
  findGuardianById(id: string): Promise<Guardian | null>;

  linkPatientGuardian(link: Omit<PatientGuardianLink, "id" | "created_at">): Promise<PatientGuardianLink>;
  getPatientGuardians(patientId: string): Promise<Array<{ guardian: Guardian; relationship: string; is_primary: boolean }>>;

  findDuplicatePatient(
    clinicId: string,
    name: string,
    dateOfBirth: string,
    guardianPhone: string
  ): Promise<Patient | null>;

  appendAuditLog(entry: AuditLogEntry): Promise<void>;
}

export function calculateAgeFormatted(dobString: string, relativeTo: Date = new Date()): string {
  const dob = new Date(dobString);
  let years = relativeTo.getFullYear() - dob.getFullYear();
  let months = relativeTo.getMonth() - dob.getMonth();
  let days = relativeTo.getDate() - dob.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(relativeTo.getFullYear(), relativeTo.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = years * 12 + months;

  if (years >= 5) {
    return `${years} سنة`;
  } else if (years >= 2) {
    return months > 0 ? `${years} سنة و ${months} شهر` : `${years} سنة`;
  } else if (totalMonths >= 1) {
    return `${totalMonths} شهر`;
  } else {
    return `${days} يوم`;
  }
}

export class PatientService {
  constructor(private repo: IPatientRepository) {}

  private assertStaffAccess(actor: { id: string; clinicId: string | null; roles: UserRole[] }, targetClinicId: string) {
    const isPlatformAdmin = actor.roles.includes("platform_admin");
    const isClinicStaff =
      actor.clinicId === targetClinicId &&
      (actor.roles.includes("clinic_owner") ||
        actor.roles.includes("doctor") ||
        actor.roles.includes("receptionist"));

    if (!isPlatformAdmin && !isClinicStaff) {
      throw new PatientServiceError("FORBIDDEN", "Staff permission required for this clinic.");
    }
  }

  /**
   * Searches for existing guardians with the specified phone number within the clinic.
   * Enables seamless sibling detection at registration.
   */
  async findGuardiansByPhone(clinicId: string, phone: string, actor: { id: string; clinicId: string; roles: UserRole[] }) {
    this.assertStaffAccess(actor, clinicId);
    const cleanedPhone = phone.trim().replace(/\s+/g, "");
    return this.repo.findGuardiansByPhone(clinicId, cleanedPhone);
  }

  /**
   * Checks whether a duplicate patient exists before submission.
   */
  async checkDuplicatePatient(
    clinicId: string,
    name: string,
    dateOfBirth: string,
    guardianPhone: string,
    actor: { id: string; clinicId: string; roles: UserRole[] }
  ): Promise<Patient | null> {
    this.assertStaffAccess(actor, clinicId);
    const cleanedPhone = guardianPhone.trim().replace(/\s+/g, "");
    return this.repo.findDuplicatePatient(clinicId, name.trim(), dateOfBirth, cleanedPhone);
  }

  /**
   * Registers a patient and links to a guardian (creates new guardian or attaches to existing sibling guardian).
   */
  async registerPatient(input: RegisterPatientInput): Promise<{
    patient: Patient;
    guardian: Guardian;
    link: PatientGuardianLink;
  }> {
    const { patient: pData, guardian: gData, actor } = input;
    this.assertStaffAccess(actor, actor.clinicId);

    if (!pData.name || !pData.dateOfBirth || !pData.sex) {
      throw new PatientServiceError("INVALID_INPUT", "Patient name, DOB, and sex are required.");
    }

    if (!gData.phone || !gData.name) {
      throw new PatientServiceError("INVALID_INPUT", "Guardian name and phone are required.");
    }

    // 1. Resolve Guardian (Use existing if ID passed, or search existing matching phone, or create new)
    let guardian: Guardian;
    const cleanedPhone = gData.phone.trim().replace(/\s+/g, "");

    // Check duplicate patient before creation unless explicitly allowed
    if (!input.allowDuplicate) {
      const duplicate = await this.repo.findDuplicatePatient(
        actor.clinicId,
        pData.name.trim(),
        pData.dateOfBirth,
        cleanedPhone
      );
      if (duplicate) {
        throw new PatientServiceError(
          "DUPLICATE_PATIENT",
          "تم العثور على مريض مسجل مسبقاً بنفس الاسم وتاريخ الميلاد وولي الأمر."
        );
      }
    }

    if (gData.id) {
      const existing = await this.repo.findGuardianById(gData.id);
      if (!existing || existing.clinic_id !== actor.clinicId) {
        throw new PatientServiceError("GUARDIAN_NOT_FOUND");
      }
      guardian = existing;
    } else {
      // Check if existing guardian with exact phone and name exists
      const matches = await this.repo.findGuardiansByPhone(actor.clinicId, cleanedPhone);
      const exactMatch = matches.find((m) => m.guardian.name.toLowerCase() === gData.name.trim().toLowerCase());

      if (exactMatch) {
        guardian = exactMatch.guardian;
      } else {
        guardian = await this.repo.createGuardian({
          clinic_id: actor.clinicId,
          name: gData.name.trim(),
          phone: cleanedPhone,
          relation_notes: gData.relationNotes || null,
          archived_at: null,
          archived_by: null,
        });
      }
    }

    // 2. Create Patient
    const patient = await this.repo.createPatient({
      clinic_id: actor.clinicId,
      name: pData.name.trim(),
      date_of_birth: pData.dateOfBirth,
      sex: pData.sex,
      notes: pData.notes || null,
      archived_at: null,
      archived_by: null,
    });

    // 3. Link Patient to Guardian
    const link = await this.repo.linkPatientGuardian({
      clinic_id: actor.clinicId,
      patient_id: patient.id,
      guardian_id: guardian.id,
      relationship: gData.relationship || "parent",
      is_primary: true,
    });

    // 4. Audit Log
    await this.repo.appendAuditLog({
      clinic_id: actor.clinicId,
      actor_id: actor.id,
      action: "CREATE_PATIENT",
      entity_type: "patient",
      entity_id: patient.id,
      before_state: null,
      after_state: {
        name: patient.name,
        dob: patient.date_of_birth,
        sex: patient.sex,
        guardian_id: guardian.id,
        guardian_phone: guardian.phone,
      },
      metadata: {
        registered_by_role: actor.roles.join(", "),
      },
    });

    return { patient, guardian, link };
  }

  /**
   * Fast search by patient name or guardian phone.
   * Excludes archived patients unless explicitly asked.
   */
  async searchPatients(
    clinicId: string,
    query: string,
    actor: { id: string; clinicId: string; roles: UserRole[] },
    includeArchived = false
  ): Promise<PatientSearchResult[]> {
    this.assertStaffAccess(actor, clinicId);

    const rawResults = await this.repo.searchPatients(clinicId, query.trim(), includeArchived);

    return rawResults.map(({ patient, guardian, siblingsCount }) => ({
      id: patient.id,
      name: patient.name,
      dateOfBirth: patient.date_of_birth,
      sex: patient.sex,
      ageFormatted: calculateAgeFormatted(patient.date_of_birth),
      primaryGuardian: guardian
        ? {
            id: guardian.id,
            name: guardian.name,
            phone: guardian.phone,
            relationship: "ولي الأمر",
          }
        : null,
      siblingsCount,
    }));
  }

  /**
   * Soft-deletes (archives) a patient. Never hard-deletes.
   */
  async archivePatient(
    patientId: string,
    actor: { id: string; clinicId: string; roles: UserRole[] }
  ): Promise<Patient> {
    this.assertStaffAccess(actor, actor.clinicId);
    const existing = await this.repo.findPatientById(patientId);
    if (!existing || existing.clinic_id !== actor.clinicId) {
      throw new PatientServiceError("PATIENT_NOT_FOUND");
    }

    const now = new Date().toISOString();
    const updated = await this.repo.updatePatient(patientId, {
      archived_at: now,
      archived_by: actor.id,
    });

    await this.repo.appendAuditLog({
      clinic_id: actor.clinicId,
      actor_id: actor.id,
      action: "ARCHIVE_PATIENT",
      entity_type: "patient",
      entity_id: patientId,
      before_state: { archived_at: existing.archived_at },
      after_state: { archived_at: now, archived_by: actor.id },
    });

    return updated;
  }

  /**
   * Restores an archived patient.
   */
  async restorePatient(
    patientId: string,
    actor: { id: string; clinicId: string; roles: UserRole[] }
  ): Promise<Patient> {
    this.assertStaffAccess(actor, actor.clinicId);
    const existing = await this.repo.findPatientById(patientId);
    if (!existing || existing.clinic_id !== actor.clinicId) {
      throw new PatientServiceError("PATIENT_NOT_FOUND");
    }

    const updated = await this.repo.updatePatient(patientId, {
      archived_at: null,
      archived_by: null,
    });

    await this.repo.appendAuditLog({
      clinic_id: actor.clinicId,
      actor_id: actor.id,
      action: "RESTORE_PATIENT",
      entity_type: "patient",
      entity_id: patientId,
      before_state: { archived_at: existing.archived_at },
      after_state: { archived_at: null, archived_by: null },
    });

    return updated;
  }

  /**
   * Updates patient demographic notes and details.
   */
  async updatePatient(
    patientId: string,
    updates: { name?: string; dateOfBirth?: string; sex?: Sex; notes?: string },
    actor: { id: string; clinicId: string; roles: UserRole[] }
  ): Promise<Patient> {
    this.assertStaffAccess(actor, actor.clinicId);
    const existing = await this.repo.findPatientById(patientId);
    if (!existing || existing.clinic_id !== actor.clinicId) {
      throw new PatientServiceError("PATIENT_NOT_FOUND");
    }

    const payload: Partial<Patient> = {};
    if (updates.name) payload.name = updates.name.trim();
    if (updates.dateOfBirth) payload.date_of_birth = updates.dateOfBirth;
    if (updates.sex) payload.sex = updates.sex;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const updated = await this.repo.updatePatient(patientId, payload);

    await this.repo.appendAuditLog({
      clinic_id: actor.clinicId,
      actor_id: actor.id,
      action: "UPDATE_PATIENT",
      entity_type: "patient",
      entity_id: patientId,
      before_state: existing as any,
      after_state: updated as any,
    });

    return updated;
  }

  /**
   * Gets patient details along with linked guardians.
   */
  async getPatientWithGuardians(patientId: string, actor: { id: string; clinicId: string; roles: UserRole[] }) {
    this.assertStaffAccess(actor, actor.clinicId);
    const patient = await this.repo.findPatientById(patientId);
    if (!patient || patient.clinic_id !== actor.clinicId) {
      throw new PatientServiceError("PATIENT_NOT_FOUND");
    }

    const guardians = await this.repo.getPatientGuardians(patientId);
    return { patient, guardians };
  }
}
