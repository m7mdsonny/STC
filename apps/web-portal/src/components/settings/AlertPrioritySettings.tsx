import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, MessageCircle, Phone, AlertTriangle, Volume2, Vibrate, ArrowUpCircle, Flame, ScanFace, Users, Car, UserCheck, ShieldAlert, Server } from 'lucide-react';
import { notificationsApi } from '../../lib/api/notifications';
import { settingsApi } from '../../lib/api/settings';
import { useAuth } from '../../contexts/AuthContext';
import type { AlertPriority, AlertSeverity, NotificationChannel } from '../../types/database';
import { NOTIFICATION_CHANNELS, ALERT_TYPES } from '../../types/database';

const MODULE_ICONS: Record<string, typeof Bell> = {
  fire_detection: Flame,
  intrusion_detection: ShieldAlert,
  face_recognition: ScanFace,
  vehicle_recognition: Car,
  people_counter: Users,
  attendance: UserCheck,
  system: Server,
};

const MODULE_NAMES: Record<string, string> = {
  fire_detection: 'كشف الحريق والدخان',
  intrusion_detection: 'كشف التسلل',
  face_recognition: 'التعرف على الوجوه',
  vehicle_recognition: 'التعرف على المركبات',
  people_counter: 'عد الاشخاص',
  attendance: 'الحضور والانصراف',
  system: 'النظام',
};

const SEVERITY_OPTIONS: { value: AlertSeverity; label: string; color: string }[] = [
  { value: 'critical', label: 'حرج', color: 'bg-red-500' },
  { value: 'high', label: 'عالي', color: 'bg-orange-500' },
  { value: 'medium', label: 'متوسط', color: 'bg-yellow-500' },
  { value: 'low', label: 'منخفض', color: 'bg-blue-500' },
];

const CHANNEL_ICONS: Record<string, typeof Bell> = {
  push: Bell,
  email: Mail,
  sms: MessageSquare,
  whatsapp: MessageCircle,
  call: Phone,
};

export function AlertPrioritySettings() {
  const { organization, canManage } = useAuth();
  const [loading, setLoading] = useState(true);
  const [alertPriorities, setAlertPriorities] = useState<AlertPriority[]>([]);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [availableChannels, setAvailableChannels] = useState<string[]>([]);

  useEffect(() => {
    if (organization) {
      fetchData();
    }
  }, [organization]);

  const fetchData = async () => {
    if (!organization) return;
    setLoading(true);

    try {
      const [priorities, plans] = await Promise.all([
        notificationsApi.getAlertPriorities(),
        settingsApi.getPlans().catch(() => []),
      ]);

      setAlertPriorities(priorities);

      // Find the plan that matches the organization's subscription
      const planName = organization.subscription_plan === 'basic' ? 'Basic' :
                      organization.subscription_plan === 'professional' ? 'Professional' : 'Enterprise';
      const plan = plans.find(p => p.name === planName);
      if (plan?.notification_channels) {
        setAvailableChannels(plan.notification_channels);
      }
    } catch (error) {
      console.error('Error fetching alert priorities:', error);
      setAlertPriorities([]);
      setAvailableChannels([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityForAlert = (module: string, alertType: string): AlertPriority | undefined => {
    const orgPriority = alertPriorities.find(
      p => p.organization_id === organization?.id && p.module === module && p.alert_type === alertType
    );
    if (orgPriority) return orgPriority;

    return alertPriorities.find(
      p => p.organization_id === null && p.module === module && p.alert_type === alertType
    );
  };

  const updateAlertPriority = async (module: string, alertType: string, updates: Partial<AlertPriority>) => {
    if (!organization) return;

    const existing = getPriorityForAlert(module, alertType);

    try {
      if (!existing || existing.organization_id === null) {
        const defaultPriority = existing || {
          severity: 'medium' as AlertSeverity,
          notification_channels: ['push'],
          auto_escalate: false,
          escalation_minutes: 15,
          escalation_channel: 'call' as NotificationChannel,
          sound_enabled: true,
          vibration_enabled: true,
          is_active: true,
        };

        const insertData = {
          module,
          alert_type: alertType,
          severity: (updates.severity || defaultPriority.severity) as AlertSeverity,
          notification_channels: (updates.notification_channels || defaultPriority.notification_channels) as NotificationChannel[],
          auto_escalate: updates.auto_escalate !== undefined ? updates.auto_escalate : defaultPriority.auto_escalate,
          escalation_minutes: updates.escalation_minutes || defaultPriority.escalation_minutes,
          escalation_channel: updates.escalation_channel || defaultPriority.escalation_channel,
          sound_enabled: updates.sound_enabled !== undefined ? updates.sound_enabled : defaultPriority.sound_enabled,
          vibration_enabled: updates.vibration_enabled !== undefined ? updates.vibration_enabled : defaultPriority.vibration_enabled,
        };

        const newPriority = await notificationsApi.createAlertPriority(insertData);
        setAlertPriorities(prev => [...prev.filter(p => !(p.organization_id === null && p.module === module && p.alert_type === alertType)), newPriority]);
      } else {
        const updatedPriority = await notificationsApi.updateAlertPriority(existing.id, updates);
        setAlertPriorities(prev =>
          prev.map(p => (p.id === existing.id) ? updatedPriority : p)
        );
      }
    } catch (error) {
      console.error('Error updating alert priority:', error);
    }
  };

  const toggleChannel = (module: string, alertType: string, channel: NotificationChannel) => {
    const priority = getPriorityForAlert(module, alertType);
    const currentChannels = priority?.notification_channels || ['push'];
    const newChannels = currentChannels.includes(channel)
      ? currentChannels.filter(c => c !== channel)
      : [...currentChannels, channel];

    updateAlertPriority(module, alertType, { notification_channels: newChannels as NotificationChannel[] });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-2">اولوية التنبيهات</h3>
        <p className="text-white/60 text-sm mb-6">
          حدد مستوى الخطورة وقنوات الاشعار لكل نوع من التنبيهات
        </p>

        <div className="space-y-3">
          {Object.entries(ALERT_TYPES).map(([module, alerts]) => {
            const ModuleIcon = MODULE_ICONS[module] || AlertTriangle;
            const isExpanded = expandedModule === module;

            return (
              <div key={module} className="border border-white/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedModule(isExpanded ? null : module)}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-stc-gold/20 rounded-lg">
                      <ModuleIcon className="w-5 h-5 text-stc-gold" />
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{MODULE_NAMES[module]}</p>
                      <p className="text-sm text-white/50">{alerts.length} نوع من التنبيهات</p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="p-4 space-y-4 border-t border-white/10">
                    {alerts.map((alert) => {
                      const priority = getPriorityForAlert(module, alert.id);
                      const currentSeverity = priority?.severity || alert.severity;
                      const currentChannels = priority?.notification_channels || ['push'];
                      const autoEscalate = priority?.auto_escalate || false;

                      return (
                        <div key={alert.id} className="p-4 bg-white/5 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="font-medium">{alert.name}</p>
                              <p className="text-sm text-white/50">{alert.id}</p>
                            </div>
                            <select
                              value={currentSeverity}
                              onChange={(e) => updateAlertPriority(module, alert.id, { severity: e.target.value as AlertSeverity })}
                              className="input w-auto"
                              disabled={!canManage}
                            >
                              {SEVERITY_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm text-white/60 mb-2">قنوات الاشعار:</p>
                            <div className="flex flex-wrap gap-2">
                              {NOTIFICATION_CHANNELS.map(channel => {
                                const ChannelIcon = CHANNEL_ICONS[channel.id];
                                const isActive = currentChannels.includes(channel.id as NotificationChannel);
                                const isAvailable = availableChannels.includes(channel.id);

                                return (
                                  <button
                                    key={channel.id}
                                    onClick={() => canManage && isAvailable && toggleChannel(module, alert.id, channel.id as NotificationChannel)}
                                    disabled={!canManage || !isAvailable}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                                      isActive
                                        ? 'bg-stc-gold/20 border-stc-gold/50 text-stc-gold'
                                        : isAvailable
                                          ? 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                                          : 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                                    }`}
                                  >
                                    <ChannelIcon className="w-4 h-4" />
                                    <span className="text-sm">{channel.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/10">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={priority?.sound_enabled !== false}
                                onChange={(e) => updateAlertPriority(module, alert.id, { sound_enabled: e.target.checked })}
                                className="w-4 h-4 rounded bg-white/10 border-white/20"
                                disabled={!canManage}
                              />
                              <Volume2 className="w-4 h-4 text-white/60" />
                              <span className="text-sm text-white/70">صوت</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={priority?.vibration_enabled !== false}
                                onChange={(e) => updateAlertPriority(module, alert.id, { vibration_enabled: e.target.checked })}
                                className="w-4 h-4 rounded bg-white/10 border-white/20"
                                disabled={!canManage}
                              />
                              <Vibrate className="w-4 h-4 text-white/60" />
                              <span className="text-sm text-white/70">اهتزاز</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={autoEscalate}
                                onChange={(e) => updateAlertPriority(module, alert.id, { auto_escalate: e.target.checked })}
                                className="w-4 h-4 rounded bg-white/10 border-white/20"
                                disabled={!canManage}
                              />
                              <ArrowUpCircle className="w-4 h-4 text-white/60" />
                              <span className="text-sm text-white/70">تصعيد تلقائي</span>
                            </label>

                            {autoEscalate && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-white/60">بعد</span>
                                <input
                                  type="number"
                                  value={priority?.escalation_minutes || 15}
                                  onChange={(e) => updateAlertPriority(module, alert.id, { escalation_minutes: parseInt(e.target.value) })}
                                  className="input w-20 text-center"
                                  min={1}
                                  max={60}
                                  disabled={!canManage}
                                />
                                <span className="text-sm text-white/60">دقيقة</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
