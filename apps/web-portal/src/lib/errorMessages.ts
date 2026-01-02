/**
 * Centralized error message translations
 * Maps common error codes/messages to user-friendly Arabic messages
 */

export const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  'Invalid credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  'Invalid credentials provided.': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  'Login failed': 'فشل تسجيل الدخول',
  'Unauthenticated': 'يرجى تسجيل الدخول أولاً',
  'Unauthorized': 'ليس لديك صلاحية للوصول إلى هذا المورد',
  'Forbidden': 'غير مصرح لك بالوصول إلى هذا المورد',
  'Account is disabled': 'الحساب معطل. يرجى التواصل مع المدير',
  
  // Validation errors
  'Validation failed': 'البيانات المدخلة غير صحيحة',
  'Required field': 'هذا الحقل مطلوب',
  'Invalid email': 'البريد الإلكتروني غير صحيح',
  'Password too short': 'كلمة المرور قصيرة جداً (الحد الأدنى 6 أحرف)',
  'Passwords do not match': 'كلمات المرور غير متطابقة',
  'Email already exists': 'البريد الإلكتروني مسجل مسبقاً',
  'Phone already exists': 'رقم الهاتف مسجل مسبقاً',
  
  // Resource errors
  'Not found': 'المورد المطلوب غير موجود',
  'Resource not found': 'المورد المطلوب غير موجود',
  'Already exists': 'هذا المورد موجود مسبقاً',
  'Duplicate entry': 'هذا السجل موجود مسبقاً',
  
  // Network errors
  'Network error': 'خطأ في الاتصال بالشبكة. يرجى المحاولة مرة أخرى',
  'Request timeout': 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى',
  'Server error': 'خطأ في الخادم. يرجى المحاولة لاحقاً',
  'Service unavailable': 'الخدمة غير متاحة حالياً',
  
  // File upload errors
  'File too large': 'حجم الملف كبير جداً',
  'Invalid file type': 'نوع الملف غير مدعوم',
  'Upload failed': 'فشل رفع الملف',
  
  // Organization errors
  'Organization not found': 'المؤسسة غير موجودة',
  'Organization ID is required': 'معرف المؤسسة مطلوب',
  'Cannot create super admin users': 'لا يمكن إنشاء مستخدمين سوبر أدمن',
  'Cannot assign super admin role': 'لا يمكن تعيين دور سوبر أدمن',
  
  // Permission errors
  'Insufficient permissions': 'ليس لديك صلاحية كافية',
  'Permission denied': 'تم رفض الصلاحية',
  'Access denied': 'تم رفض الوصول',
  
  // Edge Server errors
  'Edge server not found': 'سيرفر الحافة غير موجود',
  'Edge server offline': 'سيرفر الحافة غير متصل',
  'Failed to connect to edge server': 'فشل الاتصال بسيرفر الحافة',
  
  // Camera errors
  'Camera not found': 'الكاميرا غير موجودة',
  'Camera offline': 'الكاميرا غير متصلة',
  'Invalid RTSP URL': 'رابط RTSP غير صحيح',
  'Failed to test camera connection': 'فشل اختبار اتصال الكاميرا',
  
  // License errors
  'License expired': 'الترخيص منتهي الصلاحية',
  'License invalid': 'الترخيص غير صحيح',
  'License limit reached': 'تم الوصول إلى الحد الأقصى للترخيص',
  
  // Generic
  'An error occurred': 'حدث خطأ',
  'Operation failed': 'فشلت العملية',
  'Something went wrong': 'حدث خطأ غير متوقع',
};

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown, defaultMessage?: string): string {
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error || defaultMessage || 'حدث خطأ';
  }

  if (error instanceof Error) {
    const message = error.message;
    
    // Check if message exists in our translations
    if (ERROR_MESSAGES[message]) {
      return ERROR_MESSAGES[message];
    }
    
    // Check for common patterns
    for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    
    return message || defaultMessage || 'حدث خطأ';
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    
    // Laravel validation errors
    if (err.errors && typeof err.errors === 'object') {
      const errors = err.errors as Record<string, string[]>;
      const firstError = Object.values(errors)[0]?.[0];
      if (firstError) {
        return ERROR_MESSAGES[firstError] || firstError;
      }
    }
    
    // API error response
    if (err.message && typeof err.message === 'string') {
      return ERROR_MESSAGES[err.message] || err.message;
    }
    
    if (err.error && typeof err.error === 'string') {
      return ERROR_MESSAGES[err.error] || err.error;
    }
  }

  return defaultMessage || 'حدث خطأ غير متوقع';
}

/**
 * Get detailed error message with context
 */
export function getDetailedErrorMessage(
  error: unknown,
  action: string,
  defaultMessage?: string
): { title: string; message: string } {
  const errorMsg = getErrorMessage(error, defaultMessage);
  
  return {
    title: `فشل ${action}`,
    message: errorMsg,
  };
}

