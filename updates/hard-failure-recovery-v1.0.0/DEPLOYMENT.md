# تعليمات النشر - Hard Failure Recovery v1.0.0

## مواقع الملفات في المشروع

### Frontend Files (React/TypeScript)

#### 1. Backup Page Fix
**الموقع الأصلي:** `apps/web-portal/src/pages/admin/AdminBackups.tsx`
**الملف في التحديث:** `frontend/AdminBackups.tsx`

#### 2. AI Modules API
**الموقع الأصلي:** `apps/web-portal/src/lib/api/aiModules.ts`
**الملف في التحديث:** `frontend/aiModules.ts`

#### 3. AI Modules Admin Page
**الموقع الأصلي:** `apps/web-portal/src/pages/admin/AIModulesAdmin.tsx`
**الملف في التحديث:** `frontend/AIModulesAdmin.tsx`

#### 4. Free Trial Request Page (NEW)
**الموقع الأصلي:** `apps/web-portal/src/pages/RequestDemo.tsx` (جديد)
**الملف في التحديث:** `frontend/RequestDemo.tsx`

#### 5. Free Trial API
**الموقع الأصلي:** `apps/web-portal/src/lib/api/freeTrial.ts`
**الملف في التحديث:** `frontend/freeTrial.ts`

#### 6. App Routes
**الموقع الأصلي:** `apps/web-portal/src/App.tsx`
**التعديلات:** راجع `frontend/App.tsx.patch`

---

## خطوات النشر

### الخطوة 1: نسخ الملفات

```bash
# الانتقال إلى مجلد المشروع
cd /path/to/project

# نسخ ملفات الإصلاح
cp updates/hard-failure-recovery-v1.0.0/frontend/AdminBackups.tsx apps/web-portal/src/pages/admin/
cp updates/hard-failure-recovery-v1.0.0/frontend/AIModulesAdmin.tsx apps/web-portal/src/pages/admin/
cp updates/hard-failure-recovery-v1.0.0/frontend/aiModules.ts apps/web-portal/src/lib/api/
cp updates/hard-failure-recovery-v1.0.0/frontend/RequestDemo.tsx apps/web-portal/src/pages/
cp updates/hard-failure-recovery-v1.0.0/frontend/freeTrial.ts apps/web-portal/src/lib/api/
```

### الخطوة 2: تحديث App.tsx

افتح `apps/web-portal/src/App.tsx` وأضف:

1. **في قسم Imports (في الأعلى):**
```typescript
import { RequestDemo } from './pages/RequestDemo';
```

2. **في قسم Routes (بعد route `/forgot-password`):**
```typescript
<Route
  path="/request-demo"
  element={
    <PublicRoute>
      <RequestDemo />
    </PublicRoute>
  }
/>
```

### الخطوة 3: بناء المشروع

```bash
cd apps/web-portal
npm install  # إذا لزم الأمر
npm run build
```

### الخطوة 4: التحقق

1. فتح المتصفح والتحقق من:
   - `/admin/backups` - لا أخطاء JavaScript
   - `/admin/ai-modules` - التبديلات تعمل
   - `/request-demo` - الصفحة تظهر وتعمل
   - Settings > Servers - إضافة Edge Server تعمل

---

## Rollback (التراجع)

في حالة الحاجة للتراجع:

```bash
# استعادة من git
cd apps/web-portal
git checkout HEAD -- src/pages/admin/AdminBackups.tsx
git checkout HEAD -- src/pages/admin/AIModulesAdmin.tsx
git checkout HEAD -- src/lib/api/aiModules.ts
git checkout HEAD -- src/lib/api/freeTrial.ts
git checkout HEAD -- src/App.tsx

# حذف الملف الجديد
rm src/pages/RequestDemo.tsx

# إعادة البناء
npm run build
```

---

## التحقق من النجاح

بعد النشر، تحقق من:

- [ ] لا أخطاء في console
- [ ] Backup page يعمل بدون أخطاء
- [ ] AI Modules toggles تعمل وتُحفظ
- [ ] Free Trial form يعمل ويرسل البيانات
- [ ] Edge Server creation يعمل ويظهر في القائمة
