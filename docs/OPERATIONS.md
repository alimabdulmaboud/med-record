# دليل العمليات والتشغيل — Med SaaS Operations Manual

**المنصة:** Med (Multi-Clinic Clinic Management Platform)  
**الإصدار:** v1.0  
**التاريخ:** أكتوبر 2026  

---

## 1. المتغيرات البيئية والأسرار (Environment Variables & Secrets)

قم بإنشاء ملف `.env.local` في بيئة الإنتاج بالمتغيرات التالية:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-secret-key> # للخلفية والمهام المجدولة فقط

# Application Settings
NEXT_PUBLIC_APP_URL=https://med.clinic
DEFAULT_TIMEZONE=Africa/Cairo
DEFAULT_LOCALE=ar
NODE_ENV=production
```

> **تحذير أمني:** لا تقم أبداً برفع مفتاح `SUPABASE_SERVICE_ROLE_KEY` إلى المستودع أو كود الواجهة الأمامية.

---

## 2. خطوات النشر والتشغيل (Deployment Steps)

### أ. تهيئة قاعدة البيانات وتشغيل الترقيات (Supabase Migrations)
يتم تنفيذ الترقيات حصراً عبر ملفات الترقية في مجلد `supabase/migrations`:
```bash
# تسجيل الدخول إلى Supabase CLI
npx supabase login

# ربط المشروع
npx supabase link --project-ref <your-project-ref>

# تطبيق جميع ملفات الترقية (من 00001 إلى 00007)
npx supabase db push
```

### ب. بناء تطبيق Next.js وتشغيله:
```bash
# تثبيت الاعتماديات
npm ci --legacy-peer-deps

# فحص الجودة الشامل (Lint + Types + Tests)
npm run check

# بناء المشروع للإنتاج
npm run build

# تشغيل الخادم
npm start
```

---

## 3. كيفية تهيئة وإضافة عيادة جديدة (Clinic Onboarding Procedure)

تتم إضافة العيادات حصراً من خلال لوحة إدارة المنصة (`/admin`) أو استدعاء خدمة الدعوات:

1. **تسجيل العيادة:**
   - الانتقال إلى لوحة `/admin` بحساب `platform_admin`.
   - النقر على "إضافة عيادة جديدة" وتحديد اسمها (مثال: "عيادة الصفوة للأطفال والتغذية").
2. **تحديد الوحدات التخصصية:**
   - تفعيل الوحدات المرخصة للعيادة (`pediatrics` و/أو `nutrition`).
3. **إرسال دعوة المالك:**
   - إدخال البريد الإلكتروني لمالك العيادة.
   - يقوم النظام بتوليد رابط دعوة آمن بصلاحية 72 ساعة، مع توثيق ذلك في `audit_log`.
4. **تفعيل العيادة من قِبل المالك:**
   - يفتح المالك رابط الدعوة ويحدد كلمة المرور.
   - يدخل المالك إلى `/settings` لضبط ترويسة الروشتة (اسم العيادة، الأطباء، العنوان، أرقام التواصل) وقائمة أسعار الكشوفات وقواعد الطابور.
5. **دعوة باقي طاقم العمل:**
   - يقوم المالك بدعوة الأطباء وموظفي الاستقبال التابعين لعيادته.

---

## 4. كيفية إضافة وحدة تخصصية جديدة (Adding a New Specialty Module)

تم تصميم النظام بمعمارية قابلة للتوسع Modular Architecture بحيث تكون النواة الأساسية (Core) منفصلة تماماً عن الوحدات التخصصية:

### الخطوة 1: إنشاء مجلد التخصص
قم بإنشاء مجلد في المسار:
```
src/modules/<module_name>/
├── types.ts          # النماذج والواجهات البرمجية
├── engine.ts         # محركات الحسابات النقية (Pure Module مع اختبارات وحدة)
├── service.ts        # خدمات إدارة البيانات والتحقق
└── components/       # مكونات واجهة المستخدم التخصصية
```

### الخطوة 2: تسجيل الوحدة في سجل المنصة (`src/modules/registry.ts`)
قم بتسجيل الوحدة في مصفوفة `AVAILABLE_MODULES`:
```typescript
{
  id: "cardiology",
  name: { ar: "طب وجراحة القلب", en: "Cardiology" },
  description: { ar: "رسم القلب، الفحوصات الإيكو، متابعة ضغط الدم", en: "ECG, Echo, BP monitoring" },
  icon: "HeartPulse",
  isCore: false,
}
```

### الخطوة 3: ترقية قاعدة البيانات وسياسات RLS
قم بإنشاء ملف ترقية في `supabase/migrations/`:
- إنشاء الجداول التخصصية مع حقل `clinic_id`.
- تفعيل RLS وسياسات الوصول للطبيب فقط وحظر مدير المنصة والاستقبال (Rule #2).
- تسجيل أسماء الجداول الجديدة في مصفوفة `CLINICAL_TABLES` في `src/lib/security/clinical-tables.ts`.

### الخطوة 4: الترجمة والنصوص
إضافة مفاتيح النصوص التخصصية في `src/lib/i18n/messages/ar.json` و `en.json`.

---

## 5. مراقبة الطابور والمهام الدورية (Scheduled Jobs)

- **مهمة نهاية اليوم (End of Day Auto-Close):**
  - جدول كرون يعمل يومياً في التوقيت المحدد لكل عيادة (الافتراضي 22:00 بتوقيت القاهرة).
  - يقوم بتحديث جميع سجلات الطابور التي لم تكتمل إلى حالة `left` مع وضع علامة `auto_closed = true`.
  - لا يتم المساس بالسجلات المكتملة (`completed`).
