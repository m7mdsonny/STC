# إصلاح سريع لـ DatabaseSeeder

## المشكلة
الملف على السيرفر لا يزال يحتوي على الكود القديم رغم التحديثات.

## الحل السريع

### الطريقة 1: استخدام Script التلقائي (الأسهل)

```bash
cd /www/wwwroot/api.stcsolutions.online
php database/scripts/fix_database_seeder.php
```

هذا سيقوم بـ:
- إنشاء نسخة احتياطية من الملف
- تحديث الملف تلقائياً
- إزالة الأعمدة القديمة

### الطريقة 2: التحديث اليدوي

```bash
cd /www/wwwroot/api.stcsolutions.online

# نسخ احتياطي
cp database/seeders/DatabaseSeeder.php database/seeders/DatabaseSeeder.php.backup

# تحرير الملف
nano database/seeders/DatabaseSeeder.php
```

ابحث عن هذا القسم (حوالي السطر 16-28):

```php
        // 1. Create Distributors (only if not exists)
        if (DB::table('distributors')->where('id', 1)->doesntExist()) {
            DB::table('distributors')->insert([
            [
                'id' => 1,
                'name' => 'STC Solutions Master Distributor',
                'contact_email' => 'partner@stc-solutions.com',
                'contact_phone' => '+966 11 000 0000',      // ❌ احذف هذا
                'address' => 'Riyadh, Saudi Arabia',        // ❌ احذف هذا
                'commission_rate' => 15.00,                  // ❌ احذف هذا
                'status' => 'active',                        // ❌ احذف هذا
                'created_at' => now(),
                'updated_at' => now(),
            ]
            ]);
        }
```

واستبدله بـ:

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

ثم ابحث عن قسم Organizations (حوالي السطر 30-45):

```php
        // 2. Create Organizations (only if not exists)
        if (DB::table('organizations')->where('id', 1)->doesntExist()) {
            DB::table('organizations')->insert([
            [
                'id' => 1,
                'distributor_id' => 1,
                'name' => 'Demo Corporation',
                'slug' => 'demo-corp',                        // ❌ احذف هذا
                'contact_email' => 'contact@democorp.local',  // ❌ غير هذا إلى 'email'
                'contact_phone' => '+966 11 111 1111',        // ❌ غير هذا إلى 'phone'
                'address' => 'King Fahd Road, Riyadh',
                'status' => 'active',                        // ❌ غير هذا إلى 'is_active' => true
                'created_at' => now(),
                'updated_at' => now(),
            ]
            ]);
        }
```

واستبدله بـ:

```php
        // 2. Create Organizations (only if not exists)
        // Note: organizations table has: id, distributor_id, reseller_id, name, name_en, logo_url, 
        // address, city, phone, email, tax_number, subscription_plan, max_cameras, max_edge_servers, 
        // is_active, timestamps, softDeletes
        if (DB::table('organizations')->where('id', 1)->doesntExist()) {
            DB::table('organizations')->insert([
            [
                'id' => 1,
                'distributor_id' => 1,
                'reseller_id' => null,
                'name' => 'Demo Corporation',
                'name_en' => 'Demo Corporation',
                'logo_url' => null,
                'address' => 'King Fahd Road, Riyadh',
                'city' => 'Riyadh',
                'phone' => '+966 11 111 1111',
                'email' => 'contact@democorp.local',
                'tax_number' => null,
                'subscription_plan' => 'basic',
                'max_cameras' => 50,
                'max_edge_servers' => 5,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
            ]);
        }
```

احفظ الملف (في nano: Ctrl+X, ثم Y, ثم Enter).

### الطريقة 3: استخدام sed (سريع)

```bash
cd /www/wwwroot/api.stcsolutions.online

# نسخ احتياطي
cp database/seeders/DatabaseSeeder.php database/seeders/DatabaseSeeder.php.backup

# إزالة الأعمدة القديمة من distributors
sed -i "/'contact_phone'/d" database/seeders/DatabaseSeeder.php
sed -i "/'address'/d" database/seeders/DatabaseSeeder.php
sed -i "/'commission_rate'/d" database/seeders/DatabaseSeeder.php
sed -i "/'status'/d" database/seeders/DatabaseSeeder.php

# إصلاح organizations
sed -i "s/'contact_email'/'email'/g" database/seeders/DatabaseSeeder.php
sed -i "s/'contact_phone'/'phone'/g" database/seeders/DatabaseSeeder.php
sed -i "s/'slug' => 'demo-corp',//g" database/seeders/DatabaseSeeder.php
sed -i "s/'status' => 'active'/'is_active' => true/g" database/seeders/DatabaseSeeder.php
```

**ملاحظة:** الطريقة 3 قد تحتاج إلى تعديلات يدوية إضافية.

## بعد التحديث

### 1. التحقق من الملف

```bash
grep -i "contact_phone\|commission_rate" database/seeders/DatabaseSeeder.php
```

يجب ألا ترى أي نتائج.

### 2. تشغيل Seeder

```bash
php artisan db:seed
```

### 3. التحقق من البيانات

```bash
php artisan tinker
```

```php
echo "Distributors: " . \App\Models\Distributor::count() . "\n";
echo "Organizations: " . \App\Models\Organization::count() . "\n";
echo "Users: " . \App\Models\User::count() . "\n";
exit
```

## النتيجة المتوقعة

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

