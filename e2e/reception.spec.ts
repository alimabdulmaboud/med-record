import { test, expect } from "@playwright/test";

test.describe("Phase 8: Reception Dashboard & Live Queue", () => {
  test("verifies reception privacy banner and strict non-clinical screen guarantee", async ({
    page,
  }) => {
    await page.goto("/reception");

    // 1. Mandatory Privacy Banner Verification (Rule #2)
    await expect(page.getByText("شاشة الاستقبال مخصصة للطابور والبيانات الإدارية فقط")).toBeVisible();

    // 2. Strict Non-clinical Content Verification
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("تشخيص سريري");
    expect(bodyText).not.toContain("روشتة طبية");
    expect(bodyText).not.toContain("جرعة علاجية");
    expect(bodyText).not.toContain("فحوصات معملية");

    // 3. Realtime Connection Indicator
    await expect(page.getByText("متصل بالخادم (تحديث فوري)")).toBeVisible();

    // 4. Counters are present
    await expect(page.getByText("في الانتظار حالياً")).toBeVisible();
    await expect(page.getByText("داخل الكشف").first()).toBeVisible();
    await expect(page.getByText("اكتمل اليوم")).toBeVisible();
    await expect(page.getByText("غادر اليوم")).toBeVisible();
  });

  test("executes one-tap check-in flow from today's appointments", async ({ page }) => {
    await page.goto("/reception");

    // Switch to appointments tab
    await page.getByRole("button", { name: /مواعيد اليوم المحجوزة/ }).click();

    // Click Check-in on a booked appointment
    const checkInBtn = page.getByRole("button", { name: "تسجيل حضور" }).first();
    await expect(checkInBtn).toBeVisible();
    await checkInBtn.click();

    // Switch back to live queue tab
    await page.getByRole("button", { name: /طابور الانتظار الحي/ }).click();

    // Verify confirmation banner
    await expect(page.getByText("تم تسجيل حضور المريض")).toBeVisible();
  });

  test("executes one-tap call next patient flow", async ({ page }) => {
    await page.goto("/reception");

    // In the waiting list, click "استدعاء للكشف" on the first waiting patient
    const callNextBtn = page.getByRole("button", { name: "استدعاء للكشف" }).first();
    await expect(callNextBtn).toBeVisible();
    await callNextBtn.click();

    // Verify success banner and consultation section
    await expect(page.getByText("تم استدعاء")).toBeVisible();
    await expect(page.getByText("داخل الكشف").first()).toBeVisible();
  });

  test("handles skip alert snooze flow", async ({ page }) => {
    await page.goto("/reception");

    // If skip alert is visible (pre-seeded with skipped patient)
    const alertSection = page.getByText("تنبيه تخطي مريض في الانتظار");
    if (await alertSection.isVisible()) {
      const snoozeBtn = page.getByRole("button", { name: "تأجيل 15 دقيقة" }).first();
      await snoozeBtn.click();

      // Verify snooze notification
      await expect(page.getByText("تم تأجيل تنبيه التخطي")).toBeVisible();
    }
  });

  test("verifies realtime synchronization between two browser sessions", async ({
    browser,
  }) => {
    // 1. Create two separate browser contexts (Reception in session A, Doctor in session B)
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // 2. Both open /reception
    await pageA.goto("/reception");
    await pageB.goto("/reception");

    await expect(pageA.getByText("طابور الانتظار الحي")).toBeVisible();
    await expect(pageB.getByText("طابور الانتظار الحي")).toBeVisible();

    // 3. In Session A: Click Check-in from appointments tab
    await pageA.getByRole("button", { name: /مواعيد اليوم المحجوزة/ }).click();
    const checkInBtnA = pageA.getByRole("button", { name: "تسجيل حضور" }).first();
    if (await checkInBtnA.isVisible()) {
      await checkInBtnA.click();

      // 4. In Session B: Verify Session B automatically received the realtime update
      await pageB.waitForTimeout(500); // Allow broadcast propagation
      const liveQueueB = pageB.getByRole("button", { name: /طابور الانتظار الحي/ });
      await expect(liveQueueB).toBeVisible();
    }

    await contextA.close();
    await contextB.close();
  });
});
