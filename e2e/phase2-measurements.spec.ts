import { test, expect } from "@playwright/test";

test.describe("Phase 2: Rapid Measurements & WHO Growth Engine E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Set consent and initial demo people in localStorage
    await page.addInitScript(() => {
      localStorage.setItem("med_user_consent", "true");
    });
  });

  test("1. Navigate from Family Space to Person Health Dashboard", async ({ page }) => {
    await page.goto("/family");

    // Person cards must be visible
    await expect(page.getByText("أحمد مصطفى إبراهيم")).toBeVisible();
    await expect(page.getByText("سارة أحمد مصطفى")).toBeVisible();

    // Click "الملف والقياس" on Ahmed's card
    const ahmedCard = page.locator("div").filter({ hasText: "أحمد مصطفى إبراهيم" }).first();
    await ahmedCard.getByRole("link", { name: "الملف والقياس" }).click();

    // Verify Dashboard URL and Content
    await expect(page).toHaveURL(/\/family\/person\/p-ahmed/);
    await expect(page.getByText("الملف الصحي الشخصي")).toBeVisible();
    await expect(page.getByText("تاريخ الميلاد: 1988-06-15")).toBeVisible();

    // Verify Vitals cards are visible
    await expect(page.getByText("ضغط الدم")).toBeVisible();
    await expect(page.getByText("السكر")).toBeVisible();
    await expect(page.getByText("النبض")).toBeVisible();
  });

  test("2. Rapid Blood Pressure Logging (< 10s Entry)", async ({ page }) => {
    await page.goto("/family/person/p-ahmed");

    // Open Quick Log Modal
    await page.getByRole("button", { name: /تسجيل قياس سريع/ }).click();
    await expect(page.getByText("تسجيل لـ:")).toBeVisible();

    // Adjust Systolic & Diastolic or type
    await page.fill('input[type="text"][placeholder*="ملاحظات"]', "قياس تجريبي E2E");

    // Submit
    await page.getByRole("button", { name: "حفظ القياس الآن" }).click();

    // Modal closes and entry is visible in history tab
    await page.getByRole("button", { name: /سجل القراءات التاريخي/ }).click();
    await expect(page.getByText("قياس تجريبي E2E")).toBeVisible();
  });

  test("3. Child Profile WHO Growth Curves & Growth Logging", async ({ page }) => {
    await page.goto("/family/person/p-sara");

    // Verify Sara's age and WHO Growth Tab is active by default for child
    await expect(page.getByText("سارة أحمد مصطفى")).toBeVisible();
    await expect(page.getByText("منحنيات النمو الرسمية (WHO)")).toBeVisible();
    await expect(page.getByText("مخطط منظمة الصحة العالمية (WHO Growth Standards)")).toBeVisible();

    // Metric selector buttons
    await expect(page.getByRole("button", { name: "الوزن" })).toBeVisible();
    await expect(page.getByRole("button", { name: "الطول" })).toBeVisible();
    await expect(page.getByRole("button", { name: "محيط الرأس" })).toBeVisible();

    // Quick log a new growth measurement
    await page.getByRole("button", { name: /تسجيل قياس سريع/ }).click();
    await expect(page.getByText("النمو (WHO)")).toBeVisible();
    await page.fill('input[type="text"][placeholder*="ملاحظات"]', "فحص دوري 5 سنوات");
    await page.getByRole("button", { name: "حفظ القياس الآن" }).click();

    // Verify in history
    await page.getByRole("button", { name: /سجل القراءات التاريخي/ }).click();
    await expect(page.getByText("فحص دوري 5 سنوات")).toBeVisible();
  });
});
