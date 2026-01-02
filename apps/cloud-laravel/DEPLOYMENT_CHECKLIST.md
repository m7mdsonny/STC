# Production Deployment Checklist

## ✅ قبل النشر

- [ ] نسخة احتياطية من قاعدة البيانات
- [ ] نسخة احتياطية من الملفات
- [ ] اختبار في بيئة staging

## 🔧 خطوات الإصلاح على Production

### 1. رفع الملفات الجديدة

```bash
cd /www/wwwroot/api.stcsolutions.online

# تحديث الكود من GitHub
git pull origin main

# أو رفع الملفات يدوياً:
# - app/Http/Controllers/NotificationController.php
# - app/Http/Controllers/SettingsController.php
# - database/migrations/2025_01_28_000002_fix_notification_priorities_table.php
# - database/migrations/2025_01_28_000003_fix_platform_contents_soft_deletes.php
```

### 2. تشغيل Migrations

```bash
# التحقق من حالة Migrations
php artisan migrate:status

# تشغيل Migrations الجديدة
php artisan migrate

# التحقق من النتيجة
php artisan tinker
>>> Schema::hasTable('notification_priorities')
>>> Schema::hasColumn('platform_contents', 'deleted_at')
```

### 3. أو استخدام SQL Script مباشرة

```bash
# نسخة احتياطية
mysqldump -u root -p stc_saas > backup_$(date +%Y%m%d_%H%M%S).sql

# تشغيل SQL Script
mysql -u root -p stc_saas < database/fix_production_database.sql
```

### 4. مسح الكاش

```bash
php artisan route:clear
php artisan config:clear
php artisan cache:clear
php artisan view:clear
composer dump-autoload
```

## ✅ التحقق من الإصلاح

### 1. اختبار API Endpoints

```bash
# Test notification priorities (يجب أن يعيد array حتى لو فارغ)
curl -X GET https://api.stcsolutions.online/api/v1/notification-priorities \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test landing settings GET (يجب أن يعيد defaults على الأقل)
curl -X GET https://api.stcsolutions.online/api/v1/settings/landing \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test landing settings SAVE
curl -X PUT https://api.stcsolutions.online/api/v1/settings/landing \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":{"hero_title":"Test Title"},"published":true}'

# Test landing settings GET again (يجب أن يحفظ البيانات)
curl -X GET https://api.stcsolutions.online/api/v1/settings/landing \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. التحقق من قاعدة البيانات

```sql
-- Check notification_priorities
DESCRIBE notification_priorities;
SELECT COUNT(*) FROM notification_priorities;

-- Check platform_contents
DESCRIBE platform_contents;
SELECT * FROM platform_contents WHERE `key` = 'landing_settings';

-- Verify columns
SHOW COLUMNS FROM platform_contents LIKE 'deleted_at';
SHOW COLUMNS FROM notification_priorities LIKE 'deleted_at';
SHOW COLUMNS FROM platform_contents LIKE 'key';
SHOW COLUMNS FROM platform_contents LIKE 'published';
```

### 3. مراقبة Logs

```bash
# راقب ملفات الـ Log
tail -f storage/logs/laravel.log | grep -E "(notification_priorities|platform_contents|Error|Exception)"
```

## ✅ النتائج المتوقعة

بعد الإصلاح:

1. ✅ `GET /api/v1/notification-priorities` - يعيد array (فارغ أو مع بيانات)
2. ✅ `GET /api/v1/settings/landing` - يعيد defaults على الأقل
3. ✅ `PUT /api/v1/settings/landing` - يحفظ البيانات بنجاح
4. ✅ `GET /api/v1/settings/landing` - يعيد البيانات المحفوظة
5. ✅ لا توجد HTTP 500 errors في logs

## ❌ إذا استمرت المشاكل

1. تحقق من حالة Migrations:
```bash
php artisan migrate:status
```

2. تحقق من قاعدة البيانات مباشرة:
```sql
SHOW TABLES LIKE 'notification_priorities';
SHOW TABLES LIKE 'platform_contents';
DESCRIBE notification_priorities;
DESCRIBE platform_contents;
```

3. تحقق من Logs:
```bash
tail -50 storage/logs/laravel.log
```

4. تحقق من Permissions:
```bash
ls -la database/migrations/2025_01_28_000002_*
ls -la database/migrations/2025_01_28_000003_*
```

