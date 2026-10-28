import { test, expect } from "@playwright/test";

test.describe("Phase 5: Childhood Vaccination Tracker (Egyptian MOH Schedule) E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to child Sara's profile
    await page.goto("/family/person/p-sara");
  });

  test("displays child profile and switches to vaccination tracker tab", async ({
    page,
  }) => {
    // 1. Verify child header
    await expect(page.locator("h1")).toContainText("سارة أحمد مصطفى");

    // 2. Verify "التطعيمات" tab is visible for child
    const vaccinationsTab = page.locator("button:has-text('التطعيمات')");
    await expect(vaccinationsTab).toBeVisible();
    await vaccinationsTab.click();

    // 3. Verify MOH official banner and progress bar
    await expect(
      page.locator("text=جدول التطعيمات الإجبارية الرسمية").first()
    ).toBeVisible();
    await expect(
      page.locator("text=وفق جدول وزارة الصحة والسكان المصرية").first()
    ).toBeVisible();

    // 4. Verify Milestones (Birth, 2 months, 4 months, etc.)
    await expect(
      page.locator("text=تطعيمات عند الولادة").first()
    ).toBeVisible();
    await expect(
      page.locator("text=تطعيمات الشهر الثاني").first()
    ).toBeVisible();

    // 5. Verify core mandatory vaccines are listed
    await expect(page.locator("text=BCG (الدرن)").first()).toBeVisible();
  });

  test("can open record vaccination modal and view inputs", async ({
    page,
  }) => {
    // 1. Switch to vaccinations
    await page.locator("button:has-text('التطعيمات')").click();

    // 2. Click record or edit on first available vaccine
    const recordBtn = page
      .locator("button:has-text('تسجيل الإعطاء'), button:has-text('تعديل السجل')")
      .first();
    await expect(recordBtn).toBeVisible();
    await recordBtn.click();

    // 3. Verify modal appears with vaccination details
    await expect(
      page.locator("h2:has-text('تسجيل إعطاء التطعيم')")
    ).toBeVisible();
    await expect(
      page.locator("text=تاريخ إعطاء التطعيم الفعلي")
    ).toBeVisible();

    // 4. Close modal
    await page.locator("button:has-text('إلغاء')").click();
    await expect(
      page.locator("h2:has-text('تسجيل إعطاء التطعيم')")
    ).not.toBeVisible();
  });
});
