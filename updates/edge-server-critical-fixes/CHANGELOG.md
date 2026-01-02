# Changelog - Edge Server Critical Fixes

## [1.0.0] - 2025-12-30

### Fixed

#### Critical Bug Fixes

1. **HTTP 500 in Heartbeat** (#1)
   - Fixed undefined variable `$edge` used before creation
   - Moved license linking logic after edge server creation
   - Added defensive error handling
   - **Impact**: Edge Servers can now successfully register and send heartbeats

2. **IP Address Storage** (#2)
   - Added `internal_ip`, `public_ip`, `hostname` columns to `edge_servers` table
   - Updated EdgeServer model to handle IP addresses
   - Extract IP from `system_info` if not provided directly
   - **Impact**: Cloud can now track Edge Server network locations

3. **Edge Server Create/Update** (#3)
   - Added `$fillable` array to EdgeServer model
   - Fixed mass assignment protection
   - **Impact**: Edge Servers can be created/updated from dashboard

4. **License-Organization Enforcement** (#4)
   - Added organization existence check in license validation
   - Enhanced license-organization relationship validation
   - **Impact**: Multi-tenant isolation is now properly enforced

5. **Database Schema** (#5)
   - Fixed `licenses.edge_server_id` from `string` to `foreignId`
   - Added proper foreign key constraint
   - **Impact**: Database integrity is maintained

6. **Error Handling** (#6)
   - Enhanced error logging with request context
   - Added debug mode check
   - Improved exception handling
   - **Impact**: Easier debugging and troubleshooting

### Changed

- `EdgeController::heartbeat()` - Complete refactor of license linking logic
- `EdgeController::store()` - Added IP address validation and storage
- `EdgeController::update()` - Added IP address validation and storage
- `LicenseController::validateKey()` - Added organization existence check
- `EdgeServer` model - Added `$fillable` array and IP address fields

### Added

- Migration: `2025_12_30_000001_fix_edge_server_schema.php`
  - Fixes `licenses.edge_server_id` foreign key
  - Adds `internal_ip`, `public_ip`, `hostname` to `edge_servers`

### Security

- Enhanced license-organization relationship validation
- Proper foreign key constraints for data integrity

---

## Migration Guide

### From Previous Version

1. **Run Migration**:
   ```bash
   php artisan migrate
   ```

2. **Clear Caches**:
   ```bash
   php artisan config:clear
   php artisan route:clear
   php artisan cache:clear
   ```

3. **Verify**:
   - Check `edge_servers` table has new columns
   - Check `licenses.edge_server_id` is now a foreign key
   - Test Edge Server heartbeat

### Database Changes

**New Columns in `edge_servers`**:
- `internal_ip` (string, nullable)
- `public_ip` (string, nullable)
- `hostname` (string, nullable)

**Changed Column in `licenses`**:
- `edge_server_id`: Changed from `string` to `foreignId` with foreign key constraint

---

## Known Issues

None at this time.

---

## Contributors

- STC AI-VAP Development Team
