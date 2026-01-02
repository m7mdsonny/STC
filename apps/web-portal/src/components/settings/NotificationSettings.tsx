import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, MessageCircle, Phone, Plus, Trash2, Save, Clock } from 'lucide-react';
import { notificationsApi } from '../../lib/api/notifications';
import { settingsApi } from '../../lib/api/settings';
import { useAuth } from '../../contexts/AuthContext';
import type { OrganizationNotificationConfig, SmsQuota } from '../../types/database';
import { NOTIFICATION_CHANNELS } from '../../types/database';

const CHANNEL_ICONS: Record<string, typeof Bell> = {
  push: Bell,
  email: Mail,
  sms: MessageSquare,
  whatsapp: MessageCircle,
  call: Phone,
};

export function NotificationSettings() {
  const { organization, canManage } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<OrganizationNotificationConfig | null>(null);
  const [smsQuota, setSmsQuota] = useState<SmsQuota | null>(null);
  const [availableChannels, setAvailableChannels] = useState<string[]>([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    if (organization) {
      fetchData();
    }
  }, [organization]);

  const fetchData = async () => {
    if (!organization) return;
    setLoading(true);

    try {
      const [configData, quotaData, plansData] = await Promise.all([
        notificationsApi.getOrgConfig().catch(() => null),
        notificationsApi.getQuota().catch(() => null),
        settingsApi.getPlans().catch(() => []),
      ]);

      if (configData) {
        setConfig(configData);
      } else {
        const defaultConfig: Partial<OrganizationNotificationConfig> = {
          organization_id: organization.id,
          push_enabled: true,
          email_enabled: true,
          sms_enabled: false,
          whatsapp_enabled: false,
          call_enabled: false,
          default_recipients: [],
          emergency_contacts: [],
          quiet_hours_enabled: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '07:00',
          quiet_hours_exceptions: ['critical'],
          language: 'ar',
          timezone: 'Africa/Cairo',
        };
        setConfig(defaultConfig as OrganizationNotificationConfig);
      }

      if (quotaData) {
        setSmsQuota({
          sms_used: quotaData.sms_used,
          sms_limit: quotaData.sms_limit,
          whatsapp_used: quotaData.whatsapp_used,
          whatsapp_limit: quotaData.whatsapp_limit,
          calls_used: quotaData.calls_used,
          calls_limit: quotaData.calls_limit,
        } as SmsQuota);
      }

      // Find the plan that matches the organization's subscription
      const planName = organization.subscription_plan === 'basic' ? 'Basic' :
                      organization.subscription_plan === 'professional' ? 'Professional' : 'Enterprise';
      const plan = plansData.find(p => p.name === planName);
      if (plan?.notification_channels) {
        setAvailableChannels(plan.notification_channels);
      }
    } catch (error) {
      console.error('Error fetching notification data:', error);
    }

    setLoading(false);
  };

  const saveConfig = async () => {
    if (!organization || !config) return;
    setSaving(true);

    const configToSave = {
      push_enabled: config.push_enabled,
      email_enabled: config.email_enabled,
      sms_enabled: config.sms_enabled,
      whatsapp_enabled: config.whatsapp_enabled,
      call_enabled: config.call_enabled,
      default_recipients: config.default_recipients,
      emergency_contacts: config.emergency_contacts,
      quiet_hours_enabled: config.quiet_hours_enabled,
      quiet_hours_start: config.quiet_hours_start,
      quiet_hours_end: config.quiet_hours_end,
      quiet_hours_exceptions: config.quiet_hours_exceptions,
      language: config.language,
      timezone: config.timezone,
    };

    try {
      await notificationsApi.updateOrgConfig(configToSave);
    } catch (error) {
      console.error('Error saving config:', error);
    }

    setSaving(false);
  };

  const toggleChannel = (channel: keyof OrganizationNotificationConfig) => {
    if (!config) return;
    setConfig({ ...config, [channel]: !config[channel] });
  };

  const addEmergencyContact = () => {
    if (!config || !newContact.name || !newContact.phone) return;
    setConfig({
      ...config,
      emergency_contacts: [...(config.emergency_contacts || []), newContact],
    });
    setNewContact({ name: '', phone: '', email: '' });
  };

  const removeEmergencyContact = (index: number) => {
    if (!config) return;
    const contacts = [...(config.emergency_contacts || [])];
    contacts.splice(index, 1);
    setConfig({ ...config, emergency_contacts: contacts });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">قنوات الاشعارات</h3>
        <p className="text-white/60 text-sm mb-6">
          اختر قنوات الاشعارات المتاحة حسب باقتك: {organization?.subscription_plan === 'basic' ? 'اساسي' : organization?.subscription_plan === 'professional' ? 'احترافي' : 'مؤسسي'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {NOTIFICATION_CHANNELS.map((channel) => {
            const Icon = CHANNEL_ICONS[channel.id];
            const isAvailable = availableChannels.includes(channel.id);
            const isEnabled = config?.[`${channel.id}_enabled` as keyof OrganizationNotificationConfig];

            return (
              <div
                key={channel.id}
                className={`p-4 rounded-lg border transition-all ${
                  isAvailable
                    ? isEnabled
                      ? 'bg-stc-gold/10 border-stc-gold/30'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                    : 'bg-white/5 border-white/10 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isEnabled ? 'bg-stc-gold/20' : 'bg-white/10'}`}>
                      <Icon className={`w-5 h-5 ${isEnabled ? 'text-stc-gold' : 'text-white/60'}`} />
                    </div>
                    <div>
                      <p className="font-medium">{channel.name}</p>
                      <p className="text-xs text-white/50">{channel.nameEn}</p>
                    </div>
                  </div>
                  {isAvailable && canManage ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={!!isEnabled}
                        onChange={() => toggleChannel(`${channel.id}_enabled` as keyof OrganizationNotificationConfig)}
                      />
                      <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stc-gold"></div>
                    </label>
                  ) : (
                    <span className="badge">غير متاح</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {smsQuota && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">حصة الرسائل الشهرية</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60">SMS</span>
                <span className="text-sm">{smsQuota.sms_used} / {smsQuota.sms_limit}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min((smsQuota.sms_used / smsQuota.sms_limit) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60">WhatsApp</span>
                <span className="text-sm">{smsQuota.whatsapp_used} / {smsQuota.whatsapp_limit}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: smsQuota.whatsapp_limit > 0 ? `${Math.min((smsQuota.whatsapp_used / smsQuota.whatsapp_limit) * 100, 100)}%` : '0%' }}
                />
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60">مكالمات</span>
                <span className="text-sm">{smsQuota.calls_used} / {smsQuota.calls_limit}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all"
                  style={{ width: smsQuota.calls_limit > 0 ? `${Math.min((smsQuota.calls_used / smsQuota.calls_limit) * 100, 100)}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">جهات اتصال الطوارئ</h3>
        <p className="text-white/60 text-sm mb-4">
          يتم ارسال التنبيهات الحرجة لجهات الاتصال هذه تلقائيا
        </p>

        <div className="space-y-3 mb-4">
          {(config?.emergency_contacts || []).map((contact, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <p className="font-medium">{contact.name}</p>
                <p className="text-sm text-white/50">{contact.phone} {contact.email && `- ${contact.email}`}</p>
              </div>
              {canManage && (
                <button onClick={() => removeEmergencyContact(index)} className="p-2 hover:bg-red-500/20 rounded">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              )}
            </div>
          ))}
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="الاسم"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              className="input flex-1 min-w-[150px]"
            />
            <input
              type="tel"
              placeholder="رقم الهاتف"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              className="input flex-1 min-w-[150px]"
              dir="ltr"
            />
            <input
              type="email"
              placeholder="البريد (اختياري)"
              value={newContact.email}
              onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              className="input flex-1 min-w-[150px]"
              dir="ltr"
            />
            <button onClick={addEmergencyContact} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>اضافة</span>
            </button>
          </div>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">ساعات الهدوء</h3>
          {canManage && (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config?.quiet_hours_enabled || false}
                onChange={() => config && setConfig({ ...config, quiet_hours_enabled: !config.quiet_hours_enabled })}
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stc-gold"></div>
            </label>
          )}
        </div>
        <p className="text-white/60 text-sm mb-4">
          ايقاف الاشعارات غير الحرجة خلال فترة محددة
        </p>

        {config?.quiet_hours_enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">وقت البداية</label>
              <div className="relative">
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="time"
                  value={config?.quiet_hours_start || '22:00'}
                  onChange={(e) => setConfig({ ...config!, quiet_hours_start: e.target.value })}
                  className="input pr-10"
                  disabled={!canManage}
                />
              </div>
            </div>
            <div>
              <label className="label">وقت النهاية</label>
              <div className="relative">
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="time"
                  value={config?.quiet_hours_end || '07:00'}
                  onChange={(e) => setConfig({ ...config!, quiet_hours_end: e.target.value })}
                  className="input pr-10"
                  disabled={!canManage}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {canManage && (
        <div className="flex justify-end">
          <button onClick={saveConfig} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-5 h-5" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ الاعدادات'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
