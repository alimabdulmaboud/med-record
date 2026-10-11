import { describe, it, expect } from "vitest";
import {
  computeOwnerReport,
  exportReportToCsv,
  calculateMean,
  calculateMedian,
} from "./engine";
import { ReportInputRecord } from "./types";

describe("Owner Reports Pure Engine — Unit Tests (Phase 13)", () => {
  describe("Statistical Helpers", () => {
    it("computes accurate mean", () => {
      expect(calculateMean([])).toBe(0);
      expect(calculateMean([10, 20, 30])).toBe(20.0);
      expect(calculateMean([10, 20])).toBe(15.0);
    });

    it("computes accurate median for odd and even length arrays", () => {
      expect(calculateMedian([])).toBe(0);
      expect(calculateMedian([5, 1, 9])).toBe(5.0); // odd: middle is 5
      expect(calculateMedian([10, 20, 30, 40])).toBe(25.0); // even: (20 + 30) / 2 = 25
    });
  });

  describe("Deterministic Fixed Dataset Evaluation", () => {
    // 10 Fixed records with known ground truth
    const fixedDataset: ReportInputRecord[] = [
      {
        id: "q-1",
        clinicId: "clinic-test",
        doctorId: "doc-A",
        doctorName: "د. أحمد",
        priority: "normal",
        state: "completed",
        arrivalTime: "2026-10-10T10:00:00Z",
        consultationStartTime: "2026-10-10T10:20:00Z", // 20m
        completedTime: "2026-10-10T10:40:00Z",
        visitType: "new",
        price: 300,
        isPaid: true,
      },
      {
        id: "q-2",
        clinicId: "clinic-test",
        doctorId: "doc-A",
        doctorName: "د. أحمد",
        priority: "normal",
        state: "completed",
        arrivalTime: "2026-10-10T10:15:00Z",
        consultationStartTime: "2026-10-10T10:45:00Z", // 30m
        completedTime: "2026-10-10T11:00:00Z",
        visitType: "follow_up",
        price: 150,
        isPaid: true,
      },
      {
        id: "q-3",
        clinicId: "clinic-test",
        doctorId: "doc-A",
        doctorName: "د. أحمد",
        priority: "normal",
        state: "left",
        autoClosed: false, // manual left
        arrivalTime: "2026-10-10T10:30:00Z",
        price: 0,
        isPaid: false,
      },
      {
        id: "q-4",
        clinicId: "clinic-test",
        doctorId: "doc-B",
        doctorName: "د. سارة",
        priority: "normal",
        state: "completed",
        arrivalTime: "2026-10-10T11:00:00Z",
        consultationStartTime: "2026-10-10T11:10:00Z", // 10m
        completedTime: "2026-10-10T11:30:00Z",
        visitType: "new",
        price: 400,
        isPaid: true,
      },
      {
        id: "q-5",
        clinicId: "clinic-test",
        doctorId: "doc-B",
        doctorName: "د. سارة",
        priority: "urgent", // paid urgent
        state: "completed",
        arrivalTime: "2026-10-10T11:20:00Z",
        consultationStartTime: "2026-10-10T11:30:00Z", // 10m
        completedTime: "2026-10-10T11:55:00Z",
        visitType: "new",
        price: 1200, // multiplied fee
        isPaid: true,
      },
      {
        id: "q-6",
        clinicId: "clinic-test",
        doctorId: "doc-B",
        doctorName: "د. سارة",
        priority: "normal",
        state: "completed",
        arrivalTime: "2026-10-10T11:30:00Z",
        consultationStartTime: "2026-10-10T12:10:00Z", // 40m
        completedTime: "2026-10-10T12:30:00Z",
        visitType: "follow_up",
        price: 200,
        isPaid: false, // unpaid
      },
      {
        id: "q-7",
        clinicId: "clinic-test",
        doctorId: "doc-B",
        doctorName: "د. سارة",
        priority: "normal",
        state: "left",
        autoClosed: true, // end of day auto closed
        arrivalTime: "2026-10-10T11:45:00Z",
        price: 0,
        isPaid: false,
      },
      {
        id: "q-8",
        clinicId: "clinic-test",
        doctorId: "doc-A",
        doctorName: "د. أحمد",
        priority: "normal",
        state: "no_show",
        appointmentId: "apt-1",
        price: 0,
        isPaid: false,
      },
      {
        id: "q-9",
        clinicId: "clinic-test",
        doctorId: "doc-A",
        doctorName: "د. أحمد",
        priority: "normal",
        state: "completed",
        appointmentId: "apt-2",
        arrivalTime: "2026-10-10T12:00:00Z",
        consultationStartTime: "2026-10-10T12:15:00Z", // 15m
        completedTime: "2026-10-10T12:35:00Z",
        visitType: "new",
        price: 300,
        isPaid: true,
      },
      {
        id: "q-10",
        clinicId: "clinic-test",
        doctorId: "doc-B",
        doctorName: "د. سارة",
        priority: "normal",
        state: "left",
        autoClosed: false,
        arrivalTime: "2026-10-10T12:10:00Z",
        price: 0,
        isPaid: false,
      },
    ];

    const report = computeOwnerReport(fixedDataset, {
      clinicId: "clinic-test",
      baseConsultationPrice: 300,
      urgentFeeMultiplier: 3,
    });

    it("matches total queue entries and patients seen count exactly", () => {
      expect(report.totalQueueEntries).toBe(10);
      expect(report.patientsSeenCount).toBe(6);
    });

    it("matches new visits vs follow-up counts exactly", () => {
      expect(report.newVisitsCount).toBe(4);
      expect(report.followUpVisitsCount).toBe(2);
    });

    it("matches waiting time mean and median exactly", () => {
      // Waiting times: [20, 30, 10, 10, 40, 15] -> Mean = 20.8m, Median = 17.5m
      expect(report.waitingTime.averageMinutes).toBe(20.8);
      expect(report.waitingTime.medianMinutes).toBe(17.5);

      // Hourly grouping
      expect(report.waitingTime.byHour.length).toBeGreaterThan(0);
      const hour10 = report.waitingTime.byHour.find((h) => h.hour === "10:00");
      expect(hour10?.patientsCount).toBe(2); // 20m and 30m
      expect(hour10?.avgMinutes).toBe(25.0);
    });

    it("matches left-before-seen statistics with auto_closed shown separately", () => {
      expect(report.leftBeforeSeen.totalLeft).toBe(3);
      expect(report.leftBeforeSeen.manualLeftCount).toBe(2);
      expect(report.leftBeforeSeen.autoClosedCount).toBe(1);
      expect(report.leftBeforeSeen.leftRatePct).toBe(30.0);
    });

    it("matches appointment no-show rate", () => {
      // 2 scheduled appointments (apt-1, apt-2), 1 no-show -> 50.0%
      expect(report.appointmentNoShow.totalAppointments).toBe(2);
      expect(report.appointmentNoShow.noShowCount).toBe(1);
      expect(report.appointmentNoShow.noShowRatePct).toBe(50.0);
    });

    it("calculates estimated lost revenue = left count * basePrice", () => {
      // 3 left * 300 = 900
      expect(report.lostRevenue.estimatedLostRevenue).toBe(900);
      expect(report.lostRevenue.disclaimer).toContain("تقدير تقريبي");
    });

    it("calculates billing totals: paid vs unpaid exactly", () => {
      // Total: 2550, Paid: 2350, Unpaid: 200
      expect(report.billing.totalBilled).toBe(2550);
      expect(report.billing.paidTotal).toBe(2350);
      expect(report.billing.unpaidTotal).toBe(200);
      expect(report.billing.paidRatePct).toBe(92.2);
    });

    it("calculates paid urgent usage count and share", () => {
      expect(report.paidUrgent.count).toBe(1);
      expect(report.paidUrgent.sharePct).toBe(10.0);
      expect(report.paidUrgent.estimatedExtraRevenue).toBe(600); // 1 * 300 * 2
    });

    it("provides per-doctor performance breakdown", () => {
      expect(report.doctorBreakdown.length).toBe(2);
      const docA = report.doctorBreakdown.find((d) => d.doctorId === "doc-A");
      const docB = report.doctorBreakdown.find((d) => d.doctorId === "doc-B");

      expect(docA?.patientsSeen).toBe(3); // q-1, q-2, q-9
      expect(docB?.patientsSeen).toBe(3); // q-4, q-5, q-6
      expect(docA?.paidTotal).toBe(750); // 300 + 150 + 300
      expect(docB?.unpaidTotal).toBe(200); // q-6 unpaid
    });

    it("exports clean UTF-8 CSV with Arabic headers and BOM", () => {
      const csv = exportReportToCsv(report);

      expect(csv.startsWith("\uFEFF")).toBe(true);
      expect(csv).toContain("مؤشر التقرير");
      expect(csv).toContain("إجمالي مراجعي الطابور,10,مريض");
      expect(csv).toContain("الإيراد المفقود التقديري,900 ج.م");
      expect(csv).toContain('"د. أحمد",3,2,1');
    });
  });

  describe("ReportsService Role Enforcement & Repository Query (Phase 13)", () => {
    it("allows clinic_owner to access their own clinic report", async () => {
      const { ReportsService } = await import("./service");
      const service = new ReportsService();
      const ownerActor = {
        id: "owner-1",
        clinicId: "clinic-pediatrics",
        roles: ["clinic_owner" as const],
      };

      const report = await service.getOwnerReport(ownerActor, "clinic-pediatrics");
      expect(report.clinicId).toBe("clinic-pediatrics");
      expect(report.totalQueueEntries).toBe(10);
      expect(report.patientsSeenCount).toBe(7);
    });

    it("allows platform_admin to access clinic report", async () => {
      const { ReportsService } = await import("./service");
      const service = new ReportsService();
      const adminActor = {
        id: "admin-1",
        clinicId: null,
        roles: ["platform_admin" as const],
      };

      const report = await service.getOwnerReport(adminActor, "clinic-pediatrics");
      expect(report.totalQueueEntries).toBe(10);
    });

    it("rejects unauthorized receptionist or doctor from owner reports", async () => {
      const { ReportsService, ReportsServiceError } = await import("./service");
      const service = new ReportsService();
      const receptionistActor = {
        id: "rec-1",
        clinicId: "clinic-pediatrics",
        roles: ["receptionist" as const],
      };
      const doctorActor = {
        id: "doc-1",
        clinicId: "clinic-pediatrics",
        roles: ["doctor" as const],
      };

      await expect(
        service.getOwnerReport(receptionistActor, "clinic-pediatrics")
      ).rejects.toThrowError(ReportsServiceError);

      await expect(
        service.getOwnerReport(doctorActor, "clinic-pediatrics")
      ).rejects.toThrowError(ReportsServiceError);
    });

    it("rejects clinic_owner attempting to access another clinic's reports", async () => {
      const { ReportsService, ReportsServiceError } = await import("./service");
      const service = new ReportsService();
      const otherOwner = {
        id: "owner-2",
        clinicId: "clinic-nutrition",
        roles: ["clinic_owner" as const],
      };

      await expect(
        service.getOwnerReport(otherOwner, "clinic-pediatrics")
      ).rejects.toThrowError(ReportsServiceError);
    });

    it("filters records by doctorId when specified", async () => {
      const { ReportsService } = await import("./service");
      const service = new ReportsService();
      const ownerActor = {
        id: "owner-1",
        clinicId: "clinic-pediatrics",
        roles: ["clinic_owner" as const],
      };

      const reportSara = await service.getOwnerReport(
        ownerActor,
        "clinic-pediatrics",
        { doctorId: "doc-sara", startDate: "2026-10-10", endDate: "2026-10-10" }
      );

      // In SEED_REPORT_RECORDS: 6 entries for doc-sara
      expect(reportSara.totalQueueEntries).toBe(6);
      expect(reportSara.doctorBreakdown.length).toBe(1);
      expect(reportSara.doctorBreakdown[0].doctorId).toBe("doc-sara");
    });
  });
});

