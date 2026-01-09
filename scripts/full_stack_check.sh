#!/usr/bin/env bash
set -euo pipefail

# Quick smoke test to keep cloud + edge deliverables consistent.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

printf "\n[1/3] Verifying Python sources (edge) compile...\n"
python -m compileall apps/edge-server

printf "\n[2/3] Checking required artifacts...\n"
for path in apps/cloud-laravel/database/schema.sql docs/END_TO_END_CHECKLIST.md apps/cloud-laravel/.env.example apps/edge-server/.env.example; do
  if [[ ! -f "$path" ]]; then
    echo "Missing required file: $path" >&2
    exit 1
  fi
done

echo "All required artifacts present."

printf "\n[3/3] Reminder for UI checks: run 'npm run build' in apps/cloud-laravel (frontend) and 'flutter test' in apps/mobile-app' when toolchains are available.\n"

echo "\nSmoke check finished successfully."
