# 🔍 تشخيص خطأ HTTP 500 في /api/v1/edges/events/batch

## المشكلة الحالية:
Edge Server يحصل على HTTP 500 عند إرسال analytics batch إلى Cloud API.

## خطوات التشخيص (يجب تنفيذها على السيرفر):

### 1. التحقق من Laravel Logs (الأهم):
```bash
# على السيرفر Production
cd /path/to/apps/cloud-laravel
tail -n 100 storage/logs/laravel.log | grep -A 20 -B 5 "Batch ingest\|EventController\|FatalError\|ParseError\|Exception"
```

**ابحث عن:**
- أي FatalError أو ParseError
- أي Exception details في batchIngest
- أي database errors
- أي missing fields

### 2. التحقق من أن التحديثات موجودة على السيرفر:
```bash
# التحقق من commit الجديد
cd /path/to/apps/cloud-laravel
git log --oneline -3

# يجب أن ترى:
# a146378 🔴 Fix Edge → Cloud Analytics Integration - Critical PHP Syntax and Runtime Errors
```

### 3. التحقق من Syntax (يجب أن يكون خالياً من الأخطاء):
```bash
php -l app/Http/Controllers/EventController.php
php -l app/Services/DomainActionService.php
```

### 4. مسح جميع Caches (CRITICAL):
```bash
cd /path/to/apps/cloud-laravel
php artisan optimize:clear
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear
```

### 5. إعادة بناء Caches:
```bash
php artisan config:cache
php artisan route:cache
```

### 6. التحقق من Route:
```bash
php artisan route:list | grep "edges/events/batch"
```

### 7. اختبار مباشر على السيرفر:
```bash
# اختبار بسيط للتحقق من أن Endpoint يعمل
curl -X POST https://api.stcsolutions.online/api/v1/edges/events/batch \
  -H "Content-Type: application/json" \
  -H "X-Edge-Key: YOUR_EDGE_KEY" \
  -H "X-Edge-Signature: YOUR_SIGNATURE" \
  -H "X-Edge-Timestamp: $(date +%s)" \
  -d '{
    "events": [{
      "event_type": "analytics",
      "severity": "info",
      "occurred_at": "2026-01-20T00:00:00Z",
      "camera_id": "test-cam",
      "meta": {"module": "fire"}
    }]
  }' -v
```

## الأخطاء المحتملة:

### 1. Database Constraint Error:
**الخطأ:** Column لا يقبل NULL أو foreign key constraint
**الحل:** تحقق من migration للجدول events

### 2. Missing Required Field:
**الخطأ:** Field مطلوب في database غير موجود في البيانات المرسلة
**الحل:** تحقق من Laravel logs للحصول على SQL error

### 3. Type Mismatch:
**الخطأ:** Type البيانات لا يطابق ما هو متوقع في database
**الحل:** تحقق من casts في Event model

### 4. Cache لم يُمسح:
**الخطأ:** القديم Code ما زال في cache
**الحل:** مسح جميع caches (Step 4)

## الإجراءات الفورية:

### على السيرفر:
1. ✅ تحقق من Laravel logs للحصول على الخطأ الفعلي
2. ✅ تأكد من وجود commit a146378
3. ✅ امسح جميع caches
4. ✅ أعد تحميل PHP-FPM/Nginx إذا لزم الأمر

### بعد معرفة الخطأ:
- إذا كان database error: أرسل SQL error من logs
- إذا كان missing field: أرسل Field name من error
- إذا كان cache issue: بعد مسح cache يجب أن يعمل

---

**ملاحظة:** بدون Laravel logs من السيرفر، لا يمكن تحديد السبب الدقيق للـ HTTP 500.
