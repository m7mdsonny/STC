import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Supported languages
export type Language = 'ar' | 'en';

// Default language
const DEFAULT_LANGUAGE: Language = 'ar';
const STORAGE_KEY = 'app_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionaries
const translations: Record<Language, Record<string, string>> = {
  ar: {
    // ==========================================
    // Navigation & Headers
    // ==========================================
    'nav.home': 'الرئيسية',
    'nav.dashboard': 'لوحة التحكم',
    'nav.cameras': 'الكاميرات',
    'nav.alerts': 'التنبيهات',
    'nav.analytics': 'التحليلات',
    'nav.people': 'الأشخاص',
    'nav.vehicles': 'المركبات',
    'nav.attendance': 'الحضور',
    'nav.market': 'Market',
    'nav.automation': 'أوامر الذكاء الاصطناعي',
    'nav.team': 'فريق العمل',
    'nav.settings': 'الإعدادات',
    'nav.organizations': 'المؤسسات',
    'nav.users': 'المستخدمين',
    'nav.licenses': 'التراخيص',
    'nav.plans': 'الباقات',
    'nav.resellers': 'الموزعين',
    'nav.integrations': 'التكاملات',
    'nav.backups': 'النسخ الاحتياطية',
    'nav.aiModules': 'موديولات الذكاء الاصطناعي',
    'nav.liveView': 'البث المباشر',
    'nav.logout': 'تسجيل الخروج',
    'nav.login': 'تسجيل الدخول',

    // ==========================================
    // Common Actions
    // ==========================================
    'action.add': 'إضافة',
    'action.edit': 'تعديل',
    'action.delete': 'حذف',
    'action.save': 'حفظ',
    'action.cancel': 'إلغاء',
    'action.close': 'إغلاق',
    'action.confirm': 'تأكيد',
    'action.search': 'بحث',
    'action.filter': 'تصفية',
    'action.export': 'تصدير',
    'action.import': 'استيراد',
    'action.download': 'تحميل',
    'action.upload': 'رفع',
    'action.refresh': 'تحديث',
    'action.submit': 'إرسال',
    'action.back': 'رجوع',
    'action.next': 'التالي',
    'action.previous': 'السابق',
    'action.view': 'عرض',
    'action.enable': 'تفعيل',
    'action.disable': 'تعطيل',
    'action.activate': 'تنشيط',
    'action.deactivate': 'إلغاء التنشيط',
    'action.test': 'اختبار',
    'action.copy': 'نسخ',
    'action.reset': 'إعادة تعيين',

    // ==========================================
    // Status
    // ==========================================
    'status.active': 'نشط',
    'status.inactive': 'غير نشط',
    'status.online': 'متصل',
    'status.offline': 'غير متصل',
    'status.pending': 'قيد الانتظار',
    'status.approved': 'تمت الموافقة',
    'status.rejected': 'مرفوض',
    'status.completed': 'مكتمل',
    'status.failed': 'فشل',
    'status.processing': 'قيد المعالجة',
    'status.published': 'منشور',
    'status.draft': 'مسودة',
    'status.suspended': 'موقوف',
    'status.expired': 'منتهي',

    // ==========================================
    // Common Labels
    // ==========================================
    'label.name': 'الاسم',
    'label.email': 'البريد الإلكتروني',
    'label.phone': 'الهاتف',
    'label.password': 'كلمة المرور',
    'label.address': 'العنوان',
    'label.description': 'الوصف',
    'label.status': 'الحالة',
    'label.date': 'التاريخ',
    'label.time': 'الوقت',
    'label.createdAt': 'تاريخ الإنشاء',
    'label.updatedAt': 'تاريخ التحديث',
    'label.organization': 'المؤسسة',
    'label.role': 'الدور',
    'label.type': 'النوع',
    'label.category': 'التصنيف',
    'label.location': 'الموقع',
    'label.notes': 'ملاحظات',
    'label.total': 'الإجمالي',
    'label.count': 'العدد',
    'label.amount': 'المبلغ',
    'label.price': 'السعر',

    // ==========================================
    // Messages
    // ==========================================
    'message.loading': 'جاري التحميل...',
    'message.saving': 'جاري الحفظ...',
    'message.deleting': 'جاري الحذف...',
    'message.noData': 'لا توجد بيانات',
    'message.noResults': 'لم يتم العثور على نتائج',
    'message.success': 'تمت العملية بنجاح',
    'message.error': 'حدث خطأ',
    'message.confirmDelete': 'هل أنت متأكد من الحذف؟',
    'message.confirmAction': 'هل أنت متأكد؟',
    'message.savedSuccessfully': 'تم الحفظ بنجاح',
    'message.deletedSuccessfully': 'تم الحذف بنجاح',
    'message.updatedSuccessfully': 'تم التحديث بنجاح',
    'message.createdSuccessfully': 'تم الإنشاء بنجاح',
    'message.copiedToClipboard': 'تم النسخ',
    'message.sessionExpired': 'انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى',
    'message.networkError': 'خطأ في الاتصال بالشبكة',
    'message.serverError': 'خطأ في الخادم',
    'message.unauthorized': 'غير مصرح',
    'message.forbidden': 'غير مسموح',
    'message.notFound': 'غير موجود',
    'message.validationError': 'خطأ في البيانات',

    // ==========================================
    // Time
    // ==========================================
    'time.today': 'اليوم',
    'time.yesterday': 'أمس',
    'time.thisWeek': 'هذا الأسبوع',
    'time.thisMonth': 'هذا الشهر',
    'time.thisYear': 'هذا العام',
    'time.lastWeek': 'الأسبوع الماضي',
    'time.lastMonth': 'الشهر الماضي',
    'time.lastYear': 'العام الماضي',
    'time.minutes': 'دقائق',
    'time.hours': 'ساعات',
    'time.days': 'أيام',
    'time.ago': 'منذ',

    // ==========================================
    // Auth
    // ==========================================
    'auth.login': 'تسجيل الدخول',
    'auth.logout': 'تسجيل الخروج',
    'auth.register': 'إنشاء حساب',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.resetPassword': 'إعادة تعيين كلمة المرور',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.rememberMe': 'تذكرني',
    'auth.loginSuccess': 'تم تسجيل الدخول بنجاح',
    'auth.loginFailed': 'فشل تسجيل الدخول',
    'auth.invalidCredentials': 'بيانات الدخول غير صحيحة',

    // ==========================================
    // Cameras
    // ==========================================
    'cameras.title': 'الكاميرات',
    'cameras.add': 'إضافة كاميرا',
    'cameras.edit': 'تعديل كاميرا',
    'cameras.name': 'اسم الكاميرا',
    'cameras.rtspUrl': 'رابط RTSP',
    'cameras.location': 'الموقع',
    'cameras.edgeServer': 'السيرفر المحلي',
    'cameras.status': 'الحالة',
    'cameras.online': 'متصلة',
    'cameras.offline': 'غير متصلة',
    'cameras.modules': 'الموديولات المفعلة',
    'cameras.testConnection': 'اختبار الاتصال',
    'cameras.snapshot': 'صورة حية',
    'cameras.liveStream': 'بث مباشر',

    // ==========================================
    // Edge Servers
    // ==========================================
    'edgeServers.title': 'السيرفرات المحلية',
    'edgeServers.add': 'إضافة سيرفر',
    'edgeServers.name': 'اسم السيرفر',
    'edgeServers.ipAddress': 'عنوان IP',
    'edgeServers.license': 'الترخيص',
    'edgeServers.status': 'الحالة',
    'edgeServers.lastSeen': 'آخر اتصال',
    'edgeServers.cameras': 'الكاميرات',
    'edgeServers.syncConfig': 'مزامنة الإعدادات',
    'edgeServers.restart': 'إعادة تشغيل',

    // ==========================================
    // Alerts
    // ==========================================
    'alerts.title': 'التنبيهات',
    'alerts.new': 'جديد',
    'alerts.acknowledged': 'تم الاطلاع',
    'alerts.resolved': 'تم الحل',
    'alerts.critical': 'حرج',
    'alerts.high': 'مرتفع',
    'alerts.medium': 'متوسط',
    'alerts.low': 'منخفض',
    'alerts.acknowledge': 'تم الاطلاع',
    'alerts.resolve': 'تم الحل',
    'alerts.markFalseAlarm': 'إنذار كاذب',

    // ==========================================
    // People / Faces
    // ==========================================
    'people.title': 'الأشخاص المسجلين',
    'people.add': 'إضافة شخص',
    'people.name': 'الاسم',
    'people.employeeId': 'رقم الموظف',
    'people.department': 'القسم',
    'people.category': 'التصنيف',
    'people.employee': 'موظف',
    'people.vip': 'VIP',
    'people.visitor': 'زائر',
    'people.blacklist': 'قائمة سوداء',
    'people.uploadPhoto': 'رفع صورة',

    // ==========================================
    // Vehicles
    // ==========================================
    'vehicles.title': 'المركبات المسجلة',
    'vehicles.add': 'إضافة مركبة',
    'vehicles.plateNumber': 'رقم اللوحة',
    'vehicles.plateAr': 'اللوحة بالعربي',
    'vehicles.ownerName': 'اسم المالك',
    'vehicles.vehicleType': 'نوع المركبة',
    'vehicles.vehicleColor': 'لون المركبة',
    'vehicles.category': 'التصنيف',

    // ==========================================
    // Organizations
    // ==========================================
    'organizations.title': 'المؤسسات',
    'organizations.add': 'إضافة مؤسسة',
    'organizations.name': 'اسم المؤسسة',
    'organizations.nameEn': 'الاسم بالإنجليزية',
    'organizations.email': 'البريد الإلكتروني',
    'organizations.phone': 'الهاتف',
    'organizations.address': 'العنوان',
    'organizations.city': 'المدينة',
    'organizations.plan': 'الباقة',
    'organizations.maxCameras': 'الحد الأقصى للكاميرات',
    'organizations.maxEdgeServers': 'الحد الأقصى للسيرفرات',

    // ==========================================
    // Licenses
    // ==========================================
    'licenses.title': 'التراخيص',
    'licenses.add': 'إضافة ترخيص',
    'licenses.key': 'مفتاح الترخيص',
    'licenses.plan': 'الباقة',
    'licenses.organization': 'المؤسسة',
    'licenses.expiresAt': 'تاريخ الانتهاء',
    'licenses.maxCameras': 'الحد الأقصى للكاميرات',
    'licenses.modules': 'الموديولات',
    'licenses.activate': 'تفعيل',
    'licenses.suspend': 'إيقاف',
    'licenses.renew': 'تجديد',

    // ==========================================
    // AI Modules
    // ==========================================
    'aiModules.title': 'موديولات الذكاء الاصطناعي',
    'aiModules.fire': 'كشف الحريق والدخان',
    'aiModules.face': 'التعرف على الوجوه',
    'aiModules.counter': 'عد الأشخاص',
    'aiModules.vehicle': 'التعرف على المركبات',
    'aiModules.attendance': 'تسجيل الحضور',
    'aiModules.intrusion': 'كشف التسلل',
    'aiModules.market': 'مراقبة المتاجر',
    'aiModules.safety': 'سلامة العمال',
    'aiModules.production': 'مراقبة الإنتاج',
    'aiModules.loitering': 'كشف التكاسل',
    'aiModules.enabled': 'مفعل',
    'aiModules.disabled': 'معطل',

    // ==========================================
    // Analytics
    // ==========================================
    'analytics.title': 'التحليلات',
    'analytics.overview': 'نظرة عامة',
    'analytics.alerts': 'التنبيهات',
    'analytics.cameras': 'الكاميرات',
    'analytics.modules': 'الموديولات',
    'analytics.timeRange': 'الفترة الزمنية',
    'analytics.compareWith': 'مقارنة مع',
    'analytics.trend': 'الاتجاه',
    'analytics.totalAlerts': 'إجمالي التنبيهات',
    'analytics.responseTime': 'وقت الاستجابة',
    'analytics.topCameras': 'أكثر الكاميرات نشاطاً',

    // ==========================================
    // Settings
    // ==========================================
    'settings.title': 'الإعدادات',
    'settings.general': 'عام',
    'settings.notifications': 'الإشعارات',
    'settings.security': 'الأمان',
    'settings.integrations': 'التكاملات',
    'settings.backup': 'النسخ الاحتياطي',
    'settings.language': 'اللغة',
    'settings.theme': 'المظهر',
    'settings.timezone': 'المنطقة الزمنية',

    // ==========================================
    // Roles
    // ==========================================
    'role.superAdmin': 'مشرف عام',
    'role.owner': 'مالك',
    'role.admin': 'مدير',
    'role.editor': 'محرر',
    'role.viewer': 'مشاهد',

    // ==========================================
    // Landing Page
    // ==========================================
    'landing.hero.title': 'منصة تحليل الفيديو بالذكاء الاصطناعي',
    'landing.hero.subtitle': 'حول كاميرات المراقبة إلى عيون ذكية تحمي منشآتك وتحلل بياناتك في الوقت الفعلي مع 10 موديولات متخصصة',
    'landing.hero.ai': 'بالذكاء الاصطناعي',
    'landing.hero.notPublished': 'هذه الصفحة غير منشورة حالياً',
    'landing.hero.cta': 'ابدأ تجربتك المجانية',
    'landing.hero.discover': 'اكتشف المميزات',
    'landing.hero.integratedPlatform': 'منصة متكاملة',
    'landing.hero.exploreFeatures': 'اكتشف المميزات',
    'landing.hero.platform': 'Cloud Platform',
    'landing.hero.platformDesc': 'لوحة تحكم ويب شاملة لإدارة كل شيء من أي مكان',
    'landing.hero.edge': 'Edge Server',
    'landing.hero.edgeDesc': 'معالجة محلية بالذكاء الاصطناعي تعمل بدون إنترنت',
    'landing.hero.mobile': 'Mobile App',
    'landing.hero.mobileDesc': 'تطبيق موبايل لمتابعة التنبيهات والكاميرات',
    'landing.platform.cloud': 'Cloud Platform',
    'landing.platform.cloudDesc': 'لوحة تحكم ويب شاملة لإدارة كل شيء من أي مكان',
    'landing.platform.edge': 'Edge Server',
    'landing.platform.edgeDesc': 'معالجة محلية بالذكاء الاصطناعي تعمل بدون إنترنت',
    'landing.platform.mobile': 'Mobile App',
    'landing.platform.mobileDesc': 'تطبيق موبايل لمتابعة التنبيهات والكاميرات',
    'landing.hero.stats.clients': 'عميل نشط',
    'landing.hero.stats.modules': 'موديول ذكاء اصطناعي',
    'landing.hero.stats.uptime': 'وقت التشغيل',
    'landing.hero.stats.support': 'دعم فني',
    'landing.modules.title': 'موديولات الذكاء الاصطناعي',
    'landing.modules.subtitle': 'كل موديول مصمم لحل مشكلة محددة مع إمكانية تفعيل أوامر تلقائية لكل حدث',
    'landing.modules.badge': '10 موديولات متخصصة',
    'landing.features.title': 'أوامر الذكاء الاصطناعي',
    'landing.features.subtitle': 'حدد ماذا يحدث عند كل حدث. عند كشف حريق يتم تشغيل السرينة وفتح أبواب الطوارئ',
    'landing.features.badge': 'أتمتة ذكية',
    'landing.features.fire.title': 'كشف حريق',
    'landing.features.fire.desc': 'تشغيل السرينة + فتح أبواب الطوارئ + اتصال طوارئ',
    'landing.features.vip.title': 'سيارة VIP',
    'landing.features.vip.desc': 'فتح البوابة تلقائياً + إشعار الاستقبال',
    'landing.features.blacklist.title': 'قائمة سوداء',
    'landing.features.blacklist.desc': 'تنبيه أمني فوري + تسجيل فيديو',
    'landing.pricing.title': 'اختر باقتك',
    'landing.pricing.subtitle': 'جميع الباقات تشمل فترة تجريبية 14 يوم مجاناً',
    'landing.pricing.badge': 'باقات مرنة',
    'landing.pricing.basic': 'أساسي',
    'landing.pricing.professional': 'احترافي',
    'landing.pricing.enterprise': 'مؤسسي',
    'landing.pricing.perMonth': 'شهرياً',
    'landing.pricing.cameras': 'كاميرات',
    'landing.pricing.servers': 'سيرفر',
    'landing.pricing.modules': 'موديولات',
    'landing.pricing.faces': 'التعرف على الوجوه',
    'landing.pricing.attendance': 'تسجيل الحضور',
    'landing.pricing.sms': 'رسائل SMS',
    'landing.pricing.whatsapp': 'WhatsApp',
    'landing.pricing.emergency': 'اتصال طوارئ',
    'landing.pricing.support': 'دعم مخصص',
    'landing.pricing.startNow': 'ابدأ الآن',
    'landing.pricing.popular': 'الأكثر طلباً',
    'landing.contact.title': 'نحن هنا لمساعدتك',
    'landing.contact.subtitle': 'تواصل معنا للاستفسارات أو طلب عرض تجريبي',
    'landing.contact.badge': 'تواصل معنا',
    'landing.contact.phone': 'الهاتف',
    'landing.contact.email': 'البريد الإلكتروني',
    'landing.contact.address': 'العنوان',
    'landing.contact.form.title': 'أرسل رسالة',
    'landing.contact.form.name': 'الاسم',
    'landing.contact.form.email': 'البريد الإلكتروني',
    'landing.contact.form.phone': 'رقم الجوال',
    'landing.contact.form.message': 'رسالتك...',
    'landing.contact.form.submit': 'إرسال',
    'landing.contact.form.sending': 'جاري الإرسال...',
    'landing.contact.form.success': 'تم إرسال رسالتك بنجاح!',
    'landing.contact.form.successDesc': 'سنتواصل معك في أقرب وقت',
    'landing.nav.home': 'الرئيسية',
    'landing.nav.modules': 'الموديولات',
    'landing.nav.features': 'المميزات',
    'landing.nav.pricing': 'الباقات',
    'landing.nav.contact': 'تواصل معنا',
    'landing.nav.login': 'تسجيل الدخول',
    'landing.footer.rights': 'جميع الحقوق محفوظة',
    'landing.loading': 'جاري التحميل...',
    'landing.unpublished': 'هذه الصفحة غير منشورة حاليا',
  },
  
  en: {
    // ==========================================
    // Navigation & Headers
    // ==========================================
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.cameras': 'Cameras',
    'nav.alerts': 'Alerts',
    'nav.analytics': 'Analytics',
    'nav.people': 'People',
    'nav.vehicles': 'Vehicles',
    'nav.attendance': 'Attendance',
    'nav.market': 'Market',
    'nav.automation': 'AI Commands',
    'nav.team': 'Team',
    'nav.settings': 'Settings',
    'nav.organizations': 'Organizations',
    'nav.users': 'Users',
    'nav.licenses': 'Licenses',
    'nav.plans': 'Plans',
    'nav.resellers': 'Resellers',
    'nav.integrations': 'Integrations',
    'nav.backups': 'Backups',
    'nav.aiModules': 'AI Modules',
    'nav.liveView': 'Live View',
    'nav.logout': 'Logout',
    'nav.login': 'Login',

    // ==========================================
    // Common Actions
    // ==========================================
    'action.add': 'Add',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.close': 'Close',
    'action.confirm': 'Confirm',
    'action.search': 'Search',
    'action.filter': 'Filter',
    'action.export': 'Export',
    'action.import': 'Import',
    'action.download': 'Download',
    'action.upload': 'Upload',
    'action.refresh': 'Refresh',
    'action.submit': 'Submit',
    'action.back': 'Back',
    'action.next': 'Next',
    'action.previous': 'Previous',
    'action.view': 'View',
    'action.enable': 'Enable',
    'action.disable': 'Disable',
    'action.activate': 'Activate',
    'action.deactivate': 'Deactivate',
    'action.test': 'Test',
    'action.copy': 'Copy',
    'action.reset': 'Reset',

    // ==========================================
    // Status
    // ==========================================
    'status.active': 'Active',
    'status.inactive': 'Inactive',
    'status.online': 'Online',
    'status.offline': 'Offline',
    'status.pending': 'Pending',
    'status.approved': 'Approved',
    'status.rejected': 'Rejected',
    'status.completed': 'Completed',
    'status.failed': 'Failed',
    'status.processing': 'Processing',
    'status.published': 'Published',
    'status.draft': 'Draft',
    'status.suspended': 'Suspended',
    'status.expired': 'Expired',

    // ==========================================
    // Common Labels
    // ==========================================
    'label.name': 'Name',
    'label.email': 'Email',
    'label.phone': 'Phone',
    'label.password': 'Password',
    'label.address': 'Address',
    'label.description': 'Description',
    'label.status': 'Status',
    'label.date': 'Date',
    'label.time': 'Time',
    'label.createdAt': 'Created At',
    'label.updatedAt': 'Updated At',
    'label.organization': 'Organization',
    'label.role': 'Role',
    'label.type': 'Type',
    'label.category': 'Category',
    'label.location': 'Location',
    'label.notes': 'Notes',
    'label.total': 'Total',
    'label.count': 'Count',
    'label.amount': 'Amount',
    'label.price': 'Price',

    // ==========================================
    // Messages
    // ==========================================
    'message.loading': 'Loading...',
    'message.saving': 'Saving...',
    'message.deleting': 'Deleting...',
    'message.noData': 'No data available',
    'message.noResults': 'No results found',
    'message.success': 'Operation successful',
    'message.error': 'An error occurred',
    'message.confirmDelete': 'Are you sure you want to delete?',
    'message.confirmAction': 'Are you sure?',
    'message.savedSuccessfully': 'Saved successfully',
    'message.deletedSuccessfully': 'Deleted successfully',
    'message.updatedSuccessfully': 'Updated successfully',
    'message.createdSuccessfully': 'Created successfully',
    'message.copiedToClipboard': 'Copied to clipboard',
    'message.sessionExpired': 'Session expired, please login again',
    'message.networkError': 'Network connection error',
    'message.serverError': 'Server error',
    'message.unauthorized': 'Unauthorized',
    'message.forbidden': 'Access denied',
    'message.notFound': 'Not found',
    'message.validationError': 'Validation error',

    // ==========================================
    // Time
    // ==========================================
    'time.today': 'Today',
    'time.yesterday': 'Yesterday',
    'time.thisWeek': 'This Week',
    'time.thisMonth': 'This Month',
    'time.thisYear': 'This Year',
    'time.lastWeek': 'Last Week',
    'time.lastMonth': 'Last Month',
    'time.lastYear': 'Last Year',
    'time.minutes': 'minutes',
    'time.hours': 'hours',
    'time.days': 'days',
    'time.ago': 'ago',

    // ==========================================
    // Auth
    // ==========================================
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.register': 'Register',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.resetPassword': 'Reset Password',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.rememberMe': 'Remember Me',
    'auth.loginSuccess': 'Login successful',
    'auth.loginFailed': 'Login failed',
    'auth.invalidCredentials': 'Invalid credentials',

    // ==========================================
    // Cameras
    // ==========================================
    'cameras.title': 'Cameras',
    'cameras.add': 'Add Camera',
    'cameras.edit': 'Edit Camera',
    'cameras.name': 'Camera Name',
    'cameras.rtspUrl': 'RTSP URL',
    'cameras.location': 'Location',
    'cameras.edgeServer': 'Edge Server',
    'cameras.status': 'Status',
    'cameras.online': 'Online',
    'cameras.offline': 'Offline',
    'cameras.modules': 'Enabled Modules',
    'cameras.testConnection': 'Test Connection',
    'cameras.snapshot': 'Snapshot',
    'cameras.liveStream': 'Live Stream',

    // ==========================================
    // Edge Servers
    // ==========================================
    'edgeServers.title': 'Edge Servers',
    'edgeServers.add': 'Add Server',
    'edgeServers.name': 'Server Name',
    'edgeServers.ipAddress': 'IP Address',
    'edgeServers.license': 'License',
    'edgeServers.status': 'Status',
    'edgeServers.lastSeen': 'Last Seen',
    'edgeServers.cameras': 'Cameras',
    'edgeServers.syncConfig': 'Sync Config',
    'edgeServers.restart': 'Restart',

    // ==========================================
    // Alerts
    // ==========================================
    'alerts.title': 'Alerts',
    'alerts.new': 'New',
    'alerts.acknowledged': 'Acknowledged',
    'alerts.resolved': 'Resolved',
    'alerts.critical': 'Critical',
    'alerts.high': 'High',
    'alerts.medium': 'Medium',
    'alerts.low': 'Low',
    'alerts.acknowledge': 'Acknowledge',
    'alerts.resolve': 'Resolve',
    'alerts.markFalseAlarm': 'Mark as False Alarm',

    // ==========================================
    // People / Faces
    // ==========================================
    'people.title': 'Registered People',
    'people.add': 'Add Person',
    'people.name': 'Name',
    'people.employeeId': 'Employee ID',
    'people.department': 'Department',
    'people.category': 'Category',
    'people.employee': 'Employee',
    'people.vip': 'VIP',
    'people.visitor': 'Visitor',
    'people.blacklist': 'Blacklist',
    'people.uploadPhoto': 'Upload Photo',

    // ==========================================
    // Vehicles
    // ==========================================
    'vehicles.title': 'Registered Vehicles',
    'vehicles.add': 'Add Vehicle',
    'vehicles.plateNumber': 'Plate Number',
    'vehicles.plateAr': 'Arabic Plate',
    'vehicles.ownerName': 'Owner Name',
    'vehicles.vehicleType': 'Vehicle Type',
    'vehicles.vehicleColor': 'Vehicle Color',
    'vehicles.category': 'Category',

    // ==========================================
    // Organizations
    // ==========================================
    'organizations.title': 'Organizations',
    'organizations.add': 'Add Organization',
    'organizations.name': 'Organization Name',
    'organizations.nameEn': 'English Name',
    'organizations.email': 'Email',
    'organizations.phone': 'Phone',
    'organizations.address': 'Address',
    'organizations.city': 'City',
    'organizations.plan': 'Plan',
    'organizations.maxCameras': 'Max Cameras',
    'organizations.maxEdgeServers': 'Max Edge Servers',

    // ==========================================
    // Licenses
    // ==========================================
    'licenses.title': 'Licenses',
    'licenses.add': 'Add License',
    'licenses.key': 'License Key',
    'licenses.plan': 'Plan',
    'licenses.organization': 'Organization',
    'licenses.expiresAt': 'Expires At',
    'licenses.maxCameras': 'Max Cameras',
    'licenses.modules': 'Modules',
    'licenses.activate': 'Activate',
    'licenses.suspend': 'Suspend',
    'licenses.renew': 'Renew',

    // ==========================================
    // AI Modules
    // ==========================================
    'aiModules.title': 'AI Modules',
    'aiModules.fire': 'Fire & Smoke Detection',
    'aiModules.face': 'Face Recognition',
    'aiModules.counter': 'People Counting',
    'aiModules.vehicle': 'Vehicle Recognition',
    'aiModules.attendance': 'Attendance',
    'aiModules.intrusion': 'Intrusion Detection',
    'aiModules.market': 'Retail Analytics',
    'aiModules.safety': 'Worker Safety',
    'aiModules.production': 'Production Monitoring',
    'aiModules.loitering': 'Loitering Detection',
    'aiModules.enabled': 'Enabled',
    'aiModules.disabled': 'Disabled',

    // ==========================================
    // Analytics
    // ==========================================
    'analytics.title': 'Analytics',
    'analytics.overview': 'Overview',
    'analytics.alerts': 'Alerts',
    'analytics.cameras': 'Cameras',
    'analytics.modules': 'Modules',
    'analytics.timeRange': 'Time Range',
    'analytics.compareWith': 'Compare With',
    'analytics.trend': 'Trend',
    'analytics.totalAlerts': 'Total Alerts',
    'analytics.responseTime': 'Response Time',
    'analytics.topCameras': 'Top Active Cameras',

    // ==========================================
    // Settings
    // ==========================================
    'settings.title': 'Settings',
    'settings.general': 'General',
    'settings.notifications': 'Notifications',
    'settings.security': 'Security',
    'settings.integrations': 'Integrations',
    'settings.backup': 'Backup',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.timezone': 'Timezone',

    // ==========================================
    // Roles
    // ==========================================
    'role.superAdmin': 'Super Admin',
    'role.owner': 'Owner',
    'role.admin': 'Admin',
    'role.editor': 'Editor',
    'role.viewer': 'Viewer',

    // ==========================================
    // Landing Page
    // ==========================================
    'landing.hero.title': 'AI-Powered Video Analytics Platform',
    'landing.hero.subtitle': 'Transform your surveillance cameras into intelligent eyes that protect your facilities and analyze data in real-time with 10 specialized modules',
    'landing.hero.ai': 'with AI',
    'landing.hero.notPublished': 'This page is currently not published',
    'landing.hero.cta': 'Start Free Trial',
    'landing.hero.discover': 'Discover Features',
    'landing.hero.integratedPlatform': 'Integrated Platform',
    'landing.hero.exploreFeatures': 'Explore Features',
    'landing.hero.platform': 'Cloud Platform',
    'landing.hero.platformDesc': 'Comprehensive web dashboard to manage everything from anywhere',
    'landing.hero.edge': 'Edge Server',
    'landing.hero.edgeDesc': 'Local AI processing that works without internet',
    'landing.hero.mobile': 'Mobile App',
    'landing.hero.mobileDesc': 'Mobile app to monitor alerts and cameras',
    'landing.platform.cloud': 'Cloud Platform',
    'landing.platform.cloudDesc': 'Comprehensive web dashboard to manage everything from anywhere',
    'landing.platform.edge': 'Edge Server',
    'landing.platform.edgeDesc': 'Local AI processing that works without internet',
    'landing.platform.mobile': 'Mobile App',
    'landing.platform.mobileDesc': 'Mobile app to monitor alerts and cameras',
    'landing.hero.stats.clients': 'Active Clients',
    'landing.hero.stats.modules': 'AI Modules',
    'landing.hero.stats.uptime': 'Uptime',
    'landing.hero.stats.support': 'Support',
    'landing.modules.title': 'AI Modules',
    'landing.modules.subtitle': 'Each module is designed to solve a specific problem with the ability to activate automatic commands for each event',
    'landing.modules.badge': '10 Specialized Modules',
    'landing.features.title': 'AI Commands',
    'landing.features.subtitle': 'Define what happens for each event. When fire is detected, activate siren and open emergency doors',
    'landing.features.badge': 'Smart Automation',
    'landing.features.fire.title': 'Fire Detection',
    'landing.features.fire.desc': 'Activate siren + Open emergency doors + Emergency call',
    'landing.features.vip.title': 'VIP Vehicle',
    'landing.features.vip.desc': 'Open gate automatically + Reception notification',
    'landing.features.blacklist.title': 'Blacklist',
    'landing.features.blacklist.desc': 'Immediate security alert + Video recording',
    'landing.pricing.title': 'Choose Your Plan',
    'landing.pricing.subtitle': 'All plans include a 14-day free trial',
    'landing.pricing.badge': 'Flexible Plans',
    'landing.pricing.basic': 'Basic',
    'landing.pricing.professional': 'Professional',
    'landing.pricing.enterprise': 'Enterprise',
    'landing.pricing.perMonth': '/month',
    'landing.pricing.cameras': 'Cameras',
    'landing.pricing.servers': 'Servers',
    'landing.pricing.modules': 'Modules',
    'landing.pricing.faces': 'Face Recognition',
    'landing.pricing.attendance': 'Attendance',
    'landing.pricing.sms': 'SMS',
    'landing.pricing.whatsapp': 'WhatsApp',
    'landing.pricing.emergency': 'Emergency Call',
    'landing.pricing.support': 'Custom Support',
    'landing.pricing.startNow': 'Start Now',
    'landing.pricing.popular': 'Most Popular',
    'landing.contact.title': 'We\'re Here to Help',
    'landing.contact.subtitle': 'Contact us for inquiries or to request a demo',
    'landing.contact.badge': 'Contact Us',
    'landing.contact.phone': 'Phone',
    'landing.contact.email': 'Email',
    'landing.contact.address': 'Address',
    'landing.contact.form.title': 'Send Message',
    'landing.contact.form.name': 'Name',
    'landing.contact.form.email': 'Email',
    'landing.contact.form.phone': 'Phone Number',
    'landing.contact.form.message': 'Your Message...',
    'landing.contact.form.submit': 'Send',
    'landing.contact.form.sending': 'Sending...',
    'landing.contact.form.success': 'Message sent successfully!',
    'landing.contact.form.successDesc': 'We\'ll get back to you soon',
    'landing.nav.home': 'Home',
    'landing.nav.modules': 'Modules',
    'landing.nav.features': 'Features',
    'landing.nav.pricing': 'Pricing',
    'landing.nav.contact': 'Contact',
    'landing.nav.login': 'Login',
    'landing.footer.rights': 'All rights reserved',
    'landing.loading': 'Loading...',
    'landing.unpublished': 'This page is currently unpublished',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as Language) || DEFAULT_LANGUAGE;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    
    // Update document direction
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  // Initialize direction on mount
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, []);

  const isRTL = language === 'ar';

  // Translation function with parameter support
  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[language][key] || translations['ar'][key] || key;
    
    // Replace parameters like {name} with actual values
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
      });
    }
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Export translation type for type safety
export type TranslationKey = keyof typeof translations['ar'];
