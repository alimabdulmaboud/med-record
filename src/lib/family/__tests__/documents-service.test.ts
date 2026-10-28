import { describe, it, expect, beforeEach } from "vitest";
import {
  addPersonDocument,
  getPersonDocuments,
  archivePersonDocument,
  getDocumentDownloadUrl,
  clearDocumentsStore,
  seedRealisticMockDocuments,
} from "../documents-service";
import { verifySignedUrlToken } from "@/lib/med-record/storage";
import type { Person } from "@/types/family";

describe("Phase 3: Family Documents Service", () => {
  const adultAhmed: Person = {
    id: "p-ahmed",
    family_id: "fam-demo",
    name: "أحمد مصطفى إبراهيم",
    birth_date: "1988-06-15",
    sex: "male",
    blood_type: "A+",
    allergies: [],
    chronic_conditions: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    clearDocumentsStore();
  });

  it("adds a medical document and retrieves it by person id", async () => {
    const doc = await addPersonDocument({
      family_id: adultAhmed.family_id,
      person_id: adultAhmed.id,
      title: "تحليل دم شامل CBC",
      document_type: "lab_result",
      file_name: "cbc_report_2026.pdf",
      file_type: "application/pdf",
      file_size_bytes: 1024 * 450, // 450KB
      doctor_name: "د. هاني عثمان",
      facility_name: "معامل البرج",
      tags: ["CBC", "صورة دم"],
    });

    expect(doc.id).toBeDefined();
    expect(doc.storage_path).toContain(adultAhmed.id);
    expect(doc.document_date).toBeDefined();

    const list = await getPersonDocuments(adultAhmed.id);
    expect(list.length).toBe(1);
    expect(list[0].title).toBe("تحليل دم شامل CBC");
  });

  it("filters documents by category and search keywords", async () => {
    await addPersonDocument({
      family_id: adultAhmed.family_id,
      person_id: adultAhmed.id,
      title: "تحليل دهون ثلاثية وكوليسترول",
      document_type: "lab_result",
      file_name: "lipid_panel.pdf",
      file_type: "application/pdf",
      file_size_bytes: 300000,
      facility_name: "معامل المختبر",
      tags: ["Lipid", "كوليسترول"],
    });

    await addPersonDocument({
      family_id: adultAhmed.family_id,
      person_id: adultAhmed.id,
      title: "أشعة مقطعية على الفقرات",
      document_type: "radiology",
      file_name: "spine_ct.jpg",
      file_type: "image/jpeg",
      file_size_bytes: 1500000,
      facility_name: "مركز كايرو سكان",
      tags: ["أشعة", "ظهر"],
    });

    // 1. Filter by category
    const labsOnly = await getPersonDocuments(adultAhmed.id, { category: "lab_result" });
    expect(labsOnly.length).toBe(1);
    expect(labsOnly[0].document_type).toBe("lab_result");

    const radiologyOnly = await getPersonDocuments(adultAhmed.id, { category: "radiology" });
    expect(radiologyOnly.length).toBe(1);
    expect(radiologyOnly[0].document_type).toBe("radiology");

    // 2. Search query matching facility or title
    const searchRes = await getPersonDocuments(adultAhmed.id, { search: "كايرو سكان" });
    expect(searchRes.length).toBe(1);
    expect(searchRes[0].title).toContain("أشعة");
  });

  it("soft-deletes/archives a document", async () => {
    const doc = await addPersonDocument({
      family_id: adultAhmed.family_id,
      person_id: adultAhmed.id,
      title: "روشتة قديمة",
      document_type: "prescription",
      file_name: "rx_old.pdf",
      file_type: "application/pdf",
      file_size_bytes: 120000,
    });

    const success = await archivePersonDocument(doc.id);
    expect(success).toBe(true);

    const activeList = await getPersonDocuments(adultAhmed.id);
    expect(activeList.length).toBe(0);
  });

  it("generates a valid expiring cryptographic signed download URL", async () => {
    const doc = await addPersonDocument({
      family_id: adultAhmed.family_id,
      person_id: adultAhmed.id,
      title: "تقرير خروج مستشفى",
      document_type: "hospital_report",
      file_name: "discharge_summary.pdf",
      file_type: "application/pdf",
      file_size_bytes: 800000,
    });

    const signedUrl = await getDocumentDownloadUrl(doc.id);
    expect(signedUrl).toContain("/api/med-record/documents/download");
    expect(signedUrl).toContain("token=");
    expect(signedUrl).toContain("expires=");

    // Verify token validity with HMAC verifier
    const isValid = verifySignedUrlToken(signedUrl);
    expect(isValid).toBe(true);
  });
});
