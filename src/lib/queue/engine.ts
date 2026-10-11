import {
  QueueClinicSettings,
  QueueEntry,
  QueuePriority,
  QueueSkipAlert,
  QueueState,
  QueueTransitionEvent,
  TERMINAL_QUEUE_STATES,
} from "./types";

export class QueueEngineError extends Error {
  constructor(
    public code:
      | "URGENT_DISABLED"
      | "REASON_REQUIRED"
      | "INVALID_INPUT"
      | "INVALID_TRANSITION"
      | "ENTRY_NOT_FOUND",
    message?: string
  ) {
    super(message || code);
    this.name = "QueueEngineError";
  }
}

/**
 * Checks if a booked patient arrived late according to clinic grace rule.
 * Patient must arrive at least arriveBeforeMinutes before scheduledTime.
 */
export function isLateArrival(
  scheduledTime: string,
  arrivalTime: string,
  arriveBeforeMinutes: number
): boolean {
  const schedMs = new Date(scheduledTime).getTime();
  const arrMs = new Date(arrivalTime).getTime();
  const deadlineMs = schedMs - arriveBeforeMinutes * 60 * 1000;
  return arrMs > deadlineMs;
}

/**
 * Pure function: Compares and ranks two waiting queue entries.
 * Rules:
 * 1. Critical cases always go to the front.
 * 2. Paid urgent cases follow critical, placed right after current consultation.
 * 3. Grace rule:
 *    - An on-time booked patient retains priority.
 *    - A late booked patient loses priority and is placed after patients waiting when they arrived.
 * 4. Normal walk-ins ordered by arrival time.
 */
export function compareWaitingEntries(
  a: QueueEntry,
  b: QueueEntry,
  settings: QueueClinicSettings
): number {
  // 1. Priority weighting: critical (3) > urgent (2) > normal (1)
  const priorityRank: Record<QueuePriority, number> = {
    critical: 3,
    urgent: 2,
    normal: 1,
  };

  const aPriority = priorityRank[a.priority];
  const bPriority = priorityRank[b.priority];

  if (aPriority !== bPriority) {
    return bPriority - aPriority; // Higher priority first
  }

  // If both have manual orderIndex assigned (via manual reorder), respect it
  if (a.orderIndex !== b.orderIndex) {
    return a.orderIndex - b.orderIndex;
  }

  // 2. Both same priority (e.g. normal):
  // Check late arrival rule for booked vs walk-in/booked
  const aArrMs = a.arrivalTime ? new Date(a.arrivalTime).getTime() : 0;
  const bArrMs = b.arrivalTime ? new Date(b.arrivalTime).getTime() : 0;

  const aIsBooked = Boolean(a.scheduledTime);
  const bIsBooked = Boolean(b.scheduledTime);

  const aLate = aIsBooked && a.arrivalTime
    ? isLateArrival(a.scheduledTime!, a.arrivalTime, settings.arrive_before_minutes)
    : false;

  const bLate = bIsBooked && b.arrivalTime
    ? isLateArrival(b.scheduledTime!, b.arrivalTime, settings.arrive_before_minutes)
    : false;

  // If 'a' is late booked and 'b' was already waiting when 'a' arrived, 'b' goes first!
  if (aLate && !bLate && bArrMs <= aArrMs) {
    return 1; // b goes before a
  }
  if (bLate && !aLate && aArrMs <= bArrMs) {
    return -1; // a goes before b
  }

  // If both on-time booked with scheduled times, order by scheduled time, then arrival
  if (aIsBooked && !aLate && bIsBooked && !bLate && a.scheduledTime && b.scheduledTime) {
    const aSchedMs = new Date(a.scheduledTime).getTime();
    const bSchedMs = new Date(b.scheduledTime).getTime();
    if (aSchedMs !== bSchedMs) return aSchedMs - bSchedMs;
  }

  // Default: order by arrival time
  return aArrMs - bArrMs;
}

/**
 * Pure function: Computes normalized order indices for all waiting queue entries.
 */
export function computeQueueOrder(
  entries: QueueEntry[],
  settings: QueueClinicSettings
): QueueEntry[] {
  // Only order active waiting patients
  const inConsultation = entries.filter((e) => e.state === "in_consultation");
  const waiting = entries.filter((e) => e.state === "waiting");
  const other = entries.filter((e) => e.state !== "waiting" && e.state !== "in_consultation");

  const sortedWaiting = [...waiting].sort((a, b) => compareWaitingEntries(a, b, settings));

  // Assign sequential order indices (1, 2, 3...)
  const indexedWaiting = sortedWaiting.map((entry, index) => ({
    ...entry,
    orderIndex: index + 1,
  }));

  return [...inConsultation, ...indexedWaiting, ...other];
}

/**
 * Pure function: Sets priority on an entry (e.g. critical or paid urgent).
 * Validates clinic urgent settings, required reason, and approver.
 */
export function setEntryPriority(
  entry: QueueEntry,
  priority: QueuePriority,
  settings: QueueClinicSettings,
  actor: { id: string; role: string },
  options?: { reason?: string; approverId?: string; timestamp?: string }
): { updatedEntry: QueueEntry; event: QueueTransitionEvent } {
  const now = options?.timestamp || new Date().toISOString();

  if (priority === "urgent") {
    if (!settings.urgent_enabled) {
      throw new QueueEngineError("URGENT_DISABLED", "Paid urgent is not enabled for this clinic.");
    }
    if (!options?.reason || !options.reason.trim()) {
      throw new QueueEngineError("REASON_REQUIRED", "Reason is required for paid urgent priority.");
    }
    if (!options?.approverId) {
      throw new QueueEngineError("INVALID_INPUT", "Approver is required for paid urgent priority.");
    }
  }

  const updatedEntry: QueueEntry = {
    ...entry,
    priority,
    urgentMultiplier: priority === "urgent" ? settings.urgent_fee_multiplier : 1,
    urgentReason: priority === "urgent" ? options?.reason : null,
    urgentApproverId: priority === "urgent" ? options?.approverId : null,
    updatedAt: now,
  };

  const event: QueueTransitionEvent = {
    id: `qevt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    clinicId: entry.clinicId,
    queueEntryId: entry.id,
    actorId: actor.id,
    actorRole: actor.role,
    eventType: "PRIORITY_CHANGE",
    fromState: entry.state,
    toState: entry.state,
    reason: options?.reason || null,
    approverId: options?.approverId || null,
    metadata: {
      fromPriority: entry.priority,
      toPriority: priority,
      multiplier: updatedEntry.urgentMultiplier,
    },
    createdAt: now,
  };

  return { updatedEntry, event };
}

/**
 * Pure function: Manually reorders an entry in the waiting queue.
 * Strict rule: Reason is mandatory.
 */
export function reorderQueueEntry(
  entries: QueueEntry[],
  entryId: string,
  targetOrderIndex: number,
  actor: { id: string; role: string },
  reason: string,
  timestamp?: string
): { updatedEntries: QueueEntry[]; event: QueueTransitionEvent } {
  if (!reason || !reason.trim()) {
    throw new QueueEngineError("REASON_REQUIRED", "Manual reorder requires a reason.");
  }

  const entryIndex = entries.findIndex((e) => e.id === entryId);
  if (entryIndex === -1) {
    throw new QueueEngineError("ENTRY_NOT_FOUND", "Queue entry not found.");
  }

  const targetEntry = entries[entryIndex];
  const fromIndex = targetEntry.orderIndex;
  const now = timestamp || new Date().toISOString();

  // Create event first
  const event: QueueTransitionEvent = {
    id: `qevt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    clinicId: targetEntry.clinicId,
    queueEntryId: targetEntry.id,
    actorId: actor.id,
    actorRole: actor.role,
    eventType: "MANUAL_REORDER",
    fromState: targetEntry.state,
    toState: targetEntry.state,
    fromOrderIndex: fromIndex,
    toOrderIndex: targetOrderIndex,
    reason: reason.trim(),
    createdAt: now,
  };

  // Reorder waiting list
  const waitingEntries = entries
    .filter((e) => e.state === "waiting")
    .filter((e) => e.id !== entryId);

  // Insert target entry at target position
  const clampedTargetIndex = Math.max(0, Math.min(targetOrderIndex - 1, waitingEntries.length));
  waitingEntries.splice(clampedTargetIndex, 0, { ...targetEntry, updatedAt: now });

  // Re-index waiting entries sequentially
  const reindexedWaiting = waitingEntries.map((e, idx) => ({
    ...e,
    orderIndex: idx + 1,
  }));

  const waitingMap = new Map(reindexedWaiting.map((e) => [e.id, e]));

  const updatedEntries = entries.map((e) => (waitingMap.has(e.id) ? waitingMap.get(e.id)! : e));

  return { updatedEntries, event };
}

/**
 * Pure function: Transitions a queue entry to a new state and records an audit event.
 */
export function transitionQueueState(
  entry: QueueEntry,
  toState: QueueState,
  actor: { id: string; role: string },
  options?: { reason?: string; timestamp?: string }
): { updatedEntry: QueueEntry; event: QueueTransitionEvent } {
  const fromState = entry.state;
  const now = options?.timestamp || new Date().toISOString();

  // Allowed transitions
  const validTransitions: Record<QueueState, QueueState[]> = {
    booked: ["waiting", "no_show", "cancelled", "left"],
    waiting: ["in_consultation", "left", "cancelled"],
    in_consultation: ["completed", "left"],
    completed: [],
    left: [],
    no_show: [],
    cancelled: [],
  };

  if (!validTransitions[fromState].includes(toState)) {
    throw new QueueEngineError(
      "INVALID_TRANSITION",
      `Cannot transition queue entry from '${fromState}' to '${toState}'.`
    );
  }

  const updated: QueueEntry = {
    ...entry,
    state: toState,
    updatedAt: now,
  };

  let eventType: QueueTransitionEvent["eventType"] = "STATE_CHANGE";

  if (toState === "waiting") {
    updated.arrivalTime = entry.arrivalTime || now;
    eventType = "CHECK_IN";
  } else if (toState === "in_consultation") {
    updated.calledTime = now;
    updated.consultationStartTime = now;
    eventType = "CALL_NEXT";
  } else if (toState === "completed") {
    updated.completedTime = now;
    eventType = "COMPLETE";
  } else if (toState === "left") {
    updated.leftTime = now;
    eventType = "MARK_LEFT";
  } else if (toState === "no_show") {
    eventType = "NO_SHOW";
  } else if (toState === "cancelled") {
    eventType = "CANCEL";
  }

  const event: QueueTransitionEvent = {
    id: `qevt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    clinicId: entry.clinicId,
    queueEntryId: entry.id,
    actorId: actor.id,
    actorRole: actor.role,
    eventType,
    fromState,
    toState,
    reason: options?.reason || null,
    createdAt: now,
  };

  return { updatedEntry: updated, event };
}

/**
 * Pure function: Evaluates skip alerts for patients currently waiting.
 * A patient is "skipped" if another patient who arrived LATER was called first into consultation.
 * Alert fires when elapsed time since skip >= skip_alert_minutes, unless snoozed.
 */
export function detectSkipAlerts(
  entries: QueueEntry[],
  settings: QueueClinicSettings,
  currentTime: string
): QueueSkipAlert[] {
  const currentMs = new Date(currentTime).getTime();
  const waitingEntries = entries.filter((e) => e.state === "waiting" && e.arrivalTime);

  // Find all entries that were called into consultation or completed
  const calledEntries = entries.filter(
    (e) => (e.state === "in_consultation" || e.state === "completed") && e.calledTime && e.arrivalTime
  );

  const alerts: QueueSkipAlert[] = [];

  for (const waiting of waitingEntries) {
    const waitingArrMs = new Date(waiting.arrivalTime!).getTime();

    // Check if any patient who arrived AFTER this patient was called BEFORE this patient
    const laterArrivalsCalled = calledEntries.filter((called) => {
      const calledArrMs = new Date(called.arrivalTime!).getTime();
      return calledArrMs > waitingArrMs;
    });

    if (laterArrivalsCalled.length === 0) continue;

    // Find earliest skip timestamp
    const earliestSkipMs = Math.min(
      ...laterArrivalsCalled.map((c) => new Date(c.calledTime!).getTime())
    );

    const skippedDurationMinutes = Math.floor((currentMs - earliestSkipMs) / (60 * 1000));
    const waitingMinutes = Math.floor((currentMs - waitingArrMs) / (60 * 1000));

    // Has it exceeded skip_alert_minutes?
    if (skippedDurationMinutes >= settings.skip_alert_minutes) {
      // Check snooze
      if (waiting.snoozedUntil) {
        const snoozeMs = new Date(waiting.snoozedUntil).getTime();
        if (currentMs < snoozeMs) {
          continue; // Suppressed by active snooze
        }
      }

      alerts.push({
        queueEntryId: waiting.id,
        patientName: waiting.patientName,
        arrivalTime: waiting.arrivalTime!,
        waitingMinutes,
        skippedAt: new Date(earliestSkipMs).toISOString(),
        skippedDurationMinutes,
        skippedByPatientId: laterArrivalsCalled[0].id,
        snoozedUntil: waiting.snoozedUntil,
      });
    }
  }

  return alerts;
}

/**
 * Pure function: Snoozes a skip alert for a waiting patient.
 */
export function snoozeSkipAlert(
  entry: QueueEntry,
  snoozeMinutes: number,
  currentTime: string,
  actor: { id: string; role: string }
): { updatedEntry: QueueEntry; event: QueueTransitionEvent } {
  const currentMs = new Date(currentTime).getTime();
  const snoozedUntil = new Date(currentMs + snoozeMinutes * 60 * 1000).toISOString();

  const updatedEntry: QueueEntry = {
    ...entry,
    snoozedUntil,
    updatedAt: currentTime,
  };

  const event: QueueTransitionEvent = {
    id: `qevt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    clinicId: entry.clinicId,
    queueEntryId: entry.id,
    actorId: actor.id,
    actorRole: actor.role,
    eventType: "SNOOZE_ALERT",
    fromState: entry.state,
    toState: entry.state,
    reason: `Snoozed skip alert for ${snoozeMinutes} minutes`,
    createdAt: currentTime,
  };

  return { updatedEntry, event };
}

/**
 * Pure function: Scheduled End-of-Day job.
 * Closes all entries not in terminal states as 'left' with autoClosed = true.
 * Leaves completed entries completely untouched.
 */
export function runEndOfDayJob(
  entries: QueueEntry[],
  currentTime: string,
  actor: { id: string; role: string }
): { updatedEntries: QueueEntry[]; events: QueueTransitionEvent[] } {
  const updatedEntries: QueueEntry[] = [];
  const events: QueueTransitionEvent[] = [];

  for (const entry of entries) {
    if (TERMINAL_QUEUE_STATES.includes(entry.state)) {
      // Already terminal (completed, left, no_show, cancelled) -> keep untouched!
      updatedEntries.push(entry);
    } else {
      // Non-terminal state (booked, waiting, in_consultation) -> close as left with autoClosed true
      const updated: QueueEntry = {
        ...entry,
        state: "left",
        autoClosed: true,
        leftTime: currentTime,
        updatedAt: currentTime,
      };

      updatedEntries.push(updated);

      events.push({
        id: `qevt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        clinicId: entry.clinicId,
        queueEntryId: entry.id,
        actorId: actor.id,
        actorRole: actor.role,
        eventType: "AUTO_CLOSE",
        fromState: entry.state,
        toState: "left",
        reason: "Automatic end-of-day closure",
        createdAt: currentTime,
      });
    }
  }

  return { updatedEntries, events };
}
