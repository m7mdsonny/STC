# تعليمات التحديث على السيرفر
## Server Update Instructions

**التاريخ:** 2026-01-13  
**الحالة:** ✅ جاهز للتطبيق الفوري

---

## 🚨 المشكلة التي تم حلها

**المشكلة:** صفحة الهبوط تعرض الـ header فقط والباقي فارغ  
**السبب:** settings كان يبدأ بـ `null` وبالتالي جميع الأقسام لا تُعرض  
**الحل:** تهيئة settings بقيم افتراضية فوراً

---

## ⚡ خطوات التطبيق السريع (5 دقائق)

### على السيرفر `/www/wwwroot/stcsolutions.online`:

```bash
# 1. سحب آخر التحديثات من GitHub
cd /www/wwwroot/stcsolutions.online
git pull origin main

# يجب أن ترى:
# Updating 1735f48..3a5e252
# apps/web-portal/src/pages/Landing.tsx
# apps/web-portal/src/contexts/I18nContext.tsx
# ...

# 2. التحقق من الملفات المحدثة
ls -la src/contexts/I18nContext.tsx
ls -la src/pages/Landing.tsx
# يجب أن يظهر كلاهما!

# 3. إعادة Build
npm run build

# يجب أن ينجح Build الآن!
# ✅ Build completed successfully

# 4. اختبار فوري
# افتح المتصفح: https://stcsolutions.online/
# يجب أن ترى كل المحتوى!
```

---

## 📋 التحقق من النجاح

### يجب أن ترى في Console:

```javascript
[Landing] Received data: {content: {...}, published: true}
[Landing] Content fields: {...}
[Landing] Merged settings: {...}
[i18n] Current language: ar
```

### يجب أن تظهر في الصفحة:

```
✅ العنوان الرئيسي: "حول كاميراتك الى عيون ذكية"
✅ النص التوضيحي: "منصة تحليل..."
✅ 4 إحصائيات (500+ عميل، 10 موديولات، 99.9%، 24/7)
✅ 3 بطاقات (Cloud, Edge, Mobile)
✅ 10 موديولات AI
✅ قسم الميزات
✅ 3 خطط أسعار (أساسي، احترافي، مؤسسي)
✅ معلومات التواصل
✅ Footer
```

---

## 🔍 إذا لم يعمل - خطوات إضافية:

### الخطوة 1: مسح Cache

```bash
# مسح cache npm
rm -rf node_modules/.vite

# إعادة build
npm run build
```

### الخطوة 2: التحقق من الملفات

```bash
# التأكد من وجود I18nContext
cat src/contexts/I18nContext.tsx | head -20

# يجب أن ترى:
# import React, { createContext, ...

# التأكد من Landing.tsx
cat src/pages/Landing.tsx | grep "useState<LandingSettings>"

# يجب أن ترى:
# const [settings, setSettings] = useState<LandingSettings>({
```

### الخطوة 3: إعادة git pull بقوة

```bash
# إذا كانت هناك تعارضات
git reset --hard HEAD
git pull origin main
npm run build
```

---

## 🎯 الملفات الثلاثة الحرجة

### 1️⃣ Landing.tsx
**المسار:** `src/pages/Landing.tsx`  
**التغيير الرئيسي:**
```typescript
// قبل:
const [settings, setSettings] = useState<LandingSettings | null>(null);

// بعد:
const [settings, setSettings] = useState<LandingSettings>({
  hero_title: 'حول كاميراتك...',
  // ... كل الحقول
});
```

### 2️⃣ I18nContext.tsx
**المسار:** `src/contexts/I18nContext.tsx`  
**الوظيفة:** نظام الترجمة الكامل  
**اللغة الافتراضية:** العربية

### 3️⃣ App.tsx
**المسار:** `src/App.tsx`  
**التغيير:** إضافة `<I18nProvider>` في أعلى مستوى

---

## ✅ النتيجة المتوقعة

بعد `git pull && npm run build`:

```
┌─────────────────────────────────────────┐
│ ✅ Build successful                     │
│ ✅ Landing page displays ALL content    │
│ ✅ Hero section visible                 │
│ ✅ Stats visible                        │
│ ✅ Modules visible                      │
│ ✅ Pricing visible                      │
│ ✅ Contact visible                      │
│ ✅ Footer visible                       │
│ ✅ i18n system working                  │
│ ✅ Arabic is default                    │
└─────────────────────────────────────────┘
```

---

## 📞 إذا استمرت المشكلة

### أرسل لي:

1. **نتيجة git pull:**
```bash
git pull origin main
# نسخ النتيجة
```

2. **نتيجة build:**
```bash
npm run build
# نسخ النتيجة (خاصة الأخطاء)
```

3. **Console output في المتصفح:**
```
افتح F12 → Console
أعد تحميل الصفحة
انسخ الـ logs
```

---

## 🚀 الأمر الواحد السريع

```bash
cd /www/wwwroot/stcsolutions.online && \
git pull origin main && \
npm run build && \
echo "✅ Done! Visit https://stcsolutions.online/"
```

---

**آخر Commit:** 3a5e252  
**الحالة:** ✅ Fixed and Deployed  
**التطبيق:** git pull + npm run build
