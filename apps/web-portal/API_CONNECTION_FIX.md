# دليل إصلاح مشكلة "Failed to fetch"

## المشكلة
بعد التحديثات الأخيرة، تسجيل الدخول يعطي "Failed to fetch"

## الحلول المطبقة

### 1. تصحيح API URL الافتراضي
- تم تغيير `DEFAULT_API_URL` من `https://stcsolutions.online/api/v1` إلى `https://api.stcsolutions.online/api/v1`

### 2. تحسين معالجة الأخطاء
- إضافة رسائل خطأ واضحة بالعربية
- إضافة timeout للطلبات (30 ثانية)
- تحسين logging للأخطاء

### 3. إضافة AbortController
- إضافة timeout mechanism للطلبات
- منع الطلبات من الانتظار إلى ما لا نهاية

## خطوات الإصلاح على السيرفر

### الخطوة 1: التحقق من API URL في Frontend

افتح Developer Console في المتصفح (F12) وتحقق من:
```javascript
// يجب أن يظهر:
API Base URL: https://api.stcsolutions.online/api/v1
```

### الخطوة 2: التحقق من CORS في Backend

```bash
cd /www/wwwroot/api.stcsolutions.online
cat config/cors.php
```

يجب أن يحتوي على:
```php
'allowed_origins' => ['*'],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

### الخطوة 3: التحقق من أن Backend يعمل

```bash
# اختبار endpoint
curl -X POST https://api.stcsolutions.online/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@demo.local","password":"Super@12345"}'
```

### الخطوة 4: إعادة بناء Frontend

```bash
cd /path/to/web-portal
npm run build
```

### الخطوة 5: التحقق من Environment Variables

إذا كان Frontend يستخدم `.env` file:
```bash
# في web-portal directory
cat .env
```

يجب أن يحتوي على:
```
VITE_API_URL=https://api.stcsolutions.online/api/v1
```

## المشاكل الشائعة والحلول

### 1. CORS Error
**الأعراض**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**الحل**:
```bash
# في Backend
php artisan config:clear
php artisan cache:clear
```

### 2. Network Error
**الأعراض**: `Failed to fetch` أو `NetworkError`

**الحل**:
- تحقق من أن Backend يعمل: `curl https://api.stcsolutions.online/api/v1/public/landing`
- تحقق من Firewall/Security settings
- تحقق من SSL Certificate

### 3. Timeout Error
**الأعراض**: `انتهت مهلة الاتصال`

**الحل**:
- تحقق من سرعة الاتصال
- تحقق من أن Backend يستجيب بسرعة
- تحقق من Server logs

### 4. Wrong API URL
**الأعراض**: 404 Not Found

**الحل**:
- تحقق من `VITE_API_URL` في `.env`
- تحقق من `DEFAULT_API_URL` في `apiClient.ts`
- تحقق من Console logs

## اختبار الاتصال

### من Browser Console:
```javascript
fetch('https://api.stcsolutions.online/api/v1/public/landing')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### من Terminal:
```bash
curl -v https://api.stcsolutions.online/api/v1/public/landing
```

## Logs للتحقق

### Frontend (Browser Console):
- افتح Developer Tools (F12)
- اذهب إلى Console
- ابحث عن "Network error details" أو "API Base URL"

### Backend:
```bash
tail -f storage/logs/laravel.log | grep -i "login\|auth"
```

## إذا استمرت المشكلة

1. **تحقق من Network Tab في Browser**:
   - افتح Developer Tools (F12)
   - اذهب إلى Network tab
   - حاول تسجيل الدخول
   - تحقق من Request URL و Response

2. **تحقق من Backend Logs**:
   ```bash
   tail -n 100 storage/logs/laravel.log
   ```

3. **تحقق من CORS Headers**:
   ```bash
   curl -I -X OPTIONS https://api.stcsolutions.online/api/v1/auth/login \
     -H "Origin: https://stcsolutions.online" \
     -H "Access-Control-Request-Method: POST"
   ```

4. **تحقق من SSL Certificate**:
   ```bash
   openssl s_client -connect api.stcsolutions.online:443
   ```

