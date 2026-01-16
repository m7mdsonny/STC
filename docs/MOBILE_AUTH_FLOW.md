# Mobile App Authentication Flow

## Overview
Mobile App uses Laravel Sanctum for token-based authentication.

## Flow Diagram

```
1. User enters credentials
   ↓
2. POST /api/v1/auth/login
   { email, password }
   ↓
3. Cloud API validates credentials
   ↓
4. Cloud API returns token + user data
   { token, user }
   ↓
5. Mobile App stores token locally
   ↓
6. Mobile App includes token in all requests
   Authorization: Bearer <token>
   ↓
7. Cloud API validates token via auth:sanctum middleware
   ↓
8. Request proceeds if token valid
```

## Login Process

### Request
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Success Response (200)
```json
{
  "token": "1|abcdef123456...",
  "user": {
    "id": 1,
    "name": "User Name",
    "email": "user@example.com",
    "role": "admin",
    "organization_id": 5,
    ...
  }
}
```

### Error Responses
- `401`: Invalid credentials
- `403`: Account disabled
- `429`: Too many login attempts (rate limited: 5 per minute)

## Token Storage

Mobile App stores token using `StorageService`:
- **Android**: SharedPreferences
- **iOS**: UserDefaults
- Key: `auth_token`

## Authenticated Requests

All authenticated requests include:
```
Authorization: Bearer <token>
```

### Token Validation
- Cloud API validates token on each request
- Token is checked against `personal_access_tokens` table
- Token expiry: None (until revoked)

## Get Current User

### Request
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

### Response
```json
{
  "id": 1,
  "name": "User Name",
  "email": "user@example.com",
  "role": "admin",
  "organization_id": 5,
  ...
}
```

## Logout Process

### Request
```http
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

### Process
1. Cloud API revokes token
2. Mobile App clears local token
3. Mobile App clears user data
4. Mobile App unregisters FCM token

## Token Refresh

**Current Implementation**: No automatic token refresh
- Tokens don't expire (until revoked)
- If token invalid, user must login again

**Future Enhancement**: Implement token refresh mechanism

## Error Handling

### 401 Unauthorized
- Token missing or invalid
- Mobile App should:
  1. Clear local token
  2. Redirect to login screen
  3. Show message: "انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى"

### 403 Forbidden
- User doesn't have permission
- Mobile App should:
  1. Show error message
  2. Don't clear token (user is still authenticated)

## Security Considerations

1. **Token Storage**: Encrypted local storage (recommended)
2. **HTTPS Only**: All API calls must use HTTPS
3. **Token Transmission**: Only in Authorization header, never in URL
4. **Token Revocation**: On logout, token is immediately revoked
5. **Rate Limiting**: Login endpoint limited to 5 attempts per minute

## FCM Token Registration

After successful login:
1. Get FCM token from Firebase
2. Register with Cloud API: `POST /api/v1/notifications/register-device`
3. Body: `{ device_token, platform: 'android' | 'ios', app_version }`

On logout:
1. Unregister FCM token: `DELETE /api/v1/notifications/unregister-device`
2. Body: `{ device_token }`
