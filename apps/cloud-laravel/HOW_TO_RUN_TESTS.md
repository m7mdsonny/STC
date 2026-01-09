# كيفية تشغيل الاختبارات في Laravel

## ⚠️ مهم: يجب تشغيل الاختبارات قبل أي commit

## الطرق المتاحة لتشغيل الاختبارات

### 1. استخدام PowerShell Script (موصى به)

```powershell
cd apps\cloud-laravel
.\run-tests.ps1
```

هذا الـ script سيبحث تلقائياً عن PHP في المواقع الشائعة:
- `C:\xampp\php\php.exe`
- `C:\laragon\bin\php\php-8.2\php.exe`
- `C:\Program Files\PHP\php.exe`
- PATH environment variable

### 2. استخدام Batch Script

```batch
cd apps\cloud-laravel
run-tests.bat
```

### 3. استخدام Composer (إذا كان PHP في PATH)

```bash
cd apps/cloud-laravel
composer test
```

### 4. الأمر المباشر (إذا كان PHP في PATH)

```bash
cd apps/cloud-laravel
php artisan test
```

### 5. تشغيل اختبارات محددة

```bash
# اختبارات Unit فقط
composer test:unit

# اختبارات Feature فقط
composer test:feature

# اختبار ملف محدد
php artisan test tests/Feature/AuthLoginTest.php
```

## الاختبارات المتاحة

### Feature Tests (9 ملفات):
- ✅ `AuthenticateMiddlewareTest.php` - اختبار middleware المصادقة
- ✅ `AuthLoginTest.php` - اختبار تسجيل الدخول
- ✅ `AuthorizationTest.php` - اختبار الصلاحيات
- ✅ `DatabaseIntegrityTest.php` - اختبار سلامة قاعدة البيانات
- ✅ `EdgeSignatureTest.php` - اختبار HMAC للـ Edge Server
- ✅ `EndToEndTest.php` - اختبارات end-to-end
- ✅ `QuotaEnforcementTest.php` - اختبار تطبيق الحصص
- ✅ `SystemBackupControllerTest.php` - اختبار النسخ الاحتياطي
- ✅ `TenantIsolationTest.php` - اختبار عزل المستأجرين

## إذا فشلت الاختبارات

1. **لا تقم بالـ commit**
2. **اقرأ رسائل الخطأ بعناية**
3. **أصلح المشاكل**
4. **شغّل الاختبارات مرة أخرى**
5. **تأكد من نجاح جميع الاختبارات قبل الـ commit**

## تثبيت PHP (إذا لم يكن مثبتاً)

### Windows:

1. **XAMPP** (موصى به للمبتدئين):
   - تحميل من: https://www.apachefriends.org/
   - تثبيت XAMPP
   - إضافة `C:\xampp\php` إلى PATH

2. **Laragon** (موصى به للمطورين):
   - تحميل من: https://laragon.org/
   - تثبيت Laragon
   - PHP سيكون في `C:\laragon\bin\php\php-8.2`

3. **PHP مباشرة**:
   - تحميل من: https://www.php.net/downloads.php
   - استخراج إلى `C:\php`
   - إضافة `C:\php` إلى PATH

### إضافة PHP إلى PATH:

1. افتح "Environment Variables"
2. ابحث عن "Path" في System Variables
3. اضغط "Edit"
4. اضغط "New"
5. أضف مسار PHP (مثل `C:\xampp\php`)
6. اضغط "OK" في جميع النوافذ
7. أعد تشغيل Terminal

## التحقق من تثبيت PHP

```bash
php --version
```

يجب أن ترى إصدار PHP (مثل PHP 8.2.x)

## ملاحظات مهمة

- ✅ يجب أن تمر جميع الاختبارات قبل أي commit
- ✅ الاختبارات تعمل على قاعدة بيانات test منفصلة
- ✅ لا تقلق، الاختبارات لن تؤثر على قاعدة البيانات الحقيقية
- ✅ إذا فشل اختبار، اقرأ رسالة الخطأ وأصلح المشكلة

---

**تذكر: Tests must pass before commit!**
