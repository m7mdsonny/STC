# Quick Start Guide - STC AI-VAP Platform

**Last Updated**: 2025-12-30

---

## 🚀 Quick Setup (5 Minutes)

### 1. Database Setup

```bash
mysql -u root -p
CREATE DATABASE stc_ai_vap CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 2. Backend Setup

```bash
cd apps/cloud-laravel
cp .env.example .env
# Edit .env with your database credentials
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

### 3. Web Portal Setup

```bash
cd apps/web-portal
npm ci
npm run dev
```

### 4. Access

- **Backend API**: http://localhost:8000/api
- **Web Portal**: http://localhost:5173
- **Login**: Use super admin credentials from `.env`

---

## 📋 Default Credentials

After running `migrate:fresh --seed`:

- **Email**: From `SUPER_ADMIN_EMAIL` in `.env`
- **Password**: From `SUPER_ADMIN_PASSWORD` in `.env`

---

## 🔧 Common Commands

### Backend
```bash
# Run migrations
php artisan migrate

# Run seeders
php artisan db:seed

# Run tests
php artisan test

# Clear cache
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Web Portal
```bash
# Install dependencies
npm ci

# Development
npm run dev

# Production build
npm run build
```

---

## 📚 Documentation

- **Full Deployment**: See `docs/RUNBOOK.md`
- **System Architecture**: See `docs/SYSTEM_MAP.md`
- **API Flows**: See `docs/FLOW_MAP.md`
- **Testing**: See `docs/PHASE_F_FINAL.md`

---

## 🆘 Troubleshooting

### Database Connection Error
- Check `.env` database credentials
- Verify MySQL is running: `systemctl status mysql`

### Permission Errors
```bash
chmod -R 755 storage bootstrap/cache
```

### Port Already in Use
- Backend: Change `APP_PORT` in `.env` or use different port
- Web: Change port in `vite.config.ts`

---

**For detailed instructions, see `docs/RUNBOOK.md`**
