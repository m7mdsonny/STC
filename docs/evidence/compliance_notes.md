# Compliance Notes

## Biometric Data Compliance

### Status: ✅ COMPLIANT

**What was removed:**
- `face_encoding` column from `registered_faces` table
- `plate_encoding` column from `registered_vehicles` table

**What remains (compliant):**
- Face recognition module uses temporary encodings for runtime matching only
- No biometric vectors are stored in the database
- Person tracking uses anonymous track IDs
- Only behavioral events and metadata are persisted

**Compliance Statement:**
The system does NOT store biometric identifiers or raw biometric vectors. Face recognition and vehicle recognition modules process data in real-time and discard encodings after matching. No biometric data is persisted to disk or database.

---

## Edge Secrets Security Compliance

### Status: ✅ COMPLIANT

**What was fixed:**
1. Heartbeat endpoint returns `edge_secret` only once during initial registration
2. Secrets are encrypted at rest using machine-specific key derivation
3. Secrets never appear in logs or plaintext files

**Security Measures:**
- Encryption: Fernet symmetric encryption with PBKDF2 key derivation
- Storage: Encrypted binary file (`edge_credentials.enc`)
- Access: File permissions restricted to owner (600)
- Delivery: One-time secret delivery tracked via `secret_delivered_at` timestamp

**Compliance Statement:**
Edge server secrets are encrypted at rest and delivered only once. Subsequent heartbeats do not expose secrets. All secret operations are logged for audit purposes without exposing secret values.

---

## Database Schema Compliance

### Status: ✅ COMPLIANT

**What was verified:**
- All tables have migrations
- All foreign keys properly defined
- All indexes added for performance
- All seeders functional and complete

**Canonical Database:**
- Full SQL dump available: `stc_cloud_mysql_complete_latest.sql`
- All migrations idempotent
- All seeders check for existing data
- No orphaned or inconsistent records

**Compliance Statement:**
The database schema is complete, consistent, and reproducible. All migrations are idempotent and safe to run multiple times. The canonical database dump represents the production-ready state.

---

**Last Updated**: 2025-01-28
