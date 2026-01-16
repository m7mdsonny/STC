# Mobile App Error Handling Matrix

## HTTP Status Codes

| Status Code | Meaning | Mobile App Handling | User Message |
|------------|---------|-------------------|--------------|
| 200 | Success | Return data | - |
| 201 | Created | Return created resource | - |
| 400 | Bad Request | Show validation errors | "بيانات غير صحيحة" |
| 401 | Unauthorized | Clear token, redirect to login | "انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى" |
| 403 | Forbidden | Show error, keep token | "ليس لديك صلاحية للوصول" |
| 404 | Not Found | Show error | "المورد غير موجود" |
| 422 | Unprocessable Entity | Show validation errors | "بيانات غير صحيحة" |
| 429 | Too Many Requests | Show rate limit message | "تم تجاوز الحد المسموح. يرجى المحاولة لاحقاً" |
| 500 | Internal Server Error | Show generic error | "خطأ في الخادم" |

## Network Errors

| Error Type | Mobile App Handling | User Message |
|-----------|-------------------|--------------|
| Connection Timeout | Retry (if applicable) | "انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى." |
| Send Timeout | Retry (if applicable) | "انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى." |
| Receive Timeout | Retry (if applicable) | "انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى." |
| Network Unavailable | Show offline message | "حدث خطأ في الاتصال بالشبكة" |
| Request Cancelled | Ignore (user cancelled) | "تم إلغاء الطلب" |

## API Error Response Format

### Standard Error
```json
{
  "message": "Error message in Arabic or English",
  "error": "error_code"
}
```

### Validation Error (422)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

## Error Codes

### Authentication Errors
- `authentication_required`: Missing or invalid token
- `invalid_credentials`: Wrong email/password
- `account_disabled`: User account is disabled

### Authorization Errors
- `insufficient_permissions`: User doesn't have required role
- `organization_access_denied`: User can't access organization

### Validation Errors
- `validation_failed`: Request data validation failed
- `invalid_input`: Invalid input format

### Business Logic Errors
- `resource_not_found`: Resource doesn't exist
- `resource_already_exists`: Resource already exists
- `operation_not_allowed`: Operation not allowed in current state

## Mobile App Error Handling Implementation

### Current Implementation (`api_service.dart`)

```dart
String _handleError(DioException error) {
  switch (error.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      return 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.';
    case DioExceptionType.badResponse:
      return _handleResponseError(error.response);
    case DioExceptionType.cancel:
      return 'تم إلغاء الطلب';
    default:
      return 'حدث خطأ في الاتصال بالشبكة';
  }
}

String _handleResponseError(Response? response) {
  if (response == null) return 'خطأ في الخادم';

  switch (response.statusCode) {
    case 400:
      return response.data['message'] ?? 'بيانات غير صحيحة';
    case 401:
      return 'انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى';
    case 403:
      return 'ليس لديك صلاحية للوصول';
    case 404:
      return 'المورد غير موجود';
    case 500:
      return 'خطأ في الخادم';
    default:
      return response.data['message'] ?? 'حدث خطأ';
  }
}
```

## Improvements Needed

### 1. Token Expiry Handling
**Current**: No automatic token refresh
**Needed**: Detect 401, clear token, redirect to login

### 2. Retry Logic
**Current**: No retry for network errors
**Needed**: Retry with exponential backoff for:
- Connection timeout
- Network unavailable
- 500 errors (server errors)

**Don't retry for**:
- 401 (authentication)
- 403 (authorization)
- 404 (not found)
- 422 (validation)

### 3. Offline Mode
**Current**: `enableOfflineMode` flag exists but not implemented
**Needed**:
- Cache API responses
- Queue requests when offline
- Sync when connection restored

### 4. Error Logging
**Current**: Basic console logging in debug mode
**Needed**:
- Log errors to analytics service
- Track error frequency
- Alert on critical errors

### 5. User-Friendly Messages
**Current**: Generic error messages
**Needed**:
- Extract specific error messages from API response
- Show validation errors per field
- Provide actionable guidance

## Error Recovery Strategies

### Network Errors
1. Show retry button
2. Auto-retry after 5 seconds (max 3 attempts)
3. Show offline indicator

### Authentication Errors (401)
1. Clear token immediately
2. Clear user data
3. Redirect to login screen
4. Show message: "انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى"

### Authorization Errors (403)
1. Show error message
2. Don't clear token (user is still authenticated)
3. Log error for admin review

### Validation Errors (422)
1. Show field-specific errors
2. Highlight invalid fields
3. Provide correction guidance

### Server Errors (500)
1. Show generic error message
2. Log error details
3. Provide "Report Issue" option

## Testing Error Scenarios

### Test Cases
- [ ] Network timeout
- [ ] Invalid credentials (401)
- [ ] Expired token (401)
- [ ] Insufficient permissions (403)
- [ ] Resource not found (404)
- [ ] Validation errors (422)
- [ ] Rate limiting (429)
- [ ] Server error (500)
- [ ] Offline mode
- [ ] Token refresh
