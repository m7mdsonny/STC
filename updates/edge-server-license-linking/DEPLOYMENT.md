# خطوات النشر

## متطلبات ما قبل النشر

- ✅ Laravel Backend يعمل على `api.stcsolutions.online`
- ✅ React Frontend يعمل على `stcsolutions.online`
- ✅ قاعدة البيانات تحتوي على جداول `edge_servers` و `licenses`
- ✅ Git repository محدث

---

## خطوات النشر

### 1. سحب التحديثات على Backend

```bash
# الاتصال بالسيرفر
ssh user@api.stcsolutions.online

# الانتقال إلى مجلد المشروع
cd /www/wwwroot/api.stcsolutions.online

# سحب التحديثات
git pull origin main

# مسح الكاش
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# التحقق من عدم وجود أخطاء
php artisan route:list | grep edge
```

### 2. سحب التحديثات على Frontend

```bash
# الاتصال بالسيرفر
ssh user@stcsolutions.online

# الانتقال إلى مجلد المشروع
cd /www/wwwroot/stcsolutions.online

# سحب التحديثات
git pull origin main

# تثبيت الحزم (إذا لزم الأمر)
npm install

# بناء المشروع
npm run build

# التحقق من البناء
ls -la dist/
```

### 3. التحقق من قاعدة البيانات

```bash
# الاتصال بقاعدة البيانات
mysql -u username -p stc_saas

# التحقق من وجود الأعمدة
DESCRIBE edge_servers;
DESCRIBE licenses;

# يجب أن ترى:
# edge_servers.license_id (nullable)
# licenses.edge_server_id (nullable)
```

---

## النسخ اليدوي (إذا لم يكن Git متاحاً)

### 1. نسخ ملفات Backend

```bash
# من المجلد المحلي
cd updates/edge-server-license-linking/backend

# نسخ إلى السيرفر
scp EdgeController.php user@api.stcsolutions.online:/www/wwwroot/api.stcsolutions.online/app/Http/Controllers/EdgeController.php
```

### 2. نسخ ملفات Frontend

```bash
# من المجلد المحلي
cd updates/edge-server-license-linking/frontend

# نسخ إلى السيرفر
scp Settings.tsx user@stcsolutions.online:/www/wwwroot/stcsolutions.online/src/pages/Settings.tsx
scp edgeServers.ts user@stcsolutions.online:/www/wwwroot/stcsolutions.online/src/lib/api/edgeServers.ts
```

### 3. إعادة بناء Frontend

```bash
ssh user@stcsolutions.online
cd /www/wwwroot/stcsolutions.online
npm run build
```

---

## التحقق من النشر

### 1. اختبار Backend API

```bash
# اختبار إنشاء Edge Server
curl -X POST "https://api.stcsolutions.online/api/v1/edge-servers" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Server",
    "license_id": 1
  }'

# يجب أن تحصل على:
# {
#   "id": 1,
#   "name": "Test Server",
#   "license_id": 1,
#   "license": { ... }
# }
```

### 2. اختبار Frontend

1. افتح `https://stcsolutions.online`
2. سجل الدخول كصاحب مؤسسة
3. اذهب إلى **الإعدادات > السيرفرات**
4. اضغط **"إضافة سيرفر"**
5. يجب أن ترى:
   - ✅ حقل "الترخيص (اختياري)"
   - ✅ قائمة منسدلة بالتراخيص المتاحة
   - ✅ يمكنك اختيار ترخيص أو تركه فارغاً

### 3. اختبار Heartbeat

```bash
# من Edge Server
curl -X POST "https://api.stcsolutions.online/api/v1/edges/heartbeat" \
  -H "Content-Type: application/json" \
  -d '{
    "edge_id": "test-edge-123",
    "version": "2.0.0",
    "online": true,
    "organization_id": 1
  }'

# يجب أن يتم ربط Edge Server تلقائياً بترخيص متاح
```

---

## استكشاف الأخطاء

### المشكلة: لا تظهر قائمة التراخيص

**الحل**:
1. تحقق من أن المستخدم لديه `organization_id`
2. تحقق من وجود تراخيص نشطة للمؤسسة
3. تحقق من console في المتصفح للأخطاء

### المشكلة: فشل ربط الترخيص

**الحل**:
1. تحقق من أن الترخيص `status = 'active'`
2. تحقق من أن الترخيص `edge_server_id = null`
3. تحقق من أن الترخيص ينتمي للمؤسسة

### المشكلة: Heartbeat لا يربط الترخيص تلقائياً

**الحل**:
1. تحقق من أن `organization_id` موجود في الطلب
2. تحقق من وجود تراخيص متاحة للمؤسسة
3. تحقق من logs في Laravel

---

## التراجع (Rollback)

إذا حدثت مشكلة، يمكنك التراجع:

### Backend

```bash
cd /www/wwwroot/api.stcsolutions.online
git checkout HEAD~1 app/Http/Controllers/EdgeController.php
php artisan config:clear
php artisan route:clear
```

### Frontend

```bash
cd /www/wwwroot/stcsolutions.online
git checkout HEAD~1 src/pages/Settings.tsx
git checkout HEAD~1 src/lib/api/edgeServers.ts
npm run build
```

---

## ملاحظات مهمة

1. **لا توجد migrations**: التحديث لا يتطلب migrations جديدة
2. **Backward Compatible**: الكود متوافق مع الإصدارات السابقة
3. **Optional Feature**: الترخيص اختياري، يمكن إضافة Edge Server بدون ترخيص
4. **Auto-linking**: إذا لم يتم اختيار ترخيص، يتم الربط تلقائياً بأول ترخيص متاح

---

## الدعم

إذا واجهت أي مشاكل:
1. تحقق من logs في Laravel: `storage/logs/laravel.log`
2. تحقق من console في المتصفح
3. تحقق من network requests في DevTools

---

## التاريخ

- **تاريخ النشر**: 30 ديسمبر 2025
- **الإصدار**: 1.0.0
- **الحالة**: ✅ جاهز للنشر

