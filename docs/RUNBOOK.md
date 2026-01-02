# Production Deployment Runbook

**Last Updated**: 2025-12-30  
**Version**: 1.0

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend (Laravel) Setup](#backend-laravel-setup)
4. [Web Portal (React) Setup](#web-portal-react-setup)
5. [Edge Server Setup](#edge-server-setup)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **PHP**: 8.2 or higher
- **Composer**: Latest version
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **MySQL**: 8.0 or higher
- **Python**: 3.10 or higher (for Edge Server)

### Required Accounts
- MySQL database access
- Server with SSH access
- Domain name (optional, for production)

---

## Database Setup

### 1. Create MySQL Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE stc_ai_vap CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'stc_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON stc_ai_vap.* TO 'stc_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Verify Database Connection

```bash
mysql -u stc_user -p stc_ai_vap -e "SELECT 1;"
```

---

## Backend (Laravel) Setup

### 1. Navigate to Backend Directory

```bash
cd apps/cloud-laravel
```

### 2. Install Dependencies

```bash
composer install --optimize-autoloader --no-dev
```

### 3. Configure Environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` file:

```env
APP_NAME="STC AI-VAP"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=stc_ai_vap
DB_USERNAME=stc_user
DB_PASSWORD=strong_password_here

# Super Admin Credentials (for initial setup)
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=ChangeThisPassword123!

# License Grace Period (days)
LICENSE_GRACE_PERIOD_DAYS=14

# Sanctum Configuration
SANCTUM_STATEFUL_DOMAINS=your-domain.com
SESSION_DOMAIN=.your-domain.com
```

### 4. Run Migrations and Seeders

```bash
php artisan migrate:fresh --seed
```

**Important**: This will:
- Create all database tables
- Create foreign keys and indexes
- Seed subscription plans (basic, premium, enterprise)
- Create super admin user (from `.env`)

### 5. Optimize Application

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 6. Set Permissions

```bash
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 7. Configure Web Server

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    root /path/to/apps/cloud-laravel/public;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### 8. Start Queue Worker (if using queues)

```bash
php artisan queue:work --daemon
```

Or use Supervisor:

```ini
[program:stc-ai-vap-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/apps/cloud-laravel/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/path/to/apps/cloud-laravel/storage/logs/worker.log
stopwaitsecs=3600
```

### 9. Schedule Cron Job

Add to crontab (`crontab -e`):

```cron
* * * * * cd /path/to/apps/cloud-laravel && php artisan schedule:run >> /dev/null 2>&1
```

---

## Web Portal (React) Setup

### 1. Navigate to Web Portal Directory

```bash
cd apps/web-portal
```

### 2. Install Dependencies

```bash
npm ci
```

### 3. Configure Environment

Create `.env.production`:

```env
VITE_API_URL=https://your-domain.com/api
VITE_APP_NAME=STC AI-VAP
```

### 4. Build for Production

```bash
npm run build
```

This creates optimized production build in `dist/` directory.

### 5. Deploy Build

#### Option A: Serve via Nginx

```nginx
server {
    listen 80;
    server_name portal.your-domain.com;
    root /path/to/apps/web-portal/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass https://your-domain.com/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Option B: Copy to Laravel Public Directory

```bash
cp -r apps/web-portal/dist/* apps/cloud-laravel/public/
```

---

## Edge Server Setup

### 1. Navigate to Edge Server Directory

```bash
cd apps/edge-server
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Create `.env`:

```env
CLOUD_API_URL=https://your-domain.com/api
EDGE_KEY=your_edge_key_from_cloud
EDGE_SECRET=your_edge_secret_from_cloud
EDGE_ID=your_edge_id
```

**Important**: Get `EDGE_KEY` and `EDGE_SECRET` from Cloud Portal after creating Edge Server.

### 4. Start Edge Server

```bash
python app/main.py
```

Or use systemd service:

```ini
[Unit]
Description=STC AI-VAP Edge Server
After=network.target

[Service]
Type=simple
User=edge
WorkingDirectory=/path/to/apps/edge-server
Environment="PATH=/usr/bin:/usr/local/bin"
ExecStart=/usr/bin/python3 app/main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## Verification

### 1. Backend Health Check

```bash
curl https://your-domain.com/api/up
```

Should return: `{"status":"ok"}`

### 2. Database Connection

```bash
php artisan tinker
```

```php
DB::connection()->getPdo();
// Should return PDO object without errors
```

### 3. Test Login

```bash
curl -X POST https://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"ChangeThisPassword123!"}'
```

Should return token and user data.

### 4. Edge Server Heartbeat

After Edge Server is configured and running, check Cloud logs:

```bash
tail -f apps/cloud-laravel/storage/logs/laravel.log | grep heartbeat
```

Should show successful heartbeat messages.

---

## Troubleshooting

### Database Connection Errors

**Error**: `SQLSTATE[HY000] [2002] Connection refused`

**Solution**:
1. Verify MySQL is running: `systemctl status mysql`
2. Check database credentials in `.env`
3. Verify firewall allows MySQL connections

### Migration Errors

**Error**: `SQLSTATE[42S01]: Base table or view already exists`

**Solution**:
```bash
php artisan migrate:fresh --seed
```

**Warning**: This will delete all data!

### Permission Errors

**Error**: `The stream or file could not be opened`

**Solution**:
```bash
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### Edge Server Authentication Errors

**Error**: `Unauthorized: Invalid signature`

**Solution**:
1. Verify `EDGE_KEY` and `EDGE_SECRET` in Edge Server `.env`
2. Ensure keys match those in Cloud database
3. Check Edge Server system time (must be within 5 minutes of Cloud server)

### CORS Errors

**Error**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solution**:
1. Verify `SANCTUM_STATEFUL_DOMAINS` in `.env`
2. Check `config/cors.php` settings
3. Ensure frontend URL is in allowed origins

### Quota Exceeded Errors

**Error**: `Camera quota exceeded`

**Solution**:
1. Check organization's subscription plan
2. Verify license status and expiry
3. Upgrade subscription plan if needed

### License Expiry Errors

**Error**: `No active subscription found`

**Solution**:
1. Check license status in database
2. Verify license expiry date
3. Renew license if expired (within grace period)

---

## Maintenance

### Daily Tasks

- Monitor logs: `tail -f storage/logs/laravel.log`
- Check disk space: `df -h`
- Verify backups (if configured)

### Weekly Tasks

- Review error logs
- Check database size
- Verify scheduled jobs are running

### Monthly Tasks

- Update dependencies (composer, npm)
- Review and rotate logs
- Check license expiry dates

---

## Support

For issues or questions:
- Check logs: `apps/cloud-laravel/storage/logs/laravel.log`
- Review documentation: `docs/`
- Contact: support@example.com

---

**End of Runbook**
