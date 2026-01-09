# STC AI-VAP Flutter App

تطبيق موبايل لمنصة STC AI-VAP لتحليل الفيديو بالذكاء الاصطناعي.

## المميزات

- 📱 واجهة مستخدم عربية كاملة (RTL)
- 🌓 دعم الوضع الفاتح والداكن
- 📹 مراقبة الكاميرات المباشرة (HLS Streaming)
- 🔔 إشعارات فورية عبر Firebase
- 📊 تحليلات وإحصائيات
- ⚡ أداء عالي مع التخزين المحلي
- 🎨 تصميم عصري ومتجاوب

## المتطلبات

- Flutter 3.16 أو أحدث
- Dart 3.0 أو أحدث
- Android Studio / VS Code
- Firebase Account
- Node.js لتشغيل API

## التثبيت

### 1. استنساخ المشروع

```bash
git clone <repository-url>
cd flutter_app
```

### 2. تثبيت المكتبات

```bash
flutter pub get
```

### 3. إعداد Firebase

1. إنشاء مشروع Firebase جديد
2. تحميل ملفات التكوين:
   - `google-services.json` لـ Android (في `android/app/`)
   - `GoogleService-Info.plist` لـ iOS (في `ios/Runner/`)
3. تفعيل Firebase Cloud Messaging

### 4. إعداد Assets

1. أضف شعار التطبيق في `assets/logo/`
2. أضف أصوات الإشعارات في `assets/sounds/`
3. أضف أنيميشن Lottie في `assets/lottie/`

راجع ملفات README في كل مجلد للتفاصيل.

### 5. تكوين API URL

أنشئ ملف `.env` في المجلد الرئيسي:

```env
API_URL=http://your-api-url.com
```

أو عدل الـ baseUrl في `lib/data/providers/app_providers.dart`.

## التشغيل

### وضع التطوير

```bash
flutter run
```

### البناء

#### Android

```bash
flutter build apk --release
```

#### iOS

```bash
flutter build ios --release
```

## هيكل المشروع

```
lib/
├── core/
│   ├── constants/        # الثوابت (ألوان، نصوص، إلخ)
│   ├── services/         # الخدمات (API، التخزين، الإشعارات)
│   └── theme/            # الثيمات
├── data/
│   ├── models/           # نماذج البيانات
│   ├── providers/        # Riverpod Providers
│   └── repositories/     # Repositories
├── features/
│   ├── splash/           # شاشة البداية
│   ├── auth/             # تسجيل الدخول
│   ├── home/             # الصفحة الرئيسية
│   ├── cameras/          # الكاميرات
│   ├── alerts/           # التنبيهات
│   ├── analytics/        # التحليلات
│   ├── servers/          # السيرفرات
│   └── settings/         # الإعدادات
├── shared/
│   └── widgets/          # Widgets المشتركة
└── routes/
    └── app_router.dart   # التوجيه
```

## الثيمات

### الوضع الفاتح (Light Mode)
- Primary: Blue (#2563EB)
- Background: Light Gray (#F8FAFC)
- Card: White (#FFFFFF)

### الوضع الداكن (Dark Mode)
- Primary: Navy (#141450)
- Secondary: Gold (#DCA000)
- Background: Dark Navy (#0A0A2E)
- Card: Dark Purple (#1E1E6E)

## الخطوط

التطبيق يستخدم خط **Alexandria** من Google Fonts.

## APIs

التطبيق يتصل بـ APIs التالية:

- `POST /api/auth/login` - تسجيل الدخول
- `GET /api/auth/me` - معلومات المستخدم
- `GET /api/cameras` - قائمة الكاميرات
- `GET /api/cameras/:id/stream` - بث الكاميرا
- `GET /api/alerts` - قائمة التنبيهات
- `POST /api/alerts/:id/ack` - إقرار التنبيه
- `GET /api/analytics` - الإحصائيات
- `GET /api/servers` - قائمة السيرفرات

## الإشعارات

التطبيق يدعم مستويات إشعارات مختلفة:

- **Critical**: صوت قوي + اهتزاز قوي
- **High**: صوت عادي
- **Medium**: صوت خفيف
- **Low**: صامت

## المساهمة

للمساهمة في المشروع:

1. Fork المشروع
2. إنشاء branch جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push للـ branch (`git push origin feature/AmazingFeature`)
5. فتح Pull Request

## الترخيص

© 2024 STC Solutions. جميع الحقوق محفوظة.

## التواصل

- الموقع: www.stcsolutions.net
- الهاتف: 01016154999
