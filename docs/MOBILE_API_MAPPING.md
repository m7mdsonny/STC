# Mobile App ↔ Cloud Server API Mapping

## Base URL
- **Mobile App**: `https://api.stcsolutions.online/api/v1` (configurable via `Env.apiUrl`)
- **Cloud API**: `https://api.stcsolutions.online/api/v1`

## Authentication

### Token-Based Authentication
Mobile App uses **Bearer Token** authentication via Laravel Sanctum.

**Header Format**:
```
Authorization: Bearer <token>
```

**Token Lifecycle**:
- Token created on login: `POST /api/v1/auth/login`
- Token validated on each request via `auth:sanctum` middleware
- Token revoked on logout: `POST /api/v1/auth/logout`

---

## API Endpoints Mapping

### Authentication Endpoints

| Mobile App Call | Cloud API Endpoint | Method | Status |
|----------------|-------------------|--------|--------|
| `POST /auth/login` | `POST /api/v1/auth/login` | POST | ✅ Match |
| `GET /auth/me` | `GET /api/v1/auth/me` | GET | ✅ Match |
| `POST /auth/logout` | `POST /api/v1/auth/logout` | POST | ✅ Match |
| `PUT /auth/profile` | `PUT /api/v1/auth/profile` | PUT | ✅ Match |
| `PUT /auth/password` | `PUT /api/v1/auth/password` | PUT | ✅ Match |
| `POST /auth/forgot-password` | `POST /api/v1/auth/forgot-password` | POST | ⚠️ Check if exists |

### Alerts Endpoints

| Mobile App Call | Cloud API Endpoint | Method | Status |
|----------------|-------------------|--------|--------|
| `GET /alerts` | `GET /api/v1/alerts` | GET | ✅ Match |
| `GET /alerts/{id}` | `GET /api/v1/alerts/{alert}` | GET | ✅ Match |
| `POST /alerts/{id}/acknowledge` | `POST /api/v1/alerts/{alert}/acknowledge` | POST | ✅ Match |
| `POST /alerts/{id}/resolve` | `POST /api/v1/alerts/{alert}/resolve` | POST | ⚠️ Check if exists |
| `GET /alerts/stats` | `GET /api/v1/alerts/stats` | GET | ⚠️ Check if exists |

**Query Parameters**:
- `page`, `per_page` - Pagination
- `module` (Mobile) vs `type` (Cloud) - ⚠️ **MISMATCH**
- `severity` (Mobile) vs `severity` (Cloud) - ✅ Match
- `status` - ✅ Match
- `from`, `to` - Date range - ✅ Match
- `organization_id` - ✅ Match

### Cameras Endpoints

| Mobile App Call | Cloud API Endpoint | Method | Status |
|----------------|-------------------|--------|--------|
| `GET /cameras` | `GET /api/v1/cameras` | GET | ✅ Match |
| `GET /cameras/{id}` | `GET /api/v1/cameras/{camera}` | GET | ✅ Match |
| `GET /cameras/stats` | `GET /api/v1/cameras/stats` | GET | ✅ Match |

**Query Parameters**:
- `page`, `per_page` - Pagination
- `status` (Mobile: `'online'` or `'offline'`) vs `status` (Cloud: same) - ✅ Match
- `organization_id` - ✅ Match

### Edge Servers Endpoints

| Mobile App Call | Cloud API Endpoint | Method | Status |
|----------------|-------------------|--------|--------|
| `GET /edge-servers` | `GET /api/v1/edge-servers` | GET | ✅ Match |
| `GET /edge-servers/{id}` | `GET /api/v1/edge-servers/{edgeServer}` | GET | ✅ Match |
| `GET /edge-servers/stats` | `GET /api/v1/edge-servers/stats` | GET | ✅ Match |

**Query Parameters**:
- `organization_id` - ✅ Match

### Notifications Endpoints

| Mobile App Call | Cloud API Endpoint | Method | Status |
|----------------|-------------------|--------|--------|
| `POST /notifications/register-device` | `POST /api/v1/notifications/register-device` | POST | ✅ Match |
| `POST /auth/register-fcm-token` | `POST /api/v1/auth/register-fcm-token` | POST | ✅ Match (alias) |
| `DELETE /notifications/unregister-device` | `DELETE /api/v1/notifications/unregister-device` | DELETE | ✅ Match |

---

## Response Format

### Paginated Response
```json
{
  "data": [...],
  "current_page": 1,
  "per_page": 15,
  "total": 100,
  "last_page": 7
}
```

### Single Resource Response
```json
{
  "id": 1,
  "name": "...",
  ...
}
```

### Error Response
```json
{
  "message": "Error message",
  "error": "error_code"
}
```

---

## Issues Identified

### 1. Alert Query Parameter Mismatch
- **Mobile App**: Uses `type` parameter
- **Cloud API**: Uses `module` parameter
- **Fix**: Update Mobile App to use `module` instead of `type`

### 2. Alert Resolve Endpoint
- **Mobile App**: Calls `POST /alerts/{id}/resolve`
- **Cloud API**: Check if this endpoint exists
- **Status**: ⚠️ Needs verification

### 3. Alert Stats Endpoint
- **Mobile App**: Calls `GET /alerts/stats`
- **Cloud API**: Check if this endpoint exists
- **Status**: ⚠️ Needs verification

### 4. Forgot Password Endpoint
- **Mobile App**: Calls `POST /auth/forgot-password`
- **Cloud API**: Check if this endpoint exists
- **Status**: ⚠️ Needs verification

---

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity (validation errors)
- `500` - Internal Server Error

### Mobile App Error Handling
- Timeout errors: "انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى."
- 401 errors: "انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى"
- 403 errors: "ليس لديك صلاحية للوصول"
- 404 errors: "المورد غير موجود"
- 500 errors: "خطأ في الخادم"

---

## Authentication Flow

1. **Login**: `POST /api/v1/auth/login`
   - Request: `{ email, password }`
   - Response: `{ token, user }`
   - Store token in local storage

2. **Authenticated Requests**: Include `Authorization: Bearer <token>` header

3. **Get Current User**: `GET /api/v1/auth/me`
   - Validates token
   - Returns current user data

4. **Logout**: `POST /api/v1/auth/logout`
   - Revokes token
   - Clears local storage

---

## FCM Token Registration

1. **Get FCM Token**: From Firebase Messaging
2. **Register Token**: `POST /api/v1/notifications/register-device`
   - Body: `{ device_token, platform: 'android' | 'ios', app_version }`
3. **Unregister Token**: `DELETE /api/v1/notifications/unregister-device`
   - Body: `{ device_token }`

---

## Offline Mode Support

Mobile App has `enableOfflineMode` flag, but implementation needs verification:
- Cache API responses locally
- Queue requests when offline
- Sync when connection restored

---

## Rate Limiting

Cloud API has rate limiting:
- Login: 5 attempts per minute
- Register: 3 attempts per minute
- Other endpoints: Default throttling

Mobile App should handle `429 Too Many Requests` errors gracefully.
