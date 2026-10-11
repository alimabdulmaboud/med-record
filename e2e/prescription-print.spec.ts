import { test, expect } from "@playwright/test";

test.describe("Phase 10: Printable Prescription & Clinic Letterhead", () => {
  test("opens prescription print modal with official clinic letterhead and details", async ({
    page,
  }) => {
    await page.goto("/doctor");

    // Open Print Modal from prescription builder header
    const printBtn = page.getByRole("button", { name: /معاينة وطباعة الروشتة/ });
    await expect(printBtn).toBeVisible();
    await printBtn.click();

    // 1. Verify Print Modal & Letterhead Elements
    await expect(page.getByText("معاينة وطباعة الروشتة الطبية").first()).toBeVisible();
    await expect(page.getByText("د. تامر الشناوي").first()).toBeVisible();
    await expect(page.getByText("عيادات الأمل التخصصية").first()).toBeVisible();
    await expect(page.getByText(/15 شارع النصر/).first()).toBeVisible();

    // 2. Verify Patient Details & Rx Symbol
    await expect(page.getByText("عمر أحمد خليل").first()).toBeVisible();
    await expect(page.getByText("℞").first()).toBeVisible();
    await expect(page.getByText(/Ventolin Syrup/).first()).toBeVisible();

    // 3. Verify Follow-up Date & Footer
    await expect(page.getByText("موعد الاستشارة والمتابعة القادمة").first()).toBeVisible();
    await expect(page.getByText("توقيع الطبيب المعالج").first()).toBeVisible();

    // 4. Verify Audit Trail Notice
    await expect(
      page.getByText("عملية الطباعة وإعادة الطباعة موثقة في سجل التدقيق")
    ).toBeVisible();
  });

  test("toggles paper size between A4 and A5 formats seamlessly", async ({ page }) => {
    await page.goto("/doctor");

    const printBtn = page.getByRole("button", { name: /معاينة وطباعة الروشتة/ });
    await printBtn.click();

    // Default or switch to A4
    const a4Btn = page.getByRole("button", { name: /مقاس A4/ });
    await expect(a4Btn).toBeVisible();
    await a4Btn.click();
    await expect(page.locator(".prescription-print-container").first()).toHaveClass(/w-\[210mm\]/);

    // Switch to A5
    const a5Btn = page.getByRole("button", { name: /مقاس A5/ });
    await expect(a5Btn).toBeVisible();
    await a5Btn.click();
    await expect(page.locator(".prescription-print-container").first()).toHaveClass(/w-\[148mm\]/);
  });

  test("executes reprint action from previous visits timeline with audit trail", async ({
    page,
  }) => {
    await page.goto("/doctor");

    // Find Reprint button on historical visit
    const reprintBtn = page.getByRole("button", { name: "إعادة طباعة الروشتة" }).first();
    await expect(reprintBtn).toBeVisible();
    await reprintBtn.click();

    // Verify modal indicates Reprint mode
    await expect(page.getByText("نسخة معادة (Reprint)").first()).toBeVisible();

    // Trigger Print
    const printNowBtn = page.getByRole("button", { name: "طباعة الروشتة الآن" });
    await expect(printNowBtn).toBeVisible();
    await printNowBtn.click();

    // Verify success banner with audit trail confirmation
    await expect(
      page.getByText(/تمت إعادة طباعة الروشتة وتوثيقها في سجل التدقيق/)
    ).toBeVisible();
  });
});
