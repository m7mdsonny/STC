# تعليمات إصلاح قاعدة البيانات في Production

## المشاكل المكتشفة

1. ❌ جدول `notification_priorities` غير موجود
2. ❌ عمود `deleted_at` غير موجود في `platform_contents`
3. ❌ عمود `key` قد يكون غير موجود في `platform_contents`
4. ❌ عمود `published` قد يكون غير موجود في `platform_contents`

## الحلول المطبقة

### 1. Migrations جديدة
تم إنشاء migrations لإصلاح المشاكل:
- `2025_01_28_000002_fix_notification_priorities_table.php`
- `2025_01_28_000003_fix_platform_contents_soft_deletes.php`

### 2. Error Handling محسّن
تم تحسين Controllers للتعامل مع الجداول غير الموجودة:
- `NotificationController` - يعيد array فارغ بدلاً من crash
- `SettingsController` - يعيد defaults بدلاً من crash
- `PublicContentController` - يعيد defaults بدلاً من crash

## خطوات الإصلاح على Production

### الطريقة 1: استخدام Migrations (مُوصى بها)

```bash
cd /www/wwwroot/api.stcsolutions.online

# 1. التحقق من حالة Migrations
php artisan migrate:status

# 2. تشغيل Migrations الجديدة
php artisan migrate

# 3. التحقق من النتيجة
php artisan tinker
>>> Schema::hasTable('notification_priorities')
>>> Schema::hasColumn('platform_contents', 'deleted_at')
```

### الطريقة 2: استخدام SQL Script مباشرة

```bash
# 1. نسخة احتياطية من قاعدة البيانات
mysqldump -u root -p stc_saas > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. تشغيل SQL Script
mysql -u root -p stc_saas < database/fix_production_database.sql

# 3. التحقق
mysql -u root -p stc_saas -e "SHOW TABLES LIKE 'notification_priorities';"
mysql -u root -p stc_saas -e "DESCRIBE platform_contents;"
```

### الطريقة 3: SQL يدوي

```sql
-- 1. إنشاء جدول notification_priorities
CREATE TABLE IF NOT EXISTS `notification_priorities` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `organization_id` bigint(20) unsigned DEFAULT NULL,
  `notification_type` varchar(255) NOT NULL,
  `priority` varchar(255) NOT NULL DEFAULT 'medium',
  `is_critical` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notification_priorities_organization_id_foreign` (`organization_id`),
  CONSTRAINT `notification_priorities_organization_id_foreign` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. إضافة deleted_at إلى platform_contents
ALTER TABLE `platform_contents` 
ADD COLUMN IF NOT EXISTS `deleted_at` timestamp NULL DEFAULT NULL AFTER `updated_at`;

-- 3. إضافة key إلى platform_contents (إذا لم يكن موجوداً)
ALTER TABLE `platform_contents` 
ADD COLUMN IF NOT EXISTS `key` varchar(255) NOT NULL AFTER `id`,
ADD UNIQUE KEY IF NOT EXISTS `platform_contents_key_unique` (`key`);

-- 4. إضافة published إلى platform_contents (إذا لم يكن موجوداً)
ALTER TABLE `platform_contents` 
ADD COLUMN IF NOT EXISTS `published` tinyint(1) NOT NULL DEFAULT 0 AFTER `section`;
```

## التحقق من الإصلاح

### 1. اختبار API Endpoints

```bash
# Test notification priorities
curl -X GET https://api.stcsolutions.online/api/v1/notification-priorities \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test landing settings GET
curl -X GET https://api.stcsolutions.online/api/v1/settings/landing \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test landing settings SAVE
curl -X PUT https://api.stcsolutions.online/api/v1/settings/landing \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":{"hero_title":"Test Title"},"published":true}'

# Test landing settings GET again (should persist)
curl -X GET https://api.stcsolutions.online/api/v1/settings/landing \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. التحقق من قاعدة البيانات

```sql
-- Check notification_priorities table
DESCRIBE notification_priorities;
SELECT COUNT(*) FROM notification_priorities;

-- Check platform_contents table
DESCRIBE platform_contents;
SELECT * FROM platform_contents WHERE `key` = 'landing_settings';

-- Check for deleted_at column
SHOW COLUMNS FROM platform_contents LIKE 'deleted_at';
SHOW COLUMNS FROM notification_priorities LIKE 'deleted_at';
```

## ملاحظات مهمة

1. **Backup أولاً**: دائماً خذ نسخة احتياطية قبل أي تعديل
2. **Test في Staging**: اختبر الإصلاحات في بيئة staging أولاً
3. **Monitor Logs**: راقب ملفات الـ log بعد الإصلاح
4. **Verify Endpoints**: اختبر جميع الـ API endpoints المتأثرة

## بعد الإصلاح

1. ✅ `notification_priorities` API يجب أن يعمل
2. ✅ Landing page GET يجب أن يعمل
3. ✅ Landing page SAVE يجب أن يحفظ البيانات
4. ✅ لا يجب أن تكون هناك HTTP 500 errors

## إذا استمرت المشاكل

1. تحقق من ملفات الـ Log:
```bash
tail -f storage/logs/laravel.log
```

2. تحقق من حالة Migrations:
```bash
php artisan migrate:status
```

3. تحقق من قاعدة البيانات مباشرة:
```sql
SHOW TABLES;
DESCRIBE notification_priorities;
DESCRIBE platform_contents;
```

