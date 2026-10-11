# دليل إجراءات النسخ الاحتياطي والاستعادة — Med Backup & Restore Guide

هذا المستند يوثق إجراءات النسخ الاحتياطي (Backup) والاستعادة (Restore) لقاعدة بيانات منصة **Med** المتعددة العيادات (Multi-Clinic SaaS).

---

## 1. استراتيجية النسخ الاحتياطي (Backup Architecture)

تعتمد منصة Med على قاعدة بيانات PostgreSQL مع نظام عزل العيادات (Row Level Security):

### أ. النسخ الاحتياطي الكامل المستمر (Physical & PITR Backup)
- يتم تنفيذ نسخ احتياطي آلي كامل يومياً عبر خدمة Supabase / AWS RDS.
- خاصية **Point-in-Time Recovery (PITR)** مفعلة لمدة 7 إلى 30 يوماً، مما يتيح استرجاع حالة قاعدة البيانات بالكامل حتى أي ثانية محددة في حالة الكوارث الكبرى.

### ب. النسخ الاحتياطي المنطقي والتصدير على مستوى العيادة (Tenant Logical Export)
- وفقاً للمتطلب القانوني (Rule #7 & Phase 15)، يحق لمالك العيادة تنزيل نسخة كاملة ومستقلة لبيانات عيادته في أي وقت بتنسيقات مفتوحة:
  1. ملف **JSON** مهيكل يحتوي على بيانات العيادة، المرضى، المواعيد، الطابور، التذكيرات.
  2. ملفات **CSV** بترميز **UTF-8 مع BOM** (`\uFEFF`) لحماية النصوص العربية عند الفتح في Microsoft Excel.
- كل عملية تصدير كامل تسجل فوراً في `audit_log` باسم المستخدم والتوقيت.

---

## 2. إجراءات أخذ النسخة الاحتياطية يدوياً (Manual Backup via CLI)

### 1. نسخة احتياطية كاملة لمخطط وبيانات المنصة:
```bash
pg_dump -h db.supabase.co -U postgres -d postgres -F c -b -v -f "med_full_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### 2. نسخة احتياطية لمخطط الجداول فقط (Schema Only):
```bash
pg_dump -h db.supabase.co -U postgres -d postgres --schema-only -f "med_schema_v1.sql"
```

### 3. نسخة احتياطية لعيادة معينة فقط (Tenant Isolation Backup via Script):
```bash
node scripts/backup-restore.mjs --backup <CLINIC_ID> --output ./backups/clinic_<CLINIC_ID>.json
```

---

## 3. إجراءات الاستعادة والتحقق (Restore Procedure)

### أ. استعادة قاعدة البيانات بالكامل:
```bash
# إنشاء قاعدة بيانات الاسترجاع
createdb -h localhost -U postgres med_recovery

# تشغيل أداة pg_restore
pg_restore -h localhost -U postgres -d med_recovery -v "med_full_backup_YYYYMMDD_HHMMSS.dump"
```

### ب. التحقق من سلامة البيانات المستعادة:
1. التأكد من تفعيل RLS على جميع الجداول:
   ```sql
   select tablename, rowsecurity from pg_tables where schemaname = 'public';
   ```
2. التأكد من وجود مؤشرات البحث والقيود الرئيسية.
3. تشغيل أداة الفحص الذاتي للتحقق من سلامة استعادة العيادات:
   ```bash
   node scripts/backup-restore.mjs --test
   ```

---

## 4. سياسة عدم الحذف النهائي (Rule #5)
وفقاً لميثاق النظام في `AGENTS.md`:
- لا يتم حذف السجلات نهائياً (`HARD DELETE`).
- جميع السجلات المحذوفة تحتفظ بـ `archived_at` و `archived_by` ويمكن استرجاعها مباشرة عبر واجهة الإدارة دون الحاجة لاسترجاع نسخة احتياطية.
