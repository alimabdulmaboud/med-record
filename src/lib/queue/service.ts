import {
  Appointment,
  QueueClinicSettings,
  QueueEntry,
  QueuePriority,
  QueueSkipAlert,
  QueueState,
  QueueTransitionEvent,
} from "./types";
import {
  computeQueueOrder,
  detectSkipAlerts,
  reorderQueueEntry,
  runEndOfDayJob,
  setEntryPriority,
  snoozeSkipAlert,
  transitionQueueState,
  QueueEngineError,
} from "./engine";
import { UserRole } from "../invitations/types";

export interface IQueueRepository {
  // Appointments
  createAppointment(appointment: Omit<Appointment, "id" | "createdAt" | "updatedAt">): Promise<Appointment>;
  findAppointmentById(id: string): Promise<Appointment | null>;
  getAppointmentsForDate(clinicId: string, date: string, doctorId?: string): Promise<Appointment[]>;

  // Queue Entries
  createQueueEntry(entry: Omit<QueueEntry, "id" | "createdAt" | "updatedAt">): Promise<QueueEntry>;
  findQueueEntryById(id: string): Promise<QueueEntry | null>;
  getQueueEntriesByClinic(clinicId: string, doctorId?: string): Promise<QueueEntry[]>;
  updateQueueEntry(id: string, updates: Partial<QueueEntry>): Promise<QueueEntry>;

  // Queue Events (Append-only)
  appendQueueEvent(event: QueueTransitionEvent): Promise<void>;
  getQueueEvents(queueEntryId: string): Promise<QueueTransitionEvent[]>;

  // Clinic Settings
  getClinicQueueSettings(clinicId: string): Promise<QueueClinicSettings>;
}

export class QueueService {
  constructor(private repo: IQueueRepository) {}

  private assertStaffAccess(
    actor: { id: string; clinicId: string | null; roles: UserRole[] },
    targetClinicId: string
  ) {
    const isPlatformAdmin = actor.roles.includes("platform_admin");
    const isClinicStaff =
      actor.clinicId === targetClinicId &&
      (actor.roles.includes("clinic_owner") ||
        actor.roles.includes("doctor") ||
        actor.roles.includes("receptionist"));

    if (!isPlatformAdmin && !isClinicStaff) {
      throw new QueueEngineError(
        "INVALID_INPUT",
        "Staff permission required for queue operations in this clinic."
      );
    }
  }

  /**
   * Books a scheduled appointment.
   */
  async bookAppointment(
    clinicId: string,
    data: {
      patientId: string;
      scheduledTime: string;
      doctorId?: string;
      notes?: string;
    },
    actor: { id: string; clinicId: string; roles: UserRole[] }
  ): Promise<Appointment> {
    this.assertStaffAccess(actor, clinicId);

    return this.repo.createAppointment({
      clinicId,
      patientId: data.patientId,
      doctorId: data.doctorId || null,
      scheduledTime: data.scheduledTime,
      status: "booked",
      notes: data.notes || null,
      archivedAt: null,
      archivedBy: null,
    });
  }

  /**
   * Checks in a patient (arrival at clinic).
   * Computes placement in live queue based on arrival time and grace rules.
   */
  async checkInPatient(
    clinicId: string,
    data: {
      patientId: string;
      patientName: string;
      appointmentId?: string;
      scheduledTime?: string;
      doctorId?: string;
      priority?: QueuePriority;
    },
    actor: { id: string; clinicId: string; roles: UserRole[] }
  ): Promise<{ entry: QueueEntry; event: QueueTransitionEvent }> {
    this.assertStaffAccess(actor, clinicId);
    const settings = await this.repo.getClinicQueueSettings(clinicId);
    const now = new Date().toISOString();

    const initialEntry = await this.repo.createQueueEntry({
      clinicId,
      patientId: data.patientId,
      patientName: data.patientName,
      doctorId: data.doctorId || null,
      appointmentId: data.appointmentId || null,
      scheduledTime: data.scheduledTime || null,
      arrivalTime: now,
      calledTime: null,
      consultationStartTime: null,
      completedTime: null,
      leftTime: null,
      state: "waiting",
      priority: data.priority || "normal",
      orderIndex: 9999, // Assigned dynamically by computeQueueOrder
      autoClosed: false,
      urgentMultiplier: data.priority === "urgent" ? settings.urgent_fee_multiplier : 1,
    });

    // Recompute ordering for active waiting queue
    const allEntries = await this.repo.getQueueEntriesByClinic(clinicId, data.doctorId);
    const ordered = computeQueueOrder(allEntries, settings);

    const updatedTarget = ordered.find((e) => e.id === initialEntry.id) || initialEntry;
    await this.repo.updateQueueEntry(initialEntry.id, {
      orderIndex: updatedTarget.orderIndex,
    });

    const event: QueueTransitionEvent = {
      id: `qevt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      clinicId,
      queueEntryId: initialEntry.id,
      actorId: actor.id,
      actorRole: actor.roles[0],
      eventType: "CHECK_IN",
      fromState: data.appointmentId ? "booked" : undefined,
      toState: "waiting",
      toOrderIndex: updatedTarget.orderIndex,
      createdAt: now,
    };

    await this.repo.appendQueueEvent(event);

    return { entry: updatedTarget, event };
  }

  /**
   * Fetches the current live queue, ordered by the pure queue engine.
   */
  async getLiveQueue(
    clinicId: string,
    doctorId: string | undefined,
    actor: { id: string; clinicId: string; roles: UserRole[] }
  ): Promise<QueueEntry[]> {
    this.assertStaffAccess(actor, clinicId);
    const settings = await this.repo.getClinicQueueSettings(clinicId);
    const rawEntries = await this.repo.getQueueEntriesByClinic(clinicId, doctorId);

    return computeQueueOrder(rawEntries, settings);
  }

  /**
   * Doctor calls the next patient into consultation.
   */
  async callNextPatient(
    clinicId: string,
    queueEntryId: string,
    actor: { id: string; clinicId: string; roles: UserRole[] }
  ): Promise<{ entry: QueueEntry; event: QueueTransitionEvent }> {
    this.assertStaffAccess(actor, clinicId);
    const existing = await this.repo.findQueueEntryById(queueEntryId);
    if (!existing || existing.clinicId !== clinicId) {
      throw new QueueEngineError("ENTRY_NOT_FOUND");
    }

    const { updatedEntry, event } = transitionQueueState(
      existing,
      "in_consultation",
      { id: actor.id, role: actor.roles[0] }
    );

    await this.repo.updateQueueEntry(queueEntryId, {
      state: updatedEntry.state,
      calledTime: updatedEntry.calledTime,
      consultationStartTime: updatedEntry.consultationStartTime,
      updatedAt: updatedEntry.updatedAt,
    });

    await this.repo.appendQueueEvent(event);

    return { entry: updatedEntry, event };
  }

  /**
   * Completes a visit/consultation.
   */
  async completeConsultation(
    clinicId: string,
    queueEntryId: string,
    actor: { id: string; clinicId: string; roles: UserRole[] }
  ): Promise<{ entry: QueueEntry; event: QueueTransitionEvent }> {
    this.assertStaffAccess(actor, clinicId);
    const existing = await this.repo.findQueueEntryById(queueEntryId);
    if (!existing || existing.clinicId !== clinicId) {
      throw new QueueEngineError("ENTRY_NOT_FOUND");
    }

    const { updatedEntry, event } = transitionQueueState(
      existing,
      "completed",
      { id: actor.id, role: actor.roles[0] }
    );

    await this.repo.updateQueueEntry(queueEntryId, {
      state: updatedEntry.state,
      completedTime: updatedEntry.completedTime,
      updatedAt: updatedEntry.updatedAt,
    });

    await this.repo.appendQueueEvent(event);

    return { entry: updatedEntry, event };
  }

  /**
   * Marks a waiting patient as left before seeing doctor.
   */
  async markPatientLeft(
    clinicId: string,
    queueEntryId: string,
    reason: string | undefined,
    actor: { id: string; clinicId: string; roles: UserRole[] }
  ): Promise<{ entry: QueueEntry; event: QueueTransitionEvent }> {
    this.assertStaffAccess(actor, clinicId);
    const existing = await this.repo.findQueueEntryById(queueEntryId);
    if (!existing || existing.clinicId !== clinicId) {
      throw new QueueEngineError("ENTRY_NOT_FOUND");
    }

    const { updatedEntry, event } = transitionQueueState(
      existing,
      "left",
      { id: actor.id, role: actor.roles[0] },
      { reason }
    );

    await this.repo.updateQueueEntry(queueEntryId, {
      state: updatedEntry.state,
      leftTime: updatedEntry.leftTime,
      updatedAt: updatedEntry.updatedAt,
    });

    await this.repo.appendQueueEvent(event);

    return { entry: updatedEntry, event };
  }

  /**
   * Sets priority (critical or paid urgent) with validation and audit.
   */
  async setPriority(
    clinicId: string,
    queueEntryId: string,
    priority: QueuePriority,
    options: { reason?: string; approverId?: string },
    actor: { id: string; clinicId: string; roles: UserRole[] }
  ): Promise<{ entry: QueueEntry; event: QueueTransitionEvent }> {
    this.assertStaffAccess(actor, clinicId);
    const settings = await this.repo.getClinicQueueSettings(clinicId);
    const existing = await this.repo.findQueueEntryById(queueEntryId);
    if (!existing || existing.clinicId !== clinicId) {
      throw new QueueEngineError("ENTRY_NOT_FOUND");
    }

    const { updatedEntry, event } = setEntryPriority(
      existing,
      priority,
      settings,
      { id: actor.id, role: actor.roles[0] },
      options
    );

    await this.repo.updateQueueEntry(queueEntryId, {
      priority: updatedEntry.priority,
      urgentMultiplier: updatedEntry.urgentMultiplier,
      urgentReason: updatedEntry.urgentReason,
      urgentApproverId: updatedEntry.urgentApproverId,
      updatedAt: updatedEntry.updatedAt,
    });

    await this.repo.appendQueueEvent(event);

    return { entry: updatedEntry, event };
  }

  /**
   * Manually reorders a waiting queue entry (reason mandatory).
   */
  async manualReorder(
    clinicId: string,
    queueEntryId: string,
    targetOrderIndex: number,
    reason: string,
    actor: { id: string; clinicId: string; roles: UserRole[] }
  ): Promise<{ updatedEntries: QueueEntry[]; event: QueueTransitionEvent }> {
    this.assertStaffAccess(actor, clinicId);
    const allEntries = await this.repo.getQueueEntriesByClinic(clinicId);

    const { updatedEntries, event } = reorderQueueEntry(
      allEntries,
      queueEntryId,
      targetOrderIndex,
      { id: actor.id, role: actor.roles[0] },
      reason
    );

    for (const entry of updatedEntries) {
      await this.repo.updateQueueEntry(entry.id, {
        orderIndex: entry.orderIndex,
        updatedAt: entry.updatedAt,
      });
    }

    await this.repo.appendQueueEvent(event);

    return { updatedEntries, event };
  }

  /**
   * Retrieves skip alerts for reception.
   */
  async getSkipAlerts(
    clinicId: string,
    currentTime = new Date().toISOString(),
    actor: { id: string; clinicId: string; roles: UserRole[] }
  ): Promise<QueueSkipAlert[]> {
    this.assertStaffAccess(actor, clinicId);
    const settings = await this.repo.getClinicQueueSettings(clinicId);
    const allEntries = await this.repo.getQueueEntriesByClinic(clinicId);

    return detectSkipAlerts(allEntries, settings, currentTime);
  }

  /**
   * Snoozes a skip alert for a waiting patient.
   */
  async snoozeSkipAlert(
    clinicId: string,
    queueEntryId: string,
    snoozeMinutes: number,
    actor: { id: string; clinicId: string; roles: UserRole[] }
  ): Promise<{ entry: QueueEntry; event: QueueTransitionEvent }> {
    this.assertStaffAccess(actor, clinicId);
    const existing = await this.repo.findQueueEntryById(queueEntryId);
    if (!existing || existing.clinicId !== clinicId) {
      throw new QueueEngineError("ENTRY_NOT_FOUND");
    }

    const { updatedEntry, event } = snoozeSkipAlert(
      existing,
      snoozeMinutes,
      new Date().toISOString(),
      { id: actor.id, role: actor.roles[0] }
    );

    await this.repo.updateQueueEntry(queueEntryId, {
      snoozedUntil: updatedEntry.snoozedUntil,
      updatedAt: updatedEntry.updatedAt,
    });

    await this.repo.appendQueueEvent(event);

    return { entry: updatedEntry, event };
  }

  /**
   * Scheduled End-of-Day job: Closes all non-terminal queue entries as 'left' with autoClosed = true.
   */
  async runEndOfDay(
    clinicId: string,
    actor: { id: string; role: string },
    currentTime = new Date().toISOString()
  ): Promise<{ updatedCount: number; eventsCount: number }> {
    const allEntries = await this.repo.getQueueEntriesByClinic(clinicId);
    const { updatedEntries, events } = runEndOfDayJob(allEntries, currentTime, actor);

    for (const entry of updatedEntries) {
      if (entry.autoClosed) {
        await this.repo.updateQueueEntry(entry.id, {
          state: entry.state,
          autoClosed: entry.autoClosed,
          leftTime: entry.leftTime,
          updatedAt: entry.updatedAt,
        });
      }
    }

    for (const ev of events) {
      await this.repo.appendQueueEvent(ev);
    }

    return { updatedCount: events.length, eventsCount: events.length };
  }
}
