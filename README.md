# STC AI-VAP Platform

## منصة تحليل الفيديو بالذكاء الاصطناعي

منصة SaaS متكاملة لتحليل الفيديو بالذكاء الاصطناعي، تتكون من 4 تطبيقات رئيسية:

1. **Cloud API** (Laravel) - Backend API المركزي
2. **Web Portal** (React) - واجهة الويب الإدارية  
3. **Mobile App** (Flutter) - تطبيق الهاتف المحمول
4. **Edge Server** (Python) - سيرفر محلي للمعالجة

---

## 🚀 البدء السريع

### التنصيب الكامل

راجع **[دليل التنصيب الشامل](INSTALLATION.md)** للحصول على تعليمات مفصلة لتنصيب جميع المكونات.

### المسارات على السيرفر:
- **Cloud API**: `/www/wwwroot/api.stcsolutions.online`
- **Web Portal**: `/www/wwwroot/stcsolutions.online`

---

## 📁 هيكلة المشروع

```
STC/
├── apps/
│   ├── cloud-laravel/      # Laravel Backend API
│   ├── web-portal/         # React Web App
│   ├── mobile-app/         # Flutter Mobile App
│   └── edge-server/        # Python Edge Server
├── docs/                   # Documentation
├── scripts/               # Build & Deployment Scripts
├── stc_cloud_mysql_complete_latest.sql  # Database Dump
└── INSTALLATION.md         # دليل التنصيب الشامل
```

---

## 🔧 المتطلبات

### Cloud API (Laravel)
- PHP 8.3+
- Composer
- MySQL 8.0+ / MariaDB 10.3+
- Nginx / Apache

### Web Portal (React)
- Node.js 18+
- npm / yarn

### Mobile App (Flutter)
- Flutter 3.16+
- Android Studio / Xcode
- Firebase Account

### Edge Server (Python)
- Python 3.10+
- OpenCV
- FFmpeg

---

## 📚 الوثائق

### التنصيب
- **[دليل التنصيب الشامل](INSTALLATION.md)** - تنصيب كامل لجميع المكونات
- **[تنصيب Cloud API](docs/INSTALL_CLOUD.md)** - تفاصيل تنصيب Laravel
- **[تنصيب Edge Server](docs/INSTALL_EDGE.md)** - تفاصيل تنصيب Python Edge

### التطوير
- **[Cloud API README](apps/cloud-laravel/README.md)** - دليل Laravel Backend
- **[Web Portal README](apps/web-portal/README.md)** - دليل React Frontend
- **[Mobile App README](apps/mobile-app/README.md)** - دليل Flutter App
- **[Edge Server README](apps/edge-server/README.md)** - دليل Python Edge

### قاعدة البيانات
- **[Database Schema](docs/FINAL_DATABASE_SCHEMA.md)** - هيكل قاعدة البيانات
- **[Database Update Guide](docs/DATABASE_UPDATE_SECURITY_PATCH.md)** - تحديثات قاعدة البيانات

---

## 🎯 المميزات الرئيسية

### AI Modules (9 modules)
1. Face Recognition - التعرف على الوجوه
2. People Counter - عداد الأشخاص
3. Fire Detection - كشف الحرائق
4. Intrusion Detection - كشف التسلل
5. Vehicle Recognition - التعرف على المركبات
6. Attendance - الحضور والانصراف
7. Loitering Detection - كشف التجمهر
8. Crowd Detection - كشف الازدحام
9. Object Detection - كشف الأجسام

### Enterprise Monitoring
- **Market Module** - مراقبة المتاجر (سلوك مشبوه، سرقة، عدم دفع)
- **Factory Module** - مراقبة المصانع (سلامة العمال، خطوط الإنتاج)

### Analytics & Reporting
- تحليلات زمنية
- تقارير يومية/أسبوعية/شهرية
- تصدير PDF و CSV

### Management
- Organizations - إدارة المؤسسات
- Users - إدارة المستخدمين
- Licenses - إدارة التراخيص
- Edge Servers - إدارة السيرفرات المحلية
- Cameras - إدارة الكاميرات
- Alerts - إدارة التنبيهات

---

## 🔐 الأمان

### Security Features
- ✅ HMAC Authentication للـ Edge Servers
- ✅ Replay Attack Protection (Nonce)
- ✅ Encrypted Edge Secrets
- ✅ Role-Based Access Control (RBAC)
- ✅ Tenant Isolation
- ✅ SSL/TLS Encryption

### Compliance
- ✅ لا تخزين بيانات حيوية (Biometric Data)
- ✅ تشفير البيانات الحساسة
- ✅ حماية من Replay Attacks

---

## 🔔 الإشعارات

### Firebase Cloud Messaging (FCM)
- ✅ Push Notifications للموبايل
- ✅ Web Notifications (اختياري)
- ✅ Notification Channels (Push, SMS, Email, WhatsApp)

---

## 🔗 Integration

### Cloud ↔ Edge Server
- Heartbeat - نبضات الحياة
- Camera Sync - مزامنة الكاميرات
- AI Commands - أوامر الذكاء الاصطناعي
- Event Ingestion - استقبال الأحداث

### Cloud ↔ Mobile App
- Authentication - المصادقة
- Alerts - التنبيهات
- Cameras - الكاميرات
- Notifications - الإشعارات

### Cloud ↔ Web Portal
- Authentication - المصادقة
- CRUD Operations - جميع العمليات
- Real-time Data - البيانات المباشرة

---

## 🛠️ التطوير

### Cloud API
```bash
cd apps/cloud-laravel
composer install
php artisan serve
```

### Web Portal
```bash
cd apps/web-portal
npm install
npm run dev
```

### Mobile App
```bash
cd apps/mobile-app
flutter pub get
flutter run
```

### Edge Server
```bash
cd apps/edge-server/edge
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080
```

---

## 📝 قاعدة البيانات

### استيراد قاعدة البيانات

```bash
mysql -u username -p database_name < stc_cloud_mysql_complete_latest.sql
```

### Migrations

```bash
cd apps/cloud-laravel
php artisan migrate
php artisan db:seed
```

---

## 🔄 التحديثات

راجع **[دليل التنصيب](INSTALLATION.md)** قسم "التحديثات" للحصول على تعليمات تحديث كل مكون.

---

## 📞 الدعم

للحصول على الدعم:
- **Email**: support@stcsolutions.net
- **Phone**: 01016154999
- **Website**: www.stcsolutions.net

---

## 📄 الترخيص

© 2025 STC Solutions. جميع الحقوق محفوظة.

---

**آخر تحديث**: 2025-01-28
