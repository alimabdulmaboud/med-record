import { describe, it, expect } from "vitest";
import { CLINIC_ROUTING_ROLES, getClinicRoleDetails } from "../roles";

describe("Phase 1: Entry Screen & Clinic Gateway Stub Rules", () => {
  it("defines the 4 required clinic routing roles with their Arabic labels", () => {
    expect(CLINIC_ROUTING_ROLES).toEqual([
      { id: "manager", label: "مدير العيادة / المركز", description: "إدارة الإعدادات، الفريق، والتقارير" },
      { id: "doctor", label: "طبيب / إخصائي", description: "الكشوفات، الروشتات، ومتابعة الحالات" },
      { id: "receptionist", label: "موظف استقبال", description: "تسجيل المرضى، المواعيد، وإدارة الطابور" },
      { id: "other", label: "أخرى / شريك منظومة", description: "فريق التمريض، الدعم الفني، أو المختبر" },
    ]);
  });

  it("proves clinic routing role selection never grants any database permission or auto-assigns roles", () => {
    const roleDetails = getClinicRoleDetails("doctor");
    expect(roleDetails).toBeDefined();
    expect(roleDetails.grantsAccess).toBe(false);
    expect(roleDetails.requiresInvitation).toBe(true);
    expect(roleDetails.noticeAr).toContain("الدخول متاح فقط من خلال رابط دعوة معتمد");
  });

  it("verifies clinic stub does NOT permit public self-signup", () => {
    const roleDetails = getClinicRoleDetails("manager");
    expect(roleDetails.allowPublicSignup).toBe(false);
  });
});
