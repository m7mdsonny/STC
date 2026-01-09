# إصلاحات Vite Server للعمل مع TestSprite Tunnel

## المشاكل التي تم إصلاحها

### 1. ERR_EMPTY_RESPONSE
- **السبب**: مشكلة في تحميل الموارد عبر tunnel
- **الحل**: 
  - تحسين CORS headers
  - إضافة middleware لمعالجة الطلبات بشكل صحيح
  - تحسين إعدادات server

### 2. ERR_CONTENT_LENGTH_MISMATCH
- **السبب**: Content-Length header غير صحيح لملفات Vite
- **الحل**: 
  - إضافة middleware لإزالة Content-Length لملفات Vite client
  - استخدام Transfer-Encoding: chunked بدلاً منه
  - معالجة خاصة لملفات @vite/client و node_modules

### 3. مشاكل HMR و WebSocket
- **السبب**: WebSocket connections لا تعمل بشكل صحيح عبر tunnel
- **الحل**: 
  - تحسين إعدادات HMR
  - إضافة error handling للWebSocket connections
  - إصلاح clientPort configuration

### 4. مشاكل CORS
- **السبب**: CORS headers غير كافية للوصول عبر tunnel
- **الحل**: 
  - إضافة CORS headers شاملة لجميع الطلبات
  - معالجة OPTIONS preflight requests
  - تحسين Access-Control headers

## التغييرات الرئيسية

### vite.config.ts

1. **تحسين server configuration**:
   ```typescript
   server: {
     host: '0.0.0.0',
     port: 5173,
     strictPort: true,
     cors: { origin: '*', credentials: true },
   }
   ```

2. **إضافة custom middleware**:
   - معالجة Content-Length issues
   - CORS headers للجميع
   - OPTIONS preflight handling

3. **تحسين HMR**:
   ```typescript
   hmr: {
     protocol: 'ws',
     host: 'localhost',
     port: 5173,
     clientPort: 5173,
     overlay: true,
   }
   ```

4. **تحسين optimizeDeps**:
   - إضافة esbuildOptions
   - تحسين target configuration

## خطوات إعادة التشغيل

### 1. إيقاف الخادم الحالي
```bash
# Windows
taskkill /F /PID <process_id>

# أو ببساطة Ctrl+C في terminal
```

### 2. مسح cache
```bash
cd apps/web-portal
rm -rf node_modules/.vite
# أو على Windows:
rmdir /s /q node_modules\.vite
```

### 3. إعادة تشغيل الخادم
```bash
npm run dev:host
# أو
npm run dev
```

### 4. التحقق من أن الخادم يعمل
افتح المتصفح على: `http://localhost:5173`

## التحقق من الإصلاحات

### 1. فتح Developer Console (F12)
- يجب ألا تظهر أخطاء ERR_EMPTY_RESPONSE
- يجب ألا تظهر أخطاء ERR_CONTENT_LENGTH_MISMATCH
- الموارد يجب أن تُحمّل بشكل صحيح

### 2. اختبار TestSprite
- تأكد من أن الخادم يعمل على port 5173
- تأكد من أن host هو 0.0.0.0 (للوصول عبر tunnel)
- قم بتشغيل TestSprite مرة أخرى

## ملاحظات مهمة

1. **الخادم يجب أن يعمل على 0.0.0.0**: 
   - استخدام `npm run dev:host` بدلاً من `npm run dev`
   - أو تحديث vite.config.ts كما هو موضح

2. **CORS headers**: 
   - تم تعيين CORS للسماح بالوصول من أي origin
   - هذا آمن للـ development فقط

3. **Content-Length handling**: 
   - Middleware يعالج Content-Length تلقائياً
   - لا حاجة لتعديل يدوي

## المشاكل المحتملة

### إذا استمرت المشاكل:

1. **تحقق من firewall**:
   - تأكد من أن port 5173 مفتوح
   - تحقق من Windows Firewall settings

2. **تحقق من antivirus**:
   - قد يحجب بعض الطلبات
   - أضف exception للـ dev server

3. **تحقق من network**:
   - تأكد من أن tunnel يعمل بشكل صحيح
   - تحقق من أن TestSprite يمكنه الوصول للخادم

4. **مسح cache كامل**:
   ```bash
   rm -rf node_modules/.vite
   rm -rf dist
   npm install
   npm run dev:host
   ```

## التغييرات في الملفات

- ✅ `vite.config.ts` - إصلاحات شاملة
- ✅ إضافة middleware للتعامل مع Content-Length
- ✅ تحسين CORS configuration
- ✅ إصلاح HMR settings
- ✅ تحسين optimizeDeps

## الاختبار

بعد إعادة التشغيل، قم بتشغيل TestSprite مرة أخرى:
```bash
# في terminal آخر
cd apps/web-portal
# ثم قم بتشغيل TestSprite من هناك
```
