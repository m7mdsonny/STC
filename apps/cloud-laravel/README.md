# AI-VAP Cloud Platform (Laravel + React)

This is the unified Laravel backend with embedded React frontend for the AI-VAP platform. It is designed for deployment on standard PHP hosting (aaPanel, Nginx + PHP-FPM, Apache).

## Architecture

```
cloud-laravel/
  public/           <- Document root for web server
    index.php       <- Laravel front controller
    index.html      <- React SPA (built from web-portal)
    assets/         <- React static assets
  app/              <- Laravel application code
  routes/
    api.php         <- API endpoints (/api/*)
    web.php         <- SPA fallback route
  bootstrap/        <- Laravel bootstrap
  config/           <- Laravel configuration
  storage/          <- Laravel storage (logs, cache, sessions)
```

## Quick Start

### 1. Build the React Frontend

```bash
# From the project root
cd apps/cloud-laravel
./build.sh    # Linux/Mac
# or
build.bat     # Windows
```

This will:
- Install web-portal dependencies
- Build the React application
- Copy the build output to `public/`

### 2. Install Laravel Dependencies

```bash
cd apps/cloud-laravel
composer install --no-dev --optimize-autoloader
```

### 3. Configure Environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` with your database credentials:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=stc_cloud
DB_USERNAME=root
DB_PASSWORD=your_password
```

### 4. Run Locally

```bash
php artisan serve --host 0.0.0.0 --port 8000
```

Visit `http://localhost:8000`

## aaPanel Deployment

### Step 1: Create Website
1. Add a new PHP website in aaPanel
2. Set PHP version to 8.2+

### Step 2: Upload Files
1. Upload the entire `cloud-laravel` directory
2. Set document root to `/cloud-laravel/public`

### Step 3: Configure Nginx

Add this to your Nginx configuration:

```nginx
location / {
    try_files $uri $uri/ /index.php?$query_string;
}

location ~ \.php$ {
    fastcgi_pass unix:/tmp/php-cgi-82.sock;
    fastcgi_index index.php;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    include fastcgi_params;
}

location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires max;
    log_not_found off;
}
```

### Step 4: Set Permissions

```bash
chmod -R 775 storage bootstrap/cache
chown -R www:www storage bootstrap/cache
```

### Step 5: Configure Environment

1. SSH into your server
2. Navigate to the project directory
3. Run:
```bash
cp .env.example .env
php artisan key:generate
```

## API Endpoints

All API routes are prefixed with `/api/`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User authentication |
| `/api/auth/logout` | POST | User logout |
| `/api/me` | GET | Current user info |
| `/api/licensing/validate` | POST | License validation |
| `/api/edges/heartbeat` | POST | Edge server heartbeat |
| `/api/edges/events` | POST | Event ingestion |
| `/api/notifications` | GET | User notifications |

## Directory Structure

```
cloud-laravel/
├── app/
│   ├── Http/
│   │   ├── Controllers/     # API controllers
│   │   └── Middleware/      # Custom middleware
│   ├── Models/              # Eloquent models
│   └── Providers/           # Service providers
├── bootstrap/
│   ├── app.php              # Application bootstrap
│   └── cache/               # Compiled files
├── config/                  # Configuration files
├── database/
│   ├── factories/           # Model factories
│   ├── migrations/          # Database migrations
│   ├── seeders/             # Database seeders
│   └── schema.sql           # Database schema
├── public/                  # Document root
│   ├── index.php            # Laravel entry point
│   ├── index.html           # React SPA
│   ├── assets/              # React assets
│   └── .htaccess            # Apache config
├── routes/
│   ├── api.php              # API routes
│   ├── console.php          # Console commands
│   └── web.php              # Web routes (SPA fallback)
├── storage/                 # Logs, cache, sessions
├── tests/                   # PHPUnit tests
├── .env.example             # Environment template
├── artisan                  # Laravel CLI
├── build.sh                 # Build script (Linux/Mac)
├── build.bat                # Build script (Windows)
├── composer.json            # PHP dependencies
└── phpunit.xml              # Test configuration
```

## Troubleshooting

### React app not loading
- Ensure `index.html` exists in `public/`
- Run the build script to rebuild

### 500 Server Error
- Check `storage/logs/laravel.log`
- Ensure storage permissions are correct
- Verify `.env` configuration

### API returning 404
- Ensure routes are cached: `php artisan route:cache`
- Check `routes/api.php` for route definitions

### CSS/JS not loading
- Clear browser cache
- Check browser console for 404 errors
- Verify assets exist in `public/assets/`

## Production Checklist

- [ ] Set `APP_ENV=production` in `.env`
- [ ] Set `APP_DEBUG=false` in `.env`
- [ ] Run `php artisan config:cache`
- [ ] Run `php artisan route:cache`
- [ ] Run `php artisan view:cache`
- [ ] Configure SSL certificate
- [ ] Set up database backups
- [ ] Configure log rotation
