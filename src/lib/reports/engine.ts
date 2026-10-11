/**
 * Owner Reports Pure Engine (Phase 13)
 * Rules:
 * - AGENTS.md Rule #9: Pure module (no DB access) with unit tests.
 * - Non-negotiable Rule #2: Zero clinical data exposed.
 */

import {
  ReportInputRecord,
  OwnerReportSummary,
  DoctorPerformanceBreakdown,
  WaitingTimeSummary,
} from "./types";

/**
 * Computes median of a numeric array.
 */
export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1));
  }
  return Number(sorted[mid].toFixed(1));
}

/**
 * Calculates mean (average) of a numeric array.
 */
export function calculateMean(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / numbers.length).toFixed(1));
}

/**
 * Pure function to compute all owner report statistics from queue & visit records.
 */
export function computeOwnerReport(
  entries: ReportInputRecord[],
  options: {
    clinicId?: string;
    baseConsultationPrice?: number;
    urgentFeeMultiplier?: number;
    periodLabel?: string;
  } = {}
): OwnerReportSummary {
  const clinicId = options.clinicId || (entries[0]?.clinicId ?? "clinic-1");
  const basePrice = options.baseConsultationPrice ?? 300;
  const urgentMultiplier = options.urgentFeeMultiplier ?? 3;
  const periodLabel = options.periodLabel ?? "اليوم";

  const totalEntries = entries.length;

  // 1. Patients Seen Count & Visit Types
  let patientsSeenCount = 0;
  let newVisitsCount = 0;
  let followUpVisitsCount = 0;

  for (const e of entries) {
    if (e.state === "completed") {
      patientsSeenCount++;
      if (e.visitType === "new") {
        newVisitsCount++;
      } else {
        followUpVisitsCount++;
      }
    }
  }

  // 2. Waiting Time Calculations (Arrival to Consultation Start)
  const waitingMinutesList: number[] = [];
  const waitingByHourMap = new Map<string, number[]>();
  const waitingByDoctorMap = new Map<string, { doctorName: string; minutes: number[] }>();

  for (const e of entries) {
    if (e.arrivalTime && e.consultationStartTime) {
      const arr = new Date(e.arrivalTime).getTime();
      const start = new Date(e.consultationStartTime).getTime();
      const diffMins = Math.max(0, (start - arr) / (1000 * 60));

      waitingMinutesList.push(diffMins);

      // Hourly grouping
      const hourStr = new Date(e.arrivalTime).toISOString().substring(11, 13) + ":00";
      const hourList = waitingByHourMap.get(hourStr) || [];
      hourList.push(diffMins);
      waitingByHourMap.set(hourStr, hourList);

      // Doctor grouping
      const docEntry = waitingByDoctorMap.get(e.doctorId) || {
        doctorName: e.doctorName || e.doctorId,
        minutes: [],
      };
      docEntry.minutes.push(diffMins);
      waitingByDoctorMap.set(e.doctorId, docEntry);
    }
  }

  const avgWaiting = calculateMean(waitingMinutesList);
  const medianWaiting = calculateMedian(waitingMinutesList);

  const byHour = Array.from(waitingByHourMap.entries())
    .map(([hour, mins]) => ({
      hour,
      patientsCount: mins.length,
      avgMinutes: calculateMean(mins),
    }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  const byDoctor = Array.from(waitingByDoctorMap.entries()).map(
    ([doctorId, val]) => ({
      doctorId,
      doctorName: val.doctorName,
      patientsCount: val.minutes.length,
      avgMinutes: calculateMean(val.minutes),
      medianMinutes: calculateMedian(val.minutes),
    })
  );

  const waitingTime: WaitingTimeSummary = {
    averageMinutes: avgWaiting,
    medianMinutes: medianWaiting,
    byHour,
    byDoctor,
  };

  // 3. Left Before Seen (Walkout Rate & Auto-Closed)
  let manualLeftCount = 0;
  let autoClosedCount = 0;

  for (const e of entries) {
    if (e.state === "left") {
      if (e.autoClosed) {
        autoClosedCount++;
      } else {
        manualLeftCount++;
      }
    }
  }

  const totalLeft = manualLeftCount + autoClosedCount;
  const leftRatePct =
    totalEntries > 0 ? Number(((totalLeft / totalEntries) * 100).toFixed(1)) : 0;

  // 4. Appointment No-Show Rate
  let scheduledAppointments = 0;
  let noShowCount = 0;

  for (const e of entries) {
    if (e.appointmentId) {
      scheduledAppointments++;
      if (e.state === "no_show") {
        noShowCount++;
      }
    }
  }

  const noShowRatePct =
    scheduledAppointments > 0
      ? Number(((noShowCount / scheduledAppointments) * 100).toFixed(1))
      : 0;

  // 5. Estimated Lost Revenue
  const estimatedLostRevenue = totalLeft * basePrice;

  // 6. Billing Aggregates
  let totalBilled = 0;
  let paidTotal = 0;
  let unpaidTotal = 0;

  for (const e of entries) {
    if (e.price && e.price > 0) {
      totalBilled += e.price;
      if (e.isPaid) {
        paidTotal += e.price;
      } else {
        unpaidTotal += e.price;
      }
    }
  }

  const paidRatePct =
    totalBilled > 0 ? Number(((paidTotal / totalBilled) * 100).toFixed(1)) : 0;

  // 7. Paid Urgent Priority Usage
  let urgentCount = 0;
  for (const e of entries) {
    if (e.priority === "urgent") {
      urgentCount++;
    }
  }

  const urgentSharePct =
    totalEntries > 0 ? Number(((urgentCount / totalEntries) * 100).toFixed(1)) : 0;
  const estimatedExtraRevenue = urgentCount * basePrice * (urgentMultiplier - 1);

  // 8. Doctor Performance Breakdown
  const doctorMap = new Map<string, DoctorPerformanceBreakdown>();

  for (const e of entries) {
    const existing = doctorMap.get(e.doctorId) || {
      doctorId: e.doctorId,
      doctorName: e.doctorName || e.doctorId,
      patientsSeen: 0,
      newVisits: 0,
      followUpVisits: 0,
      avgWaitMinutes: 0,
      paidTotal: 0,
      unpaidTotal: 0,
    };

    if (e.state === "completed") {
      existing.patientsSeen++;
      if (e.visitType === "new") {
        existing.newVisits++;
      } else {
        existing.followUpVisits++;
      }
    }

    if (e.price && e.price > 0) {
      if (e.isPaid) {
        existing.paidTotal += e.price;
      } else {
        existing.unpaidTotal += e.price;
      }
    }

    doctorMap.set(e.doctorId, existing);
  }

  const doctorBreakdown = Array.from(doctorMap.values()).map((doc) => {
    const docWaiting = waitingByDoctorMap.get(doc.doctorId)?.minutes || [];
    return {
      ...doc,
      avgWaitMinutes: calculateMean(docWaiting),
    };
  });

  return {
    clinicId,
    periodLabel,
    totalQueueEntries: totalEntries,
    patientsSeenCount,
    newVisitsCount,
    followUpVisitsCount,
    waitingTime,
    leftBeforeSeen: {
      totalLeft,
      leftRatePct,
      manualLeftCount,
      autoClosedCount,
    },
    appointmentNoShow: {
      totalAppointments: scheduledAppointments,
      noShowCount,
      noShowRatePct,
    },
    lostRevenue: {
      estimatedLostRevenue,
      baseConsultationPrice: basePrice,
      disclaimer: "تقدير تقريبي مبني على عدد الحالات التي غادرت مضروباً في سعر الكشف الأساسي",
    },
    billing: {
      totalBilled,
      paidTotal,
      unpaidTotal,
      paidRatePct,
    },
    paidUrgent: {
      count: urgentCount,
      sharePct: urgentSharePct,
      estimatedExtraRevenue,
    },
    doctorBreakdown,
  };
}

/**
 * Formats report summary into a downloadable UTF-8 CSV string with BOM for Arabic Excel support.
 */
export function exportReportToCsv(report: OwnerReportSummary): string {
  const lines: string[] = [];

  // UTF-8 BOM
  lines.push("\uFEFFمؤشر التقرير,القيمة,ملاحظات");

  // Summary Metrics
  lines.push(`الفترة,${report.periodLabel},`);
  lines.push(`إجمالي مراجعي الطابور,${report.totalQueueEntries},مريض`);
  lines.push(`الحالات المكتملة (تم الكشف),${report.patientsSeenCount},حالة`);
  lines.push(`كشوفات جديدة,${report.newVisitsCount},`);
  lines.push(`استشارات ومتابعة,${report.followUpVisitsCount},`);
  lines.push(`متوسط وقت الانتظار,${report.waitingTime.averageMinutes},دقيقة`);
  lines.push(`الوسيط لوقت الانتظار,${report.waitingTime.medianMinutes},دقيقة`);
  lines.push(`حالات غادرت قبل الكشف (يدوي),${report.leftBeforeSeen.manualLeftCount},مريض`);
  lines.push(`حالات أغلقت تلقائياً نهاية اليوم,${report.leftBeforeSeen.autoClosedCount},مريض`);
  lines.push(`إجمالي المغادرين,${report.leftBeforeSeen.totalLeft},نسبة ${report.leftBeforeSeen.leftRatePct}%`);
  lines.push(`نسبة عدم الحضور للمواعيد,${report.appointmentNoShow.noShowRatePct}%,${report.appointmentNoShow.noShowCount} من ${report.appointmentNoShow.totalAppointments}`);
  lines.push(`الإيراد المفقود التقديري,${report.lostRevenue.estimatedLostRevenue} ج.م,${report.lostRevenue.disclaimer}`);
  lines.push(`إجمالي المحصل المدفوع,${report.billing.paidTotal} ج.م,نسبة التحصيل ${report.billing.paidRatePct}%`);
  lines.push(`إجمالي غير المحصل,${report.billing.unpaidTotal} ج.م,`);
  lines.push(`حالات الكشف المستعجل,${report.paidUrgent.count},نسبة ${report.paidUrgent.sharePct}%`);

  lines.push("");
  lines.push("أداء الأطباء,الكشوفات المكتملة,جديد,متابعة,متوسط الانتظار (دقيقة),المحصل (ج.م),غير المحصل (ج.م)");

  for (const doc of report.doctorBreakdown) {
    lines.push(
      `"${doc.doctorName}",${doc.patientsSeen},${doc.newVisits},${doc.followUpVisits},${doc.avgWaitMinutes},${doc.paidTotal},${doc.unpaidTotal}`
    );
  }

  return lines.join("\n");
}
