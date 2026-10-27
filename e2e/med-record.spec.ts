import { test, expect } from "@playwright/test";

test.describe("Med Record (سجلي الطبي) — Complete Family Health Suite", () => {
  test("verifies dashboard loads with family switcher, emergency banner and quick log modal", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. App Title & Branding
    await expect(page.locator("text=سجلي الطبي").first()).toBeVisible();

    // 2. Emergency Quick Banner
    await expect(page.getByText("بطاقة الطوارئ الطبية السريعة").first()).toBeVisible();

    // 3. Fast Vital Log Trigger (<10 seconds)
    const quickLogBtn = page.getByRole("button", { name: /تسجيل سريع لمؤشر حيوي/i });
    await expect(quickLogBtn).toBeVisible();

    // 4. Open and verify Quick Log Modal
    await quickLogBtn.click();
    await expect(page.getByText("تسجيل مؤشر حيوي سريع (أقل من 10 ثوانٍ)")).toBeVisible();

    // Select measurement type (e.g. blood pressure)
    await expect(page.getByText("ضغط الدم (Blood Pressure)")).toBeVisible();
    await page.getByRole("button", { name: "إلغاء" }).click();
  });

  test("verifies measurements hub and WHO growth percentiles for children", async ({ page }) => {
    await page.goto("/measurements");

    // Check title and tabs
    await expect(page.getByText("سجل القياسات والمؤشرات الحيوية")).toBeVisible();
    await expect(page.getByRole("button", { name: /ضغط الدم/i }).first()).toBeVisible();

    // Switch to child "سارة أحمد مصطفى"
    const memberSelect = page.locator("select").first();
    await memberSelect.selectOption({ label: "سارة أحمد مصطفى (طفل)" });

    // Check that WHO Growth Percentile tab is available for child
    const whoTab = page.getByRole("button", { name: /منحنيات النمو (WHO)/i });
    await expect(whoTab).toBeVisible();
    await whoTab.click();

    // Verify WHO growth chart container is displayed
    await expect(page.getByText("منحنى نمو الطفل المعتمد من منظمة الصحة العالمية (WHO)")).toBeVisible();
  });

  test("verifies document vault with signed URLs and category filtering", async ({ page }) => {
    await page.goto("/documents");

    await expect(page.getByText("خزينة الوثائق والتقارير الطبية")).toBeVisible();
    await expect(page.getByText("روابط موقعة ومؤقتة")).toBeVisible();

    // Filter by Lab Results
    const labFilter = page.getByRole("button", { name: /تحاليل مخبرية/i }).first();
    await expect(labFilter).toBeVisible();
    await labFilter.click();
  });

  test("verifies medications manager and doctor visits log", async ({ page }) => {
    // 1. Medications
    await page.goto("/medications");
    await expect(page.getByText("الأدوية والعلاجات المنتظمة")).toBeVisible();
    await expect(page.getByText("Concor 5mg").first()).toBeVisible();

    // 2. Visits
    await page.goto("/visits");
    await expect(page.getByText("سجل استشارات وزيارات الأطباء")).toBeVisible();
  });

  test("verifies Egyptian MOH childhood vaccination tracker", async ({ page }) => {
    await page.goto("/vaccinations");
    await expect(page.getByText("جدول التطعيمات الإجبارية للأطفال")).toBeVisible();
    await expect(page.getByText("وزارة الصحة والسكان المصرية")).toBeVisible();
  });

  test("verifies bilingual doctor report builder, A4 print preview and share modal", async ({ page }) => {
    await page.goto("/report");

    await expect(page.getByText("مُنشئ تقرير الطبيب المعتمد (1-2 صفحة)")).toBeVisible();
    await expect(page.getByText("آخر 3 أشهر (الموصى بها)")).toBeVisible();
    await expect(page.getByText("القياسات والمؤشرات الحيوية")).toBeVisible();

    // Check bilingual print view
    await expect(page.getByText("معاينة التقرير الطبي للطباعة والمشاركة")).toBeVisible();
    await expect(page.getByText("Medical Summary for Doctor")).toBeVisible();

    // Open Share Modal
    const shareBtn = page.getByRole("button", { name: /مشاركة رابط مؤقت للطبيب/i }).first();
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();

    // Check modal contents
    await expect(page.getByText("مشاركة تقرير طبي مؤمن مع الطبيب المعالج")).toBeVisible();
    await expect(page.getByText("مدة صلاحية الرابط:")).toBeVisible();
  });

  test("verifies emergency quick card with blood type and 123 ambulance dialer", async ({ page }) => {
    await page.goto("/emergency");

    // Blood type & Emergency title
    await expect(page.getByText("بطاقة الطوارئ الطبية السريعة").first()).toBeVisible();
    await expect(page.getByText("فصيلة الدم")).toBeVisible();

    // Egyptian ambulance speed dial
    await expect(page.getByText("الإسعاف المصرية (Ambulance)")).toBeVisible();
    await expect(page.locator("a[href='tel:123']")).toBeVisible();

    // Emergency contacts
    await expect(page.getByText("جهات الاتصال للطوارئ")).toBeVisible();
  });

  test("verifies settings, open data export (JSON/CSV) and medical disclaimer", async ({ page }) => {
    await page.goto("/settings");

    await expect(page.getByText("إعدادات الخصوصية وسيادة البيانات الطبية")).toBeVisible();
    await expect(page.getByText("تصدير السجل الكامل (JSON / FHIR)")).toBeVisible();
    await expect(page.getByText("تصدير القياسات الحيوية (CSV)")).toBeVisible();

    // Medical disclaimer
    await expect(page.getByText("إخلاء المسؤولية الطبية ونطاق استخدام التطبيق")).toBeVisible();

    // Danger zone
    await expect(page.getByText("منطقة الخطر")).toBeVisible();
    await expect(page.getByRole("button", { name: /مسح جميع بياناتي وسجلاتي نهائياً/i })).toBeVisible();
  });
});
