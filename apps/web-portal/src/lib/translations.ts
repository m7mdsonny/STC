// Simple translation utility for remaining English strings
export const translations = {
  ar: {
    // Common actions
    'Add': 'إضافة',
    'Edit': 'تعديل',
    'Delete': 'حذف',
    'Save': 'حفظ',
    'Cancel': 'إلغاء',
    'Loading': 'جاري التحميل...',
    'Error': 'خطأ',
    'Success': 'نجح',
    'Failed': 'فشل',
    
    // Status
    'Active': 'نشط',
    'Inactive': 'غير نشط',
    'Online': 'متصل',
    'Offline': 'غير متصل',
    'Published': 'منشور',
    'Draft': 'مسودة',
    
    // Common labels
    'Name': 'الاسم',
    'Email': 'البريد الإلكتروني',
    'Phone': 'الهاتف',
    'Address': 'العنوان',
    'Description': 'الوصف',
    'Status': 'الحالة',
    'Created': 'تم الإنشاء',
    'Updated': 'تم التحديث',
    
    // Buttons
    'Create': 'إنشاء',
    'Update': 'تحديث',
    'Remove': 'إزالة',
    'Close': 'إغلاق',
    'Submit': 'إرسال',
    'Reset': 'إعادة تعيين',
    'Search': 'بحث',
    'Filter': 'تصفية',
    'Export': 'تصدير',
    'Import': 'استيراد',
    'Download': 'تحميل',
    'Upload': 'رفع',
    'Test': 'اختبار',
    'Refresh': 'تحديث',
    
    // Messages
    'No data available': 'لا توجد بيانات',
    'No results found': 'لم يتم العثور على نتائج',
    'Please wait': 'يرجى الانتظار',
    'Operation completed successfully': 'تمت العملية بنجاح',
    'Operation failed': 'فشلت العملية',
    'Are you sure?': 'هل أنت متأكد؟',
    
    // Time
    'Today': 'اليوم',
    'Yesterday': 'أمس',
    'This week': 'هذا الأسبوع',
    'This month': 'هذا الشهر',
    'This year': 'هذا العام',
    
    // Version types
    'Major': 'تحديث رئيسي',
    'Minor': 'تحديث ثانوي',
    'Patch': 'إصلاح',
    'Hotfix': 'إصلاح عاجل',
  },
  en: {
    // Keep English as fallback
  },
};

export function t(key: string, lang: string = 'ar'): string {
  return translations[lang as keyof typeof translations]?.[key as keyof typeof translations['ar']] || key;
}

