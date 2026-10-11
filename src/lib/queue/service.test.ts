import { describe, it, expect, beforeEach } from "vitest";
import { QueueService, IQueueRepository } from "./service";
import {
  Appointment,
  QueueClinicSettings,
  QueueEntry,
  QueueTransitionEvent,
} from "./types";
import { UserRole } from "../invitations/types";

class MockQueueRepository implements IQueueRepository {
  public appointments: Map<string, Appointment> = new Map();
  public queueEntries: Map<string, QueueEntry> = new Map();
  public queueEvents: QueueTransitionEvent[] = [];
  public settings: QueueClinicSettings = {
    arrive_before_minutes: 15,
    skip_alert_minutes: 60,
    urgent_enabled: true,
    urgent_fee_multiplier: 3,
    end_of_day_time: "22:00",
  };

  async createAppointment(appointment: Omit<Appointment, "id" | "createdAt" | "updatedAt">): Promise<Appointment> {
    const id = `apt-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const full: Appointment = {
      ...appointment,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.appointments.set(id, full);
    return full;
  }

  async findAppointmentById(id: string): Promise<Appointment | null> {
    return this.appointments.get(id) || null;
  }

  async getAppointmentsForDate(clinicId: string, _date: string, doctorId?: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (a) => a.clinicId === clinicId && (!doctorId || a.doctorId === doctorId)
    );
  }

  async createQueueEntry(entry: Omit<QueueEntry, "id" | "createdAt" | "updatedAt">): Promise<QueueEntry> {
    const id = `qentry-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const full: QueueEntry = {
      ...entry,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.queueEntries.set(id, full);
    return full;
  }

  async findQueueEntryById(id: string): Promise<QueueEntry | null> {
    return this.queueEntries.get(id) || null;
  }

  async getQueueEntriesByClinic(clinicId: string, doctorId?: string): Promise<QueueEntry[]> {
    return Array.from(this.queueEntries.values()).filter(
      (e) => e.clinicId === clinicId && (!doctorId || e.doctorId === doctorId)
    );
  }

  async updateQueueEntry(id: string, updates: Partial<QueueEntry>): Promise<QueueEntry> {
    const existing = this.queueEntries.get(id);
    if (!existing) throw new Error("Entry not found");
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.queueEntries.set(id, updated);
    return updated;
  }

  async appendQueueEvent(event: QueueTransitionEvent): Promise<void> {
    this.queueEvents.push(event);
  }

  async getQueueEvents(queueEntryId: string): Promise<QueueTransitionEvent[]> {
    return this.queueEvents.filter((e) => e.queueEntryId === queueEntryId);
  }

  async getClinicQueueSettings(_clinicId: string): Promise<QueueClinicSettings> {
    return this.settings;
  }
}

describe("Phase 7: QueueService & queue_events Audit Trail", () => {
  let repo: MockQueueRepository;
  let service: QueueService;

  const CLINIC_ID = "clinic-peds-1";
  const RECEPTIONIST = {
    id: "user-reception-1",
    clinicId: CLINIC_ID,
    roles: ["receptionist" as UserRole],
  };
  const DOCTOR = {
    id: "user-doctor-1",
    clinicId: CLINIC_ID,
    roles: ["doctor" as UserRole],
  };

  beforeEach(() => {
    repo = new MockQueueRepository();
    service = new QueueService(repo);
  });

  it("handles complete journey: appointment booking -> check-in -> call next -> complete consultation", async () => {
    // 1. Receptionist books appointment
    const appointment = await service.bookAppointment(
      CLINIC_ID,
      {
        patientId: "pat-101",
        scheduledTime: "2026-10-10T17:00:00Z",
        doctorId: DOCTOR.id,
        notes: "كشف أطفال أولي",
      },
      RECEPTIONIST
    );
    expect(appointment.id).toBeDefined();

    // 2. Patient arrives at clinic and checks in
    const { entry: checkedIn, event: checkInEvent } = await service.checkInPatient(
      CLINIC_ID,
      {
        patientId: "pat-101",
        patientName: "عمر أحمد خليل",
        appointmentId: appointment.id,
        scheduledTime: appointment.scheduledTime,
        doctorId: DOCTOR.id,
      },
      RECEPTIONIST
    );
    expect(checkedIn.state).toBe("waiting");
    expect(checkInEvent.eventType).toBe("CHECK_IN");

    // 3. Doctor calls the patient
    const { entry: inConsult, event: callEvent } = await service.callNextPatient(
      CLINIC_ID,
      checkedIn.id,
      DOCTOR
    );
    expect(inConsult.state).toBe("in_consultation");
    expect(callEvent.eventType).toBe("CALL_NEXT");

    // 4. Doctor completes consultation
    const { entry: completed, event: completeEvent } = await service.completeConsultation(
      CLINIC_ID,
      checkedIn.id,
      DOCTOR
    );
    expect(completed.state).toBe("completed");
    expect(completeEvent.eventType).toBe("COMPLETE");

    // Verification of append-only audit trail in queue_events:
    const history = await repo.getQueueEvents(checkedIn.id);
    expect(history).toHaveLength(3);
    expect(history.map((h) => h.eventType)).toEqual(["CHECK_IN", "CALL_NEXT", "COMPLETE"]);
    expect(history[0].actorRole).toBe("receptionist");
    expect(history[1].actorRole).toBe("doctor");
    expect(history[2].actorRole).toBe("doctor");
  });

  it("records MANUAL_REORDER transition with mandatory reason and actor", async () => {
    const { entry } = await service.checkInPatient(
      CLINIC_ID,
      { patientId: "pat-201", patientName: "كريم سامي" },
      RECEPTIONIST
    );

    const { event } = await service.manualReorder(
      CLINIC_ID,
      entry.id,
      1,
      "تقديم بطلب من إدارة العيادة لظرف طارئ",
      RECEPTIONIST
    );

    expect(event.eventType).toBe("MANUAL_REORDER");
    expect(event.reason).toBe("تقديم بطلب من إدارة العيادة لظرف طارئ");
    expect(event.actorId).toBe(RECEPTIONIST.id);
    expect(repo.queueEvents.some((e) => e.eventType === "MANUAL_REORDER")).toBe(true);
  });

  it("runs end-of-day job and writes AUTO_CLOSE events for all remaining waiting patients", async () => {
    // Check in 2 patients who end up not being seen
    await service.checkInPatient(
      CLINIC_ID,
      { patientId: "pat-1", patientName: "مريض 1" },
      RECEPTIONIST
    );
    await service.checkInPatient(
      CLINIC_ID,
      { patientId: "pat-2", patientName: "مريض 2" },
      RECEPTIONIST
    );

    const result = await service.runEndOfDay(CLINIC_ID, {
      id: "cron-service",
      role: "system",
    });

    expect(result.updatedCount).toBe(2);
    expect(repo.queueEvents.filter((e) => e.eventType === "AUTO_CLOSE")).toHaveLength(2);

    const live = await service.getLiveQueue(CLINIC_ID, undefined, RECEPTIONIST);
    // None in waiting state anymore
    expect(live.filter((e) => e.state === "waiting")).toHaveLength(0);
    // All marked left with autoClosed true
    const all = Array.from(repo.queueEntries.values());
    expect(all.every((e) => e.state === "left" && e.autoClosed === true)).toBe(true);
  });
});
