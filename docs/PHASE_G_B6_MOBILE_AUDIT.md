# PHASE G - B6: Mobile App Compatibility Audit

## Mobile App API Calls Analysis

### Repositories Found
1. `AlertRepository`
2. `CameraRepository`
3. `ServerRepository`
4. `AuthService`

## API Endpoints Used

### From README.md:
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/cameras`
- `GET /api/cameras/:id/stream`
- `GET /api/alerts`
- `POST /api/alerts/:id/ack`
- `GET /api/analytics`
- `GET /api/servers`

### Analysis Required:
1. Check if all these endpoints exist in Laravel backend
2. Verify endpoint paths match (v1 prefix?)
3. Check error handling for missing endpoints
4. Verify Market module compatibility (read-only)

## Status

⏳ **Audit in progress** - Reading repository files to verify API calls
