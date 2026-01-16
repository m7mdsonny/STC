# Cloud ↔ Local Server API Contract

## Overview
This document defines the contract between the Cloud API and Local Edge Server for secure communication.

## Base URL
- **Cloud API**: `https://api.stcsolutions.online/api/v1`
- **Local Server**: Configurable via `cloud_base_url` in config

## Authentication

### HMAC-SHA256 Signature
All requests from Local Server to Cloud API (except heartbeat) must include HMAC signature headers.

### Required Headers
```
X-EDGE-KEY: <edge_key>           # Unique identifier for edge server
X-EDGE-TIMESTAMP: <unix_timestamp> # Current Unix timestamp
X-EDGE-SIGNATURE: <hmac_sha256>   # HMAC signature
X-EDGE-NONCE: <unique_nonce>      # Replay protection (UUID or random string)
```

### Signature Generation
```
message = "{METHOD}|{PATH}|{TIMESTAMP}|{BODY_HASH}"
signature = HMAC_SHA256(edge_secret, message)
```

Where:
- `METHOD`: HTTP method (GET, POST, etc.)
- `PATH`: Full API path (e.g., `/api/v1/edges/events`)
- `TIMESTAMP`: Unix timestamp (same as X-EDGE-TIMESTAMP header)
- `BODY_HASH`: SHA256 hash of request body (empty string for GET requests)

### Replay Protection
- Timestamp must be within 5 minutes of server time
- Nonce must be unique (checked against `edge_nonces` table)
- Nonces are stored for 10 minutes, then cleaned up

## Endpoints

### 1. Heartbeat
**Endpoint**: `POST /api/v1/edges/heartbeat`

**Authentication**: None (public endpoint, rate-limited)

**Request Body**:
```json
{
  "version": "1.0.0",
  "online": true,
  "system_info": {
    "hostname": "edge-server-01",
    "os": "Windows",
    "os_version": "10",
    "cpu_count": 4,
    "cpu_percent": 45.2,
    "memory_total": 8589934592,
    "memory_used": 4294967296,
    "memory_percent": 50.0,
    "internal_ip": "192.168.1.100",
    "public_ip": null
  },
  "cameras_status": [
    {
      "camera_id": "cam-001",
      "status": "online",
      "fps": 30
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "status": "ok",
  "edge_server_id": 1,
  "last_seen_at": "2026-01-16T20:00:00Z"
}
```

**Error Responses**:
- `400`: Invalid request data
- `404`: Edge server not found (by edge_key in system_info or edge_id)
- `429`: Rate limit exceeded

---

### 2. Send Event
**Endpoint**: `POST /api/v1/edges/events`

**Authentication**: HMAC-SHA256 (required)

**Request Headers**:
```
X-EDGE-KEY: edge_xxx...
X-EDGE-TIMESTAMP: 1705449600
X-EDGE-SIGNATURE: abc123...
X-EDGE-NONCE: uuid-here
Content-Type: application/json
```

**Request Body**:
```json
{
  "event_type": "people_detected",
  "severity": "info",
  "occurred_at": "2026-01-16T20:00:00Z",
  "camera_id": "cam-001",
  "meta": {
    "module": "people_counter",
    "count": 5,
    "gender": "male",
    "confidence": 0.95,
    "risk_score": 20
  }
}
```

**Response** (200 OK):
```json
{
  "ok": true,
  "event_id": 12345,
  "evaluated": false,
  "alert_generated": false
}
```

**Enterprise Monitoring Response** (if module is market/factory):
```json
{
  "ok": true,
  "evaluated": true,
  "alert_generated": true,
  "event_id": 12345
}
```

**Error Responses**:
- `401`: Authentication failed (missing/invalid headers, signature mismatch, timestamp out of range, nonce reused)
- `403`: Module not enabled for organization
- `422`: Validation error (missing required fields)
- `500`: Server error

---

### 3. Get Cameras
**Endpoint**: `GET /api/v1/edges/cameras`

**Authentication**: HMAC-SHA256 (required)

**Request Headers**:
```
X-EDGE-KEY: edge_xxx...
X-EDGE-TIMESTAMP: 1705449600
X-EDGE-SIGNATURE: abc123...
X-EDGE-NONCE: uuid-here
```

**Response** (200 OK):
```json
{
  "cameras": [
    {
      "id": 1,
      "camera_id": "cam-001",
      "name": "Main Entrance",
      "rtsp_url": "rtsp://192.168.1.10:554/stream",
      "location": "Entrance",
      "status": "online",
      "config": {
        "fps": 30,
        "resolution": "1920x1080"
      },
      "enabled_modules": ["people_counter", "face_recognition"]
    }
  ]
}
```

**Error Responses**:
- `401`: Authentication failed
- `500`: Server error

---

## Error Codes

### Authentication Errors (401)
- `authentication_required`: Missing required headers
- `nonce_required`: Missing X-EDGE-NONCE header
- `invalid_credentials`: Edge server not found
- `configuration_error`: Edge server has no secret
- `timestamp_invalid`: Timestamp out of range (>5 minutes)
- `nonce_reused`: Nonce already used (replay attack)
- `invalid_signature`: Signature mismatch

### Business Logic Errors
- `module_disabled` (403): Module not enabled for organization
- `validation_error` (422): Invalid request data

## Rate Limiting
- Heartbeat: 100 requests per minute
- Events: 100 requests per minute
- Cameras: 100 requests per minute

## Timeout
- Local Server timeout: 30 seconds
- Cloud API timeout: 60 seconds (default Laravel)

## Retry Logic
Local Server should:
- Retry on network errors (timeout, connection refused)
- NOT retry on 401/403 errors (authentication/authorization failures)
- Use exponential backoff for retries (1s, 2s, 4s, 8s)
- Maximum 3 retries

## Security Notes
1. **edge_secret** is encrypted in database using Laravel's Crypt
2. **edge_secret** is NEVER exposed in API responses
3. Nonces prevent replay attacks
4. Timestamp validation prevents old/future requests
5. HMAC signature ensures request integrity
