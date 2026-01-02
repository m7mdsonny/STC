# PHASE C — قائمة إصلاحات UI الكاذبة

**المصدر**: `docs/REALITY_MATRIX.md`  
**التاريخ**: 2025-12-30

---

## 🔴 C1-A: UI-Only (لا Backend)

**المشكلة**: UI يعرض أزرار/ميزات لكن Backend لا ينفذ أي شيء حقيقي، فقط logs.

| Feature | Page | API Endpoint | Backend Status | Issue |
|---------|------|--------------|----------------|-------|
| **Restart Edge Server** | Settings.tsx | POST `/v1/edge-servers/{id}/restart` | ⚠️ Only logs | Fake functionality - لا يرسل أمر فعلي للـ Edge Server |
| **Sync Edge Config** | Settings.tsx | POST `/v1/edge-servers/{id}/sync-config` | ⚠️ Only logs | Fake functionality - لا يرسل أمر فعلي للـ Edge Server |

**ملاحظة**: تم تحسين هذه الميزات في PHASE C السابق، لكن يجب التأكد من أنها تعمل فعلياً.

---

## 🟠 C1-B: Partial (Backend Unsafe / Incomplete)

**المشكلة**: Backend موجود لكن غير آمن أو غير مكتمل.

| Feature | Page | API Endpoint | Backend Status | Issue |
|---------|------|--------------|----------------|-------|
| **Toggle User Active** | Team.tsx, Users.tsx | POST `/v1/users/{id}/toggle-active` | 🔴 Missing auth check | أي user يمكنه toggle أي user آخر |
| **Reset User Password** | Team.tsx | POST `/v1/users/{id}/reset-password` | 🔴 Missing auth check + Security breach | أي user يمكنه reset password + يرجع plaintext |
| **Toggle Organization Active** | Organizations.tsx | POST `/v1/organizations/{id}/toggle-active` | 🔴 Missing auth check | أي user يمكنه toggle أي organization |
| **View Edge Logs** | Settings.tsx | GET `/v1/edge-servers/{id}/logs` | 🔴 Missing auth check | Cross-tenant exposure - يمكن رؤية logs أي edge server |
| **View Edge Config** | Settings.tsx | GET `/v1/edge-servers/{id}/config` | 🔴 Missing auth check | Cross-tenant exposure - يمكن رؤية config أي edge server |
| **Camera Sync** | Cameras.tsx | POST `/v1/cameras` (implicit) | ⚠️ Sync fails silently | Admin يرى success لكن Edge Server لم يستلم |
| **Organization Stats** | Organizations.tsx | GET `/v1/organizations/{id}/stats` | ⚠️ Wrong counts | Returns 0 cameras, counts licenses as alerts |

**ملاحظة**: تم إصلاح معظم هذه المشاكل في PHASE B، لكن يجب التأكد من تطبيقها في UI.

---

## 🟡 C1-C: Placeholder / Fake Data

**المشكلة**: UI يعرض بيانات وهمية أو placeholder بدلاً من بيانات حقيقية.

| Feature | Page | API Endpoint | Backend Status | Issue |
|---------|------|--------------|----------------|-------|
| **View Attendance** | Dashboard.tsx | GET `/v1/dashboard` | ❌ Always returns 0 | Hardcoded 0 - لا يوجد attendance table |
| **View Visitors** | Dashboard.tsx | GET `/v1/dashboard` | ❌ Always returns 0 | Hardcoded 0 - لا يوجد visitors table (تم إصلاحه جزئياً) |
| **View Weekly Stats** | Dashboard.tsx | GET `/v1/dashboard` | ❌ Always returns [] | Empty array - تم إصلاحه في PHASE C |
| **Admin Dashboard Revenue** | AdminDashboard.tsx | GET `/v1/dashboard/admin` | ⚠️ Placeholder | Revenue calculation غير صحيح (تم إصلاحه) |
| **Analytics Summary** | Analytics.tsx | GET `/v1/analytics/summary` | ⚠️ Placeholder | Returns placeholder data |
| **Analytics Time Series** | Analytics.tsx | GET `/v1/analytics/time-series` | ⚠️ Placeholder | Returns placeholder data |
| **Analytics By Location** | Analytics.tsx | GET `/v1/analytics/by-location` | ⚠️ Placeholder | Returns placeholder data |
| **Analytics By Module** | Analytics.tsx | GET `/v1/analytics/by-module` | ⚠️ Placeholder | Returns placeholder data |

**ملاحظة**: تم إصلاح معظم هذه المشاكل في PHASE C، لكن يجب التأكد من إخفاء/تعطيل ما لا يزال placeholder.

---

## 🟢 C1-D: Working (NO TOUCH)

**الميزات التي تعمل بشكل صحيح - ممنوع المساس بها في PHASE C**

| Feature | Page | API Endpoint | Status |
|---------|------|--------------|--------|
| **Login** | Login.tsx | POST `/v1/auth/login` | ✅ Working |
| **Logout** | Header.tsx | POST `/v1/auth/logout` | ✅ Working |
| **View Profile** | Settings.tsx | GET `/v1/auth/me` | ✅ Working |
| **Update Profile** | Settings.tsx | PUT `/v1/auth/profile` | ✅ Working |
| **Change Password** | Settings.tsx | PUT `/v1/auth/password` | ✅ Working |
| **List Users** | Team.tsx | GET `/v1/users` | ✅ Working |
| **Create User** | Team.tsx | POST `/v1/users` | ✅ Working |
| **Update User** | Team.tsx | PUT `/v1/users/{id}` | ✅ Working |
| **Delete User** | Team.tsx | DELETE `/v1/users/{id}` | ✅ Working |
| **List Cameras** | Cameras.tsx | GET `/v1/cameras` | ✅ Working |
| **Create Camera** | Cameras.tsx | POST `/v1/cameras` | ✅ Working |
| **Update Camera** | Cameras.tsx | PUT `/v1/cameras/{id}` | ✅ Working |
| **Delete Camera** | Cameras.tsx | DELETE `/v1/cameras/{id}` | ✅ Working |
| **List Licenses** | Licenses.tsx | GET `/v1/licenses` | ✅ Working |
| **List Alerts** | Alerts.tsx | GET `/v1/alerts` | ✅ Working |
| **Acknowledge Alert** | Alerts.tsx | POST `/v1/alerts/{id}/acknowledge` | ✅ Working |
| **Resolve Alert** | Alerts.tsx | POST `/v1/alerts/{id}/resolve` | ✅ Working |

**⚠️ تحذير**: ممنوع المساس بهذه الميزات في PHASE C. الإصلاحات الأمنية ستكون في PHASE B لاحقاً.

---

## الإحصائيات

- 🔴 **UI-Only**: 2 features
- 🟠 **Partial/Unsafe**: 7 features
- 🟡 **Placeholder Data**: 8 features
- 🟢 **Working (No Touch)**: 17+ features

**المجموع**: 34+ features تم تحليلها
