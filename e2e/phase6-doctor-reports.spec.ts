import { test, expect } from "@playwright/test";

test.describe("Phase 6: Bilingual Doctor Report Generator & Expiring Share Links E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to adult Ahmed's profile
    await page.goto("/family/person/p-ahmed");
  });

  test("displays report action button in header and opens DoctorReportModal", async ({
    page,
  }) => {
    // 1. Verify profile loaded
    await expect(page.locator("h1")).toContainText("الملف الصحي الشخصي");

    // 2. Click "تقرير الطبيب (A4 / PDF)" button in header
    const reportBtn = page.locator("button:has-text('تقرير الطبيب')").first();
    await expect(reportBtn).toBeVisible();
    await reportBtn.click();

    // 3. Verify modal opens with configuration inputs
    await expect(page.locator("h3:has-text('إنشاء تقرير طبي موجز')")).toBeVisible();
    await expect(page.locator("text=الفترة الزمنية للبيانات السريرية")).toBeVisible();
    await expect(page.locator("text=الأقسام المتضمنة في التقرير")).toBeVisible();

    // 4. Close modal
    await expect(page.locator("button:has-text('القياسات والمؤشرات الحيوية')").first()).toBeVisible();
    const closeBtn = page.locator("button:has(svg.lucide-x)").first();
    await closeBtn.click();
    await expect(page.locator("h3:has-text('إنشاء تقرير طبي موجز')")).not.toBeVisible();
  });

  test("can switch to reports tab and inspect A4 IPS clinical summary", async ({
    page,
  }) => {
    // 1. Switch to reports tab
    const reportsTab = page.locator("button:has-text('التقارير الطبية')");
    await expect(reportsTab).toBeVisible();
    await reportsTab.click();

    // 2. Verify A4 Report container and bilingual header
    await expect(
      page.locator("text=الملخص الطبي للمريض • Patient Clinical Summary").first()
    ).toBeVisible();
    await expect(
      page.locator("text=معايير HL7 FHIR IPS الدولية").first()
    ).toBeVisible();

    // 3. Verify patient demographics strip and action buttons
    await expect(
      page.locator("button:has-text('طباعة / حفظ كـ PDF')").first()
    ).toBeVisible();
    await expect(
      page.locator("button:has-text('مشاركة رابط مؤقت للطبيب')").first()
    ).toBeVisible();
  });

  test("opens share modal and allows configuring expiring cryptographic link with PIN", async ({
    page,
  }) => {
    // 1. Switch to reports tab
    await page.locator("button:has-text('التقارير الطبية')").click();

    // 2. Click share button
    const shareBtn = page.locator("button:has-text('مشاركة رابط مؤقت للطبيب')").first();
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();

    // 3. Verify share modal opens with expiration options & PIN input
    await expect(page.locator("h3:has-text('مشاركة رابط طبي مؤمن للطبيب')")).toBeVisible();
    await expect(page.locator("text=مدة صلاحية الرابط")).toBeVisible();
    await expect(page.locator("text=رمز سري اختياري")).toBeVisible();

    // 4. Verify 72-hour recommended preset is available
    await expect(page.locator("button:has-text('72 ساعة')").first()).toBeVisible();

    // 5. Close share modal
    const closeBtn = page.locator("button:has-text('إغلاق')").first();
    await closeBtn.click();
    await expect(page.locator("h3:has-text('مشاركة رابط طبي مؤمن للطبيب')")).not.toBeVisible();
  });
});
