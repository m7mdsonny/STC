# دليل استعادة البيانات الأساسية

## المشكلة
تم حذف جميع البيانات من قاعدة البيانات بعد آخر التحديثات. المستخدم الجديد يعمل، لكن المؤسسات والمستخدمين وباقي البيانات غير موجودة.

## الحل

تم تحديث `DatabaseSeeder` لاستعادة البيانات الأساسية بشكل آمن دون حذف البيانات الموجودة.

## خطوات الاستعادة

### 1. سحب التحديثات

```bash
cd /www/wwwroot/api.stcsolutions.online
git pull origin main
```

### 2. تشغيل Database Seeder

```bash
php artisan db:seed
```

أو إذا أردت تشغيل seeder محدد:

```bash
php artisan db:seed --class=DatabaseSeeder
```

### 3. التحقق من البيانات

```bash
php artisan tinker
```

ثم في Tinker:

```php
// التحقق من المؤسسات
echo "Organizations: " . \App\Models\Organization::count() . "\n";

// التحقق من المستخدمين
echo "Users: " . \App\Models\User::count() . "\n";

// عرض المستخدمين
\App\Models\User::all(['id', 'name', 'email', 'role'])->each(function($u) {
    echo "  - {$u->name} ({$u->email}) - Role: {$u->role}\n";
});

// التحقق من Edge Servers
echo "Edge Servers: " . \App\Models\EdgeServer::count() . "\n";

// التحقق من Events
echo "Events: " . \App\Models\Event::count() . "\n";

exit
```

## البيانات التي سيتم إنشاؤها

### 1. Distributor (موزع)
- **ID**: 1
- **Name**: STC Solutions Master Distributor
- **Email**: partner@stc-solutions.com

### 2. Organization (مؤسسة)
- **ID**: 1
- **Name**: Demo Corporation
- **Slug**: demo-corp
- **Email**: contact@democorp.local

### 3. Users (مستخدمين)

#### Super Admin
- **Email**: superadmin@demo.local
- **Password**: Super@12345
- **Role**: super_admin

#### Organization Admin
- **Email**: admin@org1.local
- **Password**: Admin@12345
- **Role**: admin

#### Security Operator (Editor)
- **Email**: operator@org1.local
- **Password**: Operator@12345
- **Role**: editor

#### Viewer User
- **Email**: viewer@org1.local
- **Password**: Viewer@12345
- **Role**: viewer

### 4. License (ترخيص)
- **License Key**: DEMO-CORP-2024-FULL-ACCESS
- **Max Cameras**: 50
- **Max Edge Servers**: 5

### 5. Edge Servers (سيرفرات الحافة)
- **EDGE-DEMO-MAIN-001**: Main Building Edge Server
- **EDGE-DEMO-GATE-002**: Gate Entrance Edge Server

### 6. Events (أحداث)
- 100 حدث عشوائي من أنواع مختلفة

### 7. Notifications (إشعارات)
- 50 إشعار عشوائي

## ملاحظات مهمة

### ✅ الأمان
- الـ seeder يتحقق من وجود البيانات قبل إنشائها
- لن يحذف أو يعدل البيانات الموجودة
- يمكن تشغيله عدة مرات بأمان

### ⚠️ تحذيرات
- إذا كان لديك مستخدم موجود بنفس البريد الإلكتروني، لن يتم إنشاؤه مرة أخرى
- البيانات الموجودة لن تتأثر
- المستخدم الجديد الذي أنشأته سيظل موجوداً

### 🔄 إذا أردت إعادة إنشاء البيانات

إذا أردت حذف البيانات القديمة وإعادة إنشائها:

```bash
php artisan tinker
```

```php
// حذف البيانات (احذر!)
\App\Models\Event::truncate();
\App\Models\Notification::truncate();
\App\Models\EdgeServer::truncate();
\App\Models\License::truncate();
\App\Models\User::where('email', 'like', '%@org1.local')->orWhere('email', 'like', '%@demo.local')->delete();
\App\Models\Organization::where('id', 1)->delete();
\App\Models\Distributor::where('id', 1)->delete();

exit
```

ثم شغل الـ seeder مرة أخرى:

```bash
php artisan db:seed
```

## اختبار تسجيل الدخول

بعد تشغيل الـ seeder، جرب تسجيل الدخول:

```bash
curl -X POST https://api.stcsolutions.online/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@demo.local","password":"Super@12345"}'
```

## إذا واجهت مشاكل

### 1. خطأ في Foreign Keys

```bash
php artisan tinker
```

```php
\Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0');
// ثم شغل الـ seeder
exit
```

### 2. خطأ في المستخدمين

```bash
php artisan tinker
```

```php
// التحقق من المستخدمين الموجودين
\App\Models\User::all(['id', 'email', 'role'])->each(function($u) {
    echo "ID: {$u->id}, Email: {$u->email}, Role: {$u->role}\n";
});

// إنشاء مستخدم يدوياً إذا لزم الأمر
$user = \App\Models\User::create([
    'name' => 'Super Administrator',
    'email' => 'superadmin@demo.local',
    'password' => \Illuminate\Support\Facades\Hash::make('Super@12345'),
    'role' => 'super_admin',
    'is_active' => true,
    'is_super_admin' => true,
]);
echo "User created: {$user->email}\n";

exit
```

### 3. خطأ في المؤسسات

```bash
php artisan tinker
```

```php
// التحقق من المؤسسات
\App\Models\Organization::all(['id', 'name', 'slug'])->each(function($org) {
    echo "ID: {$org->id}, Name: {$org->name}, Slug: {$org->slug}\n";
});

// إنشاء مؤسسة يدوياً إذا لزم الأمر
$org = \App\Models\Organization::create([
    'distributor_id' => 1,
    'name' => 'Demo Corporation',
    'slug' => 'demo-corp',
    'contact_email' => 'contact@democorp.local',
    'contact_phone' => '+966 11 111 1111',
    'address' => 'King Fahd Road, Riyadh',
    'status' => 'active',
]);
echo "Organization created: {$org->name}\n";

exit
```

## النتيجة المتوقعة

بعد تشغيل الـ seeder بنجاح، يجب أن ترى:

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

وستكون البيانات التالية متوفرة:
- ✅ 1 Distributor
- ✅ 1 Organization
- ✅ 4 Users (Super Admin + 3 Organization Users)
- ✅ 1 License
- ✅ 2 Edge Servers
- ✅ 100 Events
- ✅ 50 Notifications

