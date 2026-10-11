import { test, expect } from "@playwright/test";

test.describe("Phase 4: Platform Admin Console & Medical Privacy Verification", () => {
  test("verifies /admin displays mandatory privacy banner and zero medical data", async ({
    page,
  }) => {
    // 1. Navigate to Platform Admin Console
    await page.goto("/admin");

    // 2. Mandatory Banner Verification: "هذه اللوحة لا تعرض أي بيانات طبية"
    const banner = page.getByTestId("privacy-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("هذه اللوحة لا تعرض أي بيانات طبية");

    // 3. Strict Non-clinical Content Verification (Rule #2)
    // Assert that clinical keywords and medical charts never appear in platform admin console
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("تشخيص"); // Diagnosis
    expect(bodyText).not.toContain("روشتة"); // Prescription
    expect(bodyText).not.toContain("جرعة"); // Drug dose
    expect(bodyText).not.toContain("منحنى النمو"); // Growth chart
    expect(bodyText).not.toContain("سعرات حرارية"); // Calories / Diet plan

    // 4. Verify Admin Navigation Tabs are visible
    await expect(page.getByRole("button", { name: /العيادات/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /المستخدمون/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /الدعوات/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /سجل التدقيق/ })).toBeVisible();

    // 5. Test Tab Switching
    await page.getByRole("button", { name: /المستخدمون/ }).click();
    await expect(page.getByText("المستخدمون عبر جميع العيادات")).toBeVisible();

    await page.getByRole("button", { name: /الدعوات/ }).click();
    await expect(page.getByText("إدارة دعوات الانضمام")).toBeVisible();

    await page.getByRole("button", { name: /سجل التدقيق/ }).click();
    await expect(page.getByText("سجل العمليات والتدقيق الإداري")).toBeVisible();
  });
});
