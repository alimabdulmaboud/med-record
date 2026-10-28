import { test, expect } from "@playwright/test";

test.describe("Phase 4: Medications Regimen & Doctor Visits Journal E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to demo person's health dashboard
    await page.goto("/family/person/p-ahmed");
  });

  test("displays person profile and switches to medications and doctor visits tabs", async ({
    page,
  }) => {
    // 1. Verify Ahmed's header and chronic conditions
    await expect(page.locator("h1")).toContainText("أحمد مصطفى إبراهيم");

    // 2. Click on Medications Tab
    const medicationsTab = page.locator("button:has-text('الأدوية')");
    await expect(medicationsTab).toBeVisible();
    await medicationsTab.click();

    // 3. Verify seeded medications are visible
    await expect(
      page.locator("text=كونكور 5 مجم (Concor 5mg)").first()
    ).toBeVisible();
    await expect(
      page.locator("text=جلوكوفاج 1000 مجم (Glucophage 1000mg)").first()
    ).toBeVisible();

    // 4. Verify status filter tabs (الكل, سارية, موقوفة مؤقتاً, منتهي)
    await expect(page.locator("button:has-text('سارية')")).toBeVisible();
    await expect(page.locator("button:has-text('موقوفة مؤقتاً')")).toBeVisible();

    // 5. Click on Encounters (Visits) Tab
    const encountersTab = page.locator("button:has-text('الكشوفات')");
    await expect(encountersTab).toBeVisible();
    await encountersTab.click();

    // 6. Verify seeded doctor visit cards
    await expect(
      page.locator("text=د. طارق البدري").first()
    ).toBeVisible();
    await expect(
      page.locator("text=باطنة وقلب وأوعية دموية").first()
    ).toBeVisible();

    // 7. Verify follow-up alert banner
    await expect(
      page.locator("text=موعد الاستشارة / المتابعة القادمة").first()
    ).toBeVisible();
  });

  test("can open new medication modal and interactive frequency presets", async ({
    page,
  }) => {
    // 1. Switch to medications
    await page.locator("button:has-text('الأدوية')").click();

    // 2. Click add medication button
    const addBtn = page.locator("button:has-text('إضافة دواء جديد')");
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // 3. Verify modal appears
    await expect(page.locator("h2:has-text('إضافة دواء جديد')")).toBeVisible();
    await expect(page.locator("button:has-text('مرة واحدة يومياً')")).toBeVisible();
    await expect(page.locator("button:has-text('بعد الأكل')")).toBeVisible();

    // 4. Close modal
    await page.locator("button:has-text('إلغاء')").click();
    await expect(page.locator("h2:has-text('إضافة دواء جديد')")).not.toBeVisible();
  });
});
