import { describe, it, expect } from "vitest";
import {
  openPatientClinicalChart,
  saveVisitAndComplete,
  getClinicalTemplates,
  getAuditLogs,
  recordPrintPrescriptionAudit,
} from "./service";
import { QueueEntry } from "../queue/types";

describe("Phase 9: Clinical Service & Privacy Verification", () => {
  const doctorActor = {
    id: "user-doc-1",
    role: "doctor",
    clinicId: "clinic-1",
  };

  const receptionistActor = {
    id: "user-rec-1",
    role: "receptionist",
    clinicId: "clinic-1",
  };

  const platformAdminActor = {
    id: "user-admin-1",
    role: "platform_admin",
    clinicId: "clinic-1",
  };

  describe("Rule #2: Medical Privacy & Access Control", () => {
    it("strictly prohibits receptionist from opening clinical chart", () => {
      expect(() => {
        openPatientClinicalChart("pat-1", "clinic-1", receptionistActor);
      }).toThrow(/Permission denied: Role 'receptionist' is strictly prohibited/);
    });

    it("strictly prohibits platform_admin from opening clinical chart", () => {
      expect(() => {
        openPatientClinicalChart("pat-1", "clinic-1", platformAdminActor);
      }).toThrow(/Permission denied: Role 'platform_admin' is strictly prohibited/);
    });

    it("enforces tenant isolation: Doctor in Clinic 2 cannot open patient of Clinic 1", () => {
      const foreignDoctor = {
        id: "user-doc-foreign",
        role: "doctor",
        clinicId: "clinic-2",
      };

      expect(() => {
        openPatientClinicalChart("pat-1", "clinic-1", foreignDoctor);
      }).toThrow(/Tenant isolation error/);
    });
  });

  describe("Rule #6: Audit Log on Chart Open", () => {
    it("writes an append-only audit_log record when doctor opens a clinical record", () => {
      const initialLogsCount = getAuditLogs().length;

      const summary = openPatientClinicalChart("pat-1", "clinic-1", doctorActor);

      expect(summary).toBeDefined();
      expect(summary.patientId).toBe("pat-1");
      expect(summary.patientName).toBe("عمر أحمد خليل");
      expect(summary.allergies.length).toBeGreaterThan(0);
      expect(summary.allergies[0].allergen).toContain("البنسلين");

      const logs = getAuditLogs();
      expect(logs.length).toBe(initialLogsCount + 1);

      const latestLog = logs[logs.length - 1];
      expect(latestLog.action).toBe("open_clinical_record");
      expect(latestLog.entity).toBe("patient");
      expect(latestLog.entityId).toBe("pat-1");
      expect(latestLog.actorId).toBe("user-doc-1");
      expect(latestLog.clinicId).toBe("clinic-1");
      expect(latestLog.actorRole).toBe("doctor");
    });
  });

  describe("Visit Completion & Queue Synchronization", () => {
    const queueEntries: QueueEntry[] = [
      {
        id: "q-101",
        clinicId: "clinic-1",
        patientId: "pat-1",
        patientName: "عمر أحمد خليل",
        doctorId: "user-doc-1",
        appointmentId: "apt-1",
        scheduledTime: "2026-10-10T11:00:00Z",
        arrivalTime: "2026-10-10T10:45:00Z",
        calledTime: "2026-10-10T11:15:00Z",
        consultationStartTime: "2026-10-10T11:15:00Z",
        completedTime: null,
        leftTime: null,
        state: "in_consultation",
        priority: "normal",
        orderIndex: 0,
        autoClosed: false,
        urgentMultiplier: 1,
        createdAt: "2026-10-10T10:45:00Z",
        updatedAt: "2026-10-10T11:15:00Z",
      },
    ];

    it("saves visit, measurements, prescription items verbatim and transitions queue to completed", () => {
      const result = saveVisitAndComplete(
        {
          clinicId: "clinic-1",
          patientId: "pat-1",
          doctorId: "user-doc-1",
          queueEntryId: "q-101",
          visitType: "follow_up",
          chiefComplaint: "سعال ورشح مستمر",
          diagnosis: "نزلة برد حادة",
          price: 300,
          isPaid: true,
          followUpDate: "2026-10-17",
          notes: "الراحة التامة وتناول السوائل الدافئة",
          measurements: {
            weightKg: 16.5,
            heightCm: 103,
            temperatureC: 37.4,
            pulseBpm: 96,
            systolicBp: 95,
            diastolicBp: 60,
            oxygenSaturation: 98,
          },
          prescriptionItems: [
            {
              medicationName: "Cetal Syrup",
              dose: "5 مل",
              frequency: "كل 8 ساعات",
              duration: "3 أيام",
              instructions: "بعد الأكل لخفض الحرارة",
            },
          ],
        },
        doctorActor,
        queueEntries
      );

      // Verify Visit
      expect(result.visit).toBeDefined();
      expect(result.visit.chiefComplaint).toBe("سعال ورشح مستمر");
      expect(result.visit.diagnosis).toBe("نزلة برد حادة");
      expect(result.visit.price).toBe(300);
      expect(result.visit.isPaid).toBe(true);
      expect(result.visit.measurements?.weightKg).toBe(16.5);
      expect(result.visit.prescription?.items[0].medicationName).toBe("Cetal Syrup");

      // Verify Queue transition to completed
      expect(result.updatedQueueEntry).toBeDefined();
      expect(result.updatedQueueEntry?.state).toBe("completed");
      expect(result.updatedQueueEntry?.completedTime).toBeDefined();

      // Verify Audit record
      const logs = getAuditLogs();
      const visitLog = logs.find((l) => l.action === "complete_visit");
      expect(visitLog).toBeDefined();
      expect(visitLog?.entityId).toBe(result.visit.id);
    });

    it("rejects non-doctor when saving visit", () => {
      expect(() => {
        saveVisitAndComplete(
          {
            clinicId: "clinic-1",
            patientId: "pat-1",
            doctorId: "user-doc-1",
            visitType: "new",
            chiefComplaint: "اختبار",
            price: 200,
            isPaid: false,
          },
          receptionistActor
        );
      }).toThrow(/Only doctors can save clinical visits/);
    });
  });

  describe("Clinical Templates", () => {
    it("loads clinic-editable templates for visits and common diagnoses", () => {
      const templates = getClinicalTemplates("clinic-1");
      expect(templates.length).toBeGreaterThan(0);

      const giProtocol = templates.find((t) => t.name.includes("معوية"));
      expect(giProtocol).toBeDefined();
      expect(giProtocol?.content.prescriptionItems?.length).toBeGreaterThan(0);

      const commonDiag = templates.find((t) => t.templateType === "diagnosis");
      expect(commonDiag).toBeDefined();
    });
  });

  describe("Phase 10: Prescription Printing & Audit Logging", () => {
    it("logs audit entry when doctor prints a prescription", () => {
      const initialCount = getAuditLogs().length;

      const record = recordPrintPrescriptionAudit(
        doctorActor,
        "pat-1",
        "pr-101",
        { paperSize: "A4", isReprint: false }
      );

      expect(record).toBeDefined();
      expect(record.action).toBe("print_prescription");
      expect(record.entity).toBe("prescription");
      expect(record.entityId).toBe("pr-101");
      expect(record.details?.paperSize).toBe("A4");
      expect(record.details?.isReprint).toBe(false);

      const logs = getAuditLogs();
      expect(logs.length).toBe(initialCount + 1);
    });

    it("logs audit entry when doctor reprints a prescription from history", () => {
      const record = recordPrintPrescriptionAudit(
        doctorActor,
        "pat-1",
        "pr-101",
        { paperSize: "A5", isReprint: true }
      );

      expect(record.action).toBe("reprint_prescription");
      expect(record.details?.isReprint).toBe(true);
      expect(record.details?.paperSize).toBe("A5");
    });

    it("strictly rejects non-doctor from printing prescriptions", () => {
      expect(() => {
        recordPrintPrescriptionAudit(
          receptionistActor,
          "pat-1",
          "pr-101"
        );
      }).toThrow(/Only doctors may print or reprint prescriptions/);
    });
  });
});

