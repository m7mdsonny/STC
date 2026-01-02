# تحديث: ربط Edge Server بالترخيص (License)

## نظرة عامة

هذا التحديث يضيف ميزة ربط Edge Server بالترخيص (License) بشكل يدوي أو تلقائي، مما يسمح لصاحب المؤسسة بإدارة Edge Servers وربطها بالتراخيص المتاحة.

## الميزات الجديدة

✅ **إضافة Edge Server من لوحة التحكم**
- يمكن لصاحب المؤسسة إضافة Edge Server من صفحة الإعدادات
- اختيار ترخيص لربطه (اختياري)
- ربط تلقائي بأول ترخيص متاح إذا لم يتم اختيار ترخيص

✅ **ربط تلقائي عند الاتصال**
- عند اتصال Edge Server بالـ Cloud عبر heartbeat
- يتم ربطه تلقائياً بترخيص متاح إذا لم يكن مربوطاً

✅ **تحديث الترخيص**
- يمكن تغيير الترخيص المرتبط بـ Edge Server
- فك ربط الترخيص القديم تلقائياً
- ربط الترخيص الجديد

✅ **إدارة الكاميرات**
- إضافة كاميرات وربطها بـ Edge Server
- عرض الكاميرات المرتبطة بكل Edge Server

---

## الملفات المحدثة

### Frontend (React/TypeScript)

1. **`apps/web-portal/src/pages/Settings.tsx`**
   - إضافة حقل اختيار الترخيص في نموذج إضافة/تعديل Edge Server
   - جلب التراخيص المتاحة للمؤسسة
   - عرض قائمة منسدلة للتراخيص

2. **`apps/web-portal/src/lib/api/edgeServers.ts`**
   - إضافة `license_id` إلى `CreateEdgeServerData` interface

### Backend (Laravel/PHP)

3. **`apps/cloud-laravel/app/Http/Controllers/EdgeController.php`**
   - تحديث `store` method: ربط الترخيص عند إنشاء Edge Server
   - تحديث `update` method: السماح بتغيير الترخيص
   - تحديث `heartbeat` method: ربط تلقائي عند الاتصال

---

## هيكل المجلد

```
updates/edge-server-license-linking/
├── README.md                    # هذا الملف - نظرة عامة
├── CHANGES.md                   # تفاصيل التغييرات لكل ملف
├── DEPLOYMENT.md                # خطوات النشر
├── frontend/
│   ├── Settings.tsx            # ملف Settings.tsx المحدث
│   └── edgeServers.ts          # ملف edgeServers.ts المحدث
└── backend/
    └── EdgeController.php      # ملف EdgeController.php المحدث
```

---

## الخطوات التالية

1. اقرأ `CHANGES.md` لفهم التغييرات بالتفصيل
2. اقرأ `DEPLOYMENT.md` لخطوات النشر
3. انسخ الملفات إلى مواقعها الصحيحة
4. اختبر الميزة

---

## التاريخ

- **التاريخ**: 30 ديسمبر 2025
- **الإصدار**: 1.0.0
- **الحالة**: ✅ مكتمل وجاهز للنشر

