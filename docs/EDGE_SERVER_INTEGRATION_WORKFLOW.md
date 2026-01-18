# Edge Server Integration Workflow - Correct Architecture

## Overview

This document describes the **correct** workflow for adding and integrating Edge Servers with the Cloud platform. The system uses **API + License Key authentication**, not IP addresses.

---

## Architecture Principle

**Cloud NEVER initiates connections to Edge.**
**Edge ALWAYS initiates outbound connections to Cloud.**

Edge Servers are typically behind NAT, have no public IP, and cannot accept inbound connections. The correct integration relies on:

1. **License Key** - Links Edge Server to Organization
2. **API Endpoint** - Cloud API URL configured in Edge Server
3. **Heartbeat Registration** - Edge Server registers itself via heartbeat
4. **HMAC Authentication** - Edge Server authenticates using edge_key + edge_secret

---

## ✅ Correct Workflow

### Step 1: Create Edge Server Record in Cloud (Organization Settings)

**Location**: Settings → Servers → Add Server

**Required Fields**:
- **Server Name** (required) - e.g., "Main Branch Server"
- **Location** (optional) - e.g., "Building A - Floor 1"
- **License Key** (optional) - Link to existing license

**NOT Required**:
- ❌ **IP Address** - NOT needed (removed from form)
- ❌ **Port** - NOT needed
- ❌ **Hostname** - NOT needed

**What Happens**:
1. Cloud creates Edge Server record in database
2. Cloud generates `edge_key` and `edge_secret`
3. Edge Server record is created with `online: false`
4. License is linked to Edge Server (if provided)

**Edge Key & Secret**:
- `edge_key`: Unique identifier (e.g., `edge_abc123...`)
- `edge_secret`: Secret for HMAC authentication (encrypted in database)
- Returned **once** in API response during creation

---

### Step 2: Configure Edge Server

**On Edge Server Side**:

1. **Configure Cloud API URL**:
   - Go to Edge Server setup page: `http://localhost:8080/setup`
   - Enter Cloud API URL: `https://api.example.com`
   - Enter License Key: (the key from Step 1, if license was linked)

2. **Edge Server Validates License**:
   - Edge calls: `POST /api/v1/licensing/validate`
   - Cloud returns license data including `organization_id`

3. **Edge Server Sends Initial Heartbeat**:
   - Edge calls: `POST /api/v1/edges/heartbeat`
   - Payload includes:
     ```json
     {
       "edge_id": "uuid-from-edge",
       "version": "2.0.0",
       "online": true,
       "organization_id": 1,
       "license_id": 123,
       "system_info": {...}
     }
     ```

4. **Cloud Registers Edge Server**:
   - Cloud matches heartbeat by `license_id` or `organization_id`
   - Cloud returns `edge_key` and `edge_secret` in response
   - Edge Server stores credentials for HMAC signing

5. **Subsequent Heartbeats**:
   - Edge uses HMAC authentication
   - Cloud updates `last_seen_at` timestamp
   - Edge status determined by: `(now - last_seen_at) < 5 minutes`

---

## ❌ What NOT to Do

### ❌ Do NOT:
- Request IP address from user
- Try to connect Cloud → Edge directly
- Use IP address for connection testing
- Require port forwarding or public IP

### ❌ Old (Broken) Workflow:
```
1. User enters Edge Server IP in Cloud
2. Cloud tries: POST https://192.168.1.100:8080/api/v1/status
3. ❌ FAILS: Edge is behind NAT, no public IP
4. ❌ ERR_SSL_PROTOCOL_ERROR
5. ❌ "Edge Offline" incorrectly shown
```

### ✅ New (Correct) Workflow:
```
1. User creates Edge Server record in Cloud (no IP needed)
2. Edge Server configured with Cloud API URL + License Key
3. Edge calls Cloud: POST /api/v1/edges/heartbeat
4. Cloud registers Edge, returns edge_key + edge_secret
5. Edge status = (last_seen_at < 5 minutes ago)
```

---

## Integration Status Check

### How to Check if Edge Server is Connected:

**Via Cloud API**:
```bash
GET /api/v1/edge-servers/{id}/status
```

**Response**:
```json
{
  "online": true,
  "last_seen_at": "2025-01-18T10:30:00Z",
  "version": "2.0.0",
  "cameras_count": 5,
  "organization_id": 1,
  "license": {
    "plan": "pro",
    "max_cameras": 16,
    "modules": ["face", "counter", "fire"]
  }
}
```

**Online Status Logic**:
```php
$isOnline = $lastSeenAt && now()->diffInMinutes($lastSeenAt) < 5;
```

---

## Camera Integration

### How Cameras are Synced:

1. **Cloud → Database**:
   - User creates camera in Cloud dashboard
   - Camera record stored with `edge_server_id`

2. **Edge Polls for Cameras**:
   - Edge calls: `GET /api/v1/edges/cameras` (HMAC authenticated)
   - Cloud returns cameras for this Edge Server

3. **Edge Configures Cameras**:
   - Edge receives camera config
   - Edge starts processing camera streams
   - Edge runs AI modules on camera frames

4. **Camera Status Updates**:
   - Edge sends camera status in heartbeat
   - Cloud updates camera `status` field

**Flow**:
```
Cloud Dashboard → Camera Created → Database
                                      ↓
Edge Server ← Heartbeat Response ← Cloud API
  (receives camera config)
      ↓
Edge Processes Camera → AI Events → Cloud API
```

---

## AI Module Integration

### Event Flow:

1. **Edge AI Processing**:
   - Camera frames processed by AI modules
   - Events generated (e.g., fire detection, intrusion)

2. **Edge → Cloud Event Ingestion**:
   - Edge calls: `POST /api/v1/edges/events` (HMAC)
   - Event includes: `event_type`, `ai_module`, `severity`, `meta`

3. **Cloud Processing**:
   - Event stored in `events` table
   - `ai_module` and `risk_score` extracted
   - Notifications triggered (if severity = critical/warning)

4. **Analytics & Dashboards**:
   - Events aggregated by module
   - Real-time metrics displayed
   - Reports generated

**Flow**:
```
Camera → Edge AI → Event Generated → POST /api/v1/edges/events → Cloud
                                                                    ↓
                                                        Event Stored + Notifications
                                                                    ↓
                                                        Analytics + Dashboards
```

---

## Notifications

### Mobile Push Notifications:

**Triggered When**:
- Event severity = `critical` or `warning`
- Any AI module generates alert

**Delivery**:
- FCM push notification to organization users
- Notification includes: module name, severity, camera_id, risk_score

**Data Flow**:
```
AI Event → Cloud EventController → FcmService → Mobile Device
```

---

## Troubleshooting

### Edge Server Not Showing as Online

**Check**:
1. Edge Server is running
2. License Key configured correctly in Edge
3. Cloud API URL configured correctly
4. Edge is sending heartbeat (check Edge logs)
5. Cloud API is accessible from Edge network

**Debug Steps**:
```bash
# Check Cloud API accessibility from Edge
curl -X POST https://api.example.com/api/v1/edges/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"edge_id":"test","version":"2.0.0","online":true,"organization_id":1}'

# Check Edge logs
tail -f /path/to/edge/logs/edge.log

# Check Cloud database
SELECT id, name, edge_id, last_seen_at, online 
FROM edge_servers 
WHERE organization_id = 1;
```

### Cameras Not Appearing

**Check**:
1. Camera created in Cloud dashboard
2. Camera linked to correct Edge Server
3. Edge Server polls for cameras (check heartbeat)
4. Edge has camera config in local storage

**Debug**:
```bash
# Check cameras in database
SELECT id, name, edge_server_id, status 
FROM cameras 
WHERE edge_server_id = {edge_server_id};

# Check Edge camera sync logs
# (in Edge Server logs)
```

### Events Not Reaching Cloud

**Check**:
1. Edge AI modules are enabled
2. Edge is processing frames
3. Events being generated (check Edge logs)
4. Edge can reach Cloud API
5. HMAC authentication working

**Debug**:
```bash
# Check events in database
SELECT id, event_type, ai_module, occurred_at 
FROM events 
WHERE edge_server_id = {edge_server_id} 
ORDER BY occurred_at DESC 
LIMIT 10;

# Check Edge event sender logs
```

---

## Security Considerations

1. **HMAC Authentication**:
   - Edge uses `edge_key` + `edge_secret` for signing
   - Secret only returned once during registration
   - Secret encrypted in database

2. **License Validation**:
   - License Key validates Edge → Organization link
   - License checked on every heartbeat

3. **No Public IPs**:
   - Edge Servers remain behind NAT
   - No inbound ports exposed
   - All connections outbound-only

---

## API Endpoints Summary

### Edge → Cloud (Outbound Only)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/licensing/validate` | POST | None | Validate license key |
| `/api/v1/edges/heartbeat` | POST | None/HMAC | Register + status update |
| `/api/v1/edges/events` | POST | HMAC | Send AI events |
| `/api/v1/edges/cameras` | GET | HMAC | Get camera config |

### Cloud → Frontend (API)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/edge-servers` | GET | Sanctum | List servers |
| `/api/v1/edge-servers/{id}/status` | GET | Sanctum | Get server status |
| `/api/v1/edge-servers/{id}/cameras` | GET | Sanctum | Get cameras |
| `/api/v1/edge-servers` | POST | Sanctum | Create server (no IP needed) |

---

## Summary

✅ **Correct Integration**:
- Cloud creates Edge Server record (no IP needed)
- Edge configures Cloud API URL + License Key
- Edge registers via heartbeat
- All communication Edge → Cloud (outbound)

❌ **Incorrect Integration**:
- Requesting IP address from user
- Cloud trying to connect to Edge directly
- Requiring public IP or port forwarding

**Result**: Production-ready, NAT-compatible Edge Server integration.
