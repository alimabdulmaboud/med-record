import { test, expect } from "@playwright/test";

test.describe("Phase 9: Doctor Dashboard & Core Clinical Record", () => {
  test("displays doctor queue, current consultation patient and prominent allergy banner", async ({
    page,
  }) => {
    await page.goto("/doctor");

    // 1. Doctor Profile & Privacy Header
    await expect(page.getByText("لوحة تحكم الطبيب والسجل السريري")).toBeVisible();
    await expect(page.getByText("د. تامر الشناوي")).toBeVisible();
    await expect(page.getByText("سجل طبي مشفر ومحمي")).toBeVisible();

    // 2. Current Consultation or Waiting Queue
    await expect(page.getByText("داخل غرفة الكشف الآن")).toBeVisible();
    await expect(page.getByText("عمر أحمد خليل").first()).toBeVisible();

    // 3. Prominent Allergy Banner (Non-negotiable requirement)
    await expect(page.getByText("تنبيه الحساسية السريرية")).toBeVisible();
    await expect(page.getByText(/البنسلين ومشتقاته/)).toBeVisible();
    await expect(page.getByText(/شديدة جداً/)).toBeVisible();

    // 4. Chronic Conditions and Current Medications
    await expect(page.getByText("الأمراض المزمنة والتاريخ الطبي")).toBeVisible();
    await expect(page.getByText(/حساسية صدرية/).first()).toBeVisible();
    await expect(page.getByText("الأدوية الجارية والمستمرة")).toBeVisible();

    // 5. Audit Log Notice
    await expect(
      page.getByText("تم تسجيل فتح هذا السجل في سجل التدقيق")
    ).toBeVisible();
  });

  test("loads clinical protocol template and populates visit fields", async ({
    page,
  }) => {
    await page.goto("/doctor");

    // Click quick protocol button for Gastroenteritis
    const protocolBtn = page.getByRole("button", {
      name: /بروتوكول نزلة معوية حادة/,
    });
    await expect(protocolBtn).toBeVisible();
    await protocolBtn.click();

    // Verify chief complaint populated
    const complaintTextarea = page.locator("textarea").first();
    await expect(complaintTextarea).toHaveValue(/قيء متكرر وإسهال مائي/);

    // Verify prescription item populated
    await expect(page.locator('input[value*="Rehydran"]').first()).toBeVisible();
  });

  test("completes visit consultation and triggers completion modal and queue update", async ({
    page,
  }) => {
    await page.goto("/doctor");

    // Click Complete Visit Button
    const completeBtn = page.getByRole("button", {
      name: /إنهاء الكشف وحفظ الزيارة/,
    });
    await expect(completeBtn).toBeVisible();
    await completeBtn.click();

    // Verify Completion Modal
    await expect(
      page.getByText("تم حفظ الزيارة وإنهاء الكشف بنجاح")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "طباعة الروشتة الطبية", exact: true })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "مناداة المريض التالي" }).last()).toBeVisible();
  });

  test("executes call next patient flow in doctor queue", async ({ page }) => {
    await page.goto("/doctor");

    // Look for Call Next button in the queue panel
    const callNextBtn = page.getByRole("button", { name: "مناداة المريض التالي" }).first();
    await expect(callNextBtn).toBeVisible();

    if (await callNextBtn.isEnabled()) {
      await callNextBtn.click();
      // Should show call notification banner
      await expect(page.getByText(/تمت مناداة المريض/)).toBeVisible();
    }
  });
});
