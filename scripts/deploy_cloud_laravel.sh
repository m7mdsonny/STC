#!/bin/bash

# ============================================
# STC AI-VAP Cloud Laravel Deployment Script
# ============================================
# This script deploys the latest code changes to the production server
# Usage: ./deploy_cloud_laravel.sh

set -e  # Exit on any error

echo "============================================"
echo "STC AI-VAP Cloud Laravel Deployment"
echo "============================================"
echo ""

# Configuration
PROJECT_PATH="/www/wwwroot/api.stcsolutions.online"
LARAVEL_PATH="$PROJECT_PATH/apps/cloud-laravel"
BRANCH="master"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${NC}→ $1"
}

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then 
    print_warning "Running as root. This is not recommended for production."
fi

# Step 1: Navigate to project directory
print_info "Step 1: Navigating to project directory..."
if [ ! -d "$LARAVEL_PATH" ]; then
    print_error "Laravel directory not found: $LARAVEL_PATH"
    exit 1
fi

cd "$LARAVEL_PATH"
print_success "Current directory: $(pwd)"

# Step 2: Check git status
print_info "Step 2: Checking git status..."
if ! git status &>/dev/null; then
    print_error "Not a git repository or git not available"
    exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
print_info "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    print_warning "Not on $BRANCH branch. Switching..."
    git checkout "$BRANCH"
fi

# Step 3: Pull latest changes
print_info "Step 3: Pulling latest changes from $BRANCH..."
if git pull origin "$BRANCH"; then
    print_success "Code updated successfully"
else
    print_error "Failed to pull latest changes"
    exit 1
fi

# Step 4: Install/Update dependencies
print_info "Step 4: Installing/updating Composer dependencies..."
if command -v composer &> /dev/null; then
    composer install --no-dev --optimize-autoloader --no-interaction
    print_success "Dependencies updated"
else
    print_error "Composer not found. Please install Composer first."
    exit 1
fi

# Step 5: Run migrations (if any)
print_info "Step 5: Checking for database migrations..."
if php artisan migrate:status &>/dev/null; then
    print_info "Running migrations..."
    php artisan migrate --force --no-interaction
    print_success "Migrations completed"
else
    print_warning "Could not check migration status. Skipping migrations."
fi

# Step 6: Clear all caches
print_info "Step 6: Clearing all caches..."
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear
print_success "All caches cleared"

# Step 7: Optimize for production
print_info "Step 7: Optimizing for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
print_success "Optimization completed"

# Step 8: Set proper permissions
print_info "Step 8: Setting proper permissions..."
if [ -w "storage" ] && [ -w "bootstrap/cache" ]; then
    chmod -R 775 storage bootstrap/cache
    print_success "Permissions set"
else
    print_warning "Could not set permissions. You may need to run: sudo chmod -R 775 storage bootstrap/cache"
fi

# Step 9: Restart PHP-FPM (if available)
print_info "Step 9: Restarting PHP-FPM..."
if command -v systemctl &> /dev/null; then
    # Try to find PHP-FPM service
    if systemctl list-units --type=service | grep -q "php.*fpm"; then
        PHP_FPM_SERVICE=$(systemctl list-units --type=service | grep "php.*fpm" | head -1 | awk '{print $1}')
        if [ -n "$PHP_FPM_SERVICE" ]; then
            sudo systemctl reload "$PHP_FPM_SERVICE" 2>/dev/null || print_warning "Could not reload PHP-FPM. You may need to restart manually."
            print_success "PHP-FPM reloaded"
        fi
    else
        print_warning "PHP-FPM service not found. Skipping restart."
    fi
else
    print_warning "systemctl not available. Please restart PHP-FPM manually if needed."
fi

# Step 10: Verify deployment
print_info "Step 10: Verifying deployment..."
if php artisan --version &>/dev/null; then
    ARTISAN_VERSION=$(php artisan --version)
    print_success "Laravel is working: $ARTISAN_VERSION"
else
    print_error "Laravel verification failed"
    exit 1
fi

# Summary
echo ""
echo "============================================"
print_success "Deployment completed successfully!"
echo "============================================"
echo ""
print_info "Next steps:"
echo "  1. Check application logs: tail -f storage/logs/laravel.log"
echo "  2. Test API endpoints"
echo "  3. Monitor for any errors"
echo ""
