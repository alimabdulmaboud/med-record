import { describe, it, expect } from "vitest";
import {
  QueueClinicSettings,
  QueueEntry,
} from "./types";
import {
  compareWaitingEntries,
  computeQueueOrder,
  setEntryPriority,
  reorderQueueEntry,
  detectSkipAlerts,
  snoozeSkipAlert,
  runEndOfDayJob,
  transitionQueueState,
  QueueEngineError,
} from "./engine";

const DEFAULT_SETTINGS: QueueClinicSettings = {
  arrive_before_minutes: 15,
  skip_alert_minutes: 60,
  urgent_enabled: false,
  urgent_fee_multiplier: 3,
  end_of_day_time: "22:00",
};

const ACTOR_RECEPTIONIST = { id: "user-reception-1", role: "receptionist" };
const ACTOR_DOCTOR = { id: "user-doctor-1", role: "doctor" };

function createTestEntry(overrides: Partial<QueueEntry>): QueueEntry {
  return {
    id: `entry-${Math.random().toString(36).substring(7)}`,
    clinicId: "clinic-test-1",
    patientId: `pat-${Math.random().toString(36).substring(7)}`,
    patientName: "مريض تجريبي",
    state: "waiting",
    priority: "normal",
    orderIndex: 1,
    autoClosed: false,
    createdAt: "2026-10-10T12:00:00Z",
    updatedAt: "2026-10-10T12:00:00Z",
    ...overrides,
  };
}

describe("Phase 7: Pure Queue Engine", () => {
  describe("Scenario 1: Late Booked Patient vs Early Walk-in", () => {
    it("places walk-in who arrived at 16:50 ahead of a booked 17:00 patient who arrived late at 17:10", () => {
      // Walk-in arrived at 16:50
      const walkIn = createTestEntry({
        id: "walkin-1",
        patientName: "مريض مباشر (حضور 16:50)",
        scheduledTime: null,
        arrivalTime: "2026-10-10T16:50:00Z",
      });

      // Booked 17:00, arrives at 17:10 (late: deadline was 16:45 given arrive_before_minutes=15)
      const lateBooked = createTestEntry({
        id: "booked-late-1",
        patientName: "مريض محجوز متأخر (17:00 موعد - 17:10 وصول)",
        scheduledTime: "2026-10-10T17:00:00Z",
        arrivalTime: "2026-10-10T17:10:00Z",
      });

      const ordered = computeQueueOrder([lateBooked, walkIn], DEFAULT_SETTINGS);

      // Walk-in MUST be first, late booked patient MUST be second!
      expect(ordered[0].id).toBe("walkin-1");
      expect(ordered[1].id).toBe("booked-late-1");
      expect(ordered[0].orderIndex).toBe(1);
      expect(ordered[1].orderIndex).toBe(2);
    });
  });

  describe("Scenario 2: On-time Booked Patient Priority", () => {
    it("retains priority when arriving on time at 16:40 for a 17:00 appointment ahead of later walk-in", () => {
      // Booked for 17:00, arrives at 16:40 (20 min early > 15 min grace, on time!)
      const onTimeBooked = createTestEntry({
        id: "booked-ontime-1",
        patientName: "مريض محجوز في الموعد (17:00 موعد - 16:40 وصول)",
        scheduledTime: "2026-10-10T17:00:00Z",
        arrivalTime: "2026-10-10T16:40:00Z",
      });

      // Walk-in who arrives later at 16:50
      const walkIn = createTestEntry({
        id: "walkin-2",
        patientName: "مريض مباشر (16:50)",
        scheduledTime: null,
        arrivalTime: "2026-10-10T16:50:00Z",
      });

      const ordered = computeQueueOrder([walkIn, onTimeBooked], DEFAULT_SETTINGS);

      // On-time booked patient MUST be first!
      expect(ordered[0].id).toBe("booked-ontime-1");
      expect(ordered[1].id).toBe("walkin-2");
      expect(ordered[0].orderIndex).toBe(1);
      expect(ordered[1].orderIndex).toBe(2);
    });
  });

  describe("Scenario 3: Critical Priority to the Front Immediately", () => {
    it("moves critical patient to the front ahead of 5 waiting patients", () => {
      const waitingList: QueueEntry[] = [];

      // 5 normal patients already waiting
      for (let i = 1; i <= 5; i++) {
        waitingList.push(
          createTestEntry({
            id: `normal-${i}`,
            patientName: `مريض منتظر ${i}`,
            arrivalTime: `2026-10-10T15:0${i}:00Z`,
            priority: "normal",
          })
        );
      }

      // Critical patient arrives later at 15:30
      const criticalPatient = createTestEntry({
        id: "critical-1",
        patientName: "مريض حالة حرجة طارئة",
        arrivalTime: "2026-10-10T15:30:00Z",
        priority: "critical",
      });

      const allEntries = [...waitingList, criticalPatient];
      const ordered = computeQueueOrder(allEntries, DEFAULT_SETTINGS);

      // Critical patient must be rank 1 at the very front!
      expect(ordered[0].id).toBe("critical-1");
      expect(ordered[0].orderIndex).toBe(1);
      expect(ordered.slice(1).map((e) => e.id)).toEqual([
        "normal-1",
        "normal-2",
        "normal-3",
        "normal-4",
        "normal-5",
      ]);
    });
  });

  describe("Scenario 4: Paid Urgent Activation & Fee Multiplication", () => {
    it("rejects setting urgent priority when urgent_enabled is false", () => {
      const entry = createTestEntry({ id: "urgent-candidate" });

      expect(() => {
        setEntryPriority(entry, "urgent", DEFAULT_SETTINGS, ACTOR_RECEPTIONIST, {
          reason: "طلب استعجال من الأب",
          approverId: ACTOR_DOCTOR.id,
        });
      }).toThrowError(QueueEngineError);

      try {
        setEntryPriority(entry, "urgent", DEFAULT_SETTINGS, ACTOR_RECEPTIONIST, {
          reason: "طلب استعجال",
          approverId: ACTOR_DOCTOR.id,
        });
      } catch (err: any) {
        expect(err.code).toBe("URGENT_DISABLED");
      }
    });

    it("accepts paid urgent when enabled, triples fee, places after current consultation and logs event", () => {
      const enabledSettings: QueueClinicSettings = {
        ...DEFAULT_SETTINGS,
        urgent_enabled: true,
        urgent_fee_multiplier: 3,
      };

      const entry = createTestEntry({
        id: "urgent-candidate",
        patientName: "مريض مستعجل مدفوع",
        arrivalTime: "2026-10-10T16:00:00Z",
      });

      const { updatedEntry, event } = setEntryPriority(
        entry,
        "urgent",
        enabledSettings,
        ACTOR_RECEPTIONIST,
        {
          reason: "حالة سفر مستعجلة بموافقة الطبيب",
          approverId: ACTOR_DOCTOR.id,
        }
      );

      // Validations:
      expect(updatedEntry.priority).toBe("urgent");
      expect(updatedEntry.urgentMultiplier).toBe(3);
      expect(updatedEntry.urgentReason).toBe("حالة سفر مستعجلة بموافقة الطبيب");
      expect(updatedEntry.urgentApproverId).toBe(ACTOR_DOCTOR.id);

      // Event logged with full audit
      expect(event.eventType).toBe("PRIORITY_CHANGE");
      expect(event.approverId).toBe(ACTOR_DOCTOR.id);
      expect(event.reason).toBe("حالة سفر مستعجلة بموافقة الطبيب");
      expect(event.metadata?.multiplier).toBe(3);

      // Verify placement in queue:
      const inConsultation = createTestEntry({
        id: "in-consult",
        patientName: "مريض داخل الكشف حالياً",
        state: "in_consultation",
      });

      const waitingNormal1 = createTestEntry({
        id: "normal-1",
        patientName: "مريض منتظر 1",
        arrivalTime: "2026-10-10T15:00:00Z",
      });

      const waitingNormal2 = createTestEntry({
        id: "normal-2",
        patientName: "مريض منتظر 2",
        arrivalTime: "2026-10-10T15:10:00Z",
      });

      const queue = [inConsultation, waitingNormal1, waitingNormal2, updatedEntry];
      const ordered = computeQueueOrder(queue, enabledSettings);

      // In consultation is preserved, then urgent patient is #1 in waiting (ahead of normal-1 and normal-2)
      expect(ordered.find((e) => e.state === "in_consultation")?.id).toBe("in-consult");
      const waitingOrdered = ordered.filter((e) => e.state === "waiting");
      expect(waitingOrdered[0].id).toBe("urgent-candidate");
      expect(waitingOrdered[0].orderIndex).toBe(1);
      expect(waitingOrdered[1].id).toBe("normal-1");
      expect(waitingOrdered[2].id).toBe("normal-2");
    });
  });

  describe("Scenario 5: Skip Alert & Snooze Logic", () => {
    it("fires skip alert exactly at or after 60 minutes and not before; snooze suppresses and delays it", () => {
      // Patient A arrived at 14:00 (still waiting)
      const patientA = createTestEntry({
        id: "patient-a",
        patientName: "أحمد المظلوم (تم تخطيه)",
        arrivalTime: "2026-10-10T14:00:00Z",
        state: "waiting",
      });

      // Patient B arrived later at 14:30, but was called into consultation at 14:40
      const patientB = createTestEntry({
        id: "patient-b",
        patientName: "باسل (وصل بعد أحمد واستدعي قبله)",
        arrivalTime: "2026-10-10T14:30:00Z",
        calledTime: "2026-10-10T14:40:00Z",
        state: "in_consultation",
      });

      const entries = [patientA, patientB];

      // 1. At 15:39 (59 minutes after skip at 14:40): NO alert
      const alertsAt59 = detectSkipAlerts(entries, DEFAULT_SETTINGS, "2026-10-10T15:39:00Z");
      expect(alertsAt59).toHaveLength(0);

      // 2. At 15:40 (exactly 60 minutes after skip at 14:40): ALERT FIRES!
      const alertsAt60 = detectSkipAlerts(entries, DEFAULT_SETTINGS, "2026-10-10T15:40:00Z");
      expect(alertsAt60).toHaveLength(1);
      expect(alertsAt60[0].queueEntryId).toBe("patient-a");
      expect(alertsAt60[0].skippedDurationMinutes).toBe(60);

      // 3. Receptionist snoozes for 15 minutes at 15:40
      const { updatedEntry: snoozedPatientA, event: snoozeEvent } = snoozeSkipAlert(
        patientA,
        15,
        "2026-10-10T15:40:00Z",
        ACTOR_RECEPTIONIST
      );
      expect(snoozeEvent.eventType).toBe("SNOOZE_ALERT");
      expect(new Date(snoozedPatientA.snoozedUntil!).toISOString()).toBe(new Date("2026-10-10T15:55:00Z").toISOString());

      // 4. At 15:50 (during snooze): Alert is suppressed!
      const entriesDuringSnooze = [snoozedPatientA, patientB];
      const alertsDuringSnooze = detectSkipAlerts(entriesDuringSnooze, DEFAULT_SETTINGS, "2026-10-10T15:50:00Z");
      expect(alertsDuringSnooze).toHaveLength(0);

      // 5. At 15:56 (after snooze window ends): Alert fires again!
      const alertsAfterSnooze = detectSkipAlerts(entriesDuringSnooze, DEFAULT_SETTINGS, "2026-10-10T15:56:00Z");
      expect(alertsAfterSnooze).toHaveLength(1);
      expect(alertsAfterSnooze[0].queueEntryId).toBe("patient-a");
    });
  });

  describe("Scenario 6: End-of-Day Automatic Closure", () => {
    it("closes waiting and booked patients as left with auto_closed=true and leaves completed untouched", () => {
      const waitingPatient = createTestEntry({
        id: "eod-waiting",
        state: "waiting",
        autoClosed: false,
      });

      const bookedPatient = createTestEntry({
        id: "eod-booked",
        state: "booked",
        autoClosed: false,
      });

      const inConsultPatient = createTestEntry({
        id: "eod-in-consult",
        state: "in_consultation",
        autoClosed: false,
      });

      const completedPatient = createTestEntry({
        id: "eod-completed",
        state: "completed",
        autoClosed: false,
        completedTime: "2026-10-10T18:00:00Z",
      });

      const entries = [waitingPatient, bookedPatient, inConsultPatient, completedPatient];
      const eodTime = "2026-10-10T22:00:00Z";

      const { updatedEntries, events } = runEndOfDayJob(entries, eodTime, {
        id: "cron-job",
        role: "system",
      });

      // Waiting, booked, and in_consultation become left with autoClosed=true
      const closedWaiting = updatedEntries.find((e) => e.id === "eod-waiting")!;
      expect(closedWaiting.state).toBe("left");
      expect(closedWaiting.autoClosed).toBe(true);
      expect(closedWaiting.leftTime).toBe(eodTime);

      const closedBooked = updatedEntries.find((e) => e.id === "eod-booked")!;
      expect(closedBooked.state).toBe("left");
      expect(closedBooked.autoClosed).toBe(true);

      const closedInConsult = updatedEntries.find((e) => e.id === "eod-in-consult")!;
      expect(closedInConsult.state).toBe("left");
      expect(closedInConsult.autoClosed).toBe(true);

      // Completed patient is COMPLETELY UNTOUCHED!
      const untouchedCompleted = updatedEntries.find((e) => e.id === "eod-completed")!;
      expect(untouchedCompleted.state).toBe("completed");
      expect(untouchedCompleted.autoClosed).toBe(false);

      // Exactly 3 AUTO_CLOSE events generated
      expect(events).toHaveLength(3);
      expect(events.every((ev) => ev.eventType === "AUTO_CLOSE")).toBe(true);
    });
  });

  describe("Scenario 7: Manual Reorder Reason Enforcement", () => {
    it("rejects manual reorder when reason is empty or whitespace", () => {
      const p1 = createTestEntry({ id: "p1", orderIndex: 1 });
      const p2 = createTestEntry({ id: "p2", orderIndex: 2 });
      const entries = [p1, p2];

      expect(() => {
        reorderQueueEntry(entries, "p2", 1, ACTOR_RECEPTIONIST, "");
      }).toThrowError(QueueEngineError);

      expect(() => {
        reorderQueueEntry(entries, "p2", 1, ACTOR_RECEPTIONIST, "   ");
      }).toThrowError(QueueEngineError);

      try {
        reorderQueueEntry(entries, "p2", 1, ACTOR_RECEPTIONIST, "");
      } catch (err: any) {
        expect(err.code).toBe("REASON_REQUIRED");
      }
    });

    it("succeeds when reason is provided and logs MANUAL_REORDER event with details", () => {
      const p1 = createTestEntry({ id: "p1", orderIndex: 1 });
      const p2 = createTestEntry({ id: "p2", orderIndex: 2 });
      const entries = [p1, p2];

      const { updatedEntries, event } = reorderQueueEntry(
        entries,
        "p2",
        1,
        ACTOR_RECEPTIONIST,
        "استئذان الطبيب لتقديم المريض"
      );

      expect(event.eventType).toBe("MANUAL_REORDER");
      expect(event.reason).toBe("استئذان الطبيب لتقديم المريض");
      expect(event.queueEntryId).toBe("p2");
      expect(event.fromOrderIndex).toBe(2);
      expect(event.toOrderIndex).toBe(1);

      // Reordered list: p2 is now orderIndex 1, p1 is orderIndex 2
      const newP2 = updatedEntries.find((e) => e.id === "p2")!;
      const newP1 = updatedEntries.find((e) => e.id === "p1")!;
      expect(newP2.orderIndex).toBe(1);
      expect(newP1.orderIndex).toBe(2);
    });
  });

  describe("Queue State Transitions", () => {
    it("correctly handles check-in transition (booked -> waiting)", () => {
      const booked = createTestEntry({ state: "booked", arrivalTime: null });
      const { updatedEntry, event } = transitionQueueState(booked, "waiting", ACTOR_RECEPTIONIST);

      expect(updatedEntry.state).toBe("waiting");
      expect(updatedEntry.arrivalTime).toBeDefined();
      expect(event.eventType).toBe("CHECK_IN");
    });

    it("correctly handles calling into consultation (waiting -> in_consultation)", () => {
      const waiting = createTestEntry({ state: "waiting" });
      const { updatedEntry, event } = transitionQueueState(waiting, "in_consultation", ACTOR_DOCTOR);

      expect(updatedEntry.state).toBe("in_consultation");
      expect(updatedEntry.calledTime).toBeDefined();
      expect(updatedEntry.consultationStartTime).toBeDefined();
      expect(event.eventType).toBe("CALL_NEXT");
    });

    it("correctly handles completion (in_consultation -> completed)", () => {
      const inConsult = createTestEntry({ state: "in_consultation" });
      const { updatedEntry, event } = transitionQueueState(inConsult, "completed", ACTOR_DOCTOR);

      expect(updatedEntry.state).toBe("completed");
      expect(updatedEntry.completedTime).toBeDefined();
      expect(event.eventType).toBe("COMPLETE");
    });

    it("rejects invalid state transition (completed -> waiting)", () => {
      const completed = createTestEntry({ state: "completed" });
      expect(() => {
        transitionQueueState(completed, "waiting", ACTOR_RECEPTIONIST);
      }).toThrowError(QueueEngineError);
    });
  });
});
