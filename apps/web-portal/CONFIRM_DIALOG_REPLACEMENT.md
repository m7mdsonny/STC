# استبدال window.confirm بـ ConfirmDialog

## ✅ الملفات المكتملة

### 1. AdminBackups.tsx ✅
- ✅ استبدال double confirmation للـ restore operation
- ✅ استخدام ConfirmDialog بدلاً من window.confirm مرتين
- ✅ Type: `danger` للتحذير من خطورة العملية

**التفاصيل**:
```typescript
// قبل
const confirmed = confirm('⚠️ تحذير...');
const doubleConfirm = confirm('تأكيد نهائي...');

// بعد
<ConfirmDialog
  open={confirmRestore.open}
  title="⚠️ تحذير: استعادة النسخة الاحتياطية"
  message="..."
  type="danger"
  onConfirm={handleRestoreConfirm}
/>

<ConfirmDialog
  open={confirmRestoreFinal.open}
  title="تأكيد نهائي"
  message="..."
  type="danger"
  onConfirm={handleRestoreFinalConfirm}
/>
```

### 2. Cameras.tsx ✅
- ✅ استبدال confirmation للـ delete operation
- ✅ استبدال confirmation للـ offline server warning
- ✅ استخدام ConfirmDialog بدلاً من window.confirm

**التفاصيل**:
```typescript
// قبل
if (!confirm(`هل أنت متأكد من حذف الكاميرا ${camera?.name}؟`)) return;
const proceed = confirm(`تحذير: السيرفر ${server.name} غير متصل...`);

// بعد
<ConfirmDialog
  open={confirmDelete.open}
  title="تأكيد الحذف"
  message={`هل أنت متأكد من حذف الكاميرا "${confirmDelete.cameraName}"؟...`}
  type="danger"
  onConfirm={handleDeleteConfirm}
/>

<ConfirmDialog
  open={confirmOfflineServer.open}
  title="تحذير: السيرفر غير متصل"
  message={`السيرفر "${confirmOfflineServer.serverName}" غير متصل...`}
  type="warning"
  onConfirm={confirmOfflineServer.onConfirm}
/>
```

---

## 📊 الإحصائيات

| الملف | window.confirm قبل | ConfirmDialog بعد | الحالة |
|------|-------------------|-------------------|--------|
| AdminBackups.tsx | 2 | 2 | ✅ مكتمل |
| Cameras.tsx | 2 | 2 | ✅ مكتمل |
| **الإجمالي** | **4** | **4** | **✅ 4/27** |

---

## ⚠️ الملفات المتبقية (23 استخدام)

### High Priority:
- `People.tsx` - 1 استخدام (handleDelete)
- `Vehicles.tsx` - 1 استخدام (handleDelete)
- `Team.tsx` - 1 استخدام (handleDelete)
- `Users.tsx` - 1 استخدام (handleDelete)
- `Settings.tsx` - 1 استخدام (handleDelete)

### Medium Priority:
- `Automation.tsx` - 1 استخدام (handleDelete)
- `EdgeServers.tsx` - 1 استخدام (handleDelete)
- `Licenses.tsx` - 1 استخدام (handleDelete)
- `Resellers.tsx` - 1 استخدام (handleDelete)
- `ModelTraining.tsx` - 4 استخدامات (delete operations)
- `LandingPageConfig.tsx` - 2 استخدامات (delete operations)
- `SuperAdminManagement.tsx` - 1 استخدام (remove super admin)
- `AdminIntegrations.tsx` - 1 استخدام (handleDelete)
- `AdminNotifications.tsx` - 1 استخدام (handleDelete)
- `AdminUpdates.tsx` - 1 استخدام (handleDelete)
- `PlatformWordings.tsx` - 1 استخدام (handleDelete)
- `SystemUpdates.tsx` - 1 استخدام (install update)
- `FreeTrialRequests.tsx` - 1 استخدام (create organization)
- `OrganizationSettings.tsx` - 1 استخدام (delete logo)

---

## 🎯 التوصيات

### الخطوة التالية:
1. **استبدال High Priority أولاً** (People, Vehicles, Team, Users, Settings)
2. **ثم Medium Priority** (Automation, EdgeServers, Licenses, etc.)
3. **أخيراً Low Priority** (ModelTraining, LandingPageConfig, etc.)

### النمط الموحد:
```typescript
// 1. Add state
const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string | null; name: string }>({ 
  open: false, 
  id: null, 
  name: '' 
});

// 2. Change handler
const handleDeleteClick = (id: string, name: string) => {
  setConfirmDelete({ open: true, id, name });
};

const handleDeleteConfirm = async () => {
  if (!confirmDelete.id) return;
  
  const id = confirmDelete.id;
  setConfirmDelete({ open: false, id: null, name: '' });
  
  try {
    await api.delete(id);
    showSuccess('تم الحذف بنجاح', `تم حذف ${confirmDelete.name} من النظام`);
    fetchData();
  } catch (error) {
    showError('خطأ', 'فشل الحذف');
  }
};

// 3. Update button
<button onClick={() => handleDeleteClick(item.id, item.name)}>حذف</button>

// 4. Add ConfirmDialog
<ConfirmDialog
  open={confirmDelete.open}
  title="تأكيد الحذف"
  message={`هل أنت متأكد من حذف "${confirmDelete.name}"؟`}
  type="danger"
  confirmText="حذف"
  cancelText="إلغاء"
  onConfirm={handleDeleteConfirm}
  onCancel={() => setConfirmDelete({ open: false, id: null, name: '' })}
/>
```

---

**تاريخ البدء**: 2026-01-09  
**الحالة**: ✅ **4/27 مكتمل** (15%)
