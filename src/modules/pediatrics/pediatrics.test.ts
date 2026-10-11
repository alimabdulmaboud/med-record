import { describe, it, expect } from "vitest";
import {
  getFullPediatricRecord,
  saveBirthHistory,
  saveFeedingHistory,
  recordVaccination,
  updateMilestone,
  savePediatricExam,
  verifyPediatricsAccess,
  EGYPT_MOH_VACCINE_SCHEDULE,
  DEVELOPMENTAL_MILESTONES_CATALOG,
} from "./service";

describe("Pediatrics Module Service & Domain Logic", () => {
  const pedsDoctor = {
    id: "doc-1",
    role: "doctor",
    clinicId: "clinic-1",
  };

  const clinicWithPeds = ["pediatrics"];
  const clinicWithoutPeds = ["nutrition"];

  describe("Medical Privacy & Module Isolation Guards", () => {
    it("denies access to receptionist", () => {
      const receptionist = {
        id: "rec-1",
        role: "receptionist",
        clinicId: "clinic-1",
      };

      expect(() =>
        verifyPediatricsAccess(receptionist, "clinic-1", clinicWithPeds)
      ).toThrowError(/Medical Privacy Violation/);
    });

    it("denies access to platform admin", () => {
      const admin = {
        id: "admin-1",
        role: "platform_admin",
        clinicId: "clinic-1",
      };

      expect(() =>
        verifyPediatricsAccess(admin, "clinic-1", clinicWithPeds)
      ).toThrowError(/Medical Privacy Violation/);
    });

    it("enforces tenant isolation: Doctor in Clinic 1 cannot access Clinic 2", () => {
      expect(() =>
        verifyPediatricsAccess(pedsDoctor, "clinic-2", clinicWithPeds)
      ).toThrowError(/Tenant Isolation Violation/);
    });

    it("denies access if the clinic does not have the pediatrics module enabled", () => {
      expect(() =>
        verifyPediatricsAccess(pedsDoctor, "clinic-1", clinicWithoutPeds)
      ).toThrowError(/Module Access Denied/);
    });
  });

  describe("Egyptian MOH Mandatory Vaccine Schedule & Tracking", () => {
    it("bundles the official Egyptian MOH schedule as the baseline template", () => {
      expect(EGYPT_MOH_VACCINE_SCHEDULE.length).toBeGreaterThanOrEqual(20);

      // Verify key mandatory vaccines
      const names = EGYPT_MOH_VACCINE_SCHEDULE.map((v) => v.vaccineName);
      expect(names.some((n) => n.includes("الدرن"))).toBe(true);
      expect(names.some((n) => n.includes("شلل الأطفال"))).toBe(true);
      expect(names.some((n) => n.includes("الخماسي"))).toBe(true);
      expect(names.some((n) => n.includes("الثلاثي الفيروسي"))).toBe(true);
    });

    it("correctly identifies administered, due, and overdue vaccines", () => {
      // Omar born in 2022 (approx 4 years old today)
      const record = getFullPediatricRecord(
        pedsDoctor,
        "pat-1",
        "2022-04-15",
        clinicWithPeds
      );

      expect(record.scheduleWithStatus.length).toBeGreaterThan(0);

      // BCG was pre-seeded as administered
      const bcg = record.scheduleWithStatus.find((s) =>
        s.template.vaccineName.includes("الدرن")
      );
      expect(bcg?.calculatedStatus).toBe("administered");

      // An unadministered vaccine from age 18m should be overdue for a 4-year-old
      const dtpBooster = record.scheduleWithStatus.find((s) =>
        s.template.vaccineName.includes("الثلاثي البكتيري المنشط")
      );
      expect(dtpBooster?.calculatedStatus).toBe("overdue");
    });

    it("allows doctor to record vaccine administration", () => {
      const newVac = recordVaccination(
        pedsDoctor,
        {
          patientId: "pat-1",
          vaccineName: "الثلاثي البكتيري المنشط (DTP Booster)",
          doseNumber: 4,
          administeredDate: "2026-10-10",
          batchNumber: "DTP-9921",
          site: "left_thigh",
          status: "administered",
          notes: "تم إعطاء الجرعة المنشطة بنجاح",
        },
        clinicWithPeds
      );

      expect(newVac.id).toBeDefined();
      expect(newVac.status).toBe("administered");

      const refreshed = getFullPediatricRecord(
        pedsDoctor,
        "pat-1",
        "2022-04-15",
        clinicWithPeds
      );
      const dtp = refreshed.scheduleWithStatus.find((s) =>
        s.template.vaccineName.includes("الثلاثي البكتيري المنشط")
      );
      expect(dtp?.calculatedStatus).toBe("administered");
    });
  });

  describe("Developmental Milestones Checklist", () => {
    it("contains structured milestones across 4 domains (motor, fine motor, speech, social)", () => {
      expect(DEVELOPMENTAL_MILESTONES_CATALOG.length).toBeGreaterThanOrEqual(18);

      const categories = new Set(
        DEVELOPMENTAL_MILESTONES_CATALOG.map((m) => m.category)
      );
      expect(categories.has("gross_motor")).toBe(true);
      expect(categories.has("fine_motor")).toBe(true);
      expect(categories.has("speech_language")).toBe(true);
      expect(categories.has("cognitive_social")).toBe(true);
    });

    it("allows doctor to record and update milestone achievements", () => {
      const updated = updateMilestone(
        pedsDoctor,
        "pat-1",
        "m24_two_word_sentences",
        true,
        clinicWithPeds,
        "يتحدث بجمل مفهومة"
      );

      expect(updated.achieved).toBe(true);
      expect(updated.achievedDate).toBeDefined();

      const refreshed = getFullPediatricRecord(
        pedsDoctor,
        "pat-1",
        "2022-04-15",
        clinicWithPeds
      );
      expect(refreshed.milestones["m24_two_word_sentences"].achieved).toBe(true);
    });
  });

  describe("Birth History & Feeding History", () => {
    it("saves and retrieves birth history with neonatal parameters", () => {
      const birth = saveBirthHistory(
        pedsDoctor,
        {
          patientId: "pat-newborn-1",
          gestationalAgeWeeks: 38,
          deliveryType: "vaginal",
          birthWeightKg: 3.2,
          birthLengthCm: 49,
          birthHeadCircumferenceCm: 34,
          apgarScore1min: 8,
          apgarScore5min: 9,
          nicuStay: false,
          nicuDays: 0,
          complications: "لا يوجد",
        },
        clinicWithPeds
      );

      expect(birth.id).toBeDefined();
      expect(birth.birthWeightKg).toBe(3.2);

      const record = getFullPediatricRecord(
        pedsDoctor,
        "pat-newborn-1",
        "2026-10-01",
        clinicWithPeds
      );
      expect(record.birthHistory?.deliveryType).toBe("vaginal");
    });

    it("saves and retrieves feeding history", () => {
      const feeding = saveFeedingHistory(
        pedsDoctor,
        {
          patientId: "pat-newborn-1",
          feedingType: "mixed",
          formulaName: "Nan Optipro 1",
          solidsStartAgeMonths: 6,
          vitaminDSupplement: true,
          ironSupplement: true,
          notes: "فيتامين د 400 وحدة يومياً",
        },
        clinicWithPeds
      );

      expect(feeding.id).toBeDefined();
      expect(feeding.vitaminDSupplement).toBe(true);

      const record = getFullPediatricRecord(
        pedsDoctor,
        "pat-newborn-1",
        "2026-10-01",
        clinicWithPeds
      );
      expect(record.feedingHistory?.feedingType).toBe("mixed");
    });
  });

  describe("Pediatric Physical Examination", () => {
    it("records examination findings by body system", () => {
      const exam = savePediatricExam(
        pedsDoctor,
        {
          patientId: "pat-1",
          generalAppearance: "طفل واعي، نشط، غير شاحب، لا يعاني من ضائقة تنفسية",
          headNeck: "اليافوخ مغلق، الأغشية المخاطية رطبة",
          respiratory: "أصوات تنفسية حويصلية طبيعية، لا توجد تزييقات أو أزيز",
          cardiovascular: "أصوات القلب طبيعية S1+S2 دون لغط",
          abdomen: "لين وغير منتفخ، لا يوجد تضخم بالكبد أو الطحال",
          skin: "خالٍ من الطفح الجلدي واليرقان",
          notes: "فحص روتيني سليم",
        },
        clinicWithPeds
      );

      expect(exam.id).toBeDefined();
      expect(exam.respiratory).toContain("طبيعية");

      const record = getFullPediatricRecord(
        pedsDoctor,
        "pat-1",
        "2022-04-15",
        clinicWithPeds
      );
      expect(record.recentExams.length).toBeGreaterThan(0);
      expect(record.recentExams[0].respiratory).toContain("طبيعية");
    });
  });
});
