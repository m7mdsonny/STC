# API Endpoints Documentation

## 🔐 Authentication Endpoints

All authentication endpoints are under `/api/v1/auth/` prefix.

### Login
**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "user": {
    "id": 1,
    "name": "User Name",
    "email": "user@example.com",
    "role": "owner",
    "organization_id": 1,
    ...
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account is disabled

---

### Logout
**Endpoint:** `POST /api/v1/auth/logout`

**Headers Required:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "ok": true
}
```

---

### Get Current User
**Endpoint:** `GET /api/v1/auth/me`

**Headers Required:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "User Name",
  "email": "user@example.com",
  "role": "owner",
  "organization_id": 1,
  ...
}
```

---

### Update Profile
**Endpoint:** `PUT /api/v1/auth/profile`

**Headers Required:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "+966500000000",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

---

### Change Password
**Endpoint:** `PUT /api/v1/auth/password`

**Headers Required:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "current_password": "oldpassword",
  "password": "newpassword",
  "password_confirmation": "newpassword"
}
```

---

## 📝 Important Notes

1. **All authentication endpoints use `/api/v1/auth/` prefix**
   - ✅ Correct: `POST /api/v1/auth/login`
   - ❌ Wrong: `POST /api/login`
   - ❌ Wrong: `POST /api/v1/login`

2. **All authenticated endpoints require Bearer token:**
   ```
   Authorization: Bearer {token}
   ```

3. **Token is returned from login endpoint and must be stored by frontend**

4. **Token expires based on Sanctum configuration (default: no expiration)**

---

## 🔗 Frontend Integration

### Example Login Function (TypeScript/JavaScript)

```typescript
async function login(email: string, password: string) {
  const response = await fetch('https://api.example.com/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = await response.json();
  
  // Store token
  localStorage.setItem('auth_token', data.token);
  
  // Store user
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
}
```

### Example Authenticated Request

```typescript
async function getCurrentUser() {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch('https://api.example.com/api/v1/auth/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user');
  }

  return await response.json();
}
```

---

## 🚨 Common Issues

### Issue: 404 Not Found on `/api/login`
**Solution:** Use `/api/v1/auth/login` instead

### Issue: 401 Unauthorized
**Solution:** 
- Check token is included in Authorization header
- Verify token format: `Bearer {token}` (with space)
- Ensure token hasn't expired (if expiration is configured)

### Issue: 403 Forbidden
**Solution:**
- User account might be disabled (`is_active = false`)
- User might not have required permissions

---

## 📚 Related Documentation

- [Laravel Sanctum Documentation](https://laravel.com/docs/sanctum)
- [API Client Configuration](./apps/web-portal/src/lib/apiClient.ts)
- [Login Credentials](./LOGIN_CREDENTIALS.md)

