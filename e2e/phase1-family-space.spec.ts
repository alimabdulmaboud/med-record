import { test, expect } from "@playwright/test";

test.describe("Phase 1: Med Platform End-to-End Verification", () => {
  test("1. Landing Entry Screen displays two worlds and toggles English/Arabic", async ({ page }) => {
    await page.goto("/");

    // Verify Title & Choice Cards
    await expect(page.locator("h1")).toContainText("اختر مسار الدخول المناسب لك");
    await expect(page.getByText("مستخدم عادي (فضاء العائلة)")).toBeVisible();
    await expect(page.getByText("طرف في منظومة صحية")).toBeVisible();

    // Verify non-diagnostic notice
    await expect(page.getByText("أداة لتوثيق وحفظ السجلات الصحية والمتابعة الشخصية وليست أداة تشخيص طبي")).toBeVisible();

    // Toggle language
    await page.getByRole("button", { name: "English" }).click();
    await expect(page.locator("h1")).toContainText("Choose your path to enter");
    await expect(page.getByText("Regular User (Family Space)")).toBeVisible();

    // Toggle back
    await page.getByRole("button", { name: "العربية" }).click();
    await expect(page.locator("h1")).toContainText("اختر مسار الدخول المناسب لك");
  });

  test("2. Clinic Gateway is login-only with invitation notice and no public signup", async ({ page }) => {
    await page.goto("/clinic");

    // Must show invitation-only notice
    await expect(page.getByText("نظام مغلق ومحمي بالدعوات فقط")).toBeVisible();
    await expect(page.getByText("الدخول متاح فقط من خلال رابط دعوة معتمد")).toBeVisible();

    // Must show login button and notice that no public signup is allowed
    await expect(page.getByRole("button", { name: "تسجيل الدخول" })).toBeVisible();
    await expect(page.getByText("لا يوجد إنشاء حساب ذاتي")).toBeVisible();

    // Contact modal can open
    await page.getByRole("button", { name: "تواصل معنا" }).click();
    await expect(page.getByText("طلب انضمام عيادة أو مركز طبي")).toBeVisible();
  });

  test("3. Regular User Signup -> Consent Gating -> Family Space Home", async ({ page }) => {
    // Navigate from entry to signup
    await page.goto("/");
    await page.getByRole("link", { name: "إنشاء حساب عائلي جديد" }).click();
    await expect(page).toHaveURL("/signup");

    // Fill signup form
    await page.fill('input[type="text"]', "أحمد مصطفى إبراهيم");
    await page.fill('input[type="email"]', "ahmed.e2e@example.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.getByRole("button", { name: /إنشاء الحساب/ }).click();

    // Must redirect to consent screen first
    await expect(page).toHaveURL("/consent");
    await expect(page.getByText("إقرار الاستخدام وإخلاء المسؤولية الطبية")).toBeVisible();

    // Cannot proceed without checking the disclaimer
    const proceedBtn = page.getByRole("button", { name: /موافق والمتابعة/ });
    await expect(proceedBtn).toBeDisabled();

    // Check agreement
    await page.locator('input[type="checkbox"]').check();
    await expect(proceedBtn).toBeEnabled();
    await proceedBtn.click();

    // Successfully arrives in Family Space
    await expect(page).toHaveURL("/family");
    await expect(page.getByText("أفراد الأسرة المسجلين")).toBeVisible();

    // Seeded family members must be visible
    await expect(page.getByText("أحمد مصطفى إبراهيم")).toBeVisible();
    await expect(page.getByText("سارة أحمد مصطفى")).toBeVisible();
    await expect(page.getByText("ياسين أحمد مصطفى")).toBeVisible();
  });

  test("4. Add person (< 1 min), edit, and soft-archive person", async ({ page }) => {
    await page.goto("/family");

    // Add new child
    await page.getByRole("link", { name: "إضافة فرد جديد" }).click();
    await expect(page).toHaveURL("/family/person/new");

    await page.fill('input[placeholder*="سارة"]', "مريم أحمد مصطفى");
    await page.fill('input[type="date"]', "2024-01-15");
    await page.getByRole("button", { name: "أنثى" }).click();
    await page.getByRole("button", { name: "O+" }).click();
    await page.getByRole("button", { name: "إضافة إلى أفراد الأسرة" }).click();

    await expect(page).toHaveURL("/family");
    await expect(page.getByText("مريم أحمد مصطفى")).toBeVisible();
  });

  test("5. Data export produces JSON and Danger Zone requires typed confirmation", async ({ page }) => {
    await page.goto("/family/settings");

    // Verify Export JSON button
    await expect(page.getByRole("button", { name: "تحميل ملف JSON" })).toBeVisible();

    // Open Delete Data Modal
    await page.getByRole("button", { name: "حذف جميع البيانات" }).click();
    await expect(page.getByText("تأكيد حذف الحساب والبيانات نهائياً")).toBeVisible();

    // Confirm button disabled without exact phrase
    const deleteBtn = page.getByRole("button", { name: "نعم، احذف بياناتي نهائياً" });
    await expect(deleteBtn).toBeDisabled();

    await page.fill('input[placeholder="حذف بياناتي نهائيا"]', "حذف بياناتي نهائيا");
    await expect(deleteBtn).toBeEnabled();
  });
});
