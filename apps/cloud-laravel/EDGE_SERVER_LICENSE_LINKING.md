# ربط Edge Server بالترخيص (License)

## التحديثات المطبقة

### 1. واجهة المستخدم (Frontend) ✅

**الملف**: `apps/web-portal/src/pages/Settings.tsx`

**التحديثات**:
- ✅ إضافة حقل `license_id` في نموذج إضافة/تعديل Edge Server
- ✅ جلب التراخيص المتاحة للمؤسسة (active و غير مربوطة)
- ✅ عرض قائمة منسدلة للتراخيص المتاحة
- ✅ عرض معلومات الترخيص (license_key, plan, max_cameras)
- ✅ رسالة توضيحية إذا لم توجد تراخيص متاحة

**الكود**:
```typescript
// جلب التراخيص
const fetchLicenses = async () => {
  const result = await licensesApi.getLicenses({
    organization_id: organization.id,
    per_page: 100,
  });
  // عرض فقط التراخيص النشطة وغير مربوطة
  const unboundLicenses = result.data.filter(
    (license) => license.status === 'active' && !license.edge_server_id
  );
  setAvailableLicenses(unboundLicenses);
};

// إرسال license_id عند إنشاء Edge Server
const newServer = await edgeServersApi.createEdgeServer({
  name: serverForm.name,
  location: serverForm.location || undefined,
  license_id: serverForm.license_id || undefined,
});
```

### 2. Backend API ✅

**الملف**: `apps/cloud-laravel/app/Http/Controllers/EdgeController.php`

#### أ. `store` Method (إنشاء Edge Server)

**التحديثات**:
- ✅ قبول `license_id` في الطلب
- ✅ التحقق من أن الترخيص ينتمي للمؤسسة
- ✅ التحقق من أن الترخيص غير مربوط بسيرفر آخر
- ✅ ربط الترخيص بـ Edge Server تلقائياً
- ✅ ربط Edge Server بالترخيص في جدول `licenses`

**الكود**:
```php
// التحقق من الترخيص
if (!empty($data['license_id'])) {
    $license = License::findOrFail($data['license_id']);
    if ($license->organization_id !== (int) $organizationId) {
        return response()->json(['message' => 'License does not belong to the specified organization'], 403);
    }
    
    // التحقق من عدم ربطه بسيرفر آخر
    $existingEdge = EdgeServer::where('license_id', $data['license_id'])
        ->where('id', '!=', $request->get('edge_id'))
        ->first();
    if ($existingEdge) {
        return response()->json(['message' => 'License is already bound to another edge server'], 409);
    }
}

// إنشاء Edge Server
$edgeServer = EdgeServer::create([
    'name' => $data['name'],
    'organization_id' => $organizationId,
    'license_id' => $data['license_id'] ?? null,
    'edge_id' => $data['edge_id'] ?? Str::uuid()->toString(),
    'location' => $data['location'] ?? null,
    'notes' => $data['notes'] ?? null,
    'online' => false,
]);

// ربط الترخيص
if (!empty($data['license_id'])) {
    $license = License::findOrFail($data['license_id']);
    $license->update(['edge_server_id' => $edgeServer->id]);
} else {
    // ربط تلقائي بأول ترخيص متاح
    $availableLicense = License::where('organization_id', $organizationId)
        ->where('status', 'active')
        ->whereNull('edge_server_id')
        ->first();
    
    if ($availableLicense) {
        $edgeServer->update(['license_id' => $availableLicense->id]);
        $availableLicense->update(['edge_server_id' => $edgeServer->id]);
    }
}
```

#### ب. `update` Method (تحديث Edge Server)

**التحديثات**:
- ✅ السماح بتغيير الترخيص
- ✅ فك ربط الترخيص القديم
- ✅ ربط الترخيص الجديد
- ✅ التحقق من أن الترخيص ينتمي للمؤسسة

**الكود**:
```php
if (isset($data['license_id'])) {
    if ($data['license_id'] === null || $data['license_id'] === '') {
        // فك ربط الترخيص القديم
        if ($edgeServer->license_id) {
            $oldLicense = License::find($edgeServer->license_id);
            if ($oldLicense) {
                $oldLicense->update(['edge_server_id' => null]);
            }
        }
        $data['license_id'] = null;
    } else {
        $license = License::findOrFail($data['license_id']);
        
        // التحقق من الملكية
        if ($license->organization_id !== $edgeServer->organization_id) {
            return response()->json(['message' => 'License does not belong to this edge server\'s organization'], 403);
        }
        
        // فك ربط الترخيص القديم
        if ($edgeServer->license_id && $edgeServer->license_id != $data['license_id']) {
            $oldLicense = License::find($edgeServer->license_id);
            if ($oldLicense) {
                $oldLicense->update(['edge_server_id' => null]);
            }
        }
        
        // ربط الترخيص الجديد
        $license->update(['edge_server_id' => $edgeServer->id]);
    }
}
```

#### ج. `heartbeat` Method (ربط تلقائي عند الاتصال)

**التحديثات**:
- ✅ ربط تلقائي بأول ترخيص متاح إذا لم يكن Edge Server مربوطاً بترخيص
- ✅ التأكد من ربط الترخيص بـ Edge Server بعد `updateOrCreate`
- ✅ فك ربط الترخيص القديم إذا تم ربطه بسيرفر آخر

**الكود**:
```php
// إنشاء أو تحديث Edge Server
$edge = EdgeServer::updateOrCreate(
    ['edge_id' => $request->edge_id],
    $updateData
);

// ربط تلقائي بأول ترخيص متاح
if (!$edge->license_id) {
    $availableLicense = License::where('organization_id', $organizationId)
        ->where('status', 'active')
        ->whereNull('edge_server_id')
        ->first();
    
    if ($availableLicense) {
        $edge->update(['license_id' => $availableLicense->id]);
        $availableLicense->update(['edge_server_id' => $edge->id]);
    }
} else {
    // التأكد من ربط الترخيص
    $license = License::find($edge->license_id);
    if ($license && $license->edge_server_id != $edge->id) {
        // فك ربط السيرفر القديم
        if ($license->edge_server_id) {
            $oldEdge = EdgeServer::find($license->edge_server_id);
            if ($oldEdge && $oldEdge->id != $edge->id) {
                $oldEdge->update(['license_id' => null]);
            }
        }
        // ربط الترخيص بالسيرفر الحالي
        $license->update(['edge_server_id' => $edge->id]);
    }
}
```

### 3. API Interface ✅

**الملف**: `apps/web-portal/src/lib/api/edgeServers.ts`

**التحديثات**:
- ✅ إضافة `license_id` إلى `CreateEdgeServerData` interface

```typescript
interface CreateEdgeServerData {
  name: string;
  location?: string;
  notes?: string;
  license_id?: string; // ✅ جديد
}
```

---

## سير العمل (Workflow)

### 1. إضافة Edge Server من لوحة التحكم

1. **صاحب المؤسسة** يذهب إلى **الإعدادات > السيرفرات**
2. يضغط على **"إضافة سيرفر"**
3. يملأ البيانات:
   - اسم السيرفر (مطلوب)
   - عنوان IP (اختياري)
   - الموقع/الفرع (اختياري)
   - **الترخيص (اختياري)** ← جديد
4. يضغط **"إضافة"**
5. **Backend**:
   - ينشئ Edge Server
   - إذا تم اختيار ترخيص، يربطه
   - إذا لم يتم اختيار ترخيص، يربط تلقائياً بأول ترخيص متاح
   - يربط الترخيص بـ Edge Server في جدول `licenses`

### 2. ربط Edge Server عند الاتصال (Heartbeat)

1. **Edge Server** يبدأ التشغيل
2. يرسل **heartbeat** إلى Cloud
3. **Cloud**:
   - يبحث عن Edge Server بـ `edge_id`
   - إذا لم يكن موجوداً، ينشئه
   - إذا كان موجوداً، يحدثه
   - **إذا لم يكن مربوطاً بترخيص**، يربط تلقائياً بأول ترخيص متاح
   - **إذا كان مربوطاً بترخيص**، يتأكد من الربط الصحيح

### 3. إضافة كاميرا وربطها بـ Edge Server

1. **صاحب المؤسسة** يذهب إلى **الكاميرات**
2. يضغط على **"إضافة كاميرا"**
3. يملأ البيانات:
   - اسم الكاميرا
   - RTSP URL
   - **Edge Server** (اختيار من القائمة)
   - إعدادات أخرى
4. يضغط **"إضافة"**
5. **Backend** ينشئ الكاميرا ويربطها بـ Edge Server

---

## قاعدة البيانات

### جدول `edge_servers`
```sql
- id
- edge_id (UUID)
- organization_id
- license_id (nullable) ← ربط بالترخيص
- name
- location
- online
- ...
```

### جدول `licenses`
```sql
- id
- license_key
- organization_id
- edge_server_id (nullable) ← ربط بـ Edge Server
- status
- plan
- max_cameras
- ...
```

### جدول `cameras`
```sql
- id
- camera_id
- organization_id
- edge_server_id ← ربط بـ Edge Server
- name
- rtsp_url
- status
- ...
```

---

## الاختبار

### 1. اختبار إضافة Edge Server مع ترخيص

```bash
# 1. إنشاء Edge Server مع ترخيص
curl -X POST "https://api.stcsolutions.online/api/v1/edge-servers" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "سيرفر الفرع الرئيسي",
    "location": "المبنى الرئيسي",
    "license_id": 1
  }'

# 2. التحقق من الربط
curl -X GET "https://api.stcsolutions.online/api/v1/edge-servers/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. اختبار Heartbeat مع ربط تلقائي

```bash
curl -X POST "https://api.stcsolutions.online/api/v1/edges/heartbeat" \
  -H "Content-Type: application/json" \
  -d '{
    "edge_id": "test-edge-123",
    "version": "2.0.0",
    "online": true,
    "organization_id": 1
  }'
```

### 3. اختبار إضافة كاميرا

```bash
curl -X POST "https://api.stcsolutions.online/api/v1/cameras" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "كاميرا المدخل الرئيسي",
    "edge_server_id": 1,
    "rtsp_url": "rtsp://192.168.1.100:554/stream",
    "location": "المدخل الرئيسي"
  }'
```

---

## النتيجة

✅ **يمكن لصاحب المؤسسة**:
1. إضافة Edge Server من لوحة التحكم
2. اختيار ترخيص لربطه (أو تركه فارغاً للربط التلقائي)
3. ربط Edge Server بالترخيص تلقائياً عند الاتصال
4. إضافة كاميرات وربطها بـ Edge Server
5. رؤية Edge Server والكاميرات في لوحة التحكم

✅ **Edge Server**:
1. يتصل بالـ Cloud عبر heartbeat
2. يتم ربطه تلقائياً بترخيص إذا لم يكن مربوطاً
3. يمكنه جلب الكاميرات المرتبطة به
4. يمكنه إرسال الأحداث والتنبيهات

---

## الملفات المحدثة

1. ✅ `apps/web-portal/src/pages/Settings.tsx` - إضافة حقل الترخيص
2. ✅ `apps/web-portal/src/lib/api/edgeServers.ts` - تحديث interface
3. ✅ `apps/cloud-laravel/app/Http/Controllers/EdgeController.php` - ربط الترخيص في store, update, heartbeat

جميع التحديثات تم رفعها على GitHub.

