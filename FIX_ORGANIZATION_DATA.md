# دليل إصلاح بيانات المؤسسات
## Fix Organization Data Guide

---

## المشكلة | Problem

عند إضافة سيرفر أو كاميرا، يظهر خطأ: **"المورد المطلوب غير موجود"**

**السبب:**  
المستخدم لديه `organization_id` في جدول `users` لكن هذه المؤسسة غير موجودة في جدول `organizations`.

---

## الحل السريع | Quick Solution

### الخطوة 1: التحقق من البيانات

```bash
# على السيرفر، نفذ الأمر التالي للتحقق من المشكلة (بدون تعديل):
php artisan fix:organization-data --dry-run
```

سيظهر لك:
- عدد المستخدمين الذين لديهم `organization_id` غير صحيح
- تفاصيل هؤلاء المستخدمين

### الخطوة 2: إصلاح البيانات

```bash
# تشغيل الإصلاح الفعلي
php artisan fix:organization-data
```

سيسألك الأمر:
1. **هل تريد إنشاء مؤسسات للمستخدمين؟** (موصى به)  
   → اختر `yes` لإنشاء مؤسسات جديدة

2. **أم تريد حذف organization_id؟**  
   → اختر `yes` إذا كنت تريد جعل المستخدمين بدون مؤسسة

---

## الحل اليدوي | Manual Solution

### 1. فحص المشكلة

```sql
-- التحقق من المستخدمين بـ organization_id غير صحيح
SELECT u.id, u.email, u.name, u.organization_id, o.id as org_exists
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE u.organization_id IS NOT NULL AND o.id IS NULL;
```

### 2. إنشاء مؤسسات للمستخدمين المتأثرين

```sql
-- إنشاء مؤسسة جديدة لمستخدم معين
INSERT INTO organizations (id, name, name_en, email, subscription_plan, max_cameras, max_edge_servers, is_active, created_at, updated_at)
VALUES (
    [ORGANIZATION_ID],  -- نفس organization_id من جدول users
    'اسم المؤسسة',
    'Organization Name',
    'email@example.com',
    'basic',
    4,
    1,
    1,
    NOW(),
    NOW()
);
```

### 3. أو حذف organization_id من المستخدمين

```sql
-- حذف organization_id للمستخدمين المتأثرين
UPDATE users 
SET organization_id = NULL 
WHERE organization_id NOT IN (SELECT id FROM organizations);
```

---

## الوقاية من المشكلة | Prevention

### إضافة Foreign Key Constraint

```sql
-- إضافة constraint لضمان سلامة البيانات
ALTER TABLE users
ADD CONSTRAINT fk_users_organization
FOREIGN KEY (organization_id) 
REFERENCES organizations(id)
ON DELETE SET NULL
ON UPDATE CASCADE;
```

⚠️ **تحذير:** قبل تنفيذ هذا الأمر، تأكد من إصلاح جميع البيانات غير الصحيحة أولاً.

---

## اختبار بعد الإصلاح | Testing After Fix

### 1. التحقق من إصلاح البيانات

```sql
-- يجب أن يرجع 0 rows
SELECT u.id, u.email, u.organization_id
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE u.organization_id IS NOT NULL AND o.id IS NULL;
```

### 2. اختبار إضافة سيرفر

1. سجل الدخول إلى لوحة التحكم
2. اذهب إلى الإعدادات → السيرفرات
3. اضغط "إضافة سيرفر"
4. املأ البيانات:
   - الاسم: "سيرفر اختبار"
   - IP: "192.168.1.100"
   - الموقع: "اختبار"
5. اضغط "إضافة"

**النتيجة المتوقعة:** ✅ يجب أن يتم إضافة السيرفر بنجاح

### 3. اختبار إضافة كاميرا

1. اذهب إلى الكاميرات
2. اضغط "إضافة كاميرا"
3. املأ البيانات المطلوبة
4. اضغط "إضافة"

**النتيجة المتوقعة:** ✅ يجب أن يتم إضافة الكاميرا بنجاح

---

## الأوامر المفيدة | Useful Commands

```bash
# عرض جميع المؤسسات
php artisan tinker
>>> Organization::all();

# عرض جميع المستخدمين مع مؤسساتهم
>>> User::with('organization')->get();

# عدد المستخدمين لكل مؤسسة
>>> Organization::withCount('users')->get();

# إنشاء مؤسسة جديدة
>>> Organization::create([
    'name' => 'مؤسسة جديدة',
    'name_en' => 'New Organization',
    'email' => 'org@example.com',
    'subscription_plan' => 'basic',
    'max_cameras' => 4,
    'max_edge_servers' => 1,
    'is_active' => true,
]);
```

---

## الأسئلة الشائعة | FAQ

### س: هل سيفقد المستخدمون بياناتهم؟
**ج:** لا، الإصلاح يحافظ على جميع بيانات المستخدمين. سيتم فقط إنشاء مؤسسات جديدة أو حذف الارتباط.

### س: ماذا لو كان لدي بيانات حقيقية في production؟
**ج:** استخدم `--dry-run` أولاً للتحقق، ثم خذ نسخة احتياطية قبل التنفيذ:
```bash
mysqldump -u user -p database > backup_before_fix.sql
```

### س: كيف أعرف إذا كانت المشكلة محلولة؟
**ج:** جرب إضافة سيرفر أو كاميرا. إذا نجحت العملية، فالمشكلة محلولة.

### س: ماذا لو استمرت المشكلة؟
**ج:** 
1. تحقق من Laravel logs: `storage/logs/laravel.log`
2. تحقق من Browser Console
3. تأكد من أن المستخدم لديه صلاحيات
4. تأكد من أن المؤسسة active (`is_active = 1`)

---

## ملاحظات مهمة | Important Notes

1. ✅ **قم بعمل نسخة احتياطية قبل أي تعديل**
2. ✅ **استخدم `--dry-run` للتحقق أولاً**
3. ✅ **اختبر على بيئة development قبل production**
4. ✅ **راقب Laravel logs بعد الإصلاح**
5. ✅ **تأكد من أن المستخدمين يمكنهم الوصول لمؤسساتهم**

---

**بعد تنفيذ هذا الإصلاح، يجب أن تعمل جميع عمليات الإضافة بشكل صحيح! ✨**
