import { useState, useEffect } from 'react';
import { Settings, Shield, Database, Globe, Mail, Server, Save, Loader2 } from 'lucide-react';
import { superAdminApi, SystemSettings } from '../../lib/api/superAdmin';
import { useToast } from '../../contexts/ToastContext';
import { apiClient } from '../../lib/apiClient';

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'email' | 'system'>('general');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'STC AI-VAP',
    platformNameAr: 'منصة تحليل الفيديو بالذكاء الاصطناعي',
    defaultLanguage: 'ar',
    timezone: 'Africa/Cairo',
    trialDays: 14,
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    requireMfa: false,
    passwordMinLength: 8,
    passwordRequireSpecial: true,
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'noreply@stc-solutions.com',
    fromName: 'STC AI-VAP',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const settings = await superAdminApi.getSystemSettings();
      if (settings) {
        setGeneralSettings({
          platformName: settings.platform_name || 'STC AI-VAP',
          platformNameAr: settings.platform_tagline || 'منصة تحليل الفيديو بالذكاء الاصطناعي',
          defaultLanguage: settings.default_language || 'ar',
          timezone: settings.default_timezone || 'Africa/Cairo',
          trialDays: 14, // Not in SystemSettings
        });
        setSecuritySettings({
          sessionTimeout: settings.session_timeout_minutes || 60,
          maxLoginAttempts: settings.max_login_attempts || 5,
          requireMfa: settings.require_2fa || false,
          passwordMinLength: settings.password_min_length || 8,
          passwordRequireSpecial: true, // Not in SystemSettings
        });
        const emailSettingsData = (settings as any).email_settings || {};
        setEmailSettings({
          smtpHost: emailSettingsData.smtp_host || '',
          smtpPort: emailSettingsData.smtp_port || 587,
          smtpUser: emailSettingsData.smtp_user || '',
          smtpPassword: '', // Don't load password
          fromEmail: emailSettingsData.from_email || 'noreply@stc-solutions.com',
          fromName: emailSettingsData.from_name || 'STC AI-VAP',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showError('خطأ في التحميل', 'فشل تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsData: any = {
        platform_name: generalSettings.platformName,
        platform_tagline: generalSettings.platformNameAr,
        default_language: generalSettings.defaultLanguage,
        default_timezone: generalSettings.timezone,
        session_timeout_minutes: securitySettings.sessionTimeout,
        max_login_attempts: securitySettings.maxLoginAttempts,
        require_2fa: securitySettings.requireMfa,
        password_min_length: securitySettings.passwordMinLength,
        email_settings: {
          smtp_host: emailSettings.smtpHost,
          smtp_port: emailSettings.smtpPort,
          smtp_user: emailSettings.smtpUser,
          from_email: emailSettings.fromEmail,
          from_name: emailSettings.fromName,
        },
      };

      // Only include password if it was changed
      if (emailSettings.smtpPassword) {
        settingsData.email_settings.smtp_password = emailSettings.smtpPassword;
      }

      await superAdminApi.updateSystemSettings(settingsData as SystemSettings);
      showSuccess('تم الحفظ', 'تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ في حفظ الإعدادات';
      showError('خطأ في الحفظ', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = async () => {
    try {
      await apiClient.post('/api/v1/super-admin/clear-cache');
      showSuccess('تم التنظيف', 'تم تنظيف الذاكرة المؤقتة بنجاح');
    } catch (error) {
      showError('خطأ', 'فشل تنظيف الذاكرة المؤقتة');
    }
  };

  const handleCreateBackup = async () => {
    try {
      await apiClient.post('/api/v1/system-backups');
      showSuccess('تم الإنشاء', 'تم إنشاء النسخة الاحتياطية بنجاح');
    } catch (error) {
      showError('خطأ', 'فشل إنشاء النسخة الاحتياطية');
    }
  };

  const handleTestEmail = async () => {
    try {
      await superAdminApi.testEmail({ email: emailSettings.fromEmail });
      showSuccess('تم الإرسال', 'تم إرسال بريد تجريبي بنجاح');
    } catch (error) {
      showError('خطأ', 'فشل إرسال البريد التجريبي');
    }
  };

  const tabs = [
    { id: 'general', label: 'عام', icon: Globe },
    { id: 'security', label: 'الامان', icon: Shield },
    { id: 'email', label: 'البريد', icon: Mail },
    { id: 'system', label: 'النظام', icon: Server },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-stc-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">اعدادات النظام</h1>
        <p className="text-white/60">تكوين اعدادات المنصة العامة</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <div className="card p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-stc-gold/20 text-stc-gold'
                    : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-6">الاعدادات العامة</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">اسم المنصة (انجليزي)</label>
                    <input
                      type="text"
                      value={generalSettings.platformName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, platformName: e.target.value })}
                      className="input"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="label">اسم المنصة (عربي)</label>
                    <input
                      type="text"
                      value={generalSettings.platformNameAr}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, platformNameAr: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">اللغة الافتراضية</label>
                    <select
                      value={generalSettings.defaultLanguage}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, defaultLanguage: e.target.value })}
                      className="input"
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">المنطقة الزمنية</label>
                    <select
                      value={generalSettings.timezone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                      className="input"
                    >
                      <option value="Africa/Cairo">القاهرة (UTC+2)</option>
                      <option value="Africa/Cairo">القاهرة (UTC+2)</option>
                      <option value="Asia/Dubai">دبي (UTC+4)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">مدة الفترة التجريبية (ايام)</label>
                  <input
                    type="number"
                    value={generalSettings.trialDays}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, trialDays: parseInt(e.target.value) })}
                    className="input w-32"
                    min={1}
                    max={90}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-6">اعدادات الامان</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">مهلة انتهاء الجلسة (دقيقة)</label>
                    <input
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                      className="input"
                      min={5}
                      max={480}
                    />
                  </div>
                  <div>
                    <label className="label">الحد الاقصى لمحاولات الدخول</label>
                    <input
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
                      className="input"
                      min={3}
                      max={10}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">الحد الادنى لطول كلمة المرور</label>
                    <input
                      type="number"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: parseInt(e.target.value) })}
                      className="input"
                      min={6}
                      max={32}
                    />
                  </div>
                </div>
                <div className="space-y-3 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.requireMfa}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, requireMfa: e.target.checked })}
                      className="w-5 h-5 rounded border-white/20 bg-white/5"
                    />
                    <div>
                      <p className="font-medium">تفعيل المصادقة الثنائية اجباريا</p>
                      <p className="text-sm text-white/50">الزام جميع المستخدمين بتفعيل المصادقة الثنائية</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.passwordRequireSpecial}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, passwordRequireSpecial: e.target.checked })}
                      className="w-5 h-5 rounded border-white/20 bg-white/5"
                    />
                    <div>
                      <p className="font-medium">اشتراط رموز خاصة في كلمة المرور</p>
                      <p className="text-sm text-white/50">يجب ان تحتوي كلمة المرور على رموز خاصة</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-6">اعدادات البريد الالكتروني</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">خادم SMTP</label>
                    <input
                      type="text"
                      value={emailSettings.smtpHost}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                      className="input"
                      dir="ltr"
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div>
                    <label className="label">منفذ SMTP</label>
                    <input
                      type="number"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">اسم المستخدم</label>
                    <input
                      type="text"
                      value={emailSettings.smtpUser}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                      className="input"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="label">كلمة المرور</label>
                    <input
                      type="password"
                      value={emailSettings.smtpPassword}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                      className="input"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">البريد المرسل</label>
                    <input
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                      className="input"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="label">اسم المرسل</label>
                    <input
                      type="text"
                      value={emailSettings.fromName}
                      onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <button onClick={handleTestEmail} className="btn-secondary">
                  ارسال بريد تجريبي
                </button>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-6">معلومات النظام</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-sm text-white/50 mb-1">اصدار المنصة</p>
                    <p className="font-mono font-medium">v1.0.0</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-sm text-white/50 mb-1">اصدار قاعدة البيانات</p>
                    <p className="font-mono font-medium">MySQL 8.0</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-sm text-white/50 mb-1">مساحة التخزين</p>
                    <p className="font-mono font-medium">45.2 GB / 100 GB</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-sm text-white/50 mb-1">اخر نسخة احتياطية</p>
                    <p className="font-mono font-medium">منذ 2 ساعة</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <h3 className="font-medium mb-3">صيانة النظام</h3>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={handleClearCache} className="btn-secondary">تنظيف الذاكرة المؤقتة</button>
                    <button onClick={handleCreateBackup} className="btn-secondary">انشاء نسخة احتياطية</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button onClick={handleSave} disabled={saving || loading} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
