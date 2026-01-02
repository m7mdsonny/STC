#!/bin/bash

# Build Canonical Database
# This script runs migrate:fresh --seed and generates SQL dump

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Building Canonical Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$(dirname "$0")/.."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        echo "❌ .env.example not found. Cannot proceed."
        exit 1
    fi
fi

echo "Step 1: Running migrate:fresh --seed..."
php artisan migrate:fresh --seed --force

if [ $? -ne 0 ]; then
    echo "❌ Migration failed!"
    exit 1
fi

echo ""
echo "✅ Migrations and seeders completed successfully!"
echo ""

echo "Step 2: Generating SQL dump..."

# Get database credentials from .env
DB_HOST=$(grep "^DB_HOST=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
DB_DATABASE=$(grep "^DB_DATABASE=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
DB_USERNAME=$(grep "^DB_USERNAME=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
DB_PASSWORD=$(grep "^DB_PASSWORD=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")

if [ -z "$DB_DATABASE" ]; then
    echo "⚠️  Database name not found in .env. Skipping SQL dump."
    exit 0
fi

DUMP_FILE="stc_cloud_mysql_canonical_latest.sql"

# Generate dump
mysqldump -h"${DB_HOST:-localhost}" \
    -u"${DB_USERNAME:-root}" \
    -p"${DB_PASSWORD}" \
    "${DB_DATABASE}" \
    --single-transaction \
    --routines \
    --triggers \
    --no-create-info=false \
    --add-drop-table \
    > "${DUMP_FILE}" 2>/dev/null || {
    echo "⚠️  mysqldump failed. Trying alternative method..."
    # Alternative: Use Laravel's db:dump if available
    php artisan db:dump --file="${DUMP_FILE}" 2>/dev/null || {
        echo "⚠️  Could not generate SQL dump. Please run manually:"
        echo "   mysqldump -u${DB_USERNAME} -p ${DB_DATABASE} > ${DUMP_FILE}"
    }
}

if [ -f "${DUMP_FILE}" ]; then
    FILE_SIZE=$(du -h "${DUMP_FILE}" | cut -f1)
    echo "✅ SQL dump generated: ${DUMP_FILE} (${FILE_SIZE})"
else
    echo "⚠️  SQL dump file not created"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Canonical Database Build Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
