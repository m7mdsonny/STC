# إصلاح مشكلة Cache في Database Seeder

## المشكلة
عند تشغيل `php artisan db:seed`، يظهر خطأ يشير إلى أن الكود القديم لا يزال يعمل، رغم أن التحديثات تم رفعها على GitHub.

## الحل

### 1. التأكد من سحب التحديثات

```bash
cd /www/wwwroot/api.stcsolutions.online

# التحقق من حالة Git
git status

# سحب التحديثات
git pull origin main

# التحقق من أن الملف تم تحديثه
cat database/seeders/DatabaseSeeder.php | head -30
```

يجب أن ترى في السطر 17-27:
```php
// 1. Create Distributors (only if not exists)
// Note: distributors table only has: id, name, contact_email, timestamps, softDeletes
if (DB::table('distributors')->where('id', 1)->doesntExist()) {
    DB::table('distributors')->insert([
    [
        'id' => 1,
        'name' => 'STC Solutions Master Distributor',
        'contact_email' => 'partner@stc-solutions.com',
        'created_at' => now(),
        'updated_at' => now(),
    ]
    ]);
}
```

**إذا لم ترى هذا الكود، فالتحديثات لم يتم سحبها بعد.**

### 2. تنظيف Laravel Cache

```bash
cd /www/wwwroot/api.stcsolutions.online

# Clear all caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Clear compiled files
php artisan clear-compiled

# Regenerate autoload files
composer dump-autoload
```

### 3. تنظيف OPcache (إذا كان مفعلاً)

```bash
# إعادة تحميل PHP-FPM (سيؤدي إلى clear OPcache)
sudo service php-fpm reload

# أو
sudo systemctl reload php-fpm

# أو إذا كان Apache
sudo service apache2 reload
```

### 4. التحقق من أن الملف صحيح

```bash
cd /www/wwwroot/api.stcsolutions.online

# التحقق من محتوى الملف
grep -A 10 "Create Distributors" database/seeders/DatabaseSeeder.php
```

يجب أن ترى:
```
        // 1. Create Distributors (only if not exists)
        // Note: distributors table only has: id, name, contact_email, timestamps, softDeletes
        if (DB::table('distributors')->where('id', 1)->doesntExist()) {
            DB::table('distributors')->insert([
            [
                'id' => 1,
                'name' => 'STC Solutions Master Distributor',
                'contact_email' => 'partner@stc-solutions.com',
```

**إذا رأيت `address` أو `commission_rate` أو `contact_phone` أو `status`، فالتحديثات لم يتم سحبها.**

### 5. إذا استمرت المشكلة - تحديث يدوي

إذا لم تعمل `git pull`، قم بتحديث الملف يدوياً:

```bash
cd /www/wwwroot/api.stcsolutions.online

# نسخ احتياطي
cp database/seeders/DatabaseSeeder.php database/seeders/DatabaseSeeder.php.backup

# تحرير الملف
nano database/seeders/DatabaseSeeder.php
```

ثم استبدل قسم `distributors` (السطور 16-28 تقريباً) بـ:

```php
        // 1. Create Distributors (only if not exists)
        // Note: distributors table only has: id, name, contact_email, timestamps, softDeletes
        if (DB::table('distributors')->where('id', 1)->doesntExist()) {
            DB::table('distributors')->insert([
            [
                'id' => 1,
                'name' => 'STC Solutions Master Distributor',
                'contact_email' => 'partner@stc-solutions.com',
                'created_at' => now(),
                'updated_at' => now(),
            ]
            ]);
        }
```

احفظ الملف (Ctrl+X, ثم Y, ثم Enter).

### 6. تشغيل Seeder مرة أخرى

```bash
php artisan db:seed
```

## إذا استمرت المشكلة

### التحقق من أن الملف الصحيح يتم تحميله

```bash
cd /www/wwwroot/api.stcsolutions.online

# البحث عن أي إشارة للأعمدة القديمة
grep -r "contact_phone\|commission_rate\|address.*distributors" database/seeders/

# يجب ألا ترى أي نتائج
```

### التحقق من أن Composer Autoload محدث

```bash
composer dump-autoload -o
```

### التحقق من صلاحيات الملفات

```bash
ls -la database/seeders/DatabaseSeeder.php

# يجب أن تكون الصلاحيات: -rw-r--r--
# إذا لم تكن كذلك:
chmod 644 database/seeders/DatabaseSeeder.php
```

## التحقق النهائي

بعد كل الخطوات، تحقق من أن الملف صحيح:

```bash
php artisan tinker
```

```php
// قراءة الملف مباشرة
$content = file_get_contents('database/seeders/DatabaseSeeder.php');
if (strpos($content, 'contact_phone') !== false || strpos($content, 'commission_rate') !== false) {
    echo "❌ الملف لا يزال يحتوي على الأعمدة القديمة!\n";
} else {
    echo "✅ الملف صحيح!\n";
}
exit
```

## النتيجة المتوقعة

بعد إصلاح المشكلة وتشغيل `php artisan db:seed`، يجب أن ترى:

```
✅ Database seeded successfully!

📝 Login Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Super Admin:
  Email: superadmin@demo.local
  Password: Super@12345

Organization Admin:
  Email: admin@org1.local
  Password: Admin@12345
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

بدون أي أخطاء!

