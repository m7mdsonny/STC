import { useState, useEffect } from 'react';
import { Settings, Shield, Users, Server, Save, AlertTriangle, Bell } from 'lucide-react';
import { superAdminApi, SystemSettings } from '../../lib/api/superAdmin';

export function SuperAdminSettings() {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'registration' | 'maintenance' | 'firebase'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await superAdminApi.getSystemSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      alert('حدث خطأ في تحميل الإعدادات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await superAdminApi.updateSystemSettings(settings);
      alert('تم حفظ الإعدادات بنجاح');
      // Refresh settings after save
      await fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ في حفظ الإعدادات';
      alert(`فشل في حفظ الإعدادات: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: Partial<SystemSettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'registration', label: 'Registration', icon: Users },
    { id: 'maintenance', label: 'Maintenance', icon: Server },
    { id: 'firebase', label: 'Firebase', icon: Bell },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">جاري تحميل الإعدادات...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">فشل تحميل الإعدادات</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إعدادات النظام</h1>
        <p className="text-white/60">تكوين إعدادات النظام على مستوى المنصة</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400'
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
            <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <h2 className="text-lg font-semibold mb-6">الإعدادات العامة</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    اسم المنصة
                  </label>
                  <input
                    type="text"
                    value={settings.platform_name}
                    onChange={(e) => updateSettings({ platform_name: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    شعار المنصة
                  </label>
                  <input
                    type="text"
                    value={settings.platform_tagline}
                    onChange={(e) => updateSettings({ platform_tagline: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      بريد الدعم
                    </label>
                    <input
                      type="email"
                      value={settings.support_email}
                      onChange={(e) => updateSettings({ support_email: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      هاتف الدعم
                    </label>
                    <input
                      type="tel"
                      value={settings.support_phone || ''}
                      onChange={(e) => updateSettings({ support_phone: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      المنطقة الزمنية الافتراضية
                    </label>
                    <select
                      value={settings.default_timezone}
                      onChange={(e) => updateSettings({ default_timezone: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">الوقت الشرقي (UTC-5)</option>
                      <option value="America/Chicago">الوقت المركزي (UTC-6)</option>
                      <option value="America/Denver">الوقت الجبلي (UTC-7)</option>
                      <option value="America/Los_Angeles">الوقت الهادئ (UTC-8)</option>
                      <option value="Europe/London">لندن (UTC+0)</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Dubai">Dubai</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      اللغة الافتراضية
                    </label>
                    <select
                      value={settings.default_language}
                      onChange={(e) => updateSettings({ default_language: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <h2 className="text-lg font-semibold mb-6">إعدادات الأمان</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      انتهاء الجلسة (بالدقائق)
                    </label>
                    <input
                      type="number"
                      value={settings.session_timeout_minutes}
                      onChange={(e) => updateSettings({ session_timeout_minutes: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={5}
                      max={1440}
                    />
                    <p className="text-xs text-white/50 mt-1">How long users can stay logged in without activity</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      الحد الأقصى لمحاولات تسجيل الدخول
                    </label>
                    <input
                      type="number"
                      value={settings.max_login_attempts}
                      onChange={(e) => updateSettings({ max_login_attempts: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={3}
                      max={10}
                    />
                    <p className="text-xs text-white/50 mt-1">Failed login attempts before account lock</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Minimum Password Length
                    </label>
                    <input
                      type="number"
                      value={settings.password_min_length}
                      onChange={(e) => updateSettings({ password_min_length: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={6}
                      max={32}
                    />
                    <p className="text-xs text-white/50 mt-1">Minimum characters required for passwords</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.require_2fa}
                      onChange={(e) => updateSettings({ require_2fa: e.target.checked })}
                      className="w-5 h-5 mt-0.5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-medium">Require Two-Factor Authentication</p>
                      <p className="text-sm text-white/50 mt-1">
                        Force all users to enable 2FA for enhanced security
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'registration' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <h2 className="text-lg font-semibold mb-6">إعدادات التسجيل</h2>
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg hover:bg-white/5 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.allow_registration}
                    onChange={(e) => updateSettings({ allow_registration: e.target.checked })}
                    className="w-5 h-5 mt-0.5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium">السماح بتسجيل مستخدمين جدد</p>
                    <p className="text-sm text-white/50 mt-1">
                      Enable public registration for new users
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg hover:bg-white/5 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.require_email_verification}
                    onChange={(e) => updateSettings({ require_email_verification: e.target.checked })}
                    className="w-5 h-5 mt-0.5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium">يتطلب التحقق من البريد الإلكتروني</p>
                    <p className="text-sm text-white/50 mt-1">
                      Users must verify their email address before accessing the platform
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <h2 className="text-lg font-semibold mb-6">وضع الصيانة</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-500">وضع الصيانة</p>
                    <p className="text-sm text-white/70 mt-1">
                      When enabled, only super admins can access the platform. All other users will see a maintenance message.
                    </p>
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg hover:bg-white/5 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.maintenance_mode}
                    onChange={(e) => updateSettings({ maintenance_mode: e.target.checked })}
                    className="w-5 h-5 mt-0.5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium">تفعيل وضع الصيانة</p>
                    <p className="text-sm text-white/50 mt-1">
                      Put the platform into maintenance mode
                    </p>
                  </div>
                </label>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    رسالة الصيانة
                  </label>
                  <textarea
                    value={settings.maintenance_message}
                    onChange={(e) => updateSettings({ maintenance_message: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                    placeholder="Enter a message to display to users during maintenance..."
                  />
                  <p className="text-xs text-white/50 mt-1">
                    This message will be shown to users when maintenance mode is active
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'firebase' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <h2 className="text-lg font-semibold mb-6">Firebase Cloud Messaging (FCM)</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <Bell className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-500">Firebase Configuration</p>
                    <p className="text-sm text-white/70 mt-1">
                      Configure Firebase Cloud Messaging for push notifications to mobile apps.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      FCM Server Key
                    </label>
                    <input
                      type="password"
                      value={settings.fcm_settings?.server_key || ''}
                      onChange={(e) => updateSettings({ 
                        fcm_settings: { 
                          ...settings.fcm_settings, 
                          server_key: e.target.value 
                        } 
                      })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="AAAA..."
                    />
                    <p className="text-xs text-white/50 mt-1">
                      احصل على هذا من Firebase Console → Project Settings → Cloud Messaging → Server Key
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      معرف مشروع Firebase
                    </label>
                    <input
                      type="text"
                      value={settings.fcm_settings?.project_id || ''}
                      onChange={(e) => updateSettings({ 
                        fcm_settings: { 
                          ...settings.fcm_settings, 
                          project_id: e.target.value 
                        } 
                      })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="your-project-id"
                      dir="ltr"
                    />
                    <p className="text-xs text-white/50 mt-1">
                      Optional: For FCM HTTP v1 API (more secure)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Test Device Token (Optional)
                    </label>
                    <input
                      type="text"
                      id="test-token"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="Enter device token to test..."
                      dir="ltr"
                    />
                    <p className="text-xs text-white/50 mt-1">
                      Enter a device token to send a test notification
                    </p>
                  </div>

                  <button
                    onClick={async () => {
                      const testToken = (document.getElementById('test-token') as HTMLInputElement)?.value;
                      try {
                        const response = await fetch('/api/v1/super-admin/test-fcm' + (testToken ? `?test_token=${testToken}` : ''), {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                            'Content-Type': 'application/json',
                          },
                        });
                        const data = await response.json();
                        if (data.success) {
                          alert('Test notification sent successfully!');
                        } else {
                          alert(`Failed: ${data.message}`);
                        }
                      } catch (error) {
                        alert('Error sending test notification');
                      }
                    }}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Send Test Notification</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 rounded-lg font-medium transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
