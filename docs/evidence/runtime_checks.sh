#!/usr/bin/env bash
set -euo pipefail

# This script exercises HTTPS enforcement and license validation. It expects the
# Laravel app to be running locally (or remotely) and seeded data with at least
# one edge server and license belonging to the same organization.

BASE_URL=${BASE_URL:-"https://127.0.0.1:8443"}
PING_PATH=${PING_PATH:-"/api/v1/ping"}
LICENSE_PATH=${LICENSE_PATH:-"/api/license/validate"}

OUTPUT_DIR="$(cd -- "$(dirname "$0")" && pwd)"
HTTP_LOG="$OUTPUT_DIR/http_enforcement.log"
LICENSE_LOG="$OUTPUT_DIR/license_validation.log"

: > "$HTTP_LOG"
: > "$LICENSE_LOG"

echo "[HTTP->HTTPS] plain HTTP request should be rejected" | tee -a "$HTTP_LOG"
curl -vk "${BASE_URL/https:\/\//http://}${PING_PATH}" -o /tmp/http_response.txt -w "\nstatus:%{http_code}\n" 2>>"$HTTP_LOG" | tee -a "$HTTP_LOG"

printf "\n[HTTPS] request should succeed" | tee -a "$HTTP_LOG"
curl -sk "${BASE_URL}${PING_PATH}" -o /tmp/https_response.txt -w "\nstatus:%{http_code}\n" 2>>"$HTTP_LOG" | tee -a "$HTTP_LOG"

# HMAC-signed license validation
EDGE_KEY=${EDGE_KEY:-""}
EDGE_SECRET=${EDGE_SECRET:-""}
LICENSE_KEY=${LICENSE_KEY:-""}
TIMESTAMP=$(date +%s)
BODY="license_key=$LICENSE_KEY&edge_id=edge-1"
SIGNATURE_STRING="POST|api/license/validate|$TIMESTAMP|$(printf "%s" "$BODY" | sha256sum | cut -d' ' -f1)"
SIGNATURE=$(printf "%s" "$SIGNATURE_STRING" | openssl dgst -sha256 -hmac "$EDGE_SECRET" -binary | openssl base64 -A)

if [[ -z "$EDGE_KEY" || -z "$EDGE_SECRET" || -z "$LICENSE_KEY" ]]; then
  echo "[license] Missing EDGE_KEY/EDGE_SECRET/LICENSE_KEY env vars; skipping signed request" | tee -a "$LICENSE_LOG"
else
  echo "\n[license] signed request (expected 200)" | tee -a "$LICENSE_LOG"
  curl -sk -X POST "${BASE_URL}${LICENSE_PATH}" \
    -H "X-EDGE-KEY: $EDGE_KEY" \
    -H "X-EDGE-TIMESTAMP: $TIMESTAMP" \
    -H "X-EDGE-SIGNATURE: $SIGNATURE" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data "$BODY" \
    -w "\nstatus:%{http_code}\n" | tee -a "$LICENSE_LOG"

  echo "\n[license] unsigned request (expected 401)" | tee -a "$LICENSE_LOG"
  curl -sk -X POST "${BASE_URL}${LICENSE_PATH}" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data "$BODY" \
    -w "\nstatus:%{http_code}\n" | tee -a "$LICENSE_LOG"
fi
