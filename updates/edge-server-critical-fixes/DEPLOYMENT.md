# Deployment Guide - Edge Server Critical Fixes

## Pre-Deployment Checklist

- [ ] Database backup completed
- [ ] Laravel application backup completed
- [ ] Git repository is up to date
- [ ] All team members notified
- [ ] Maintenance window scheduled (if needed)

---

## Step-by-Step Deployment

### Step 1: Backup

```bash
# Database backup
mysqldump -u [username] -p [database_name] > backup_$(date +%Y%m%d_%H%M%S).sql

# Application backup (if using version control, ensure latest commit)
cd /path/to/laravel
git status
git log --oneline -5
```

### Step 2: Pull Latest Code

```bash
cd /path/to/laravel
git pull origin main  # or your branch name
```

### Step 3: Install Dependencies (if needed)

```bash
composer install --no-dev --optimize-autoloader
```

### Step 4: Run Migration

```bash
# Check current migration status
php artisan migrate:status

# Run the new migration
php artisan migrate

# Verify migration succeeded
php artisan migrate:status
```

**Expected Output**:
```
2025_12_30_000001_fix_edge_server_schema .......... DONE
```

### Step 5: Clear All Caches

```bash
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear

# If using queue
php artisan queue:restart
```

### Step 6: Verify Database Schema

```bash
# Connect to database
mysql -u [username] -p [database_name]

# Check edge_servers table
DESCRIBE edge_servers;
# Should show: internal_ip, public_ip, hostname

# Check licenses table
DESCRIBE licenses;
SHOW CREATE TABLE licenses;
# Should show: edge_server_id as foreignId with foreign key constraint
```

### Step 7: Test Edge Server Heartbeat

```bash
# Test heartbeat endpoint
curl -X POST https://api.stcsolutions.online/api/v1/edges/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "edge_id": "test-edge-123",
    "version": "2.0.0",
    "online": true,
    "organization_id": 1,
    "internal_ip": "192.168.1.100",
    "public_ip": "203.0.113.1",
    "hostname": "edge-server-01"
  }'

# Expected response:
# {
#   "ok": true,
#   "edge": {
#     "id": 1,
#     "edge_id": "test-edge-123",
#     "internal_ip": "192.168.1.100",
#     "public_ip": "203.0.113.1",
#     "hostname": "edge-server-01",
#     ...
#   }
# }
```

### Step 8: Test License Validation

```bash
# Test license validation
curl -X POST https://api.stcsolutions.online/api/v1/licensing/validate \
  -H "Content-Type: application/json" \
  -d '{
    "license_key": "DEMO-CORP-2024-FULL-ACCESS",
    "edge_id": "test-edge-123"
  }'

# Expected response:
# {
#   "valid": true,
#   "organization_id": 1,
#   "license_id": 1,
#   ...
# }
```

### Step 9: Monitor Logs

```bash
# Watch Laravel logs
tail -f storage/logs/laravel.log

# Check for errors
grep -i error storage/logs/laravel.log | tail -20
```

---

## Post-Deployment Verification

### 1. Functional Tests

- [ ] Edge Server heartbeat returns HTTP 200
- [ ] Edge Server registration succeeds
- [ ] IP addresses are stored in database
- [ ] License validation works correctly
- [ ] Edge Server create/update from dashboard works
- [ ] Foreign key constraints work (try to delete organization with licenses)

### 2. Database Verification

```sql
-- Check edge_servers table structure
DESCRIBE edge_servers;

-- Check licenses table structure
DESCRIBE licenses;

-- Check foreign key constraint
SHOW CREATE TABLE licenses;

-- Verify IP addresses are being stored
SELECT id, edge_id, internal_ip, public_ip, hostname 
FROM edge_servers 
WHERE internal_ip IS NOT NULL;
```

### 3. API Endpoint Tests

```bash
# Test heartbeat
curl -X POST https://api.stcsolutions.online/api/v1/edges/heartbeat \
  -H "Content-Type: application/json" \
  -d @test_heartbeat.json

# Test license validation
curl -X POST https://api.stcsolutions.online/api/v1/licensing/validate \
  -H "Content-Type: application/json" \
  -d @test_license.json

# Test Edge Server creation (requires auth token)
curl -X POST https://api.stcsolutions.online/api/v1/edge-servers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Server",
    "internal_ip": "192.168.1.100",
    "hostname": "test-server"
  }'
```

---

## Rollback Procedure

If critical issues occur:

### Step 1: Rollback Migration

```bash
php artisan migrate:rollback --step=1
```

### Step 2: Restore Previous Code

```bash
cd /path/to/laravel
git checkout HEAD~1 app/Http/Controllers/EdgeController.php
git checkout HEAD~1 app/Http/Controllers/LicenseController.php
git checkout HEAD~1 app/Models/EdgeServer.php
```

### Step 3: Clear Caches

```bash
php artisan config:clear
php artisan route:clear
php artisan cache:clear
```

### Step 4: Restore Database (if needed)

```bash
mysql -u [username] -p [database_name] < backup_[timestamp].sql
```

---

## Troubleshooting

### Issue: Migration Fails

**Error**: `SQLSTATE[HY000]: General error: 1005 Can't create table`

**Solution**:
1. Check if `edge_servers` table exists
2. Check if `licenses` table exists
3. Verify foreign key constraint can be created
4. Check database user has ALTER privileges

### Issue: Edge Server Heartbeat Still Returns 500

**Solution**:
1. Check Laravel logs: `tail -f storage/logs/laravel.log`
2. Verify migration ran successfully
3. Check if `$edge` variable issue is fixed
4. Verify all files were updated correctly

### Issue: IP Addresses Not Stored

**Solution**:
1. Check `edge_servers` table has new columns
2. Verify EdgeServer model has `$fillable` array
3. Check request includes IP addresses
4. Verify validation rules allow IP addresses

### Issue: Foreign Key Constraint Error

**Error**: `Cannot add foreign key constraint`

**Solution**:
1. Ensure `edge_servers` table exists before `licenses` table
2. Check data types match (both should be `bigint unsigned`)
3. Verify no orphaned records in `licenses.edge_server_id`

---

## Production Deployment Notes

1. **Schedule**: Deploy during low-traffic period
2. **Monitoring**: Watch logs for 30 minutes after deployment
3. **Backup**: Keep database backup for 7 days
4. **Communication**: Notify Edge Server operators of deployment
5. **Testing**: Test with one Edge Server first before full rollout

---

## Support Contacts

- **Technical Lead**: [Contact Info]
- **Database Admin**: [Contact Info]
- **DevOps**: [Contact Info]

---

## Version

- **Deployment Date**: [Date]
- **Version**: 1.0.0
- **Status**: ✅ Production Ready
