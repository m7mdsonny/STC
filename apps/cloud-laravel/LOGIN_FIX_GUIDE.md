# دليل إصلاح مشكلة تسجيل الدخول

## المشكلة
بعد التحديثات الأخيرة، تسجيل الدخول يقول "كلمة المرور أو اسم المستخدم خطأ"

## الحلول المطبقة

### 1. تحسين Query البحث عن المستخدم
- إضافة `whereNull('deleted_at')` لاستبعاد المستخدمين المحذوفين (Soft Deletes)
- تحسين البحث عن المستخدم بالبريد الإلكتروني أو رقم الهاتف

### 2. إزالة forceFill
- استبدال `forceFill` بـ `update` مباشر لتجنب مشاكل في حفظ البيانات

### 3. إضافة Logging
- إضافة logging لتتبع محاولات تسجيل الدخول الفاشلة

## خطوات الإصلاح على السيرفر

### الخطوة 1: سحب التحديثات
```bash
cd /www/wwwroot/api.stcsolutions.online
git pull origin main
```

### الخطوة 2: مسح Cache
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

### الخطوة 3: التحقق من المستخدمين وإصلاح كلمات المرور
```bash
php database/scripts/fix_user_passwords.php
```

### الخطوة 4: التحقق من المستخدمين في قاعدة البيانات
```sql
-- التحقق من جميع المستخدمين
SELECT id, name, email, role, is_active, is_super_admin, deleted_at 
FROM users 
ORDER BY id;

-- التحقق من مستخدم محدد
SELECT id, name, email, role, is_active, is_super_admin, deleted_at, 
       SUBSTRING(password, 1, 20) as password_hash
FROM users 
WHERE email = 'superadmin@demo.local';
```

### الخطوة 5: إعادة تعيين كلمة مرور مستخدم (إذا لزم الأمر)
```bash
php artisan tinker
```

```php
use App\Models\User;
use Illuminate\Support\Facades\Hash;

// إعادة تعيين كلمة مرور Super Admin
$user = User::where('email', 'superadmin@demo.local')->first();
$user->password = Hash::make('Super@12345');
$user->is_active = true;
$user->deleted_at = null; // التأكد من أنه غير محذوف
$user->save();

// إعادة تعيين كلمة مرور Owner
$user = User::where('email', 'owner@org1.local')->first();
if ($user) {
    $user->password = Hash::make('Owner@12345');
    $user->is_active = true;
    $user->deleted_at = null;
    $user->save();
}
```

## بيانات الدخول الصحيحة

### Super Admin:
```
Email: superadmin@demo.local
Password: Super@12345
```

### Organization Owner:
```
Email: owner@org1.local
Password: Owner@12345
```

### Organization Admin:
```
Email: admin@org1.local
Password: Admin@12345
```

## التحقق من Logs

```bash
# عرض آخر محاولات تسجيل الدخول
tail -n 50 storage/logs/laravel.log | grep -i "login\|auth"

# أو
cat storage/logs/laravel.log | grep -i "Login attempt failed"
```

## المشاكل الشائعة والحلول

### 1. المستخدم محذوف (Soft Delete)
```sql
-- استعادة مستخدم محذوف
UPDATE users SET deleted_at = NULL WHERE email = 'superadmin@demo.local';
```

### 2. كلمة المرور غير صحيحة
```php
// إعادة تعيين كلمة المرور
$user = User::where('email', 'superadmin@demo.local')->first();
$user->password = Hash::make('Super@12345');
$user->save();
```

### 3. المستخدم غير مفعّل
```sql
UPDATE users SET is_active = 1 WHERE email = 'superadmin@demo.local';
```

### 4. مشكلة في Email Case Sensitivity
```php
// التأكد من أن Email صغير
$user = User::where('email', 'superadmin@demo.local')->first();
$user->email = strtolower($user->email);
$user->save();
```

## اختبار تسجيل الدخول

```bash
curl -X POST https://api.stcsolutions.online/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@demo.local",
    "password": "Super@12345"
  }'
```

## إذا استمرت المشكلة

1. تحقق من logs في `storage/logs/laravel.log`
2. تحقق من أن المستخدم موجود وغير محذوف
3. تحقق من أن كلمة المرور صحيحة باستخدام `Hash::check()`
4. تحقق من أن `is_active = 1`
5. تحقق من أن `deleted_at = NULL`

