# فهرس الملفات - Edge Server License Linking Update

## هيكل المجلد

```
updates/edge-server-license-linking/
├── README.md                    # نظرة عامة على التحديث
├── CHANGES.md                   # تفاصيل التغييرات لكل ملف
├── DEPLOYMENT.md                # خطوات النشر
├── INDEX.md                     # هذا الملف - فهرس الملفات
├── frontend/
│   ├── Settings.tsx            # صفحة الإعدادات - إضافة حقل الترخيص
│   └── edgeServers.ts          # API Client - إضافة license_id
└── backend/
    └── EdgeController.php      # Controller - ربط الترخيص في store, update, heartbeat
```

---

## الملفات والمواقع

### 1. Frontend Files

#### `frontend/Settings.tsx`
- **الموقع الأصلي**: `apps/web-portal/src/pages/Settings.tsx`
- **الوصف**: صفحة الإعدادات الرئيسية
- **التغييرات**:
  - إضافة حقل `license_id` في نموذج إضافة/تعديل Edge Server
  - جلب التراخيص المتاحة للمؤسسة
  - عرض قائمة منسدلة للتراخيص
- **السطور المحدثة**: ~100 سطر
- **الوظيفة**: واجهة المستخدم لإضافة Edge Server وربطه بترخيص

#### `frontend/edgeServers.ts`
- **الموقع الأصلي**: `apps/web-portal/src/lib/api/edgeServers.ts`
- **الوصف**: API Client للتعامل مع Edge Servers
- **التغييرات**:
  - إضافة `license_id?: string` إلى `CreateEdgeServerData` interface
- **السطور المحدثة**: 1 سطر
- **الوظيفة**: تعريف TypeScript interface لإرسال `license_id` في الطلبات

---

### 2. Backend Files

#### `backend/EdgeController.php`
- **الموقع الأصلي**: `apps/cloud-laravel/app/Http/Controllers/EdgeController.php`
- **الوصف**: Controller للتعامل مع Edge Servers
- **التغييرات**:

  **أ. `store` Method (السطور 48-132)**
  - قبول `license_id` في الطلب
  - التحقق من أن الترخيص ينتمي للمؤسسة
  - ربط الترخيص بـ Edge Server عند الإنشاء
  - ربط تلقائي بأول ترخيص متاح إذا لم يتم اختيار ترخيص

  **ب. `update` Method (السطور 134-199)**
  - السماح بتغيير الترخيص
  - فك ربط الترخيص القديم
  - ربط الترخيص الجديد

  **ج. `heartbeat` Method (السطور 257-359)**
  - ربط تلقائي بأول ترخيص متاح عند الاتصال
  - التأكد من ربط الترخيص بشكل صحيح

- **السطور المحدثة**: ~150 سطر
- **الوظيفة**: منطق Backend لربط Edge Server بالترخيص

---

## الملفات التوثيقية

### `README.md`
- **الوصف**: نظرة عامة على التحديث
- **المحتوى**:
  - الميزات الجديدة
  - قائمة الملفات المحدثة
  - هيكل المجلد
  - الخطوات التالية

### `CHANGES.md`
- **الوصف**: تفاصيل التغييرات لكل ملف
- **المحتوى**:
  - التغييرات في Frontend
  - التغييرات في Backend
  - أمثلة الكود (قبل/بعد)
  - ملخص التغييرات

### `DEPLOYMENT.md`
- **الوصف**: خطوات النشر
- **المحتوى**:
  - متطلبات ما قبل النشر
  - خطوات النشر على Backend
  - خطوات النشر على Frontend
  - التحقق من النشر
  - استكشاف الأخطاء
  - التراجع (Rollback)

### `INDEX.md`
- **الوصف**: هذا الملف - فهرس الملفات
- **المحتوى**:
  - هيكل المجلد
  - مواقع الملفات
  - وصف كل ملف

---

## كيفية الاستخدام

### 1. قراءة التوثيق
1. ابدأ بـ `README.md` لفهم التحديث
2. اقرأ `CHANGES.md` لفهم التغييرات بالتفصيل
3. اقرأ `DEPLOYMENT.md` لخطوات النشر

### 2. نسخ الملفات
```bash
# Frontend
cp frontend/Settings.tsx apps/web-portal/src/pages/Settings.tsx
cp frontend/edgeServers.ts apps/web-portal/src/lib/api/edgeServers.ts

# Backend
cp backend/EdgeController.php apps/cloud-laravel/app/Http/Controllers/EdgeController.php
```

### 3. النشر
اتبع الخطوات في `DEPLOYMENT.md`

---

## ملاحظات مهمة

1. **لا توجد migrations**: التحديث لا يتطلب migrations جديدة
2. **Backward Compatible**: الكود متوافق مع الإصدارات السابقة
3. **Optional Feature**: الترخيص اختياري
4. **Auto-linking**: ربط تلقائي بأول ترخيص متاح

---

## الدعم

إذا واجهت أي مشاكل:
1. راجع `DEPLOYMENT.md` - قسم "استكشاف الأخطاء"
2. راجع `CHANGES.md` لفهم التغييرات
3. تحقق من logs في Laravel و console في المتصفح

---

## التاريخ

- **تاريخ الإنشاء**: 30 ديسمبر 2025
- **الإصدار**: 1.0.0
- **الحالة**: ✅ مكتمل

