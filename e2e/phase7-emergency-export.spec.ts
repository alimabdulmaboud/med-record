import { test, expect } from "@playwright/test";

test.describe("Phase 7: Emergency Medical ID & Comprehensive Data Export E2E", () => {
  test("displays high-contrast emergency ID with blood group, allergies, and 1-tap dialing", async ({
    page,
  }) => {
    // 1. Navigate to emergency medical card
    await page.goto("/emergency/p-ahmed");

    // 2. Verify emergency banner & patient header
    await expect(page.locator("text=بطاقة الطوارئ الطبية السريعة").first()).toBeVisible();
    await expect(page.locator("h1")).toContainText("أحمد مصطفى إبراهيم");

    // 3. Verify prominent blood type
    await expect(page.locator("text=فصيلة الدم")).toBeVisible();
    await expect(page.locator("text=A+").first()).toBeVisible();

    // 4. Verify 123 Ambulance hotline with tel: protocol
    const ambulanceBtn = page.locator("a[href='tel:123']");
    await expect(ambulanceBtn).toBeVisible();
    await expect(ambulanceBtn).toContainText("123");

    // 5. Verify life-threatening allergies section
    await expect(page.locator("text=الحساسيات الدوائية والغذائية المهددة للحياة")).toBeVisible();
    await expect(page.locator("text=بنسلين (Penicillin)").first()).toBeVisible();

    // 6. Verify emergency contacts with tel link
    await expect(page.locator("text=جهات الاتصال للطوارئ")).toBeVisible();
    const contactCallBtn = page.locator("a[href^='tel:']").first();
    await expect(contactCallBtn).toBeVisible();
  });

  test("can switch between family members in emergency mode", async ({
    page,
  }) => {
    await page.goto("/emergency/p-ahmed");

    // Switch to child Sara
    const saraBtn = page.locator("button:has-text('سارة')").first();
    await expect(saraBtn).toBeVisible();
    await saraBtn.click();

    // Verify URL and Sara's details
    await expect(page).toHaveURL(/.*\/emergency\/p-sara/);
    await expect(page.locator("h1")).toContainText("سارة أحمد مصطفى");
    await expect(page.locator("text=طفل").first()).toBeVisible();
  });

  test("verifies settings page has dual JSON and Excel/CSV data sovereignty export options", async ({
    page,
  }) => {
    await page.goto("/family/settings");

    // Verify Data Sovereignty header
    await expect(page.locator("text=تصدير بياناتي بالكامل (Data Sovereignty)")).toBeVisible();

    // Verify both export buttons are present and clickable
    const jsonBtn = page.locator("button:has-text('تحميل JSON')");
    await expect(jsonBtn).toBeVisible();

    const csvBtn = page.locator("button:has-text('تحميل Excel / CSV')");
    await expect(csvBtn).toBeVisible();
  });
});
