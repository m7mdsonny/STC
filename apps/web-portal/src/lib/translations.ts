/**
 * Comprehensive Translations System
 * Complete Arabic and English translations for the entire platform
 */

export type Language = 'ar' | 'en';

export interface Translations {
  // Authentication
  auth: {
    login: string;
    logout: string;
    register: string;
    email: string;
    password: string;
    confirmPassword: string;
    forgotPassword: string;
    resetPassword: string;
    rememberMe: string;
    loginSuccess: string;
    loginFailed: string;
    invalidCredentials: string;
    accountDisabled: string;
  };

  // Navigation
  nav: {
    dashboard: string;
    live: string;
    cameras: string;
    alerts: string;
    analytics: string;
    people: string;
    vehicles: string;
    attendance: string;
    automation: string;
    settings: string;
    team: string;
    guide: string;
  };

  // Admin Navigation
  adminNav: {
    dashboard: string;
    monitor: string;
    organizations: string;
    users: string;
    licenses: string;
    edgeServers: string;
    resellers: string;
    plans: string;
    aiModules: string;
    modelTraining: string;
    integrations: string;
    sms: string;
    notifications: string;
    settings: string;
    superAdmins: string;
    superSettings: string;
    landing: string;
    updates: string;
    systemUpdates: string;
    backups: string;
    aiCommands: string;
    freeTrialRequests: string;
  };

  // Common
  common: {
    add: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    confirm: string;
    search: string;
    filter: string;
    reset: string;
    loading: string;
    noData: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    refresh: string;
    export: string;
    import: string;
    download: string;
    upload: string;
    view: string;
    details: string;
    actions: string;
    status: string;
    date: string;
    time: string;
    name: string;
    description: string;
    active: string;
    inactive: string;
    enabled: string;
    disabled: string;
    yes: string;
    no: string;
    all: string;
    none: string;
    total: string;
    online: string;
    offline: string;
  };

  // Organizations
  organizations: {
    title: string;
    subtitle: string;
    add: string;
    edit: string;
    delete: string;
    name: string;
    nameEn: string;
    email: string;
    phone: string;
    city: string;
    plan: string;
    maxCameras: string;
    maxEdgeServers: string;
    active: string;
    inactive: string;
    stats: string;
    users: string;
    cameras: string;
    edgeServers: string;
    created: string;
    updated: string;
    deleteConfirm: string;
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
    loadError: string;
  };

  // Edge Servers
  edgeServers: {
    title: string;
    subtitle: string;
    add: string;
    edit: string;
    delete: string;
    name: string;
    ipAddress: string;
    location: string;
    license: string;
    status: string;
    version: string;
    online: string;
    offline: string;
    testConnection: string;
    syncConfig: string;
    restart: string;
    edgeId: string;
    edgeKey: string;
    created: string;
    lastSeen: string;
    deleteConfirm: string;
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
    connectionTest: string;
    syncSuccess: string;
  };

  // Cameras
  cameras: {
    title: string;
    subtitle: string;
    add: string;
    edit: string;
    delete: string;
    name: string;
    cameraId: string;
    rtspUrl: string;
    location: string;
    edgeServer: string;
    status: string;
    resolution: string;
    fps: string;
    enabledModules: string;
    username: string;
    password: string;
    online: string;
    offline: string;
    error: string;
    testConnection: string;
    snapshot: string;
    liveStream: string;
    deleteConfirm: string;
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
  };

  // Licenses
  licenses: {
    title: string;
    subtitle: string;
    add: string;
    edit: string;
    delete: string;
    licenseKey: string;
    organization: string;
    plan: string;
    status: string;
    maxCameras: string;
    maxEdgeServers: string;
    startDate: string;
    expiryDate: string;
    active: string;
    expired: string;
    suspended: string;
    activate: string;
    suspend: string;
    renew: string;
    regenerate: string;
    deleteConfirm: string;
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
  };

  // Users
  users: {
    title: string;
    subtitle: string;
    add: string;
    edit: string;
    delete: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    organization: string;
    active: string;
    inactive: string;
    lastLogin: string;
    created: string;
    roles: {
      super_admin: string;
      admin: string;
      owner: string;
      editor: string;
      viewer: string;
    };
    deleteConfirm: string;
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
  };

  // Alerts
  alerts: {
    title: string;
    subtitle: string;
    severity: {
      critical: string;
      high: string;
      medium: string;
      low: string;
      info: string;
    };
    status: {
      new: string;
      acknowledged: string;
      resolved: string;
      falseAlarm: string;
    };
    acknowledge: string;
    resolve: string;
    markFalseAlarm: string;
    camera: string;
    time: string;
    details: string;
    noAlerts: string;
  };

  // Analytics
  analytics: {
    title: string;
    subtitle: string;
    timeSeries: string;
    byModule: string;
    bySeverity: string;
    byCamera: string;
    topCameras: string;
    highRisk: string;
    exportData: string;
    dateRange: string;
    today: string;
    thisWeek: string;
    thisMonth: string;
    custom: string;
  };

  // People
  people: {
    title: string;
    subtitle: string;
    add: string;
    edit: string;
    delete: string;
    personName: string;
    employeeId: string;
    department: string;
    category: string;
    photo: string;
    active: string;
    inactive: string;
    categories: {
      employee: string;
      vip: string;
      visitor: string;
      blacklist: string;
    };
    deleteConfirm: string;
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
  };

  // Vehicles
  vehicles: {
    title: string;
    subtitle: string;
    add: string;
    edit: string;
    delete: string;
    plateNumber: string;
    plateAr: string;
    ownerName: string;
    vehicleType: string;
    vehicleColor: string;
    category: string;
    active: string;
    inactive: string;
    categories: {
      employee: string;
      vip: string;
      visitor: string;
      delivery: string;
      blacklist: string;
    };
    deleteConfirm: string;
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
  };

  // Settings
  settings: {
    title: string;
    subtitle: string;
    organization: string;
    servers: string;
    notifications: string;
    priorities: string;
    security: string;
    save: string;
    saved: string;
    saveError: string;
  };

  // AI Modules
  aiModules: {
    title: string;
    subtitle: string;
    enabled: string;
    disabled: string;
    configure: string;
    enable: string;
    disable: string;
    confidenceThreshold: string;
    alertThreshold: string;
    cooldown: string;
    schedule: string;
    settings: string;
  };

  // Automation
  automation: {
    title: string;
    subtitle: string;
    add: string;
    edit: string;
    delete: string;
    ruleName: string;
    trigger: string;
    action: string;
    enabled: string;
    disabled: string;
    test: string;
    logs: string;
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
  };

  // Free Trial
  freeTrial: {
    title: string;
    subtitle: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    jobTitle: string;
    message: string;
    selectedModules: string;
    status: {
      new: string;
      contacted: string;
      demoScheduled: string;
      demoCompleted: string;
      converted: string;
      rejected: string;
    };
    changeStatus: string;
    adminNotes: string;
    createOrganization: string;
    convertedTo: string;
    viewOrganization: string;
    submissionDate: string;
  };

  // Notifications
  notifications: {
    title: string;
    markRead: string;
    markAllRead: string;
    clear: string;
    clearAll: string;
    settings: string;
    email: string;
    sms: string;
    push: string;
    inApp: string;
    enabled: string;
    disabled: string;
  };

  // Errors
  errors: {
    networkError: string;
    serverError: string;
    notFound: string;
    unauthorized: string;
    forbidden: string;
    validationError: string;
    unknownError: string;
    tryAgain: string;
    contactSupport: string;
  };
}

export const translations: Record<Language, Translations> = {
  ar: {
    auth: {
      login: 'تسجيل الدخول',
      logout: 'تسجيل الخروج',
      register: 'إنشاء حساب',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      confirmPassword: 'تأكيد كلمة المرور',
      forgotPassword: 'نسيت كلمة المرور؟',
      resetPassword: 'إعادة تعيين كلمة المرور',
      rememberMe: 'تذكرني',
      loginSuccess: 'تم تسجيل الدخول بنجاح',
      loginFailed: 'فشل تسجيل الدخول',
      invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      accountDisabled: 'الحساب معطل. يرجى التواصل مع المدير',
    },

    nav: {
      dashboard: 'لوحة التحكم',
      live: 'البث المباشر',
      cameras: 'الكاميرات',
      alerts: 'التنبيهات',
      analytics: 'التحليلات',
      people: 'الأشخاص',
      vehicles: 'المركبات',
      attendance: 'الحضور والانصراف',
      automation: 'الأتمتة',
      settings: 'الإعدادات',
      team: 'الفريق',
      guide: 'دليل المستخدم',
    },

    adminNav: {
      dashboard: 'لوحة التحكم',
      monitor: 'مراقبة النظام',
      organizations: 'المؤسسات',
      users: 'المستخدمين',
      licenses: 'التراخيص',
      edgeServers: 'سيرفرات الحافة',
      resellers: 'الموزعين',
      plans: 'الباقات',
      aiModules: 'موديولات الذكاء الاصطناعي',
      modelTraining: 'تدريب النماذج',
      integrations: 'التكاملات',
      sms: 'الرسائل النصية',
      notifications: 'الإشعارات',
      settings: 'الإعدادات',
      superAdmins: 'مدراء النظام',
      superSettings: 'إعدادات النظام',
      landing: 'صفحة الهبوط',
      updates: 'إعلانات التحديثات',
      systemUpdates: 'نظام التحديثات',
      backups: 'النسخ الاحتياطية',
      aiCommands: 'مركز أوامر الذكاء الاصطناعي',
      freeTrialRequests: 'طلبات التجربة المجانية',
    },

    common: {
      add: 'إضافة',
      edit: 'تعديل',
      delete: 'حذف',
      save: 'حفظ',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      search: 'بحث',
      filter: 'تصفية',
      reset: 'إعادة تعيين',
      loading: 'جاري التحميل...',
      noData: 'لا توجد بيانات',
      error: 'خطأ',
      success: 'نجاح',
      warning: 'تحذير',
      info: 'معلومة',
      refresh: 'تحديث',
      export: 'تصدير',
      import: 'استيراد',
      download: 'تحميل',
      upload: 'رفع',
      view: 'عرض',
      details: 'التفاصيل',
      actions: 'الإجراءات',
      status: 'الحالة',
      date: 'التاريخ',
      time: 'الوقت',
      name: 'الاسم',
      description: 'الوصف',
      active: 'نشط',
      inactive: 'غير نشط',
      enabled: 'مفعّل',
      disabled: 'معطّل',
      yes: 'نعم',
      no: 'لا',
      all: 'الكل',
      none: 'لا شيء',
      total: 'الإجمالي',
      online: 'متصل',
      offline: 'غير متصل',
    },

    organizations: {
      title: 'المؤسسات',
      subtitle: 'إدارة المؤسسات والاشتراكات',
      add: 'إضافة مؤسسة',
      edit: 'تعديل المؤسسة',
      delete: 'حذف المؤسسة',
      name: 'اسم المؤسسة',
      nameEn: 'الاسم بالإنجليزية',
      email: 'البريد الإلكتروني',
      phone: 'رقم الهاتف',
      city: 'المدينة',
      plan: 'الباقة',
      maxCameras: 'الحد الأقصى للكاميرات',
      maxEdgeServers: 'الحد الأقصى للسيرفرات',
      active: 'نشط',
      inactive: 'غير نشط',
      stats: 'الإحصائيات',
      users: 'المستخدمين',
      cameras: 'الكاميرات',
      edgeServers: 'السيرفرات',
      created: 'تاريخ الإنشاء',
      updated: 'تاريخ التحديث',
      deleteConfirm: 'هل أنت متأكد من حذف هذه المؤسسة؟ سيتم حذف جميع البيانات المرتبطة بها.',
      createSuccess: 'تم إنشاء المؤسسة بنجاح',
      updateSuccess: 'تم تحديث المؤسسة بنجاح',
      deleteSuccess: 'تم حذف المؤسسة بنجاح',
      loadError: 'فشل تحميل المؤسسات',
    },

    edgeServers: {
      title: 'سيرفرات الحافة',
      subtitle: 'إدارة سيرفرات Edge للمعالجة المحلية',
      add: 'إضافة سيرفر',
      edit: 'تعديل السيرفر',
      delete: 'حذف السيرفر',
      name: 'اسم السيرفر',
      ipAddress: 'عنوان IP',
      location: 'الموقع',
      license: 'الترخيص',
      status: 'الحالة',
      version: 'الإصدار',
      online: 'متصل',
      offline: 'غير متصل',
      testConnection: 'اختبار الاتصال',
      syncConfig: 'مزامنة الإعدادات',
      restart: 'إعادة التشغيل',
      edgeId: 'معرف السيرفر',
      edgeKey: 'مفتاح السيرفر',
      created: 'تاريخ الإنشاء',
      lastSeen: 'آخر ظهور',
      deleteConfirm: 'هل أنت متأكد من حذف هذا السيرفر؟ سيتم فصل جميع الكاميرات المرتبطة به.',
      createSuccess: 'تم إضافة السيرفر بنجاح',
      updateSuccess: 'تم تحديث السيرفر بنجاح',
      deleteSuccess: 'تم حذف السيرفر بنجاح',
      connectionTest: 'اختبار الاتصال',
      syncSuccess: 'تمت المزامنة بنجاح',
    },

    cameras: {
      title: 'الكاميرات',
      subtitle: 'إدارة الكاميرات ومصادر الفيديو',
      add: 'إضافة كاميرا',
      edit: 'تعديل الكاميرا',
      delete: 'حذف الكاميرا',
      name: 'اسم الكاميرا',
      cameraId: 'معرف الكاميرا',
      rtspUrl: 'رابط RTSP',
      location: 'الموقع',
      edgeServer: 'سيرفر الحافة',
      status: 'الحالة',
      resolution: 'الدقة',
      fps: 'معدل الإطارات',
      enabledModules: 'الوحدات المفعلة',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      online: 'متصلة',
      offline: 'غير متصلة',
      error: 'خطأ',
      testConnection: 'اختبار الاتصال',
      snapshot: 'لقطة',
      liveStream: 'البث المباشر',
      deleteConfirm: 'هل أنت متأكد من حذف هذه الكاميرا؟',
      createSuccess: 'تم إضافة الكاميرا بنجاح',
      updateSuccess: 'تم تحديث الكاميرا بنجاح',
      deleteSuccess: 'تم حذف الكاميرا بنجاح',
    },

    licenses: {
      title: 'التراخيص',
      subtitle: 'إدارة تراخيص النظام والاشتراكات',
      add: 'إضافة ترخيص',
      edit: 'تعديل الترخيص',
      delete: 'حذف الترخيص',
      licenseKey: 'مفتاح الترخيص',
      organization: 'المؤسسة',
      plan: 'الباقة',
      status: 'الحالة',
      maxCameras: 'الحد الأقصى للكاميرات',
      maxEdgeServers: 'الحد الأقصى للسيرفرات',
      startDate: 'تاريخ البدء',
      expiryDate: 'تاريخ الانتهاء',
      active: 'نشط',
      expired: 'منتهي',
      suspended: 'معلق',
      activate: 'تفعيل',
      suspend: 'تعليق',
      renew: 'تجديد',
      regenerate: 'إعادة توليد المفتاح',
      deleteConfirm: 'هل أنت متأكد من حذف هذا الترخيص؟',
      createSuccess: 'تم إنشاء الترخيص بنجاح',
      updateSuccess: 'تم تحديث الترخيص بنجاح',
      deleteSuccess: 'تم حذف الترخيص بنجاح',
    },

    users: {
      title: 'المستخدمين',
      subtitle: 'إدارة المستخدمين والصلاحيات',
      add: 'إضافة مستخدم',
      edit: 'تعديل المستخدم',
      delete: 'حذف المستخدم',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      phone: 'رقم الهاتف',
      role: 'الدور',
      organization: 'المؤسسة',
      active: 'نشط',
      inactive: 'غير نشط',
      lastLogin: 'آخر تسجيل دخول',
      created: 'تاريخ الإنشاء',
      roles: {
        super_admin: 'مدير النظام',
        admin: 'مدير',
        owner: 'مالك',
        editor: 'محرر',
        viewer: 'مشاهد',
      },
      deleteConfirm: 'هل أنت متأكد من حذف هذا المستخدم؟',
      createSuccess: 'تم إضافة المستخدم بنجاح',
      updateSuccess: 'تم تحديث المستخدم بنجاح',
      deleteSuccess: 'تم حذف المستخدم بنجاح',
    },

    alerts: {
      title: 'التنبيهات',
      subtitle: 'مراقبة التنبيهات والأحداث',
      severity: {
        critical: 'حرج',
        high: 'عالي',
        medium: 'متوسط',
        low: 'منخفض',
        info: 'معلومة',
      },
      status: {
        new: 'جديد',
        acknowledged: 'تم الاطلاع',
        resolved: 'تم الحل',
        falseAlarm: 'إنذار خاطئ',
      },
      acknowledge: 'تأكيد الاطلاع',
      resolve: 'حل',
      markFalseAlarm: 'وضع علامة كإنذار خاطئ',
      camera: 'الكاميرا',
      time: 'الوقت',
      details: 'التفاصيل',
      noAlerts: 'لا توجد تنبيهات',
    },

    analytics: {
      title: 'التحليلات',
      subtitle: 'تحليلات متقدمة للأحداث والأداء',
      timeSeries: 'التسلسل الزمني',
      byModule: 'حسب الموديول',
      bySeverity: 'حسب الأهمية',
      byCamera: 'حسب الكاميرا',
      topCameras: 'الكاميرات الأكثر نشاطاً',
      highRisk: 'عالية المخاطر',
      exportData: 'تصدير البيانات',
      dateRange: 'الفترة الزمنية',
      today: 'اليوم',
      thisWeek: 'هذا الأسبوع',
      thisMonth: 'هذا الشهر',
      custom: 'مخصص',
    },

    people: {
      title: 'الأشخاص المسجلين',
      subtitle: 'إدارة قاعدة بيانات التعرف على الوجوه',
      add: 'إضافة شخص',
      edit: 'تعديل بيانات الشخص',
      delete: 'حذف الشخص',
      personName: 'الاسم',
      employeeId: 'رقم الموظف',
      department: 'القسم',
      category: 'الفئة',
      photo: 'الصورة',
      active: 'نشط',
      inactive: 'غير نشط',
      categories: {
        employee: 'موظف',
        vip: 'مميز',
        visitor: 'زائر',
        blacklist: 'قائمة سوداء',
      },
      deleteConfirm: 'هل أنت متأكد من حذف هذا الشخص من قاعدة البيانات؟',
      createSuccess: 'تم إضافة الشخص بنجاح',
      updateSuccess: 'تم تحديث بيانات الشخص بنجاح',
      deleteSuccess: 'تم حذف الشخص بنجاح',
    },

    vehicles: {
      title: 'المركبات المسجلة',
      subtitle: 'إدارة قاعدة بيانات المركبات',
      add: 'إضافة مركبة',
      edit: 'تعديل بيانات المركبة',
      delete: 'حذف المركبة',
      plateNumber: 'رقم اللوحة',
      plateAr: 'رقم اللوحة بالعربية',
      ownerName: 'اسم المالك',
      vehicleType: 'نوع المركبة',
      vehicleColor: 'اللون',
      category: 'الفئة',
      active: 'نشطة',
      inactive: 'غير نشطة',
      categories: {
        employee: 'موظف',
        vip: 'مميز',
        visitor: 'زائر',
        delivery: 'توصيل',
        blacklist: 'قائمة سوداء',
      },
      deleteConfirm: 'هل أنت متأكد من حذف هذه المركبة من قاعدة البيانات؟',
      createSuccess: 'تم إضافة المركبة بنجاح',
      updateSuccess: 'تم تحديث بيانات المركبة بنجاح',
      deleteSuccess: 'تم حذف المركبة بنجاح',
    },

    settings: {
      title: 'الإعدادات',
      subtitle: 'إعدادات النظام والمؤسسة',
      organization: 'المؤسسة',
      servers: 'السيرفرات',
      notifications: 'الإشعارات',
      priorities: 'أولوية التنبيهات',
      security: 'الأمان',
      save: 'حفظ',
      saved: 'تم الحفظ بنجاح',
      saveError: 'فشل حفظ الإعدادات',
    },

    aiModules: {
      title: 'موديولات الذكاء الاصطناعي',
      subtitle: 'إدارة وتكوين وحدات التحليل الذكي',
      enabled: 'مفعّل',
      disabled: 'معطّل',
      configure: 'تكوين',
      enable: 'تفعيل',
      disable: 'تعطيل',
      confidenceThreshold: 'حد الثقة',
      alertThreshold: 'حد التنبيه',
      cooldown: 'فترة الانتظار',
      schedule: 'الجدولة',
      settings: 'الإعدادات',
    },

    automation: {
      title: 'الأتمتة',
      subtitle: 'إدارة قواعد الأتمتة والأوامر التلقائية',
      add: 'إضافة قاعدة',
      edit: 'تعديل القاعدة',
      delete: 'حذف القاعدة',
      ruleName: 'اسم القاعدة',
      trigger: 'المحفز',
      action: 'الإجراء',
      enabled: 'مفعّلة',
      disabled: 'معطّلة',
      test: 'اختبار',
      logs: 'السجلات',
      createSuccess: 'تم إنشاء القاعدة بنجاح',
      updateSuccess: 'تم تحديث القاعدة بنجاح',
      deleteSuccess: 'تم حذف القاعدة بنجاح',
    },

    freeTrial: {
      title: 'طلبات التجربة المجانية',
      subtitle: 'إدارة طلبات التجربة المجانية والتحويل إلى مؤسسات',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      phone: 'رقم الهاتف',
      company: 'اسم الشركة',
      jobTitle: 'المسمى الوظيفي',
      message: 'الرسالة',
      selectedModules: 'الوحدات المطلوبة',
      status: {
        new: 'جديد',
        contacted: 'تم التواصل',
        demoScheduled: 'تم جدولة العرض',
        demoCompleted: 'اكتمل العرض',
        converted: 'تم التحويل',
        rejected: 'مرفوض',
      },
      changeStatus: 'تغيير الحالة',
      adminNotes: 'ملاحظات الإدارة',
      createOrganization: 'إنشاء مؤسسة من الطلب',
      convertedTo: 'تم التحويل إلى مؤسسة',
      viewOrganization: 'عرض المؤسسة',
      submissionDate: 'تاريخ الإرسال',
    },

    notifications: {
      title: 'الإشعارات',
      markRead: 'وضع علامة كمقروء',
      markAllRead: 'وضع علامة على الكل كمقروء',
      clear: 'مسح',
      clearAll: 'مسح الكل',
      settings: 'إعدادات الإشعارات',
      email: 'البريد الإلكتروني',
      sms: 'رسائل SMS',
      push: 'إشعارات الدفع',
      inApp: 'داخل التطبيق',
      enabled: 'مفعّل',
      disabled: 'معطّل',
    },

    errors: {
      networkError: 'خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت.',
      serverError: 'خطأ في الخادم. يرجى المحاولة لاحقاً.',
      notFound: 'المورد المطلوب غير موجود.',
      unauthorized: 'غير مصرح. يرجى تسجيل الدخول.',
      forbidden: 'ليس لديك صلاحية للوصول إلى هذا المورد.',
      validationError: 'البيانات المدخلة غير صحيحة. يرجى مراجعة الحقول.',
      unknownError: 'حدث خطأ غير متوقع.',
      tryAgain: 'يرجى المحاولة مرة أخرى',
      contactSupport: 'إذا استمرت المشكلة، يرجى الاتصال بالدعم الفني',
    },
  },

  en: {
    auth: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password?',
      resetPassword: 'Reset Password',
      rememberMe: 'Remember Me',
      loginSuccess: 'Login successful',
      loginFailed: 'Login failed',
      invalidCredentials: 'Invalid email or password',
      accountDisabled: 'Account is disabled. Please contact administrator',
    },

    nav: {
      dashboard: 'Dashboard',
      live: 'Live View',
      cameras: 'Cameras',
      alerts: 'Alerts',
      analytics: 'Analytics',
      people: 'People',
      vehicles: 'Vehicles',
      attendance: 'Attendance',
      automation: 'Automation',
      settings: 'Settings',
      team: 'Team',
      guide: 'Guide',
    },

    adminNav: {
      dashboard: 'Dashboard',
      monitor: 'System Monitor',
      organizations: 'Organizations',
      users: 'Users',
      licenses: 'Licenses',
      edgeServers: 'Edge Servers',
      resellers: 'Resellers',
      plans: 'Plans',
      aiModules: 'AI Modules',
      modelTraining: 'Model Training',
      integrations: 'Integrations',
      sms: 'SMS',
      notifications: 'Notifications',
      settings: 'Settings',
      superAdmins: 'Super Admins',
      superSettings: 'System Settings',
      landing: 'Landing Page',
      updates: 'Updates',
      systemUpdates: 'System Updates',
      backups: 'Backups',
      aiCommands: 'AI Command Center',
      freeTrialRequests: 'Free Trial Requests',
    },

    common: {
      add: 'Add',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      search: 'Search',
      filter: 'Filter',
      reset: 'Reset',
      loading: 'Loading...',
      noData: 'No data',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Info',
      refresh: 'Refresh',
      export: 'Export',
      import: 'Import',
      download: 'Download',
      upload: 'Upload',
      view: 'View',
      details: 'Details',
      actions: 'Actions',
      status: 'Status',
      date: 'Date',
      time: 'Time',
      name: 'Name',
      description: 'Description',
      active: 'Active',
      inactive: 'Inactive',
      enabled: 'Enabled',
      disabled: 'Disabled',
      yes: 'Yes',
      no: 'No',
      all: 'All',
      none: 'None',
      total: 'Total',
      online: 'Online',
      offline: 'Offline',
    },

    organizations: {
      title: 'Organizations',
      subtitle: 'Manage organizations and subscriptions',
      add: 'Add Organization',
      edit: 'Edit Organization',
      delete: 'Delete Organization',
      name: 'Organization Name',
      nameEn: 'Name in English',
      email: 'Email',
      phone: 'Phone',
      city: 'City',
      plan: 'Plan',
      maxCameras: 'Max Cameras',
      maxEdgeServers: 'Max Edge Servers',
      active: 'Active',
      inactive: 'Inactive',
      stats: 'Statistics',
      users: 'Users',
      cameras: 'Cameras',
      edgeServers: 'Edge Servers',
      created: 'Created At',
      updated: 'Updated At',
      deleteConfirm: 'Are you sure you want to delete this organization? All associated data will be deleted.',
      createSuccess: 'Organization created successfully',
      updateSuccess: 'Organization updated successfully',
      deleteSuccess: 'Organization deleted successfully',
      loadError: 'Failed to load organizations',
    },

    edgeServers: {
      title: 'Edge Servers',
      subtitle: 'Manage Edge servers for local processing',
      add: 'Add Server',
      edit: 'Edit Server',
      delete: 'Delete Server',
      name: 'Server Name',
      ipAddress: 'IP Address',
      location: 'Location',
      license: 'License',
      status: 'Status',
      version: 'Version',
      online: 'Online',
      offline: 'Offline',
      testConnection: 'Test Connection',
      syncConfig: 'Sync Configuration',
      restart: 'Restart',
      edgeId: 'Edge ID',
      edgeKey: 'Edge Key',
      created: 'Created At',
      lastSeen: 'Last Seen',
      deleteConfirm: 'Are you sure you want to delete this server? All cameras will be disconnected.',
      createSuccess: 'Server added successfully',
      updateSuccess: 'Server updated successfully',
      deleteSuccess: 'Server deleted successfully',
      connectionTest: 'Connection Test',
      syncSuccess: 'Sync completed successfully',
    },

    cameras: {
      title: 'Cameras',
      subtitle: 'Manage cameras and video sources',
      add: 'Add Camera',
      edit: 'Edit Camera',
      delete: 'Delete Camera',
      name: 'Camera Name',
      cameraId: 'Camera ID',
      rtspUrl: 'RTSP URL',
      location: 'Location',
      edgeServer: 'Edge Server',
      status: 'Status',
      resolution: 'Resolution',
      fps: 'FPS',
      enabledModules: 'Enabled Modules',
      username: 'Username',
      password: 'Password',
      online: 'Online',
      offline: 'Offline',
      error: 'Error',
      testConnection: 'Test Connection',
      snapshot: 'Snapshot',
      liveStream: 'Live Stream',
      deleteConfirm: 'Are you sure you want to delete this camera?',
      createSuccess: 'Camera added successfully',
      updateSuccess: 'Camera updated successfully',
      deleteSuccess: 'Camera deleted successfully',
    },

    licenses: {
      title: 'Licenses',
      subtitle: 'Manage system licenses and subscriptions',
      add: 'Add License',
      edit: 'Edit License',
      delete: 'Delete License',
      licenseKey: 'License Key',
      organization: 'Organization',
      plan: 'Plan',
      status: 'Status',
      maxCameras: 'Max Cameras',
      maxEdgeServers: 'Max Edge Servers',
      startDate: 'Start Date',
      expiryDate: 'Expiry Date',
      active: 'Active',
      expired: 'Expired',
      suspended: 'Suspended',
      activate: 'Activate',
      suspend: 'Suspend',
      renew: 'Renew',
      regenerate: 'Regenerate Key',
      deleteConfirm: 'Are you sure you want to delete this license?',
      createSuccess: 'License created successfully',
      updateSuccess: 'License updated successfully',
      deleteSuccess: 'License deleted successfully',
    },

    users: {
      title: 'Users',
      subtitle: 'Manage users and permissions',
      add: 'Add User',
      edit: 'Edit User',
      delete: 'Delete User',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      role: 'Role',
      organization: 'Organization',
      active: 'Active',
      inactive: 'Inactive',
      lastLogin: 'Last Login',
      created: 'Created At',
      roles: {
        super_admin: 'Super Admin',
        admin: 'Admin',
        owner: 'Owner',
        editor: 'Editor',
        viewer: 'Viewer',
      },
      deleteConfirm: 'Are you sure you want to delete this user?',
      createSuccess: 'User added successfully',
      updateSuccess: 'User updated successfully',
      deleteSuccess: 'User deleted successfully',
    },

    alerts: {
      title: 'Alerts',
      subtitle: 'Monitor alerts and events',
      severity: {
        critical: 'Critical',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
        info: 'Info',
      },
      status: {
        new: 'New',
        acknowledged: 'Acknowledged',
        resolved: 'Resolved',
        falseAlarm: 'False Alarm',
      },
      acknowledge: 'Acknowledge',
      resolve: 'Resolve',
      markFalseAlarm: 'Mark as False Alarm',
      camera: 'Camera',
      time: 'Time',
      details: 'Details',
      noAlerts: 'No alerts',
    },

    analytics: {
      title: 'Analytics',
      subtitle: 'Advanced analytics for events and performance',
      timeSeries: 'Time Series',
      byModule: 'By Module',
      bySeverity: 'By Severity',
      byCamera: 'By Camera',
      topCameras: 'Top Cameras',
      highRisk: 'High Risk',
      exportData: 'Export Data',
      dateRange: 'Date Range',
      today: 'Today',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      custom: 'Custom',
    },

    people: {
      title: 'Registered People',
      subtitle: 'Manage face recognition database',
      add: 'Add Person',
      edit: 'Edit Person',
      delete: 'Delete Person',
      personName: 'Name',
      employeeId: 'Employee ID',
      department: 'Department',
      category: 'Category',
      photo: 'Photo',
      active: 'Active',
      inactive: 'Inactive',
      categories: {
        employee: 'Employee',
        vip: 'VIP',
        visitor: 'Visitor',
        blacklist: 'Blacklist',
      },
      deleteConfirm: 'Are you sure you want to delete this person from the database?',
      createSuccess: 'Person added successfully',
      updateSuccess: 'Person updated successfully',
      deleteSuccess: 'Person deleted successfully',
    },

    vehicles: {
      title: 'Registered Vehicles',
      subtitle: 'Manage vehicle database',
      add: 'Add Vehicle',
      edit: 'Edit Vehicle',
      delete: 'Delete Vehicle',
      plateNumber: 'Plate Number',
      plateAr: 'Plate Number (Arabic)',
      ownerName: 'Owner Name',
      vehicleType: 'Vehicle Type',
      vehicleColor: 'Color',
      category: 'Category',
      active: 'Active',
      inactive: 'Inactive',
      categories: {
        employee: 'Employee',
        vip: 'VIP',
        visitor: 'Visitor',
        delivery: 'Delivery',
        blacklist: 'Blacklist',
      },
      deleteConfirm: 'Are you sure you want to delete this vehicle from the database?',
      createSuccess: 'Vehicle added successfully',
      updateSuccess: 'Vehicle updated successfully',
      deleteSuccess: 'Vehicle deleted successfully',
    },

    settings: {
      title: 'Settings',
      subtitle: 'System and organization settings',
      organization: 'Organization',
      servers: 'Servers',
      notifications: 'Notifications',
      priorities: 'Alert Priorities',
      security: 'Security',
      save: 'Save',
      saved: 'Saved successfully',
      saveError: 'Failed to save settings',
    },

    aiModules: {
      title: 'AI Modules',
      subtitle: 'Manage and configure AI analysis modules',
      enabled: 'Enabled',
      disabled: 'Disabled',
      configure: 'Configure',
      enable: 'Enable',
      disable: 'Disable',
      confidenceThreshold: 'Confidence Threshold',
      alertThreshold: 'Alert Threshold',
      cooldown: 'Cooldown',
      schedule: 'Schedule',
      settings: 'Settings',
    },

    automation: {
      title: 'Automation',
      subtitle: 'Manage automation rules and automatic commands',
      add: 'Add Rule',
      edit: 'Edit Rule',
      delete: 'Delete Rule',
      ruleName: 'Rule Name',
      trigger: 'Trigger',
      action: 'Action',
      enabled: 'Enabled',
      disabled: 'Disabled',
      test: 'Test',
      logs: 'Logs',
      createSuccess: 'Rule created successfully',
      updateSuccess: 'Rule updated successfully',
      deleteSuccess: 'Rule deleted successfully',
    },

    freeTrial: {
      title: 'Free Trial Requests',
      subtitle: 'Manage free trial requests and convert to organizations',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      company: 'Company Name',
      jobTitle: 'Job Title',
      message: 'Message',
      selectedModules: 'Selected Modules',
      status: {
        new: 'New',
        contacted: 'Contacted',
        demoScheduled: 'Demo Scheduled',
        demoCompleted: 'Demo Completed',
        converted: 'Converted',
        rejected: 'Rejected',
      },
      changeStatus: 'Change Status',
      adminNotes: 'Admin Notes',
      createOrganization: 'Create Organization from Request',
      convertedTo: 'Converted to Organization',
      viewOrganization: 'View Organization',
      submissionDate: 'Submission Date',
    },

    notifications: {
      title: 'Notifications',
      markRead: 'Mark as Read',
      markAllRead: 'Mark All as Read',
      clear: 'Clear',
      clearAll: 'Clear All',
      settings: 'Notification Settings',
      email: 'Email',
      sms: 'SMS',
      push: 'Push Notifications',
      inApp: 'In-App',
      enabled: 'Enabled',
      disabled: 'Disabled',
    },

    errors: {
      networkError: 'Network error. Please check your internet connection.',
      serverError: 'Server error. Please try again later.',
      notFound: 'Resource not found.',
      unauthorized: 'Unauthorized. Please login.',
      forbidden: 'You do not have permission to access this resource.',
      validationError: 'Invalid input. Please check the fields.',
      unknownError: 'An unexpected error occurred.',
      tryAgain: 'Please try again',
      contactSupport: 'If the problem persists, please contact support',
    },
  },
};

/**
 * Get translation for current language
 */
export function getTranslation(lang: Language = 'ar'): Translations {
  return translations[lang];
}

/**
 * Get nested translation value
 */
export function t(key: string, lang: Language = 'ar'): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
}

/**
 * Format date in Arabic or English
 */
export function formatDate(date: Date | string, lang: Language = 'ar'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = lang === 'ar' ? 'ar-SA' : 'en-US';
  
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string, lang: Language = 'ar'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = lang === 'ar' ? 'ar-SA' : 'en-US';
  
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
