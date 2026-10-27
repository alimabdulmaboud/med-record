export interface ClinicRoutingRole {
  id: string;
  label: string;
  description: string;
}

export const CLINIC_ROUTING_ROLES: ClinicRoutingRole[] = [
  {
    id: "manager",
    label: "مدير العيادة / المركز",
    description: "إدارة الإعدادات، الفريق، والتقارير",
  },
  {
    id: "doctor",
    label: "طبيب / إخصائي",
    description: "الكشوفات، الروشتات، ومتابعة الحالات",
  },
  {
    id: "receptionist",
    label: "موظف استقبال",
    description: "تسجيل المرضى، المواعيد، وإدارة الطابور",
  },
  {
    id: "other",
    label: "أخرى / شريك منظومة",
    description: "فريق التمريض، الدعم الفني، أو المختبر",
  },
];

export function getClinicRoleDetails(roleId: string) {
  const role = CLINIC_ROUTING_ROLES.find((r) => r.id === roleId);
  return {
    roleId,
    label: role?.label || "عضو فريق طبي",
    grantsAccess: false,
    requiresInvitation: true,
    allowPublicSignup: false,
    noticeAr:
      "الدخول متاح فقط من خلال رابط دعوة معتمد من إدارة العيادة أو المنصة. لا يوجد تسجيل حساب ذاتي لأطراف المنظومة الصحية.",
  };
}
