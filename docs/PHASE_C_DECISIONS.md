# PHASE C — قرارات التنفيذ والتعطيل

**التاريخ**: 2025-12-30

---

## 🔴 C1-A: UI-Only Features

### Feature: Restart Edge Server
**Location**: `apps/web-portal/src/pages/Settings.tsx`  
**API**: `POST /v1/edge-servers/{id}/restart`  
**Decision**: ✅ **IMPLEMENTED** (في PHASE C السابق)  
**Status**: تم تحسين Backend لإرسال أمر فعلي للـ Edge Server  
**Action**: ✅ **NO ACTION** - الميزة تعمل الآن بشكل صحيح  
**Note**: تم إضافة authorization checks و HTTP command sending

---

### Feature: Sync Edge Config
**Location**: `apps/web-portal/src/pages/Settings.tsx`  
**API**: `POST /v1/edge-servers/{id}/sync-config`  
**Decision**: ✅ **IMPLEMENTED** (في PHASE C السابق)  
**Status**: تم تحسين Backend لإرسال أمر sync فعلي ومزامنة الكاميرات  
**Action**: ✅ **NO ACTION** - الميزة تعمل الآن بشكل صحيح  
**Note**: تم إضافة authorization checks و HTTP command sending و camera sync

---

## 🟠 C1-B: Partial/Unsafe Features

### Feature: Toggle User Active
**Location**: `apps/web-portal/src/pages/Team.tsx`, `apps/web-portal/src/pages/admin/Users.tsx`  
**API**: `POST /v1/users/{id}/toggle-active`  
**Decision**: ✅ **FIXED** (في PHASE B)  
**Status**: تم إضافة authorization checks في Backend  
**Action**: ✅ **NO ACTION** - الميزة آمنة الآن  
**Note**: تم إضافة Policy checks في PHASE B

---

### Feature: Reset User Password
**Location**: `apps/web-portal/src/pages/Team.tsx`  
**API**: `POST /v1/users/{id}/reset-password`  
**Decision**: ❌ **DISABLED** (في PHASE B)  
**Status**: تم حذف الـ endpoint من Backend  
**Action**: 🔍 **VERIFY** - التأكد من إزالة الزر من UI  
**Note**: تم استبداله بـ Laravel password reset flow

---

### Feature: Toggle Organization Active
**Location**: `apps/web-portal/src/pages/admin/Organizations.tsx`  
**API**: `POST /v1/organizations/{id}/toggle-active`  
**Decision**: ✅ **FIXED** (في PHASE B)  
**Status**: تم إضافة authorization checks في Backend  
**Action**: ✅ **NO ACTION** - الميزة آمنة الآن  
**Note**: تم إضافة Policy checks في PHASE B

---

### Feature: View Edge Logs
**Location**: `apps/web-portal/src/pages/Settings.tsx`  
**API**: `GET /v1/edge-servers/{id}/logs`  
**Decision**: ✅ **FIXED** (في PHASE B)  
**Status**: تم إضافة authorization checks في Backend  
**Action**: ✅ **NO ACTION** - الميزة آمنة الآن  
**Note**: تم إضافة Policy checks في PHASE B

---

### Feature: View Edge Config
**Location**: `apps/web-portal/src/pages/Settings.tsx`  
**API**: `GET /v1/edge-servers/{id}/config`  
**Decision**: ✅ **FIXED** (في PHASE B)  
**Status**: تم إضافة authorization checks في Backend  
**Action**: ✅ **NO ACTION** - الميزة آمنة الآن  
**Note**: تم إضافة Policy checks في PHASE B

---

### Feature: Camera Sync
**Location**: `apps/web-portal/src/pages/Cameras.tsx`  
**API**: `POST /v1/cameras` (implicit sync)  
**Decision**: ⚠️ **IMPROVE**  
**Status**: Sync قد يفشل بصمت  
**Action**: 🔧 **ADD ERROR HANDLING** - إضافة error handling أفضل في UI  
**Note**: يجب إظهار error message إذا فشل sync

---

### Feature: Organization Stats
**Location**: `apps/web-portal/src/pages/admin/Organizations.tsx`  
**API**: `GET /v1/organizations/{id}/stats`  
**Decision**: ✅ **FIXED** (في PHASE C السابق)  
**Status**: تم إصلاح counts في Backend  
**Action**: ✅ **NO ACTION** - الميزة تعمل الآن بشكل صحيح  
**Note**: تم إصلاح OrganizationController@stats

---

## 🟡 C1-C: Placeholder/Fake Data

### Feature: View Attendance
**Location**: `apps/web-portal/src/pages/Dashboard.tsx`  
**API**: `GET /v1/dashboard` → `attendance.today`  
**Decision**: ⚠️ **HIDE** (temporarily)  
**Status**: لا يوجد attendance table بعد  
**Action**: 🚫 **HIDE WIDGET** - إخفاء Attendance widget من Dashboard  
**Reason**: لا توجد بيانات حقيقية - الميزة غير مطبقة بعد  
**Temporary UI State**: إخفاء StatCard للـ Attendance

---

### Feature: View Visitors
**Location**: `apps/web-portal/src/pages/Dashboard.tsx`  
**API**: `GET /v1/dashboard` → `visitors.today`  
**Decision**: ✅ **FIXED** (في PHASE C السابق)  
**Status**: تم حساب visitors من events  
**Action**: ✅ **NO ACTION** - الميزة تعمل الآن بشكل صحيح  
**Note**: يتم حساب visitors من `people_counter` events

---

### Feature: View Weekly Stats
**Location**: `apps/web-portal/src/pages/Dashboard.tsx`  
**API**: `GET /v1/dashboard` → `weekly_stats`  
**Decision**: ✅ **FIXED** (في PHASE C السابق)  
**Status**: تم حساب weekly_stats من events  
**Action**: ✅ **NO ACTION** - الميزة تعمل الآن بشكل صحيح  
**Note**: يتم حساب weekly_stats من أحداث آخر 7 أيام

---

### Feature: Admin Dashboard Revenue
**Location**: `apps/web-portal/src/pages/admin/AdminDashboard.tsx`  
**API**: `GET /v1/dashboard/admin` → `revenue_this_month`  
**Decision**: ✅ **FIXED** (في PHASE C السابق)  
**Status**: تم حساب revenue من active licenses  
**Action**: ✅ **NO ACTION** - الميزة تعمل الآن بشكل صحيح  
**Note**: يتم حساب revenue من التراخيص النشطة

---

### Feature: Analytics Summary
**Location**: `apps/web-portal/src/pages/Analytics.tsx`  
**API**: `GET /v1/analytics/summary`  
**Decision**: ⚠️ **KEEP BUT IMPROVE**  
**Status**: يعمل لكن قد يحتاج تحسين  
**Action**: ✅ **NO ACTION** - الميزة تعمل  
**Note**: Analytics يعمل من البيانات الفعلية

---

### Feature: Analytics Time Series
**Location**: `apps/web-portal/src/pages/Analytics.tsx`  
**API**: `GET /v1/analytics/time-series`  
**Decision**: ⚠️ **KEEP BUT IMPROVE**  
**Status**: يعمل لكن قد يحتاج تحسين  
**Action**: ✅ **NO ACTION** - الميزة تعمل  
**Note**: Analytics يعمل من البيانات الفعلية

---

### Feature: Analytics By Location
**Location**: `apps/web-portal/src/pages/Analytics.tsx`  
**API**: `GET /v1/analytics/by-location`  
**Decision**: ⚠️ **KEEP BUT IMPROVE**  
**Status**: يعمل لكن قد يحتاج تحسين  
**Action**: ✅ **NO ACTION** - الميزة تعمل  
**Note**: Analytics يعمل من البيانات الفعلية

---

### Feature: Analytics By Module
**Location**: `apps/web-portal/src/pages/Analytics.tsx`  
**API**: `GET /v1/analytics/by-module`  
**Decision**: ⚠️ **KEEP BUT IMPROVE**  
**Status**: يعمل لكن قد يحتاج تحسين  
**Action**: ✅ **NO ACTION** - الميزة تعمل  
**Note**: Analytics يعمل من البيانات الفعلية

---

## ملخص القرارات

- ✅ **IMPLEMENTED/FIXED**: 8 features
- ❌ **DISABLED**: 1 feature (Reset Password)
- ⚠️ **IMPROVE**: 1 feature (Camera Sync error handling)
- 🚫 **HIDE**: 1 feature (Attendance widget)
- ✅ **NO ACTION**: 7 features (تعمل بشكل صحيح)

**الإجراءات المطلوبة**:
1. ✅ التحقق من إزالة Reset Password button من UI
2. 🔧 إضافة error handling أفضل لـ Camera Sync
3. 🚫 إخفاء Attendance widget من Dashboard
