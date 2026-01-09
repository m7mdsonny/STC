# دليل التنصيب الشامل - STC AI-VAP Platform

## 📋 نظرة عامة

هذا الدليل يشرح كيفية تنصيب جميع مكونات منصة STC AI-VAP على السيرفر.

### المكونات:
1. **Cloud API** (Laravel) - `/www/wwwroot/api.stcsolutions.online`
2. **Web Portal** (React) - `/www/wwwroot/stcsolutions.online`
3. **Edge Server** (Python) - سيرفر محلي
4. **Mobile App** (Flutter) - تطبيق الهاتف

---

## 🔧 المتطلبات الأساسية

### على السيرفر:
- PHP 8.3+ مع PHP-FPM
- Composer
- Node.js 18+ و npm
- Nginx أو Apache
- MySQL 8.0+ أو MariaDB 10.3+
- SSL Certificate (Let's Encrypt)

### للسيرفر المحلي (Edge):
- Python 3.10+
- pip
- OpenCV
- FFmpeg

### للتطبيق:
- Flutter 3.16+
- Android Studio / Xcode
- Firebase Account

---

## 1️⃣ تنصيب Cloud API (Laravel)

### المسار: `/www/wwwroot/api.stcsolutions.online`

```bash
# 1. الانتقال للمسار
cd /www/wwwroot/api.stcsolutions.online

# 2. استنساخ المشروع (إذا لم يكن موجوداً)
git clone https://github.com/m7mdsonny/STC.git .
# أو إذا كان موجوداً:
git pull origin main

# 3. الانتقال لمجلد Cloud
cd apps/cloud-laravel

# 4. تثبيت Dependencies
composer install --no-dev --optimize-autoloader

# 5. إعداد ملف البيئة
cp .env.example .env
nano .env  # أو استخدم محرر آخر
```

### إعدادات `.env` المهمة:

```env
APP_NAME="STC AI-VAP"
APP_ENV=production
APP_KEY=  # سيتم توليده تلقائياً
APP_DEBUG=false
APP_URL=https://api.stcsolutions.online

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=stc_cloud
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

# Session & Cache
SESSION_DRIVER=file
CACHE_DRIVER=file
QUEUE_CONNECTION=sync

# Mail (اختياري)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your_email@gmail.com
MAIL_FROM_NAME="${APP_NAME}"

# Firebase (للإشعارات)
FIREBASE_SERVER_KEY=your_firebase_server_key
```

### 6. توليد Application Key

```bash
php artisan key:generate
```

### 7. تشغيل Migrations

```bash
# استيراد قاعدة البيانات
mysql -u your_db_user -p stc_cloud < /path/to/stc_cloud_mysql_complete_latest.sql

# أو تشغيل Migrations
php artisan migrate --force

# تشغيل Seeders
php artisan db:seed --force
```

### 8. إعداد الصلاحيات

```bash
# Storage
php artisan storage:link
php artisan storage:link

# Permissions
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Clear cache
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

### 9. إعداد Nginx

إنشاء ملف `/etc/nginx/sites-available/api.stcsolutions.online`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.stcsolutions.online;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.stcsolutions.online;
    
    root /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/public;
    index index.php;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.stcsolutions.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.stcsolutions.online/privkey.pem;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # API Routes
    location /api {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    # Laravel
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
    
    # Logs
    access_log /var/log/nginx/api.stcsolutions.online.access.log;
    error_log /var/log/nginx/api.stcsolutions.online.error.log;
}
```

تفعيل الموقع:

```bash
ln -s /etc/nginx/sites-available/api.stcsolutions.online /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 10. إعداد Supervisor (للـ Queue - اختياري)

```bash
# إنشاء ملف /etc/supervisor/conf.d/stc-queue.conf
[program:stc-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/www/wwwroot/api.stcsolutions.online/apps/cloud-laravel/storage/logs/queue.log
```

```bash
supervisorctl reread
supervisorctl update
supervisorctl start stc-queue:*
```

---

## 2️⃣ تنصيب Web Portal (React)

### المسار: `/www/wwwroot/stcsolutions.online`

```bash
# 1. الانتقال للمسار
cd /www/wwwroot/stcsolutions.online

# 2. استنساخ المشروع
git clone https://github.com/m7mdsonny/STC.git .
cd apps/web-portal

# 3. تثبيت Dependencies
npm install

# 4. إعداد ملف البيئة
cp .env.example .env
nano .env
```

### إعدادات `.env`:

```env
VITE_API_URL=https://api.stcsolutions.online/api/v1
VITE_APP_NAME=STC AI-VAP
VITE_APP_VERSION=1.0.0
```

### 5. بناء التطبيق للإنتاج

```bash
npm run build
```

### 6. نسخ الملفات المبنية

```bash
# نسخ ملفات build إلى public
cp -r dist/* /www/wwwroot/stcsolutions.online/public/
```

### 7. إعداد Nginx للـ Web Portal

إنشاء ملف `/etc/nginx/sites-available/stcsolutions.online`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name stcsolutions.online www.stcsolutions.online;
    
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name stcsolutions.online www.stcsolutions.online;
    
    root /www/wwwroot/stcsolutions.online/public;
    index index.html;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/stcsolutions.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stcsolutions.online/privkey.pem;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
    
    # SPA Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static Assets Cache
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
    
    # Logs
    access_log /var/log/nginx/stcsolutions.online.access.log;
    error_log /var/log/nginx/stcsolutions.online.error.log;
}
```

تفعيل الموقع:

```bash
ln -s /etc/nginx/sites-available/stcsolutions.online /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 3️⃣ تنصيب Edge Server (Python)

### على السيرفر المحلي

```bash
# 1. استنساخ المشروع
cd /opt
git clone https://github.com/m7mdsonny/STC.git
cd STC/apps/edge-server/edge

# 2. إنشاء Virtual Environment
python3 -m venv venv
source venv/bin/activate

# 3. تثبيت Dependencies
pip install -r requirements.txt

# 4. تثبيت OpenCV و FFmpeg
# Ubuntu/Debian:
sudo apt-get update
sudo apt-get install -y python3-opencv ffmpeg

# 5. إعداد ملف البيئة
cp .env.example .env
nano .env
```

### إعدادات `.env`:

```env
# Cloud API
CLOUD_API_URL=https://api.stcsolutions.online/api/v1
EDGE_KEY=your_edge_key
EDGE_SECRET=your_edge_secret

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# License
LICENSE_KEY=your_license_key

# Storage
MEDIA_STORAGE_PATH=/opt/stc-edge/media
LOG_PATH=/opt/stc-edge/logs

# AI Models
AI_MODELS_PATH=/opt/stc-edge/models
```

### 6. إنشاء مجلدات التخزين

```bash
mkdir -p /opt/stc-edge/{media,logs,models}
chmod -R 755 /opt/stc-edge
```

### 7. تشغيل Edge Server

#### يدوياً:
```bash
cd /opt/STC/apps/edge-server/edge
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8080
```

#### كخدمة Systemd:

إنشاء ملف `/etc/systemd/system/stc-edge.service`:

```ini
[Unit]
Description=STC AI-VAP Edge Server
After=network.target

[Service]
Type=simple
User=stc-edge
WorkingDirectory=/opt/STC/apps/edge-server/edge
Environment="PATH=/opt/STC/apps/edge-server/edge/venv/bin"
ExecStart=/opt/STC/apps/edge-server/edge/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8080
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

تفعيل الخدمة:

```bash
sudo systemctl daemon-reload
sudo systemctl enable stc-edge
sudo systemctl start stc-edge
sudo systemctl status stc-edge
```

---

## 4️⃣ بناء وتنصيب Mobile App (Flutter)

### على جهاز التطوير

```bash
# 1. استنساخ المشروع
git clone https://github.com/m7mdsonny/STC.git
cd STC/apps/mobile-app

# 2. تثبيت Dependencies
flutter pub get

# 3. إعداد Firebase
# اتبع التعليمات في apps/mobile-app/README.md

# 4. إعداد ملف البيئة
# عدّل lib/config/api_config.dart
const String apiBaseUrl = 'https://api.stcsolutions.online/api/v1';
```

### بناء APK (Android)

```bash
# Debug
flutter build apk --debug

# Release
flutter build apk --release

# Split APK (لحجم أصغر)
flutter build apk --split-per-abi --release
```

### بناء IPA (iOS)

```bash
# Release
flutter build ios --release

# ثم استخدم Xcode لبناء ورفع التطبيق
open ios/Runner.xcworkspace
```

### توزيع التطبيق

#### Android:
- رفع APK إلى Google Play Console
- أو توزيع مباشر (APK)

#### iOS:
- رفع عبر Xcode إلى App Store Connect
- أو TestFlight للتوزيع الداخلي

---

## 🔄 التحديثات

### Cloud API:
```bash
cd /www/wwwroot/api.stcsolutions.online/apps/cloud-laravel
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:clear
php artisan cache:clear
```

### Web Portal:
```bash
cd /www/wwwroot/stcsolutions.online/apps/web-portal
git pull origin main
npm install
npm run build
cp -r dist/* /www/wwwroot/stcsolutions.online/public/
```

### Edge Server:
```bash
cd /opt/STC/apps/edge-server/edge
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart stc-edge
```

---

## ✅ التحقق من التنصيب

### Cloud API:
```bash
curl https://api.stcsolutions.online/api/v1/public/landing
```

### Web Portal:
افتح المتصفح: `https://stcsolutions.online`

### Edge Server:
```bash
curl http://edge-server-ip:8080/health
```

---

## 🐛 استكشاف الأخطاء

### Cloud API لا يعمل:
1. تحقق من PHP-FPM: `systemctl status php8.3-fpm`
2. تحقق من Nginx: `nginx -t`
3. تحقق من Logs: `tail -f storage/logs/laravel.log`
4. تحقق من الصلاحيات: `ls -la storage bootstrap/cache`

### Web Portal لا يعمل:
1. تحقق من ملفات Build موجودة في `/public`
2. تحقق من Nginx configuration
3. تحقق من Console في المتصفح (F12)

### Edge Server لا يعمل:
1. تحقق من الخدمة: `systemctl status stc-edge`
2. تحقق من Logs: `journalctl -u stc-edge -f`
3. تحقق من الاتصال بالـ Cloud API
4. تحقق من Edge Key و Secret

---

## 📞 الدعم

للحصول على الدعم:
- Email: support@stcsolutions.net
- Phone: 01016154999
- Website: www.stcsolutions.net

---

**آخر تحديث**: 2025-01-28
