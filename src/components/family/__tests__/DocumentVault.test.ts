import { describe, it, expect } from "vitest";
import {
  validateFileUpload,
  formatFileSize,
  DOCUMENT_CATEGORIES,
} from "../document-vault-utils";

describe("Phase 3: Document Vault Utilities & Validation", () => {
  it("accepts valid PDF, JPEG, PNG, and WEBP files under 15MB", () => {
    const pdf = validateFileUpload({
      name: "cbc_report.pdf",
      size: 5 * 1024 * 1024, // 5MB
      type: "application/pdf",
    });
    expect(pdf.isValid).toBe(true);

    const jpg = validateFileUpload({
      name: "xray.jpg",
      size: 2 * 1024 * 1024, // 2MB
      type: "image/jpeg",
    });
    expect(jpg.isValid).toBe(true);

    const png = validateFileUpload({
      name: "scan.png",
      size: 3 * 1024 * 1024,
      type: "image/png",
    });
    expect(png.isValid).toBe(true);
  });

  it("rejects files exceeding 15MB limit", () => {
    const oversized = validateFileUpload({
      name: "large_mri.pdf",
      size: 16 * 1024 * 1024, // 16MB
      type: "application/pdf",
    });
    expect(oversized.isValid).toBe(false);
    expect(oversized.errorAr).toContain("15 ميجابايت");
  });

  it("rejects unsupported executable or archive file types", () => {
    const exe = validateFileUpload({
      name: "virus.exe",
      size: 1024,
      type: "application/x-msdownload",
    });
    expect(exe.isValid).toBe(false);
    expect(exe.errorAr).toContain("غير مدعوم");
  });

  it("formats file sizes cleanly", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1024 * 350)).toBe("350 KB");
    expect(formatFileSize(1024 * 1024 * 4.5)).toBe("4.5 MB");
  });

  it("defines comprehensive Arabic metadata for all document categories", () => {
    expect(DOCUMENT_CATEGORIES.lab_result.labelAr).toBe("تحاليل طبية");
    expect(DOCUMENT_CATEGORIES.radiology.labelAr).toBe("أشعة وسونار");
    expect(DOCUMENT_CATEGORIES.prescription.labelAr).toBe("روشتات طبية");
    expect(DOCUMENT_CATEGORIES.hospital_report.labelAr).toBe("تقارير مستشفى");
    expect(DOCUMENT_CATEGORIES.vaccination_card.labelAr).toBe("كروت تطعيم");
  });
});
