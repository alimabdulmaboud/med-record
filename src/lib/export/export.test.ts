import { describe, it, expect } from "vitest";
import { ClinicExportService, ExportServiceError } from "./service";
import { getAuditLogs } from "../clinical/service";

describe("Clinic Open Data Export — Unit Tests (Phase 15)", () => {
  const service = new ClinicExportService();

  it("allows clinic_owner to export their clinic data in JSON and CSV formats", async () => {
    const ownerActor = {
      id: "owner-1",
      clinicId: "clinic-pediatrics",
      roles: ["clinic_owner" as const],
    };

    const result = await service.exportClinicData(
      ownerActor,
      "clinic-pediatrics",
      "عيادة الشروق لطب الأطفال"
    );

    // JSON Validation
    expect(result.json).toBeDefined();
    expect(result.json.metadata.clinicId).toBe("clinic-pediatrics");
    expect(result.json.patients.length).toBeGreaterThan(0);
    expect(result.json.appointments.length).toBeGreaterThan(0);
    expect(result.json.queueHistory.length).toBeGreaterThan(0);

    // CSV Validations with UTF-8 BOM
    expect(result.csvPatients.startsWith("\uFEFF")).toBe(true);
    expect(result.csvPatients).toContain("معرف المريض,الاسم بالكامل");
    expect(result.csvPatients).toContain("عمر أحمد خليل");

    expect(result.csvAppointments.startsWith("\uFEFF")).toBe(true);
    expect(result.csvAppointments).toContain("معرف الموعد,معرف المريض");

    expect(result.csvQueue.startsWith("\uFEFF")).toBe(true);
    expect(result.csvQueue).toContain("معرف الطابور,معرف المريض");
  });

  it("records an audit log entry when clinic export is generated (Rule #6)", async () => {
    const ownerActor = {
      id: "owner-1",
      clinicId: "clinic-pediatrics",
      roles: ["clinic_owner" as const],
    };

    await service.exportClinicData(ownerActor, "clinic-pediatrics");

    const logs = getAuditLogs();
    const exportLog = logs.find((l) => l.action === "CLINIC_DATA_EXPORT");

    expect(exportLog).toBeDefined();
    expect(exportLog?.clinicId).toBe("clinic-pediatrics");
    expect(exportLog?.actorId).toBe("owner-1");
  });

  it("allows platform_admin to export clinic data", async () => {
    const adminActor = {
      id: "admin-1",
      clinicId: null,
      roles: ["platform_admin" as const],
    };

    const result = await service.exportClinicData(adminActor, "clinic-pediatrics");
    expect(result.json.metadata.exportedBy).toBe("admin-1");
  });

  it("denies unauthorized receptionist or doctor from exporting clinic data", async () => {
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
      service.exportClinicData(receptionistActor, "clinic-pediatrics")
    ).rejects.toThrowError(ExportServiceError);

    await expect(
      service.exportClinicData(doctorActor, "clinic-pediatrics")
    ).rejects.toThrowError(ExportServiceError);
  });

  it("denies clinic_owner from exporting another clinic's data (Rule #3)", async () => {
    const ownerA = {
      id: "owner-a",
      clinicId: "clinic-pediatrics",
      roles: ["clinic_owner" as const],
    };

    await expect(
      service.exportClinicData(ownerA, "clinic-nutrition")
    ).rejects.toThrowError(ExportServiceError);
  });
});
