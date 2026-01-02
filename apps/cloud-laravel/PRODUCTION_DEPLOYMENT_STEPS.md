# خطوات النشر على السيرفر - Production Deployment Steps

## 📋 الخطوات المطلوبة بعد تحديث الملفات

### 1️⃣ سحب التحديثات من GitHub

```bash
cd /www/wwwroot/api.stcsolutions.online
git pull origin main
```

---

### 2️⃣ تثبيت/تحديث Dependencies (إذا لزم الأمر)

```bash
composer install --no-dev --optimize-autoloader
```

---

### 3️⃣ مزامنة Migration History (مهم جداً!)

إذا كانت قاعدة البيانات موجودة بالفعل ولكن migrations غير مسجلة:

```bash
php artisan tinker
```

ثم داخل tinker:

```php
require 'database/scripts/baseline_migrations.php';
```

أو يمكنك استخدام السكريبت مباشرة:

```bash
php -r "require 'vendor/autoload.php'; \$app = require 'bootstrap/app.php'; \$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap(); require 'database/scripts/baseline_migrations.php';"
```

**هذا السكريبت سيقوم بـ:**
- التحقق من جميع الجداول الموجودة
- تسجيل migrations المناسبة في جدول `migrations`
- منع أخطاء "table already exists"

---

### 4️⃣ تشغيل Migrations

```bash
php artisan migrate
```

**النتيجة المتوقعة:**
- ✅ "Nothing to migrate" (إذا كانت جميع migrations مسجلة)
- ✅ أو migrations جديدة تعمل بنجاح
- ❌ **لن تحصل على** "table already exists" أو "duplicate column"

---

### 5️⃣ مسح جميع الـ Caches

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

---

### 6️⃣ إعادة بناء Autoloader

```bash
composer dump-autoload --optimize
```

---

### 7️⃣ التحقق من Routes

```bash
php artisan route:list | grep auth
```

**يجب أن ترى:**
```
POST   api/v1/auth/login
POST   api/v1/auth/logout
GET    api/v1/auth/me
```

---

### 8️⃣ التحقق من Migration Status

```bash
php artisan migrate:status
```

**يجب أن ترى:** جميع migrations مع "Ran"

---

### 9️⃣ اختبار Login Endpoint

```bash
curl -X POST https://api.stcsolutions.online/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@stc-solutions.com","password":"password"}'
```

**يجب أن ترى:** `{"token":"...","user":{...}}`

---

## 🔄 إذا واجهت مشاكل

### المشكلة: "Table already exists"

**الحل:**
```bash
# 1. سحب التحديثات
git pull origin main

# 2. مزامنة migration history
php artisan tinker
>>> require 'database/scripts/baseline_migrations.php';

# 3. تشغيل migrations
php artisan migrate
```

---

### المشكلة: "Column already exists"

**الحل:**
```bash
# جميع migrations الآن آمنة
# فقط تأكد من سحب آخر التحديثات
git pull origin main
php artisan migrate
```

---

### المشكلة: "Route not found"

**الحل:**
```bash
php artisan route:clear
php artisan config:clear
composer dump-autoload
```

---

## ✅ Checklist النهائي

- [ ] سحبت آخر التحديثات من GitHub
- [ ] نفذت baseline migration sync script
- [ ] نفذت `php artisan migrate` بنجاح
- [ ] مسحت جميع الـ caches
- [ ] `php artisan route:list` يعمل بدون أخطاء
- [ ] Login endpoint يعمل: `POST /api/v1/auth/login`
- [ ] جميع الجداول موجودة في قاعدة البيانات

---

## 📝 ملاحظات مهمة

1. **دائماً** نفذ baseline migration sync قبل `php artisan migrate`
2. **دائماً** امسح الـ caches بعد التحديثات
3. **دائماً** تحقق من `php artisan route:list` يعمل
4. **لا تقم** بحذف قاعدة البيانات - migrations آمنة الآن

---

## 🚀 الأوامر السريعة (Copy & Paste)

```bash
# 1. سحب التحديثات
cd /www/wwwroot/api.stcsolutions.online && git pull origin main

# 2. تحديث dependencies
composer install --no-dev --optimize-autoloader

# 3. مزامنة migration history
php artisan tinker <<< "require 'database/scripts/baseline_migrations.php';"

# 4. تشغيل migrations
php artisan migrate

# 5. مسح caches
php artisan config:clear && php artisan cache:clear && php artisan route:clear && php artisan view:clear

# 6. إعادة بناء autoloader
composer dump-autoload --optimize

# 7. التحقق
php artisan route:list | grep auth
php artisan migrate:status
```

---

## ✅ النتيجة المتوقعة

بعد تنفيذ جميع الخطوات:

- ✅ `php artisan migrate` يعمل بدون أخطاء
- ✅ `php artisan route:list` يعمل بدون أخطاء  
- ✅ Login endpoint يعمل: `/api/v1/auth/login`
- ✅ جميع الجداول موجودة
- ✅ جميع الأعمدة موجودة
- ✅ لا مزيد من 500 errors

**المنصة جاهزة للإنتاج!** 🎉

