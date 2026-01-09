# إصلاح خطأ 500 في تسجيل الدخول

## المشكلة
عند محاولة تسجيل الدخول عبر API، يظهر Server Error 500 بدلاً من رسالة خطأ واضحة.

## الحل المطبق

تم إضافة `try-catch` في `AuthController::login()` لالتقاط الأخطاء وتسجيلها في Laravel logs.

## خطوات التحقق من المشكلة على السيرفر

### 1. التحقق من Laravel Logs

```bash
cd /www/wwwroot/api.stcsolutions.online
tail -n 100 storage/logs/laravel.log | grep -A 20 "Login error"
```

أو لعرض آخر الأخطاء:
```bash
tail -n 200 storage/logs/laravel.log
```

### 2. التحقق من أن المستخدم موجود

```bash
cd /www/wwwroot/api.stcsolutions.online
php artisan tinker
```

ثم في Tinker:
```php
$user = \App\Models\User::where('email', 'superadmin@stc-solutions.com')->first();
if ($user) {
    echo "User found: " . $user->name . "\n";
    echo "Role: " . $user->role . "\n";
    echo "Is Active: " . ($user->is_active ? 'yes' : 'no') . "\n";
    echo "Is Super Admin: " . ($user->is_super_admin ? 'yes' : 'no') . "\n";
    echo "Deleted: " . ($user->deleted_at ? 'yes' : 'no') . "\n";
} else {
    echo "User not found!\n";
}
exit
```

### 3. التحقق من كلمة المرور

```bash
php artisan tinker
```

```php
$user = \App\Models\User::where('email', 'superadmin@stc-solutions.com')->first();
if ($user) {
    $check = \Illuminate\Support\Facades\Hash::check('password', $user->password);
    echo "Password check: " . ($check ? 'correct' : 'incorrect') . "\n";
} else {
    echo "User not found!\n";
}
exit
```

### 4. التحقق من Sanctum (Laravel API Tokens)

```bash
php artisan tinker
```

```php
$user = \App\Models\User::where('email', 'superadmin@stc-solutions.com')->first();
if ($user) {
    try {
        $token = $user->createToken('test')->plainTextToken;
        echo "Token created successfully: " . substr($token, 0, 20) . "...\n";
        // Delete test token
        $user->tokens()->delete();
    } catch (\Exception $e) {
        echo "Error creating token: " . $e->getMessage() . "\n";
    }
} else {
    echo "User not found!\n";
}
exit
```

### 5. التحقق من RoleHelper

```bash
php artisan tinker
```

```php
$user = \App\Models\User::where('email', 'superadmin@stc-solutions.com')->first();
if ($user) {
    $rawRole = $user->getAttributes()['role'] ?? 'viewer';
    echo "Raw role: " . $rawRole . "\n";
    
    $normalized = \App\Helpers\RoleHelper::normalize($rawRole);
    echo "Normalized role: " . $normalized . "\n";
    
    $isSuperAdmin = ($normalized === \App\Helpers\RoleHelper::SUPER_ADMIN);
    echo "Is Super Admin: " . ($isSuperAdmin ? 'yes' : 'no') . "\n";
} else {
    echo "User not found!\n";
}
exit
```

### 6. التحقق من قاعدة البيانات

```bash
php artisan tinker
```

```php
// Check if personal_access_tokens table exists (required for Sanctum)
$exists = \Illuminate\Support\Facades\Schema::hasTable('personal_access_tokens');
echo "personal_access_tokens table exists: " . ($exists ? 'yes' : 'no') . "\n";

// Check if users table has required columns
$columns = \Illuminate\Support\Facades\Schema::getColumnListing('users');
echo "Users table columns: " . implode(', ', $columns) . "\n";

// Check required columns
$required = ['id', 'email', 'password', 'role', 'is_active', 'is_super_admin'];
foreach ($required as $col) {
    $has = in_array($col, $columns);
    echo "Column '{$col}': " . ($has ? 'exists' : 'MISSING') . "\n";
}
exit
```

## المشاكل الشائعة والحلول

### 1. المستخدم غير موجود
**الحل**: إنشاء المستخدم أو التحقق من البريد الإلكتروني

```bash
php artisan tinker
```

```php
$user = \App\Models\User::create([
    'name' => 'Super Admin',
    'email' => 'superadmin@stc-solutions.com',
    'password' => \Illuminate\Support\Facades\Hash::make('password'),
    'role' => 'super_admin',
    'is_active' => true,
    'is_super_admin' => true,
]);
echo "User created: " . $user->email . "\n";
exit
```

### 2. جدول personal_access_tokens غير موجود
**الحل**: تشغيل migrations

```bash
php artisan migrate
```

أو إنشاء الجدول يدوياً:
```bash
php artisan migrate --path=database/migrations/2019_12_14_000001_create_personal_access_tokens_table.php
```

### 3. RoleHelper غير موجود
**الحل**: التحقق من وجود الملف

```bash
ls -la app/Helpers/RoleHelper.php
```

إذا لم يكن موجوداً، يجب نسخه من الكود المحدث.

### 4. خطأ في قاعدة البيانات
**الحل**: التحقق من الاتصال

```bash
php artisan tinker
```

```php
try {
    \Illuminate\Support\Facades\DB::connection()->getPdo();
    echo "Database connection: OK\n";
} catch (\Exception $e) {
    echo "Database connection error: " . $e->getMessage() . "\n";
}
exit
```

### 5. خطأ في PHP Memory أو Timeout
**الحل**: زيادة memory_limit و max_execution_time في php.ini

```bash
# في php.ini أو .htaccess
memory_limit = 256M
max_execution_time = 300
```

## اختبار تسجيل الدخول بعد الإصلاح

### من Terminal:
```bash
curl -X POST https://api.stcsolutions.online/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@stc-solutions.com","password":"password"}' \
  -v
```

### النتيجة المتوقعة:
```json
{
  "token": "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "user": {
    "id": 1,
    "name": "Super Admin",
    "email": "superadmin@stc-solutions.com",
    "role": "super_admin",
    "is_active": true,
    "is_super_admin": true
  }
}
```

## إذا استمرت المشكلة

1. **تحقق من Laravel Logs**:
   ```bash
   tail -f storage/logs/laravel.log
   ```
   ثم حاول تسجيل الدخول مرة أخرى وراقب الأخطاء.

2. **تحقق من PHP Error Logs**:
   ```bash
   tail -f /var/log/php-fpm/error.log
   # أو
   tail -f /var/log/php_errors.log
   ```

3. **تحقق من Web Server Logs** (Nginx/Apache):
   ```bash
   tail -f /var/log/nginx/error.log
   # أو
   tail -f /var/log/apache2/error.log
   ```

4. **تفعيل Debug Mode مؤقتاً**:
   ```bash
   # في .env
   APP_DEBUG=true
   
   # ثم clear cache
   php artisan config:clear
   php artisan cache:clear
   ```

   **تحذير**: لا تترك `APP_DEBUG=true` في الإنتاج!

## بعد الإصلاح

1. **Clear Cache**:
   ```bash
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   php artisan view:clear
   ```

2. **إعادة تحميل PHP-FPM** (إذا كان مستخدماً):
   ```bash
   sudo service php-fpm reload
   # أو
   sudo systemctl reload php-fpm
   ```

3. **اختبار تسجيل الدخول مرة أخرى**

