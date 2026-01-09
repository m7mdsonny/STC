# Web Portal Installation Guide

**Last Updated**: 2025-01-30  
**Version**: 1.0

---

## Overview

This guide covers the installation and setup of the Web Portal (React) for the STC AI-VAP Platform.

---

## Requirements

### Operating System
- **Linux**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **Windows**: Windows 10/11
- **macOS**: macOS 10.15+

### Software Requirements
- **Node.js**: 18.x or higher (LTS recommended)
- **npm**: 9.x or higher (comes with Node.js)

### Verify Installation

```bash
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher
```

---

## Installation Steps

### 1. Navigate to Web Portal Directory

```bash
cd apps/web-portal
```

### 2. Install Dependencies

```bash
npm ci
```

**Note**: Use `npm ci` (not `npm install`) for production builds. It ensures exact dependency versions from `package-lock.json`.

### 3. Environment Configuration

Create `.env` file (if not exists):

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=STC AI-VAP
```

**Production**:
```env
VITE_API_BASE_URL=https://api.your-domain.com/api
VITE_APP_NAME=STC AI-VAP
```

### 4. Build for Production

```bash
npm run build
```

This creates optimized production build in `dist/` directory.

### 5. Development Mode

```bash
npm run dev
```

Access at: `http://localhost:5173`

---

## Running the Application

### Development Mode

```bash
npm run dev
```

Features:
- Hot module replacement (HMR)
- Fast refresh
- Source maps for debugging
- Development server on port 5173

### Production Mode

#### Option 1: Serve with Vite Preview

```bash
npm run build
npm run preview
```

#### Option 2: Serve with Nginx

See `docs/RUNBOOK.md` for production deployment with Nginx.

---

## Common Commands

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Type check
npm run typecheck
```

### Maintenance

```bash
# Clean node_modules and reinstall
rm -rf node_modules package-lock.json
npm ci

# Update dependencies
npm update

# Check for security vulnerabilities
npm audit
npm audit fix
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000/api` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_NAME` | Application name | `STC AI-VAP` |

**Note**: All `VITE_*` variables are embedded at build time. Changes require rebuild.

---

## Common Errors & Fixes

### Error: "Cannot find module 'X'"

**Cause**: Dependencies not installed or corrupted

**Fix**:
```bash
rm -rf node_modules package-lock.json
npm ci
```

### Error: "Port 5173 is already in use"

**Cause**: Another process using the port

**Fix**:
```bash
# Find process
lsof -i :5173  # Linux/macOS
netstat -ano | findstr :5173  # Windows

# Kill process or use different port
npm run dev -- --port 3000
```

### Error: "Failed to fetch" or CORS errors

**Cause**: Backend API not accessible or CORS misconfiguration

**Fix**:
1. Verify backend is running: `curl http://localhost:8000/api/up`
2. Check `VITE_API_BASE_URL` in `.env`
3. Verify CORS configuration in Laravel backend

### Error: Build fails with "Out of memory"

**Cause**: Insufficient memory for build process

**Fix**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Error: TypeScript errors

**Cause**: Type mismatches or missing types

**Fix**:
```bash
# Run type check
npm run typecheck

# Fix errors or update types
```

---

## Verification

### 1. Check Development Server

```bash
npm run dev
```

Open browser: `http://localhost:5173`

Should see login page.

### 2. Test API Connection

Open browser console (F12) and check for:
- No CORS errors
- API calls returning data
- No 404 errors for API endpoints

### 3. Test Production Build

```bash
npm run build
npm run preview
```

Open browser: `http://localhost:4173`

Verify:
- All pages load correctly
- API calls work
- No console errors

---

## Build Output

After `npm run build`, the `dist/` directory contains:

```
dist/
├── index.html          # Main HTML file
├── assets/
│   ├── index-*.js      # JavaScript bundles
│   ├── index-*.css     # CSS bundles
│   └── *.png|jpg|svg   # Images and icons
```

**Deploy**: Upload entire `dist/` directory to web server.

---

## API Configuration

### Development

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Production

```env
VITE_API_BASE_URL=https://api.your-domain.com/api
```

**Important**: 
- API URL must include `/api` suffix
- Must use HTTPS in production
- CORS must be configured in Laravel backend

---

## Next Steps

1. **Configure Backend API**: Ensure Cloud Backend is running (see `docs/INSTALL_CLOUD.md`)
2. **Production Deployment**: See `docs/RUNBOOK.md` for Nginx configuration
3. **Test Login**: Use super admin credentials from backend `.env`

---

## Support

For issues or questions:
- Check `docs/RUNBOOK.md` for troubleshooting
- Review browser console for errors
- Verify API connectivity
- Contact: support@stcsolutions.net

---

**Last Updated**: 2025-01-30
