import { test, expect } from "@playwright/test";

test.describe("Phase 3: Secure Medical Document Vault E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Set consent in localStorage
    await page.addInitScript(() => {
      localStorage.setItem("med_user_consent", "true");
    });
  });

  test("1. View Medical Documents Vault and filter by category", async ({ page }) => {
    await page.goto("/family/person/p-ahmed");

    // Click "المستندات والتحاليل" tab
    await page.getByRole("button", { name: /المستندات والتحاليل/ }).click();

    // Verify Document Vault Header & Security Notice
    await expect(page.getByText("HMAC-SHA Signed URLs")).toBeVisible();
    await expect(page.getByText("الخزينة آمنة تماماً: المستندات والتحاليل تفتح بروابط مؤقتة")).toBeVisible();

    // Verify seeded documents
    await expect(page.getByText("تحليل دم شامل (Complete Blood Count - CBC)")).toBeVisible();
    await expect(page.getByText("معامل البرج - فرع المعادي")).toBeVisible();

    // Filter by radiology
    await page.getByRole("button", { name: /أشعة وسونار/ }).click();
    await expect(page.getByText("أشعة رنين مغناطيسي على الفقرات القطنية")).toBeVisible();
    await expect(page.getByText("تحليل دم شامل")).not.toBeVisible();

    // Reset to All
    await page.getByRole("button", { name: /الكل/ }).click();
    await expect(page.getByText("تحليل دم شامل (Complete Blood Count - CBC)")).toBeVisible();
  });

  test("2. Upload new medical document with metadata", async ({ page }) => {
    await page.goto("/family/person/p-ahmed");

    // Open upload modal
    await page.getByRole("button", { name: "رفع مستند طبي" }).click();
    await expect(page.getByText("رفع مستند طبي جديد")).toBeVisible();

    // Fill form
    await page.fill('input[placeholder*="تحليل دهون"]', "تقرير فحص نظر دوري");
    await page.fill('input[placeholder*="د. طارق السعدني"]', "د. حازم ياسين");
    await page.fill('input[placeholder*="معامل البرج"]', "مستشفى المغربي للعيون");
    await page.fill('input[placeholder*="كوليسترول، رنين"]', "عيون, كشف");

    // Save
    await page.getByRole("button", { name: "حفظ المستند في الخزينة" }).click();

    // Modal closes and document is visible
    await page.getByRole("button", { name: /المستندات والتحاليل/ }).click();
    await expect(page.getByText("تقرير فحص نظر دوري")).toBeVisible();
    await expect(page.getByText("مستشفى المغربي للعيون")).toBeVisible();
  });
});
