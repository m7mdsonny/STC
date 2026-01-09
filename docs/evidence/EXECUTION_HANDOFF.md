# Runtime Execution Handoff

Runtime execution of the evidence harness is not possible in the current environment because application services (Laravel API, database, edge server) are not provisioned and required dependencies are unavailable. The following steps allow a reviewer to run the required checks on a prepared environment.

## Prerequisites
- Laravel application dependencies installed (`composer install`, `.env` configured, key generated).
- Database available and migrations seeded (`php artisan migrate:fresh --seed`).
- Edge server running with valid HMAC secrets.
- HTTPS termination available (self-signed or trusted cert).
- `docs/evidence/runtime_checks.sh` present and executable.

## Environment Variables
Set the following before running the harness:

```bash
export BASE_URL="https://localhost"
export HTTP_BASE_URL="http://localhost"
export LICENSE_PATH="/api/license/validate"
export STATUS_PATH="/api/status"
export ANALYTICS_PATH="/api/analytics"
export ORG_ID="<org_id>"
export EDGE_KEY="<edge_key>"
export EDGE_SECRET="<edge_secret>"
```

## HTTPS Enforcement Proof
```bash
# Expect 403/redirect when using HTTP
curl -ik "$HTTP_BASE_URL$STATUS_PATH"

# Expect 200 over HTTPS
curl -ik "$BASE_URL$STATUS_PATH"
```
Collect application logs showing the HTTPS middleware rejection for the HTTP request and success for HTTPS.

## License Validation Proof
```bash
# Unsigned request should be 401/403
curl -ik -X POST "$BASE_URL$LICENSE_PATH" -d '{"license_key":"<key>"}' -H 'Content-Type: application/json'

# Signed request (HMAC)
TIMESTAMP=$(date +%s)
SIGNATURE=$(printf "%s\n" "$TIMESTAMP" | openssl dgst -sha256 -hmac "$EDGE_SECRET" -binary | base64)
curl -ik -X POST "$BASE_URL$LICENSE_PATH" \
  -H "X-EDGE-KEY: $EDGE_KEY" \
  -H "X-EDGE-TIMESTAMP: $TIMESTAMP" \
  -H "X-EDGE-SIGNATURE: $SIGNATURE" \
  -d '{"license_key":"<key>","organization_id":'$ORG_ID'}' \
  -H 'Content-Type: application/json'
```
Use a key from another organization to confirm rejection (expect 403) and capture logs.

## Analytics Before/After Proof
```bash
# Baseline (expect zeros when no data)
curl -ik "$BASE_URL$ANALYTICS_PATH?organization_id=$ORG_ID"

# Insert sample data
php artisan tinker --execute "\\App\\Models\\Camera::factory()->create(['organization_id' => $ORG_ID]);" # repeat with alerts/edges/events as needed

# After data creation (counts should increase)
curl -ik "$BASE_URL$ANALYTICS_PATH?organization_id=$ORG_ID"
```
Store both JSON responses for audit.

## Evidence Packaging
- Save all curl outputs and timestamps to `docs/evidence/runtime_checks.log`.
- Save relevant application logs demonstrating middleware and authorization decisions.
- Archive (`tar -czf evidence.tar.gz docs/evidence/runtime_checks.log storage/logs/laravel.log`).
```
