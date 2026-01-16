# إصلاح مشكلة DELETE Routes (405 Not Allowed)

## المشكلة
عند محاولة حذف أي entity (User, Organization, License, etc.) يظهر خطأ:
- `405 Method Not Allowed`
- `net::ERR_FAILED` في المتصفح
- CORS policy error

## الحل

### 1. تشغيل Script الإصلاح
```bash
cd /path/to/cloud-laravel
chmod +x scripts/fix_delete_routes.sh
./scripts/fix_delete_routes.sh
```

### 2. أو تشغيل الأوامر يدوياً
```bash
cd /path/to/cloud-laravel

# حذف جميع الـ caches
php artisan route:clear
php artisan cache:clear
php artisan config:clear
php artisan view:clear
php artisan event:clear
php artisan optimize:clear

# إعادة بناء الـ caches
php artisan route:cache
php artisan config:cache

# التحقق من Routes
php artisan route:list --method=DELETE
```

### 3. إعادة تشغيل الخدمات
```bash
# إعادة تشغيل PHP-FPM
sudo systemctl restart php8.2-fpm
# أو
sudo systemctl restart php-fpm

# إعادة تشغيل Nginx
sudo systemctl restart nginx
```

### 4. التحقق من إعدادات Nginx
تأكد من أن Nginx يسمح بـ DELETE method. في ملف Nginx config:

```nginx
location /api {
    # Allow all HTTP methods including DELETE
    limit_except GET POST PUT PATCH DELETE OPTIONS {
        deny all;
    }
    
    try_files $uri $uri/ /index.php?$query_string;
}
```

### 5. اختبار DELETE Route
```bash
# اختبار محلي
curl -X DELETE http://127.0.0.1/api/v1/users/7 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# اختبار من السيرفر
curl -X DELETE https://api.stcsolutions.online/api/v1/users/7 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## Routes الموجود DELETE لها

جميع الـ DELETE routes موجودة في `routes/api.php`:

- ✅ `/api/v1/users/{user}` - UserController::destroy
- ✅ `/api/v1/organizations/{organization}` - OrganizationController::destroy
- ✅ `/api/v1/licenses/{license}` - LicenseController::destroy
- ✅ `/api/v1/cameras/{camera}` - CameraController::destroy
- ✅ `/api/v1/edge-servers/{edgeServer}` - EdgeController::destroy
- ✅ `/api/v1/vehicles/{vehicle}` - VehicleController::destroy
- ✅ `/api/v1/people/{person}` - PersonController::destroy
- ✅ `/api/v1/subscription-plans/{subscriptionPlan}` - SubscriptionPlanController::destroy
- ✅ `/api/v1/ai-policies/{aiPolicy}` - AiPolicyController::destroy
- ✅ `/api/v1/automation-rules/{automationRule}` - AutomationRuleController::destroy
- ✅ `/api/v1/integrations/{integration}` - IntegrationController::destroy
- ✅ `/api/v1/backups/{backup}` - SystemBackupController::destroy
- ✅ وغيرها...

## ملاحظات مهمة

1. **Route Cache**: Laravel يحفظ routes في cache. عند تحديث routes يجب حذف cache أولاً.

2. **Nginx Configuration**: تأكد من أن Nginx يسمح بـ DELETE method.

3. **CORS Headers**: جميع DELETE responses تحتوي على CORS headers صحيحة.

4. **Authorization**: جميع DELETE endpoints محمية بـ Policies و require authentication.

5. **Error Handling**: جميع DELETE methods تحتوي على try-catch ومعالجة أخطاء كاملة.

## إذا استمرت المشكلة

1. تحقق من سجلات Laravel: `storage/logs/laravel.log`
2. تحقق من سجلات Nginx: `/var/log/nginx/error.log`
3. تحقق من سجلات PHP-FPM: `/var/log/php8.2-fpm.log`
4. تأكد من أن route model binding يعمل بشكل صحيح
5. تحقق من أن middleware لا يمنع الطلبات
