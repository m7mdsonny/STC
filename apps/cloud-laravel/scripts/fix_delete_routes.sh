#!/bin/bash

# Script to fix DELETE routes and clear all caches
# Run this on the server after deploying updates

set -e

echo "🔧 Fixing DELETE routes and clearing all Laravel caches..."
echo ""

cd "$(dirname "$0")/.." || exit 1

# Check if we're in the right directory
if [ ! -f "artisan" ]; then
    echo "❌ Error: artisan file not found. Make sure you're in the Laravel root directory."
    exit 1
fi

# Clear all caches
echo "📦 Step 1: Clearing all Laravel caches..."
php artisan route:clear
php artisan cache:clear
php artisan config:clear
php artisan view:clear
php artisan event:clear
php artisan optimize:clear

echo "✅ All caches cleared"
echo ""

# Rebuild caches
echo "🔨 Step 2: Rebuilding route and config caches..."
php artisan route:cache
php artisan config:cache

echo "✅ Caches rebuilt"
echo ""

# Verify DELETE routes
echo "✅ Step 3: Verifying DELETE routes are registered..."
echo ""
echo "DELETE routes found:"
php artisan route:list --method=DELETE | grep -E "(DELETE|users|organizations|licenses|cameras|edge-servers)" || echo "⚠️  No DELETE routes found in output"

echo ""
echo "✨ Done! Next steps:"
echo ""
echo "1. Restart PHP-FPM:"
echo "   sudo systemctl restart php8.2-fpm"
echo "   (or: sudo systemctl restart php-fpm)"
echo ""
echo "2. Restart Nginx:"
echo "   sudo systemctl restart nginx"
echo ""
echo "3. Test a DELETE request:"
echo "   curl -X DELETE https://api.stcsolutions.online/api/v1/users/7 -H 'Authorization: Bearer YOUR_TOKEN'"
echo ""
