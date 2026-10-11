/**
 * Clinical Service for Med SaaS.
 * 
 * Rules:
 * - AGENTS.md Rule #1: Roles first. Only doctors can view or write clinical records.
 * - AGENTS.md Rule #2: Medical privacy. Receptionists and platform admins are strictly denied.
 * - AGENTS.md Rule #3: Tenant isolation. Doctors in clinic A cannot read or write clinic B patients.
 * - AGENTS.md Rule #6: Audit log on opening a patient clinical record.
 * - AGENTS.md Rule #8: Do not auto-edit clinical text. Doctor's typed text is stored verbatim.
 */

import {
  Allergy,
  ClinicalTemplate,
  Measurement,
  MedicalHistoryCondition,
  PatientClinicalSummary,
  Prescription,
  PrescriptionItem,
  SaveVisitInput,
  Visit,
} from "./types";
import { QueueEntry } from "../queue/types";
import { transitionQueueState } from "../queue/engine";

export interface AuditRecord {
  id: string;
  clinicId: string;
  actorId: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  details?: Record<string, any>;
}

// In-memory Append-Only Audit Store (mirrors public.audit_log table)
const auditLogs: AuditRecord[] = [];

export function getAuditLogs(): readonly AuditRecord[] {
  return auditLogs;
}

export function logAuditAction(entry: Omit<AuditRecord, "id" | "timestamp">): AuditRecord {
  const record: AuditRecord = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  auditLogs.push(record);
  return record;
}

// Seed Clinical Data store per patient
const patientClinicalSummaries: Map<string, PatientClinicalSummary> = new Map([
  [
    "pat-1", // عمر أحمد خليل (عمره 4 سنوات)
    {
      patientId: "pat-1",
      patientName: "عمر أحمد خليل",
      dateOfBirth: "2022-04-15",
      gender: "ذكر",
      allergies: [
        {
          id: "alg-1",
          clinicId: "clinic-1",
          patientId: "pat-1",
          allergen: "البنسلين ومشتقاته (Penicillin)",
          severity: "severe",
          reaction: "طفح جلدي حاد وضيق في التنفس (تورم وعائي)",
          notes: "تم التشخيص في مستشفى الأطفال التخصصي عام 2023",
          createdAt: "2023-08-10T10:00:00Z",
        },
      ],
      chronicConditions: [
        {
          id: "ch-1",
          clinicId: "clinic-1",
          patientId: "pat-1",
          conditionName: "حساسية صدرية (ربو شعبي أطفال)",
          conditionType: "chronic",
          diagnosedDate: "2023-11-01",
          currentMedication: "بخاخ فينتولين عند اللزوم (Ventolin Inhaler 100mcg)",
          notes: "تتفاقم مع نزلات البرد وتغير الفصول",
          createdAt: "2023-11-01T12:00:00Z",
        },
      ],
      currentMedications: ["Ventolin Inhaler 100mcg"],
      visits: [
        {
          id: "vis-101",
          clinicId: "clinic-1",
          patientId: "pat-1",
          doctorId: "doc-1",
          visitDate: "2026-08-20T11:00:00Z",
          visitType: "new",
          chiefComplaint: "سعال جاف متكرر وضيق بالتنفس ليلًا منذ 3 أيام",
          diagnosis: "نوبة ربو خفيفة مصاحبة لنزلة برد",
          price: 300,
          isPaid: true,
          followUpDate: "2026-08-27",
          notes: "تحسن ملحوظ بعد جلسة الاستنشاق الأولى بالعيادة",
          measurements: {
            id: "m-101",
            clinicId: "clinic-1",
            patientId: "pat-1",
            visitId: "vis-101",
            recordedAt: "2026-08-20T11:05:00Z",
            weightKg: 15.5,
            heightCm: 101,
            temperatureC: 37.2,
            pulseBpm: 98,
            systolicBp: 95,
            diastolicBp: 60,
            oxygenSaturation: 97,
          },
          prescription: {
            id: "pr-101",
            clinicId: "clinic-1",
            visitId: "vis-101",
            patientId: "pat-1",
            doctorId: "doc-1",
            createdAt: "2026-08-20T11:20:00Z",
            items: [
              {
                id: "pi-1",
                medicationName: "Ventolin Syrup",
                dose: "2.5 مل",
                frequency: "3 مرات يومياً",
                duration: "5 أيام",
                instructions: "بعد الأكل",
              },
              {
                id: "pi-2",
                medicationName: "Cetal Drops",
                dose: "15 نقطة",
                frequency: "عند اللزوم كل 6 ساعات",
                duration: "3 أيام",
                instructions: "لخفض الحرارة وتسكين الألم",
              },
            ],
          },
          createdAt: "2026-08-20T11:00:00Z",
          updatedAt: "2026-08-20T11:25:00Z",
        },
        {
          id: "vis-102",
          clinicId: "clinic-1",
          patientId: "pat-1",
          doctorId: "doc-1",
          visitDate: "2026-09-15T10:30:00Z",
          visitType: "follow_up",
          chiefComplaint: "متابعة الصدر وفحص روتيني للنمو",
          diagnosis: "حالة الصدر مستقرة تمامًا ولا يوجد أزيز",
          price: 150,
          isPaid: true,
          followUpDate: "2026-10-15",
          notes: "الطفل يمارس نشاطه اليومي بشكل طبيعي",
          measurements: {
            id: "m-102",
            clinicId: "clinic-1",
            patientId: "pat-1",
            visitId: "vis-102",
            recordedAt: "2026-09-15T10:35:00Z",
            weightKg: 16.0,
            heightCm: 102.5,
            temperatureC: 36.8,
            pulseBpm: 92,
            systolicBp: 96,
            diastolicBp: 62,
            oxygenSaturation: 99,
          },
          createdAt: "2026-09-15T10:30:00Z",
          updatedAt: "2026-09-15T10:45:00Z",
        },
      ],
      measurementsTimeline: [
        {
          id: "m-100",
          clinicId: "clinic-1",
          patientId: "pat-1",
          recordedAt: "2026-06-10T10:00:00Z",
          weightKg: 14.8,
          heightCm: 99.0,
          temperatureC: 36.7,
          pulseBpm: 95,
          systolicBp: 92,
          diastolicBp: 58,
          oxygenSaturation: 98,
        },
        {
          id: "m-101",
          clinicId: "clinic-1",
          patientId: "pat-1",
          recordedAt: "2026-08-20T11:05:00Z",
          weightKg: 15.5,
          heightCm: 101.0,
          temperatureC: 37.2,
          pulseBpm: 98,
          systolicBp: 95,
          diastolicBp: 60,
          oxygenSaturation: 97,
        },
        {
          id: "m-102",
          clinicId: "clinic-1",
          patientId: "pat-1",
          recordedAt: "2026-09-15T10:35:00Z",
          weightKg: 16.0,
          heightCm: 102.5,
          temperatureC: 36.8,
          pulseBpm: 92,
          systolicBp: 96,
          diastolicBp: 62,
          oxygenSaturation: 99,
        },
      ],
      labResults: [
        {
          id: "lr-1",
          clinicId: "clinic-1",
          patientId: "pat-1",
          testName: "Complete Blood Count (CBC)",
          resultValue: "Hb: 12.1 g/dL, WBC: 7.2 x10^3/uL, Platelets: 280 x10^3/uL",
          unit: "Standard",
          referenceRange: "Normal pediatric range",
          resultDate: "2026-08-21T09:00:00Z",
          notes: "لا توجد علامات أنيميا أو عدوى بكتيرية حادة",
        },
      ],
    },
  ],
  [
    "pat-2", // ياسين كريم شريف
    {
      patientId: "pat-2",
      patientName: "ياسين كريم شريف",
      dateOfBirth: "2021-10-05",
      gender: "ذكر",
      allergies: [],
      chronicConditions: [],
      currentMedications: [],
      visits: [],
      measurementsTimeline: [
        {
          id: "m-201",
          clinicId: "clinic-1",
          patientId: "pat-2",
          recordedAt: "2026-05-12T11:00:00Z",
          weightKg: 17.2,
          heightCm: 106.0,
          temperatureC: 37.0,
          pulseBpm: 90,
          systolicBp: 98,
          diastolicBp: 64,
          oxygenSaturation: 98,
        },
      ],
      labResults: [],
    },
  ],
  [
    "pat-3", // نور أحمد خليل
    {
      patientId: "pat-3",
      patientName: "نور أحمد خليل",
      dateOfBirth: "2024-02-10",
      gender: "أنثى",
      allergies: [
        {
          id: "alg-3",
          clinicId: "clinic-1",
          patientId: "pat-3",
          allergen: "بروتين حليب البقر (CMPA)",
          severity: "moderate",
          reaction: "مغص حاد وطفح جلدي وإسهال مخاطي",
          notes: "الاعتماد على حليب خاص مهدرج كليًا",
          createdAt: "2024-05-01T10:00:00Z",
        },
      ],
      chronicConditions: [],
      currentMedications: [],
      visits: [],
      measurementsTimeline: [
        {
          id: "m-301",
          clinicId: "clinic-1",
          patientId: "pat-3",
          recordedAt: "2026-07-01T10:00:00Z",
          weightKg: 10.5,
          heightCm: 81.0,
          temperatureC: 36.9,
          pulseBpm: 105,
          systolicBp: 88,
          diastolicBp: 55,
          oxygenSaturation: 99,
        },
      ],
      labResults: [],
    },
  ],
]);

// Saved Clinical Templates (clinic-editable)
const clinicalTemplates: ClinicalTemplate[] = [
  {
    id: "tpl-1",
    clinicId: "clinic-1",
    templateType: "visit",
    name: "بروتوكول نزلة معوية حادة (Gastroenteritis)",
    content: {
      chiefComplaint: "قيء متكرر وإسهال مائي منذ يومين مع فقدان للشهية",
      diagnosis: "نزلة معوية حادة مع جفاف خفيف (Acute Gastroenteritis)",
      prescriptionItems: [
        {
          medicationName: "Rehydran N Sachet (محلول جفاف)",
          dose: "كيس على 200 مل ماء مغلي ومبرد",
          frequency: "بعد كل مرة قيء أو إسهال",
          duration: "3 أيام",
          instructions: "يُعطى بالملعقة ببطء",
        },
        {
          medicationName: "Motinorm Suspension (مضاد للقيء)",
          dose: "2.5 مل",
          frequency: "قبل الرضاعة / الأكل بـ 15 دقيقة 3 مرات",
          duration: "يومين فقط",
          instructions: "يوقف فور توقف القيء",
        },
        {
          medicationName: "Enterogermina Vials (بروبيوتيك)",
          dose: "أمبولة واحدة بالفم",
          frequency: "مرة واحدة يومياً",
          duration: "5 أيام",
          instructions: "لإعادة توازن بكتيريا الأمعاء النافعة",
        },
      ],
      notes: "التركيز على السوائل ومحلول الجفاف وتجنب العصائر المحلاة والأطعمة الدسمة.",
    },
  },
  {
    id: "tpl-2",
    clinicId: "clinic-1",
    templateType: "visit",
    name: "بروتوكول التهاب الحلق واللوزتين (Tonsillitis)",
    content: {
      chiefComplaint: "ارتفاع في درجة الحرارة وصعوبة بالبلع وألم بالحلق",
      diagnosis: "التهاب اللوزتين الحاد (Acute Tonsillitis)",
      prescriptionItems: [
        {
          medicationName: "Augmentin 457mg Suspension",
          dose: "5 مل",
          frequency: "كل 12 ساعة (مرتين يومياً)",
          duration: "7 أيام",
          instructions: "بعد الأكل والالتزام بإنهاء الكورس كاملاً",
        },
        {
          medicationName: "Brufen Syrup",
          dose: "5 مل",
          frequency: "كل 8 ساعات بعد الأكل",
          duration: "3 أيام",
          instructions: "خافض للحرارة ومضاد للالتهاب",
        },
        {
          medicationName: "BBC Oral Spray",
          dose: "بختان بالفم",
          frequency: "3 مرات يومياً",
          duration: "4 أيام",
          instructions: "مسكن ومطهر موضعي للحلق",
        },
      ],
      notes: "الإكثار من المشروبات الدافئة والراحة التامة والعودة في حالة عدم هبوط الحرارة بعد 48 ساعة.",
    },
  },
  {
    id: "tpl-3",
    clinicId: "clinic-1",
    templateType: "diagnosis",
    name: "التشخيصات الشائعة لعيادة الأطفال",
    content: {
      commonDiagnoses: [
        "التهاب الحلق واللوزتين الحاد (Acute Tonsillitis)",
        "نزلة معوية حادة (Acute Gastroenteritis)",
        "نزلة برد والتهاب الشعب الهوائية (Bronchitis)",
        "نوبة ربو شعبي حادة (Acute Asthma Exacerbation)",
        "التهاب الأذن الوسطى الحاد (Acute Otitis Media)",
        "حساسية جلدية / إكزيما (Atopic Dermatitis)",
        "فحص روتيني وتقييم نمو (Routine Well-Child Checkup)",
        "أنيميا نقص الحديد (Iron Deficiency Anemia)",
      ] as any,
    },
  },
];

/**
 * Access a patient's clinical summary.
 * 
 * Enforces:
 * - AGENTS.md Rule #1: Actor role MUST be 'doctor'
 * - AGENTS.md Rule #2: Receptionists & platform_admin are rejected with PermissionDenied
 * - AGENTS.md Rule #3: Tenant isolation: Doctor's clinic MUST match patient clinic
 * - AGENTS.md Rule #6: Writes an audit_log record for 'open_clinical_record'
 */
export function openPatientClinicalChart(
  patientId: string,
  clinicId: string,
  actor: { id: string; role: string; clinicId: string }
): PatientClinicalSummary {
  // Rule #2: Receptionist and platform_admin must NEVER be able to read clinical data
  if (actor.role === "receptionist" || actor.role === "platform_admin") {
    throw new Error(
      `Permission denied: Role '${actor.role}' is strictly prohibited from accessing clinical records.`
    );
  }

  if (actor.role !== "doctor") {
    throw new Error(
      `Permission denied: Only role 'doctor' may access clinical records. Current role: '${actor.role}'.`
    );
  }

  // Rule #3: Tenant isolation
  if (actor.clinicId !== clinicId) {
    throw new Error(
      `Tenant isolation error: Actor clinic '${actor.clinicId}' does not match patient clinic '${clinicId}'.`
    );
  }

  let summary = patientClinicalSummaries.get(patientId);
  if (!summary) {
    // Generate a default summary if not yet initialized
    summary = {
      patientId,
      patientName: "مريض مجهول",
      allergies: [],
      chronicConditions: [],
      currentMedications: [],
      visits: [],
      measurementsTimeline: [],
      labResults: [],
    };
    patientClinicalSummaries.set(patientId, summary);
  }

  // Rule #6: Audit log on opening a patient clinical record
  logAuditAction({
    clinicId,
    actorId: actor.id,
    actorRole: actor.role,
    action: "open_clinical_record",
    entity: "patient",
    entityId: patientId,
    details: {
      patientName: summary.patientName,
      hasAllergies: summary.allergies.length > 0,
      timestamp: new Date().toISOString(),
    },
  });

  return summary;
}

/**
 * Saves a completed visit, measurements, and prescription items.
 * 
 * Enforces:
 * - AGENTS.md Rule #8: Verbatim doctor text (no auto-editing)
 * - Transitions queue entry to 'completed' with price and paid status
 * - Appends audit_log entry for completed visit
 */
export function saveVisitAndComplete(
  input: SaveVisitInput,
  actor: { id: string; role: string; clinicId: string },
  queueEntries?: QueueEntry[]
): {
  visit: Visit;
  updatedQueueEntry?: QueueEntry;
  updatedQueueList?: QueueEntry[];
} {
  if (actor.role !== "doctor") {
    throw new Error("Permission denied: Only doctors can save clinical visits.");
  }
  if (actor.clinicId !== input.clinicId) {
    throw new Error("Tenant isolation violation.");
  }

  const visitId = `vis-${Date.now()}`;
  const now = new Date().toISOString();

  // Create Measurement record if provided
  let measurementRecord: Measurement | undefined;
  if (input.measurements) {
    measurementRecord = {
      id: `m-${Date.now()}`,
      clinicId: input.clinicId,
      patientId: input.patientId,
      visitId,
      recordedAt: now,
      ...input.measurements,
    };
  }

  // Create Prescription and items verbatim (Rule #8)
  let prescriptionRecord: Prescription | undefined;
  if (input.prescriptionItems && input.prescriptionItems.length > 0) {
    const prescId = `pr-${Date.now()}`;
    prescriptionRecord = {
      id: prescId,
      clinicId: input.clinicId,
      visitId,
      patientId: input.patientId,
      doctorId: input.doctorId,
      createdAt: now,
      items: input.prescriptionItems.map((item, idx) => ({
        id: `pi-${Date.now()}-${idx}`,
        prescriptionId: prescId,
        medicationName: item.medicationName,
        dose: item.dose,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.instructions,
      })),
    };
  }

  const visit: Visit = {
    id: visitId,
    clinicId: input.clinicId,
    patientId: input.patientId,
    doctorId: input.doctorId,
    queueEntryId: input.queueEntryId,
    visitDate: now,
    visitType: input.visitType,
    chiefComplaint: input.chiefComplaint,
    diagnosis: input.diagnosis,
    price: input.price,
    isPaid: input.isPaid,
    followUpDate: input.followUpDate,
    notes: input.notes,
    measurements: measurementRecord,
    prescription: prescriptionRecord,
    createdAt: now,
    updatedAt: now,
  };

  // Update in-memory patient summary
  const summary = patientClinicalSummaries.get(input.patientId);
  if (summary) {
    summary.visits.unshift(visit);
    if (measurementRecord) {
      summary.measurementsTimeline.push(measurementRecord);
    }
  }

  // Complete Queue Entry if queueEntryId and queueEntries are supplied
  let updatedQueueEntry: QueueEntry | undefined;
  let updatedQueueList: QueueEntry[] | undefined;

  if (input.queueEntryId && queueEntries) {
    const target = queueEntries.find((e) => e.id === input.queueEntryId);
    if (target) {
      const transitionResult = transitionQueueState(
        target,
        "completed",
        { id: actor.id, role: "doctor" },
        { reason: "Visit consultation successfully completed by doctor" }
      );

      updatedQueueEntry = {
        ...transitionResult.updatedEntry,
        completedTime: now,
      };

      updatedQueueList = queueEntries.map((e) =>
        e.id === target.id ? updatedQueueEntry! : e
      );
    }
  }

  // Audit visit completion
  logAuditAction({
    clinicId: input.clinicId,
    actorId: actor.id,
    actorRole: actor.role,
    action: "complete_visit",
    entity: "visit",
    entityId: visitId,
    details: {
      patientId: input.patientId,
      queueEntryId: input.queueEntryId,
      price: input.price,
      isPaid: input.isPaid,
      itemCount: input.prescriptionItems?.length || 0,
    },
  });

  return {
    visit,
    updatedQueueEntry,
    updatedQueueList,
  };
}

/**
 * Returns clinic-editable clinical templates.
 */
export function getClinicalTemplates(clinicId: string): ClinicalTemplate[] {
  return clinicalTemplates.filter((t) => t.clinicId === clinicId);
}

/**
 * Saves a new template for the clinic.
 */
export function saveClinicalTemplate(
  template: Omit<ClinicalTemplate, "id">
): ClinicalTemplate {
  const newTpl: ClinicalTemplate = {
    ...template,
    id: `tpl-${Date.now()}`,
  };
  clinicalTemplates.push(newTpl);
  return newTpl;
}

/**
 * Audit log recording for printing or reprinting a prescription.
 * Non-negotiable Rule #6 (AGENTS.md).
 */
export function recordPrintPrescriptionAudit(
  actor: { id: string; role: string; clinicId: string },
  patientId: string,
  prescriptionId: string,
  options?: { isReprint?: boolean; paperSize?: "A4" | "A5" }
): AuditRecord {
  if (actor.role !== "doctor") {
    throw new Error("Permission denied: Only doctors may print or reprint prescriptions.");
  }

  return logAuditAction({
    clinicId: actor.clinicId,
    actorId: actor.id,
    actorRole: actor.role,
    action: options?.isReprint ? "reprint_prescription" : "print_prescription",
    entity: "prescription",
    entityId: prescriptionId,
    details: {
      patientId,
      isReprint: options?.isReprint || false,
      paperSize: options?.paperSize || "A4",
      printedAt: new Date().toISOString(),
    },
  });
}

