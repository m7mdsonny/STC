# AI Modules Schema Fix - Summary

## المشاكل التي تم إصلاحها

### المشكلة 1: `module_key` غير موجود
**الخطأ**: `Column not found: 1054 Unknown column 'module_key'`

**الحل**:
- ✅ تحديث `AiModuleSeeder` لاستخدام `name` بدلاً من `module_key`
- ✅ تحديث `AiModule` model لإزالة `module_key` من `$fillable`
- ✅ تحديث `AiModuleController` لإزالة جميع المراجع لـ `module_key`

### المشكلة 2: `deleted_at` غير موجود
**الخطأ**: `Column not found: 1054 Unknown column 'ai_modules.deleted_at'`

**الحل**:
- ✅ إنشاء migration `2025_01_28_000014_fix_ai_modules_table_schema.php` لإضافة `deleted_at`
- ✅ إعادة `SoftDeletes` trait إلى `AiModule` model

### المشكلة 3: `is_enabled` vs `is_active`
**الخطأ**: استخدام `is_enabled` في الكود بينما الجدول يستخدم `is_active`

**الحل**:
- ✅ تحديث `AiModuleSeeder` لاستخدام `is_active`
- ✅ تحديث `FreeTrialRequestController` لاستخدام `is_active`
- ✅ تحديث `AiModuleController` لاستخدام `is_active`
- ✅ إنشاء migration لإعادة تسمية `is_enabled` إلى `is_active` إذا كان موجوداً

### المشكلة 4: أعمدة غير موجودة
**الحل**:
- ✅ إزالة المراجع لـ `category`, `is_premium`, `min_plan_level` من Controller
- ✅ إضافة `display_name`, `display_name_ar`, `description_ar` عبر migration إذا كانت ناقصة

## الملفات المحدثة

### Migrations
1. `2025_01_28_000014_fix_ai_modules_table_schema.php`
   - يضيف `deleted_at` للـ SoftDeletes

2. `2025_01_28_000015_fix_ai_modules_table_columns.php`
   - يضيف `display_name`, `display_name_ar`, `description_ar`
   - يعيد تسمية `is_enabled` إلى `is_active` إذا كان موجوداً
   - يزيل `module_key`, `category`, `is_premium`, `min_plan_level`

### Models
3. `apps/cloud-laravel/app/Models/AiModule.php`
   - ✅ يستخدم `name` (UNIQUE) كمعرف
   - ✅ يستخدم `is_active` بدلاً من `is_enabled`
   - ✅ يستخدم `display_name`, `display_name_ar`
   - ✅ يستخدم `SoftDeletes` (بعد إضافة `deleted_at`)

### Seeders
4. `apps/cloud-laravel/database/seeders/AiModuleSeeder.php`
   - ✅ يستخدم `name` في `updateOrCreate`
   - ✅ يستخدم `is_active` بدلاً من `is_enabled`
   - ✅ يتضمن `display_name`, `display_name_ar`, `description_ar`

### Controllers
5. `apps/cloud-laravel/app/Http/Controllers/FreeTrialRequestController.php`
   - ✅ يستخدم `is_active` بدلاً من `is_enabled`

6. `apps/cloud-laravel/app/Http/Controllers/AiModuleController.php`
   - ✅ يستخدم `is_active` بدلاً من `is_enabled`
   - ✅ إزالة المراجع لـ `module_key`, `category`, `is_premium`, `min_plan_level`
   - ✅ استخدام `display_name`, `display_name_ar`

## هيكل الجدول النهائي

```sql
CREATE TABLE `ai_modules` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) UNIQUE NOT NULL,
    `display_name` VARCHAR(255) NOT NULL,
    `display_name_ar` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `description_ar` TEXT NULL,
    `config_schema` JSON NULL,
    `default_config` JSON NULL,
    `required_camera_type` VARCHAR(255) NULL,
    `min_fps` INT NULL,
    `min_resolution` VARCHAR(50) NULL,
    `icon` VARCHAR(255) NULL,
    `display_order` INT DEFAULT 0,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL,  -- Added via migration
    INDEX `idx_ai_modules_active` (`is_active`),
    INDEX `idx_ai_modules_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## التحقق من التطابق

### ✅ Model ↔ Database
- جميع الأعمدة في `$fillable` موجودة في الجدول
- `SoftDeletes` يعمل بعد إضافة `deleted_at`

### ✅ Seeder ↔ Database
- يستخدم `name` كمعرف فريد (يتطابق مع UNIQUE constraint)
- جميع الحقول في البيانات موجودة في الجدول

### ✅ Controller ↔ Model ↔ Database
- جميع الاستعلامات تستخدم أعمدة موجودة
- لا توجد مراجع لأعمدة غير موجودة

## خطوات التطبيق على السيرفر

```bash
cd /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel

# 1. سحب التحديثات
git pull origin main

# 2. تشغيل Migrations
php artisan migrate --force

# 3. تشغيل Seeders
php artisan db:seed --force
```

## Commits المرفوعة

1. `5335ac7` - fix: Update AiModuleController to match actual database schema
2. `f52f25e` - fix: Complete ai_modules table schema alignment
3. `177c540` - fix: Add deleted_at column to ai_modules table via migration
4. `bdb91bf` - fix: Update AiModuleSeeder to match database schema

---

**آخر تحديث**: 2025-01-28
