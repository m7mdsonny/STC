# AI Modules Schema Fix - ملفات التحديث

## 📋 نظرة عامة

هذا المجلد يحتوي على جميع الملفات المعدلة لإصلاح مشاكل جدول `ai_modules` وربطها بشكل صحيح مع قاعدة البيانات.

---

## 📁 الملفات المعدلة

### 1. Models

#### `AiModule.php`
**الموقع الأصلي**: `/www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/app/Models/AiModule.php`

**التغييرات**:
- ✅ إضافة `SoftDeletes` trait
- ✅ تحديث `$fillable` ليتطابق مع الجدول الفعلي
- ✅ استخدام `is_active` بدلاً من `is_enabled`
- ✅ إزالة `module_key`, `category`, `is_premium`, `min_plan_level`

**كيفية التطبيق**:
```bash
cp AiModule.php /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/app/Models/AiModule.php
```

---

### 2. Seeders

#### `AiModuleSeeder.php`
**الموقع الأصلي**: `/www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/database/seeders/AiModuleSeeder.php`

**التغييرات**:
- ✅ استخدام `name` كمعرف فريد في `updateOrCreate`
- ✅ استخدام `is_active` بدلاً من `is_enabled`
- ✅ إضافة `display_name`, `display_name_ar`, `description_ar`

**كيفية التطبيق**:
```bash
cp AiModuleSeeder.php /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/database/seeders/AiModuleSeeder.php
```

---

### 3. Controllers

#### `FreeTrialRequestController.php`
**الموقع الأصلي**: `/www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/app/Http/Controllers/FreeTrialRequestController.php`

**التغييرات**:
- ✅ تغيير `is_enabled` إلى `is_active` في السطر 305

**كيفية التطبيق**:
```bash
cp FreeTrialRequestController.php /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/app/Http/Controllers/FreeTrialRequestController.php
```

#### `AiModuleController.php`
**الموقع الأصلي**: `/www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/app/Http/Controllers/AiModuleController.php`

**التغييرات**:
- ✅ تغيير `is_enabled` إلى `is_active` لجدول `ai_modules`
- ✅ إزالة المراجع لـ `module_key`, `category`, `is_premium`, `min_plan_level`
- ✅ استخدام `display_name`, `display_name_ar` بدلاً من `name` فقط

**كيفية التطبيق**:
```bash
cp AiModuleController.php /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/app/Http/Controllers/AiModuleController.php
```

---

### 4. Migrations

#### `2025_01_28_000014_fix_ai_modules_table_schema.php`
**الموقع الأصلي**: `/www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/database/migrations/2025_01_28_000014_fix_ai_modules_table_schema.php`

**الوظيفة**:
- ✅ يضيف عمود `deleted_at` للـ SoftDeletes

**كيفية التطبيق**:
```bash
cp 2025_01_28_000014_fix_ai_modules_table_schema.php /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/database/migrations/2025_01_28_000014_fix_ai_modules_table_schema.php
```

#### `2025_01_28_000015_fix_ai_modules_table_columns.php`
**الموقع الأصلي**: `/www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/database/migrations/2025_01_28_000015_fix_ai_modules_table_columns.php`

**الوظيفة**:
- ✅ يضيف `display_name`, `display_name_ar`, `description_ar` إذا كانت ناقصة
- ✅ يعيد تسمية `is_enabled` إلى `is_active` إذا كان موجوداً
- ✅ يزيل `module_key`, `category`, `is_premium`, `min_plan_level`

**كيفية التطبيق**:
```bash
cp 2025_01_28_000015_fix_ai_modules_table_columns.php /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/database/migrations/2025_01_28_000015_fix_ai_modules_table_columns.php
```

---

## 🚀 خطوات التطبيق الكاملة

### الطريقة 1: نسخ الملفات يدوياً

```bash
# الانتقال للمجلد
cd /path/to/deployment/ai_modules_fix

# نسخ Models
cp AiModule.php /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/app/Models/

# نسخ Seeders
cp AiModuleSeeder.php /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/database/seeders/

# نسخ Controllers
cp FreeTrialRequestController.php /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/app/Http/Controllers/
cp AiModuleController.php /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/app/Http/Controllers/

# نسخ Migrations
cp 2025_01_28_000014_fix_ai_modules_table_schema.php /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/database/migrations/
cp 2025_01_28_000015_fix_ai_modules_table_columns.php /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/database/migrations/

# تشغيل Migrations
cd /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel
php artisan migrate --force

# تشغيل Seeders
php artisan db:seed --force
```

### الطريقة 2: استخدام Git Pull (موصى به)

```bash
cd /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel

# سحب التحديثات
git pull origin main

# تشغيل Migrations
php artisan migrate --force

# تشغيل Seeders
php artisan db:seed --force
```

---

## ✅ التحقق من التطبيق

بعد تطبيق التحديثات، تحقق من:

1. **Migrations تمت بنجاح**:
```bash
php artisan migrate:status
```

2. **Seeders تمت بنجاح**:
```bash
php artisan db:seed --class=AiModuleSeeder
```

3. **التحقق من الجدول**:
```sql
DESCRIBE ai_modules;
-- يجب أن يحتوي على: deleted_at, display_name, display_name_ar, description_ar, is_active
```

4. **اختبار API**:
```bash
curl https://api.stcsolutions.online/api/v1/ai-modules
```

---

## 📝 ملاحظات

- جميع Migrations آمنة للتكرار (idempotent)
- يمكن تشغيل Migrations عدة مرات بدون مشاكل
- Seeders تستخدم `updateOrCreate` - آمنة للتكرار

---

## 🔗 روابط مفيدة

- [AI Modules Schema Fix Summary](../../docs/AI_MODULES_SCHEMA_FIX_SUMMARY.md)
- [Installation Guide](../../INSTALLATION.md)

---

**آخر تحديث**: 2025-01-28
