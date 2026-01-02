# دليل تثبيت وإعداد Edge Server المحلي

## 📋 نظرة عامة

Edge Server هو الخادم المحلي الذي يعمل على جهازك ويتصل بالـ Cloud (Laravel Backend) لمعالجة الفيديو وتشغيل نماذج الذكاء الاصطناعي.

## 🎯 المتطلبات الأساسية

### 1. متطلبات النظام
- **نظام التشغيل**: Windows 10/11 أو Linux (Ubuntu 20.04+)
- **المعالج**: Intel Core i5 أو أعلى (يفضل i7/i9)
- **الذاكرة**: 8GB RAM كحد أدنى (يفضل 16GB+)
- **التخزين**: 50GB مساحة حرة
- **GPU**: اختياري (NVIDIA GPU مع CUDA للسرعة العالية)

### 2. البرمجيات المطلوبة
- **Python**: 3.10 أو أحدث
- **pip**: مدير حزم Python
- **Git**: لسحب الكود (اختياري)

---

## 📦 خطوات التثبيت

### الخطوة 1: تثبيت Python

#### على Windows:
1. اذهب إلى [python.org/downloads](https://www.python.org/downloads/)
2. حمّل Python 3.10 أو أحدث
3. أثناء التثبيت، تأكد من تفعيل "Add Python to PATH"
4. افتح Command Prompt واختبر:
   ```cmd
   python --version
   pip --version
   ```

#### على Linux:
```bash
sudo apt update
sudo apt install python3.10 python3-pip python3-venv
python3 --version
```

### الخطوة 2: سحب الكود

#### من GitHub:
```bash
git clone https://github.com/m7mdsonny/STCSAAS.git
cd STCSAAS/apps/edge-server
```

#### أو إذا كان الكود موجود:
```bash
cd apps/edge-server
```

### الخطوة 3: إنشاء بيئة افتراضية (Virtual Environment)

#### على Windows:
```cmd
python -m venv venv
venv\Scripts\activate
```

#### على Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

**ملاحظة**: بعد تفعيل البيئة الافتراضية، سترى `(venv)` في بداية السطر.

### الخطوة 4: تثبيت المتطلبات

```bash
pip install -r requirements.txt
```

**ملاحظة**: قد يستغرق هذا عدة دقائق حسب سرعة الإنترنت.

---

## ⚙️ إعداد الاتصال بالـ Cloud

### الطريقة 1: استخدام واجهة الويب (الأسهل)

1. **شغّل Edge Server**:
   ```bash
   python main.py
   ```
   أو
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8080
   ```

2. **افتح المتصفح** واذهب إلى:
   ```
   http://localhost:8080/setup
   ```

3. **املأ البيانات**:
   - **Cloud API URL**: `https://api.stcsolutions.online/api/v1`
   - **Cloud API Key**: (اختياري - اتركه فارغاً إذا لم يكن مطلوباً)
   - **License Key**: مفتاح الترخيص الخاص بك (مثال: `DEMO-CORP-2024-FULL-ACCESS`)

4. **اضغط "Save Configuration"**

5. **أعد تشغيل Edge Server**

### الطريقة 2: التعديل اليدوي لملف `.env`

1. **أنشئ ملف `.env`** في مجلد `edge-server`:
   ```bash
   # على Windows
   copy .env.example .env
   
   # على Linux
   cp .env.example .env
   ```

2. **افتح الملف** وعدّل القيم التالية:

```env
# ============================================
# STC AI-VAP Edge Server Configuration
# ============================================

# Cloud API Settings
CLOUD_API_URL=https://api.stcsolutions.online/api/v1
CLOUD_API_KEY=

# License Settings
LICENSE_KEY=DEMO-CORP-2024-FULL-ACCESS

# Server Settings
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
DEBUG=false

# Logging
LOG_LEVEL=INFO
LOG_DIR=logs

# Performance Settings
MAX_CAMERAS=16
PROCESSING_FPS=5
SYNC_INTERVAL=30
HEARTBEAT_INTERVAL=60

# AI Model Confidence Thresholds
FACE_CONFIDENCE=0.6
OBJECT_CONFIDENCE=0.5
FIRE_CONFIDENCE=0.7

# Data Directories
DATA_DIR=data

# MQTT (Optional)
MQTT_BROKER=
MQTT_PORT=1883
```

### شرح المتغيرات المهمة:

| المتغير | الوصف | القيمة المطلوبة |
|---------|-------|------------------|
| `CLOUD_API_URL` | رابط الـ Cloud API | `https://api.stcsolutions.online/api/v1` |
| `CLOUD_API_KEY` | مفتاح API (اختياري) | اتركه فارغاً إذا لم يكن مطلوباً |
| `LICENSE_KEY` | مفتاح الترخيص | يجب أن يكون موجوداً في قاعدة البيانات |
| `SERVER_PORT` | منفذ Edge Server | `8080` (افتراضي) |
| `MAX_CAMERAS` | الحد الأقصى للكاميرات | `16` (افتراضي) |

---

## 🚀 تشغيل Edge Server

### الطريقة 1: استخدام Python مباشرة

```bash
python main.py
```

### الطريقة 2: استخدام Uvicorn

```bash
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

**ملاحظة**: `--reload` يجعل السيرفر يعيد التشغيل تلقائياً عند تغيير الكود (للتطوير فقط).

### الطريقة 3: كخدمة Windows (Windows Service)

1. استخدم `NSSM` (Non-Sucking Service Manager):
   ```cmd
   nssm install EdgeServer "C:\path\to\venv\Scripts\python.exe" "C:\path\to\edge-server\main.py"
   ```

2. أو استخدم `pywin32`:
   ```python
   # create_service.py
   import win32serviceutil
   import win32service
   import servicemanager
   import socket
   import sys
   import os
   
   class EdgeServerService(win32serviceutil.ServiceFramework):
       _svc_name_ = "STCEdgeServer"
       _svc_display_name_ = "STC Edge Server"
       _svc_description_ = "STC AI-VAP Edge Server Service"
       
       def __init__(self, args):
           win32serviceutil.ServiceFramework.__init__(self, args)
           self.stop_event = win32event.CreateEvent(None, 0, 0, None)
           socket.setdefaulttimeout(60)
           
       def SvcStop(self):
           self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
           win32event.SetEvent(self.stop_event)
           
       def SvcDoRun(self):
           servicemanager.LogMsg(
               servicemanager.EVENTLOG_INFORMATION_TYPE,
               servicemanager.PYS_SERVICE_STARTED,
               (self._svc_name_, '')
           )
           os.chdir(r'C:\path\to\edge-server')
           os.system('venv\\Scripts\\python.exe main.py')
           
   if __name__ == '__main__':
       win32serviceutil.HandleCommandLine(EdgeServerService)
   ```

### الطريقة 4: كخدمة Linux (Systemd)

أنشئ ملف `/etc/systemd/system/edge-server.service`:

```ini
[Unit]
Description=STC Edge Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/edge-server
Environment="PATH=/path/to/edge-server/venv/bin"
ExecStart=/path/to/edge-server/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

ثم:
```bash
sudo systemctl daemon-reload
sudo systemctl enable edge-server
sudo systemctl start edge-server
sudo systemctl status edge-server
```

---

## ✅ التحقق من التثبيت

### 1. التحقق من أن Edge Server يعمل

افتح المتصفح واذهب إلى:
```
http://localhost:8080
```

يجب أن ترى صفحة ترحيب أو API documentation.

### 2. التحقق من الاتصال بالـ Cloud

افتح:
```
http://localhost:8080/health
```

يجب أن ترى:
```json
{
  "status": "ok",
  "cloud_connected": true,
  "license_valid": true
}
```

### 3. التحقق من السجلات (Logs)

```bash
# على Windows
type logs\edge_server.log

# على Linux
tail -f logs/edge_server.log
```

ابحث عن:
```
✅ Connected to Cloud API: https://api.stcsolutions.online/api/v1
✅ License validated successfully
```

---

## 🔧 حل المشاكل الشائعة

### المشكلة 1: "CLOUD_API_URL not configured"

**الحل**:
1. تأكد من وجود ملف `.env`
2. تأكد من أن `CLOUD_API_URL` موجود في الملف
3. أعد تشغيل Edge Server

### المشكلة 2: "Connection failed"

**الحل**:
1. تحقق من أن الـ Cloud API يعمل:
   ```bash
   curl https://api.stcsolutions.online/api/v1/public/landing
   ```
2. تحقق من إعدادات Firewall
3. تحقق من أن `CLOUD_API_URL` صحيح (يجب أن ينتهي بـ `/api/v1`)

### المشكلة 3: "License validation failed"

**الحل**:
1. تحقق من أن `LICENSE_KEY` صحيح في قاعدة البيانات
2. تحقق من أن License موجود في Cloud:
   ```bash
   # في Cloud Laravel
   php artisan tinker
   ```
   ```php
   $license = \App\Models\License::where('license_key', 'YOUR_LICENSE_KEY')->first();
   if ($license) {
       echo "License found: " . $license->status . "\n";
   } else {
       echo "License not found!\n";
   }
   ```

### المشكلة 4: "Port 8080 already in use"

**الحل**:
1. غيّر `SERVER_PORT` في `.env` إلى منفذ آخر (مثل `8081`)
2. أو أوقف البرنامج الذي يستخدم المنفذ:
   ```bash
   # على Windows
   netstat -ano | findstr :8080
   taskkill /PID <PID> /F
   
   # على Linux
   lsof -i :8080
   kill -9 <PID>
   ```

### المشكلة 5: "Module not found" أو أخطاء Python

**الحل**:
1. تأكد من تفعيل البيئة الافتراضية:
   ```bash
   # Windows
   venv\Scripts\activate
   
   # Linux
   source venv/bin/activate
   ```
2. أعد تثبيت المتطلبات:
   ```bash
   pip install -r requirements.txt --upgrade
   ```

---

## 📊 مراقبة الأداء

### 1. عرض الحالة الحالية

```
http://localhost:8080/api/status
```

### 2. عرض الكاميرات المتصلة

```
http://localhost:8080/api/cameras
```

### 3. عرض السجلات في الوقت الفعلي

```bash
# Windows
Get-Content logs\edge_server.log -Wait

# Linux
tail -f logs/edge_server.log
```

---

## 🔐 الأمان

### 1. تغيير المنفذ الافتراضي

في `.env`:
```env
SERVER_PORT=9000
```

### 2. إضافة Authentication (اختياري)

يمكنك إضافة API Key في Cloud Laravel وإضافته في `.env`:
```env
CLOUD_API_KEY=your-api-key-here
```

### 3. Firewall Rules

تأكد من أن Firewall يسمح بالاتصال:
- **Outbound**: إلى `api.stcsolutions.online:443`
- **Inbound**: من الشبكة المحلية إلى `SERVER_PORT`

---

## 📝 ملاحظات مهمة

1. **الترخيص**: Edge Server يعمل بدون اتصال بالإنترنت لمدة 14 يوم بعد انتهاء الترخيص (Grace Period).

2. **التخزين**: البيانات (الفيديو/الصور) تُخزن محلياً، فقط الميتاداتا تُرسل للـ Cloud.

3. **الأداء**: 
   - استخدم GPU إذا كان متوفراً لسرعة أعلى
   - قلل `PROCESSING_FPS` إذا كان المعالج بطيء
   - قلل `MAX_CAMERAS` إذا كانت الذاكرة محدودة

4. **التحديثات**: 
   - احتفظ بنسخة احتياطية من `.env` قبل التحديث
   - اختبر التحديثات في بيئة تجريبية أولاً

---

## 🧪 اختبار الاتصال

### اختبار 1: الاتصال بالـ Cloud

```bash
curl http://localhost:8080/api/test/cloud
```

يجب أن ترى:
```json
{
  "connected": true,
  "cloud_url": "https://api.stcsolutions.online/api/v1"
}
```

### اختبار 2: التحقق من الترخيص

```bash
curl http://localhost:8080/api/test/license
```

يجب أن ترى:
```json
{
  "valid": true,
  "license_key": "DEMO-CORP-2024-FULL-ACCESS",
  "expires_at": "2026-12-30"
}
```

### اختبار 3: Heartbeat

Edge Server يرسل Heartbeat كل 60 ثانية (افتراضي) للـ Cloud. تحقق من ذلك في Cloud:

```bash
# في Cloud Laravel
php artisan tinker
```

```php
$edge = \App\Models\EdgeServer::where('edge_id', 'YOUR_EDGE_ID')->first();
if ($edge) {
    echo "Last seen: " . $edge->last_seen_at . "\n";
    echo "Online: " . ($edge->online ? 'yes' : 'no') . "\n";
}
```

---

## 📞 الدعم الفني

إذا واجهت مشاكل:

1. **تحقق من السجلات**: `logs/edge_server.log`
2. **تحقق من إعدادات `.env`**
3. **تحقق من اتصال الإنترنت**
4. **تحقق من أن Cloud API يعمل**

---

## ✅ قائمة التحقق النهائية

- [ ] Python 3.10+ مثبت
- [ ] المتطلبات مثبتة (`pip install -r requirements.txt`)
- [ ] ملف `.env` موجود ومعدّل
- [ ] `CLOUD_API_URL` صحيح
- [ ] `LICENSE_KEY` صحيح وموجود في قاعدة البيانات
- [ ] Edge Server يعمل (`http://localhost:8080`)
- [ ] الاتصال بالـ Cloud يعمل (`/api/test/cloud`)
- [ ] الترخيص صحيح (`/api/test/license`)
- [ ] Heartbeat يعمل (يظهر في Cloud)

---

## 🎉 تهانينا!

إذا أكملت جميع الخطوات بنجاح، Edge Server الآن:
- ✅ متصل بالـ Cloud
- ✅ مرخص ويعمل
- ✅ جاهز لاستقبال الكاميرات
- ✅ يرسل البيانات للـ Cloud

**الخطوة التالية**: إضافة الكاميرات من خلال واجهة Cloud Dashboard!

