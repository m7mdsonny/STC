import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Language type
export type Language = 'ar' | 'en';

// Translation context type
interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  dir: 'rtl' | 'ltr';
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Complete translations object
const translations = {
  ar: {
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.live': 'البث المباشر',
    'nav.cameras': 'الكاميرات',
    'nav.alerts': 'التنبيهات',
    'nav.analytics': 'التحليلات',
    'nav.people': 'الأشخاص',
    'nav.vehicles': 'المركبات',
    'nav.attendance': 'الحضور والانصراف',
    'nav.automation': 'الأتمتة',
    'nav.settings': 'الإعدادات',
    'nav.team': 'الفريق',
    'nav.guide': 'الدليل',
    
    // Admin Navigation
    'admin.dashboard': 'لوحة التحكم',
    'admin.monitor': 'مراقبة النظام',
    'admin.organizations': 'المؤسسات',
    'admin.users': 'المستخدمين',
    'admin.licenses': 'التراخيص',
    'admin.edgeServers': 'سيرفرات الحافة',
    'admin.resellers': 'الموزعين',
    'admin.plans': 'الباقات',
    'admin.aiModules': 'موديولات الذكاء الاصطناعي',
    'admin.integrations': 'التكاملات',
    'admin.notifications': 'الإشعارات',
    'admin.settings': 'الإعدادات',
    'admin.backups': 'النسخ الاحتياطية',
    'admin.freeTrialRequests': 'طلبات التجربة المجانية',
    
    // Common
    'common.add': 'إضافة',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.confirm': 'تأكيد',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.loading': 'جاري التحميل...',
    'common.noData': 'لا توجد بيانات',
    'common.success': 'نجاح',
    'common.error': 'خطأ',
    'common.refresh': 'تحديث',
    'common.view': 'عرض',
    'common.details': 'التفاصيل',
    'common.actions': 'الإجراءات',
    'common.status': 'الحالة',
    'common.name': 'الاسم',
    'common.active': 'نشط',
    'common.inactive': 'غير نشط',
    'common.online': 'متصل',
    'common.offline': 'غير متصل',
    
    // Landing Page
    'landing.nav.home': 'الرئيسية',
    'landing.nav.modules': 'الموديولات',
    'landing.nav.features': 'المميزات',
    'landing.nav.pricing': 'الأسعار',
    'landing.nav.contact': 'تواصل معنا',
    'landing.nav.login': 'تسجيل الدخول',
    'landing.hero.title': 'حول كاميراتك الى عيون ذكية',
    'landing.hero.ai': 'بالذكاء الاصطناعي',
    'landing.hero.subtitle': 'منصة تحليل الفيديو بالذكاء الاصطناعي - 10 موديولات متخصصة للمراقبة الذكية والأتمتة الكاملة',
    'landing.hero.cta': 'ابدأ الآن',
    'landing.hero.exploreFeatures': 'استكشف المميزات',
    'landing.hero.integratedPlatform': 'منصة متكاملة',
    'landing.hero.notPublished': 'الصفحة غير منشورة - معاينة فقط',
    'landing.platform.cloud': 'Cloud Portal',
    'landing.platform.cloudDesc': 'لوحة تحكم سحابية شاملة',
    'landing.platform.edge': 'Edge Server',
    'landing.platform.edgeDesc': 'معالجة محلية فورية',
    'landing.platform.mobile': 'Mobile App',
    'landing.platform.mobileDesc': 'تطبيق موبايل متقدم',
    
    // Authentication
    'auth.login': 'تسجيل الدخول',
    'auth.logout': 'تسجيل الخروج',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.rememberMe': 'تذكرني',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.loginSuccess': 'تم تسجيل الدخول بنجاح',
    'auth.loginFailed': 'فشل تسجيل الدخول',
    'auth.invalidCredentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    
    // Organizations
    'org.title': 'المؤسسات',
    'org.add': 'إضافة مؤسسة',
    'org.edit': 'تعديل المؤسسة',
    'org.delete': 'حذف المؤسسة',
    'org.name': 'اسم المؤسسة',
    'org.email': 'البريد الإلكتروني',
    'org.phone': 'رقم الهاتف',
    'org.city': 'المدينة',
    'org.plan': 'الباقة',
    'org.maxCameras': 'الحد الأقصى للكاميرات',
    'org.maxEdgeServers': 'الحد الأقصى للسيرفرات',
    'org.createSuccess': 'تم إنشاء المؤسسة بنجاح',
    'org.updateSuccess': 'تم تحديث المؤسسة بنجاح',
    'org.deleteSuccess': 'تم حذف المؤسسة بنجاح',
    'org.deleteConfirm': 'هل أنت متأكد من حذف هذه المؤسسة؟ سيتم حذف جميع البيانات المرتبطة.',
    
    // Edge Servers
    'server.title': 'سيرفرات الحافة',
    'server.add': 'إضافة سيرفر',
    'server.edit': 'تعديل السيرفر',
    'server.delete': 'حذف السيرفر',
    'server.name': 'اسم السيرفر',
    'server.ipAddress': 'عنوان IP',
    'server.location': 'الموقع',
    'server.license': 'الترخيص',
    'server.status': 'الحالة',
    'server.online': 'متصل',
    'server.offline': 'غير متصل',
    'server.testConnection': 'اختبار الاتصال',
    'server.syncConfig': 'مزامنة الإعدادات',
    'server.createSuccess': 'تم إضافة السيرفر بنجاح',
    'server.updateSuccess': 'تم تحديث السيرفر بنجاح',
    'server.deleteSuccess': 'تم حذف السيرفر بنجاح',
    
    // Cameras
    'camera.title': 'الكاميرات',
    'camera.add': 'إضافة كاميرا',
    'camera.edit': 'تعديل الكاميرا',
    'camera.delete': 'حذف الكاميرا',
    'camera.name': 'اسم الكاميرا',
    'camera.rtspUrl': 'رابط RTSP',
    'camera.location': 'الموقع',
    'camera.edgeServer': 'سيرفر الحافة',
    'camera.status': 'الحالة',
    'camera.online': 'متصلة',
    'camera.offline': 'غير متصلة',
    'camera.createSuccess': 'تم إضافة الكاميرا بنجاح',
    'camera.updateSuccess': 'تم تحديث الكاميرا بنجاح',
    'camera.deleteSuccess': 'تم حذف الكاميرا بنجاح',
    
    // Alerts
    'alert.title': 'التنبيهات',
    'alert.severity.critical': 'حرج',
    'alert.severity.high': 'عالي',
    'alert.severity.medium': 'متوسط',
    'alert.severity.low': 'منخفض',
    'alert.status.new': 'جديد',
    'alert.status.acknowledged': 'تم الاطلاع',
    'alert.status.resolved': 'تم الحل',
    'alert.acknowledge': 'تأكيد الاطلاع',
    'alert.resolve': 'حل',
    
    // People
    'people.title': 'الأشخاص المسجلين',
    'people.add': 'إضافة شخص',
    'people.personName': 'الاسم',
    'people.employeeId': 'رقم الموظف',
    'people.department': 'القسم',
    'people.category': 'الفئة',
    'people.category.employee': 'موظف',
    'people.category.vip': 'مميز',
    'people.category.visitor': 'زائر',
    'people.category.blacklist': 'قائمة سوداء',
    
    // Vehicles
    'vehicle.title': 'المركبات المسجلة',
    'vehicle.add': 'إضافة مركبة',
    'vehicle.plateNumber': 'رقم اللوحة',
    'vehicle.ownerName': 'اسم المالك',
    'vehicle.category': 'الفئة',
    'vehicle.category.employee': 'موظف',
    'vehicle.category.vip': 'مميز',
    'vehicle.category.visitor': 'زائر',
    'vehicle.category.delivery': 'توصيل',
    'vehicle.category.blacklist': 'قائمة سوداء',
    
    // Errors
    'error.networkError': 'خطأ في الاتصال بالشبكة',
    'error.serverError': 'خطأ في الخادم',
    'error.notFound': 'المورد المطلوب غير موجود',
    'error.unauthorized': 'غير مصرح - يرجى تسجيل الدخول',
    'error.forbidden': 'ليس لديك صلاحية للوصول',
    'error.validationError': 'البيانات المدخلة غير صحيحة',
    'error.tryAgain': 'يرجى المحاولة مرة أخرى',
    'error.contactSupport': 'يرجى الاتصال بالدعم الفني',
  },
  
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.live': 'Live View',
    'nav.cameras': 'Cameras',
    'nav.alerts': 'Alerts',
    'nav.analytics': 'Analytics',
    'nav.people': 'People',
    'nav.vehicles': 'Vehicles',
    'nav.attendance': 'Attendance',
    'nav.automation': 'Automation',
    'nav.settings': 'Settings',
    'nav.team': 'Team',
    'nav.guide': 'Guide',
    
    // Admin Navigation
    'admin.dashboard': 'Dashboard',
    'admin.monitor': 'System Monitor',
    'admin.organizations': 'Organizations',
    'admin.users': 'Users',
    'admin.licenses': 'Licenses',
    'admin.edgeServers': 'Edge Servers',
    'admin.resellers': 'Resellers',
    'admin.plans': 'Plans',
    'admin.aiModules': 'AI Modules',
    'admin.integrations': 'Integrations',
    'admin.notifications': 'Notifications',
    'admin.settings': 'Settings',
    'admin.backups': 'Backups',
    'admin.freeTrialRequests': 'Free Trial Requests',
    
    // Common
    'common.add': 'Add',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.loading': 'Loading...',
    'common.noData': 'No data',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.refresh': 'Refresh',
    'common.view': 'View',
    'common.details': 'Details',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.name': 'Name',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.online': 'Online',
    'common.offline': 'Offline',
    
    // Landing Page
    'landing.nav.home': 'Home',
    'landing.nav.modules': 'Modules',
    'landing.nav.features': 'Features',
    'landing.nav.pricing': 'Pricing',
    'landing.nav.contact': 'Contact',
    'landing.nav.login': 'Login',
    'landing.hero.title': 'Transform Your Cameras into Smart Eyes',
    'landing.hero.ai': 'with Artificial Intelligence',
    'landing.hero.subtitle': 'AI-powered video analytics platform - 10 specialized modules for intelligent monitoring and complete automation',
    'landing.hero.cta': 'Get Started',
    'landing.hero.exploreFeatures': 'Explore Features',
    'landing.hero.integratedPlatform': 'Integrated Platform',
    'landing.hero.notPublished': 'Page not published - Preview only',
    'landing.platform.cloud': 'Cloud Portal',
    'landing.platform.cloudDesc': 'Comprehensive cloud dashboard',
    'landing.platform.edge': 'Edge Server',
    'landing.platform.edgeDesc': 'Instant local processing',
    'landing.platform.mobile': 'Mobile App',
    'landing.platform.mobileDesc': 'Advanced mobile application',
    
    // Authentication
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.rememberMe': 'Remember Me',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.loginSuccess': 'Login successful',
    'auth.loginFailed': 'Login failed',
    'auth.invalidCredentials': 'Invalid email or password',
    
    // Organizations
    'org.title': 'Organizations',
    'org.add': 'Add Organization',
    'org.edit': 'Edit Organization',
    'org.delete': 'Delete Organization',
    'org.name': 'Organization Name',
    'org.email': 'Email',
    'org.phone': 'Phone',
    'org.city': 'City',
    'org.plan': 'Plan',
    'org.maxCameras': 'Max Cameras',
    'org.maxEdgeServers': 'Max Edge Servers',
    'org.createSuccess': 'Organization created successfully',
    'org.updateSuccess': 'Organization updated successfully',
    'org.deleteSuccess': 'Organization deleted successfully',
    'org.deleteConfirm': 'Are you sure you want to delete this organization? All associated data will be deleted.',
    
    // Edge Servers
    'server.title': 'Edge Servers',
    'server.add': 'Add Server',
    'server.edit': 'Edit Server',
    'server.delete': 'Delete Server',
    'server.name': 'Server Name',
    'server.ipAddress': 'IP Address',
    'server.location': 'Location',
    'server.license': 'License',
    'server.status': 'Status',
    'server.online': 'Online',
    'server.offline': 'Offline',
    'server.testConnection': 'Test Connection',
    'server.syncConfig': 'Sync Configuration',
    'server.createSuccess': 'Server added successfully',
    'server.updateSuccess': 'Server updated successfully',
    'server.deleteSuccess': 'Server deleted successfully',
    
    // Cameras
    'camera.title': 'Cameras',
    'camera.add': 'Add Camera',
    'camera.edit': 'Edit Camera',
    'camera.delete': 'Delete Camera',
    'camera.name': 'Camera Name',
    'camera.rtspUrl': 'RTSP URL',
    'camera.location': 'Location',
    'camera.edgeServer': 'Edge Server',
    'camera.status': 'Status',
    'camera.online': 'Online',
    'camera.offline': 'Offline',
    'camera.createSuccess': 'Camera added successfully',
    'camera.updateSuccess': 'Camera updated successfully',
    'camera.deleteSuccess': 'Camera deleted successfully',
    
    // Alerts
    'alert.title': 'Alerts',
    'alert.severity.critical': 'Critical',
    'alert.severity.high': 'High',
    'alert.severity.medium': 'Medium',
    'alert.severity.low': 'Low',
    'alert.status.new': 'New',
    'alert.status.acknowledged': 'Acknowledged',
    'alert.status.resolved': 'Resolved',
    'alert.acknowledge': 'Acknowledge',
    'alert.resolve': 'Resolve',
    
    // People
    'people.title': 'Registered People',
    'people.add': 'Add Person',
    'people.personName': 'Name',
    'people.employeeId': 'Employee ID',
    'people.department': 'Department',
    'people.category': 'Category',
    'people.category.employee': 'Employee',
    'people.category.vip': 'VIP',
    'people.category.visitor': 'Visitor',
    'people.category.blacklist': 'Blacklist',
    
    // Vehicles
    'vehicle.title': 'Registered Vehicles',
    'vehicle.add': 'Add Vehicle',
    'vehicle.plateNumber': 'Plate Number',
    'vehicle.ownerName': 'Owner Name',
    'vehicle.category': 'Category',
    'vehicle.category.employee': 'Employee',
    'vehicle.category.vip': 'VIP',
    'vehicle.category.visitor': 'Visitor',
    'vehicle.category.delivery': 'Delivery',
    'vehicle.category.blacklist': 'Blacklist',
    
    // Errors
    'error.networkError': 'Network error',
    'error.serverError': 'Server error',
    'error.notFound': 'Resource not found',
    'error.unauthorized': 'Unauthorized - Please login',
    'error.forbidden': 'You do not have permission to access',
    'error.validationError': 'Invalid input',
    'error.tryAgain': 'Please try again',
    'error.contactSupport': 'Please contact support',
  },
};

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default language is Arabic
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('app_language');
    return (stored === 'en' || stored === 'ar') ? stored : 'ar';
  });

  // Set language and persist to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
    
    // Update HTML dir and lang attributes
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  // Initialize HTML attributes
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Translation function
  const t = (key: string, fallback?: string): string => {
    const translation = translations[language][key as keyof typeof translations['ar']];
    
    if (!translation) {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] Missing translation for key: "${key}" in language: "${language}"`);
      }
      return fallback || key;
    }
    
    return translation;
  };

  const value: I18nContextType = {
    language,
    setLanguage,
    t,
    dir: language === 'ar' ? 'rtl' : 'ltr',
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};

// Helper hook for easy translation
export const useTranslation = () => {
  const { t, language } = useI18n();
  return { t, language };
};

// Format date according to language
export const formatDate = (date: Date | string, language: Language = 'ar'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Format date with time
export const formatDateTime = (date: Date | string, language: Language = 'ar'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
