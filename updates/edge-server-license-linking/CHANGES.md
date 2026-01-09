# تفاصيل التغييرات

## 1. Frontend: `apps/web-portal/src/pages/Settings.tsx`

### الموقع
```
apps/web-portal/src/pages/Settings.tsx
```

### التغييرات

#### أ. إضافة Imports
```typescript
// قبل
import { Settings as SettingsIcon, Building2, Bell, Shield, Server, Plus, ... } from 'lucide-react';
import { edgeServersApi } from '../lib/api/edgeServers';

// بعد
import { Settings as SettingsIcon, Building2, Bell, Shield, Server, Plus, ..., Key } from 'lucide-react';
import { edgeServersApi } from '../lib/api/edgeServers';
import { licensesApi } from '../lib/api/licenses';  // ✅ جديد
import type { EdgeServer, License } from '../types/database';  // ✅ إضافة License
```

#### ب. إضافة State Variables
```typescript
// قبل
const [serverForm, setServerForm] = useState({
  name: '',
  ip_address: '',
  location: '',
});

// بعد
const [serverForm, setServerForm] = useState({
  name: '',
  ip_address: '',
  location: '',
  license_id: '',  // ✅ جديد
});
const [availableLicenses, setAvailableLicenses] = useState<License[]>([]);  // ✅ جديد
const [loadingLicenses, setLoadingLicenses] = useState(false);  // ✅ جديد
```

#### ج. إضافة Function لجلب التراخيص
```typescript
// ✅ جديد - بعد fetchData
const fetchLicenses = async () => {
  if (!organization) return;
  setLoadingLicenses(true);
  try {
    const result = await licensesApi.getLicenses({
      organization_id: organization.id,
      per_page: 100,
    });
    // عرض فقط التراخيص النشطة وغير مربوطة
    const unboundLicenses = result.data.filter(
      (license) => license.status === 'active' && !license.edge_server_id
    );
    setAvailableLicenses(unboundLicenses);
  } catch (error) {
    console.error('Failed to fetch licenses:', error);
  }
  setLoadingLicenses(false);
};
```

#### د. تحديث useEffect
```typescript
// قبل
useEffect(() => {
  if (organization) {
    fetchData();
  }
}, [organization]);

// بعد
useEffect(() => {
  if (organization) {
    fetchData();
    fetchLicenses();  // ✅ جديد
  }
}, [organization]);
```

#### هـ. تحديث addServer Function
```typescript
// قبل
const newServer = await edgeServersApi.createEdgeServer({
  name: serverForm.name,
  location: serverForm.location || undefined,
});

// بعد
const newServer = await edgeServersApi.createEdgeServer({
  name: serverForm.name,
  location: serverForm.location || undefined,
  license_id: serverForm.license_id || undefined,  // ✅ جديد
});
```

#### و. تحديث editServer Function
```typescript
// قبل
setServerForm({
  name: server.name,
  ip_address: server.ip_address || '',
  location: (server.system_info as Record<string, string>)?.location || '',
});

// بعد
setServerForm({
  name: server.name,
  ip_address: server.ip_address || '',
  location: (server.system_info as Record<string, string>)?.location || '',
  license_id: server.license_id || '',  // ✅ جديد
});
```

#### ز. إضافة حقل الترخيص في النموذج
```typescript
// ✅ جديد - بعد حقل location
<div>
  <label className="label flex items-center gap-2">
    <Key className="w-4 h-4" />
    الترخيص (اختياري)
  </label>
  {loadingLicenses ? (
    <div className="input flex items-center justify-center py-2">
      <div className="w-4 h-4 border-2 border-stc-gold border-t-transparent rounded-full animate-spin" />
    </div>
  ) : (
    <select
      value={serverForm.license_id}
      onChange={(e) => setServerForm({ ...serverForm, license_id: e.target.value })}
      className="input"
    >
      <option value="">-- اختر ترخيص (اختياري) --</option>
      {availableLicenses.map((license) => (
        <option key={license.id} value={license.id}>
          {license.license_key} - {license.plan} ({license.max_cameras} كاميرات)
        </option>
      ))}
    </select>
  )}
  {availableLicenses.length === 0 && !loadingLicenses && (
    <p className="text-xs text-white/50 mt-1">
      لا توجد تراخيص متاحة غير مربوطة. يمكنك إضافة السيرفر بدون ترخيص وربطه لاحقاً.
    </p>
  )}
</div>
```

---

## 2. Frontend: `apps/web-portal/src/lib/api/edgeServers.ts`

### الموقع
```
apps/web-portal/src/lib/api/edgeServers.ts
```

### التغييرات

#### تحديث Interface
```typescript
// قبل
interface CreateEdgeServerData {
  name: string;
  location?: string;
  notes?: string;
}

// بعد
interface CreateEdgeServerData {
  name: string;
  location?: string;
  notes?: string;
  license_id?: string;  // ✅ جديد
}
```

---

## 3. Backend: `apps/cloud-laravel/app/Http/Controllers/EdgeController.php`

### الموقع
```
apps/cloud-laravel/app/Http/Controllers/EdgeController.php
```

### التغييرات

#### أ. تحديث `store` Method (السطور 48-132)

**قبل**:
```php
$edgeServer = EdgeServer::create([
    ...$data,
    'edge_id' => $data['edge_id'] ?? Str::uuid()->toString(),
    'online' => false,
]);

return response()->json($edgeServer->load(['organization', 'license']), 201);
```

**بعد**:
```php
// التحقق من الترخيص
if (!empty($data['license_id'])) {
    $license = \App\Models\License::findOrFail($data['license_id']);
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
    'license_id' => $data['license_id'] ?? null,  // ✅ جديد
    'edge_id' => $data['edge_id'] ?? Str::uuid()->toString(),
    'location' => $data['location'] ?? null,
    'notes' => $data['notes'] ?? null,
    'online' => false,
]);

// ربط الترخيص
if (!empty($data['license_id'])) {
    $license = License::findOrFail($data['license_id']);
    $license->update(['edge_server_id' => $edgeServer->id]);  // ✅ جديد
} else {
    // ربط تلقائي بأول ترخيص متاح  // ✅ جديد
    $availableLicense = License::where('organization_id', $organizationId)
        ->where('status', 'active')
        ->whereNull('edge_server_id')
        ->first();
    
    if ($availableLicense) {
        $edgeServer->update(['license_id' => $availableLicense->id]);
        $availableLicense->update(['edge_server_id' => $edgeServer->id]);
    }
}

return response()->json($edgeServer->load(['organization', 'license']), 201);
```

#### ب. تحديث `update` Method (السطور 134-199)

**قبل**:
```php
$data = $request->validate([
    'name' => 'sometimes|string|max:255',
    'license_id' => 'nullable|exists:licenses,id',
    // ...
]);

$edgeServer->update($data);
```

**بعد**:
```php
$data = $request->validate([
    'name' => 'sometimes|string|max:255',
    'license_id' => 'nullable|exists:licenses,id',
    // ...
]);

// معالجة license_id  // ✅ جديد
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

$edgeServer->update($data);
```

#### ج. تحديث `heartbeat` Method (السطور 257-359)

**قبل**:
```php
$edge = EdgeServer::updateOrCreate(
    ['edge_id' => $request->edge_id],
    $updateData
);
```

**بعد**:
```php
// إنشاء أو تحديث Edge Server
$edge = EdgeServer::updateOrCreate(
    ['edge_id' => $request->edge_id],
    $updateData
);

// ربط تلقائي بأول ترخيص متاح  // ✅ جديد
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
    // التأكد من ربط الترخيص  // ✅ جديد
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

---

## ملخص التغييرات

| الملف | التغييرات | السطور |
|------|-----------|--------|
| `Settings.tsx` | إضافة حقل الترخيص، جلب التراخيص | ~100 سطر |
| `edgeServers.ts` | إضافة `license_id` إلى interface | 1 سطر |
| `EdgeController.php` | ربط الترخيص في store, update, heartbeat | ~150 سطر |

**إجمالي التغييرات**: ~250 سطر من الكود

---

## قاعدة البيانات

لا توجد تغييرات على قاعدة البيانات. الجداول موجودة بالفعل:
- `edge_servers.license_id` (nullable)
- `licenses.edge_server_id` (nullable)

---

## الاختبار

### 1. اختبار إضافة Edge Server مع ترخيص
```bash
POST /api/v1/edge-servers
{
  "name": "سيرفر الفرع الرئيسي",
  "location": "المبنى الرئيسي",
  "license_id": 1
}
```

### 2. اختبار Heartbeat مع ربط تلقائي
```bash
POST /api/v1/edges/heartbeat
{
  "edge_id": "test-edge-123",
  "version": "2.0.0",
  "online": true,
  "organization_id": 1
}
```

### 3. اختبار تحديث الترخيص
```bash
PUT /api/v1/edge-servers/1
{
  "license_id": 2
}
```

