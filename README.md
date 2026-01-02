# STC AI-VAP - منصة تحليل الفيديو بالذكاء الاصطناعي

## 📖 نظرة عامة

**STC AI-VAP** (STC AI Video Analytics Platform) هي منصة SaaS متكاملة لتحليل الفيديو بالذكاء الاصطناعي. تتكون المنصة من 4 تطبيقات رئيسية:

1. **Cloud API** (Laravel) - Backend API المركزي
2. **Web Portal** (React) - واجهة الويب الإدارية
3. **Mobile App** (Flutter) - تطبيق الهاتف المحمول
4. **Edge Server** (Python) - سيرفر محلي للمعالجة

---

## 🏗️ البنية المعمارية

```
┌─────────────┐
│  Web Portal │
│   (React)   │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
┌──────▼──────┐   ┌──────▼──────┐
│  Cloud API  │   │ Mobile App   │
│  (Laravel)  │   │  (Flutter)   │
└──────┬──────┘   └──────┬───────┘
       │                 │
       │                 │
       └────────┬────────┘
                │
         ┌──────▼──────┐
         │ Edge Server │
         │  (Python)   │
         └─────────────┘
```

---

## 🚀 البدء السريع

### المتطلبات
- PHP 8.3+
- Node.js 18+
- Flutter 3.0+
- Python 3.10+
- PostgreSQL 14+

### 1. Cloud API
```bash
cd apps/cloud-laravel
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### 2. Web Portal
```bash
cd apps/web-portal
npm install
npm run dev
```

### 3. Mobile App
```bash
cd apps/mobile-app
flutter pub get
flutter run
```

### 4. Edge Server
```bash
cd apps/edge-server
pip install -r requirements.txt
python main.py
```

---

## 📚 Documentation

### Installation Guides
- **[Cloud Backend Installation](docs/INSTALL_CLOUD.md)** - Laravel backend setup
- **[Web Portal Installation](docs/INSTALL_WEB.md)** - React frontend setup
- **[Edge Server Installation](docs/INSTALL_EDGE.md)** - Python edge server setup

### Deployment & Operations
- **[Production Runbook](docs/RUNBOOK.md)** - Complete production deployment guide
- **[Quick Start Guide](docs/QUICK_START.md)** - 5-minute setup guide

### System Documentation
- **[System Map](docs/SYSTEM_MAP.md)** - Complete API route mapping
- **[Flow Map](docs/FLOW_MAP.md)** - Core business flows
- **[Reality Matrix](docs/REALITY_MATRIX.md)** - UI to backend mapping

### Development
- **[Final Code Review](docs/FINAL_CODE_REVIEW.md)** - Pre-release code review
- **[Completion Report](docs/FINAL_COMPLETION_REPORT.md)** - Overall completion status

---

## 🔐 Authentication

جميع التطبيقات تستخدم نفس Cloud API للـ authentication:

- **Endpoint**: `/api/v1/auth/login`
- **Method**: POST
- **Body**: `{ "email": "...", "password": "..." }`
- **Response**: `{ "token": "...", "user": {...} }`

### الصلاحيات (Roles)
- `super_admin` - مدير النظام
- `owner` - مالك المؤسسة
- `admin` - مدير المؤسسة
- `editor` - محرر
- `viewer` - مشاهد

---

## 🔔 الإشعارات

### Firebase (Mobile App)
- ✅ موجود ومُعد
- ✅ FCM token registration
- ✅ Push notifications

### Web Portal
- ⚠️ Browser Notification API (بدون Firebase)
- ⚠️ يمكن إضافة Firebase لاحقاً

---

## 🔗 Integration

### Cloud ↔ Edge Server
- Heartbeat
- Camera sync
- AI commands
- Event ingestion

### Cloud ↔ Mobile App
- Authentication
- Alerts
- Cameras
- Notifications

### Cloud ↔ Web Portal
- Authentication
- All CRUD operations
- Real-time data

---

## 🎯 المميزات الرئيسية

### AI Modules (9 modules)
1. Face Recognition
2. People Counter
3. Fire Detection
4. Intrusion Detection
5. Vehicle Recognition
6. Attendance
7. Loitering Detection
8. Crowd Detection
9. Object Detection

### Management
- Organizations
- Users
- Licenses
- Edge Servers
- Cameras
- Alerts
- Analytics

---

## 📁 هيكلة المشروع

```
STCSAAS/
├── apps/
│   ├── cloud-laravel/      # Laravel Backend
│   ├── web-portal/         # React Web App
│   ├── mobile-app/         # Flutter Mobile App
│   └── edge-server/        # Python Edge Server
├── docs/                   # Documentation
└── scripts/               # Build scripts
```

---

## 🛠️ التطوير

### Cloud API
```bash
cd apps/cloud-laravel
php artisan test
```

### Web Portal
```bash
cd apps/web-portal
npm run lint
npm run typecheck
```

### Mobile App
```bash
cd apps/mobile-app
flutter analyze
```

### Edge Server
```bash
cd apps/edge-server
pytest tests/
```

---

## 📝 الترخيص

© 2024 STC Solutions. جميع الحقوق محفوظة.

---

## 📞 الدعم

للحصول على الدعم، يرجى التواصل:
- Email: support@stcsolutions.net
- Phone: 01016154999
- Website: www.stcsolutions.net

---

**آخر تحديث**: 2024-12-20

