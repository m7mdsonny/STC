#!/bin/bash

# AI Modules Schema Fix - Script التطبيق التلقائي
# هذا السكريبت يطبق جميع التحديثات تلقائياً

set -e  # إيقاف عند أي خطأ

# الألوان للرسائل
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# المسار الأساسي للسيرفر
SERVER_PATH="/www/wwwroot/api.stcsolutions.online/apps/cloud-laravel"
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AI Modules Schema Fix - التطبيق${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# التحقق من وجود المسار
if [ ! -d "$SERVER_PATH" ]; then
    echo -e "${RED}❌ المسار غير موجود: $SERVER_PATH${NC}"
    echo "يرجى تعديل SERVER_PATH في السكريبت"
    exit 1
fi

echo -e "${YELLOW}📁 نسخ الملفات...${NC}"

# نسخ Models
echo "  → نسخ AiModule.php"
cp "$CURRENT_DIR/AiModule.php" "$SERVER_PATH/app/Models/AiModule.php"

# نسخ Seeders
echo "  → نسخ AiModuleSeeder.php"
cp "$CURRENT_DIR/AiModuleSeeder.php" "$SERVER_PATH/database/seeders/AiModuleSeeder.php"

echo "  → نسخ DatabaseSeeder.php"
cp "$CURRENT_DIR/DatabaseSeeder.php" "$SERVER_PATH/database/seeders/DatabaseSeeder.php"

# نسخ Controllers
echo "  → نسخ FreeTrialRequestController.php"
cp "$CURRENT_DIR/FreeTrialRequestController.php" "$SERVER_PATH/app/Http/Controllers/FreeTrialRequestController.php"

echo "  → نسخ AiModuleController.php"
cp "$CURRENT_DIR/AiModuleController.php" "$SERVER_PATH/app/Http/Controllers/AiModuleController.php"

# نسخ Migrations
echo "  → نسخ Migrations"
cp "$CURRENT_DIR/2025_01_28_000014_fix_ai_modules_table_schema.php" "$SERVER_PATH/database/migrations/"
cp "$CURRENT_DIR/2025_01_28_000015_fix_ai_modules_table_columns.php" "$SERVER_PATH/database/migrations/"

echo -e "${GREEN}✅ تم نسخ جميع الملفات${NC}"
echo ""

# الانتقال لمجلد Laravel
cd "$SERVER_PATH"

# تشغيل Migrations
echo -e "${YELLOW}🔄 تشغيل Migrations...${NC}"
php artisan migrate --force

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ تم تشغيل Migrations بنجاح${NC}"
else
    echo -e "${RED}❌ فشل تشغيل Migrations${NC}"
    exit 1
fi

echo ""

# تشغيل Seeders
echo -e "${YELLOW}🌱 تشغيل Seeders...${NC}"
php artisan db:seed --class=AiModuleSeeder --force

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ تم تشغيل Seeders بنجاح${NC}"
else
    echo -e "${RED}❌ فشل تشغيل Seeders${NC}"
    exit 1
fi

echo ""

# تنظيف Cache
echo -e "${YELLOW}🧹 تنظيف Cache...${NC}"
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

echo -e "${GREEN}✅ تم تنظيف Cache${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ تم تطبيق جميع التحديثات بنجاح!${NC}"
echo -e "${GREEN}========================================${NC}"
