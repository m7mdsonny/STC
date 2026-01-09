import { useEffect, useState } from 'react';
import { MessageSquare, Building2, AlertTriangle, CheckCircle2, Save } from 'lucide-react';
import { settingsApi, organizationsApi, smsQuotaApi } from '../../lib/api';
import type { Organization, SubscriptionPlan } from '../../types/database';

interface PlatformSettings {
  sms_provider: string;
  sms_api_key: string;
  sms_sender_id: string;
  sms_base_url: string;
  whatsapp_api_key: string;
  whatsapp_phone_id: string;
  call_provider: string;
  call_api_key: string;
  messaging_enabled: boolean;
}

interface OrgQuota {
  organization: Organization;
  monthly_limit: number;
  used_this_month: number;
  id?: string;
  resets_at?: string | null;
}

export function AdminSmsSettings() {
  const [activeTab, setActiveTab] = useState<'config' | 'quotas'>('config');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [quotas, setQuotas] = useState<OrgQuota[]>([]);

  const [config, setConfig] = useState<PlatformSettings>({
    sms_provider: 'twilio',
    sms_api_key: '',
    sms_sender_id: '',
    sms_base_url: '',
    whatsapp_api_key: '',
    whatsapp_phone_id: '',
    call_provider: 'twilio',
    call_api_key: '',
    messaging_enabled: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, smsSettings, orgsRes] = await Promise.all([
        settingsApi.getPlans(),
        settingsApi.getSmsSettings(),
        organizationsApi.getOrganizations(),
      ]);

      setPlans(plansRes);

      setConfig({
        sms_provider: smsSettings.provider,
        sms_api_key: smsSettings.api_key || '',
        sms_sender_id: smsSettings.sender_id || '',
        sms_base_url: '',
        whatsapp_api_key: '',
        whatsapp_phone_id: smsSettings.whatsapp_number || '',
        call_provider: 'twilio',
        call_api_key: '',
        messaging_enabled: smsSettings.whatsapp_enabled,
      });

      const quotaList = await Promise.all(
        orgsRes.data.map(async (org) => {
          try {
            const quota = await smsQuotaApi.getQuota(org.id);
            return {
              organization: org,
              monthly_limit: quota.monthly_limit,
              used_this_month: quota.used_this_month,
              id: quota.id,
              resets_at: quota.resets_at,
            } as OrgQuota;
          } catch {
            return {
              organization: org,
              monthly_limit: 0,
              used_this_month: 0,
            } as OrgQuota;
          }
        })
      );
      setQuotas(quotaList);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await settingsApi.updateSmsSettings({
        provider: config.sms_provider as 'twilio' | 'unifonic' | 'custom',
        api_key: config.sms_api_key,
        sender_id: config.sms_sender_id,
        whatsapp_enabled: config.messaging_enabled,
        whatsapp_number: config.whatsapp_phone_id,
      });
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  const updatePlanQuota = async (planId: string, sms_quota: number) => {
    try {
      await settingsApi.updatePlan(planId, { sms_quota });
      setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, sms_quota } as any : p)));
    } catch (error) {
      console.error('Error updating plan quota:', error);
    }
  };

  const updateQuota = async (orgId: string, monthly_limit: number, used_this_month?: number) => {
    try {
      const quota = await smsQuotaApi.updateQuota(orgId, { monthly_limit, used_this_month });
      setQuotas((prev) =>
        prev.map((q) =>
          q.organization.id === orgId
            ? { ...q, monthly_limit: quota.monthly_limit, used_this_month: quota.used_this_month }
            : q
        )
      );
    } catch (error) {
      console.error('Error updating SMS quota:', error);
    }
  };

  const consumeQuota = async (orgId: string) => {
    try {
      const result = await smsQuotaApi.consume(orgId, 1);
      if (result.allowed) {
        setQuotas((prev) =>
          prev.map((q) =>
            q.organization.id === orgId && result.quota
              ? { ...q, used_this_month: result.quota.used_this_month }
              : q
          )
        );
      } else {
        alert('تم تجاوز الحد المسموح للرسائل');
      }
    } catch (error) {
      console.error('Error consuming SMS quota:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">اعدادات الرسائل</h1>
        <p className="text-white/60">ادارة سيرفر الرسائل وحصص العملاء</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <div className="card p-2">
            {[
              { id: 'config', label: 'سيرفر الرسائل', icon: MessageSquare },
              { id: 'quotas', label: 'استهلاك العملاء', icon: Building2 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'config' | 'quotas')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id ? 'bg-stc-gold/20 text-stc-gold' : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-6">
          {activeTab === 'config' && (
            <div className="card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">اعدادات SMS</h2>
                  <p className="text-white/60 text-sm">حفظ اعدادات المزود مع تطبيق فوري</p>
                </div>
                <button onClick={saveConfig} className="btn-primary flex items-center gap-2" disabled={saving}>
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'جاري الحفظ...' : 'حفظ'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">مزود الخدمة</label>
                  <select
                    value={config.sms_provider}
                    onChange={(e) => setConfig({ ...config, sms_provider: e.target.value })}
                    className="input"
                  >
                    <option value="twilio">Twilio</option>
                    <option value="unifonic">Unifonic</option>
                    <option value="mobily">Mobily</option>
                    <option value="custom">مخصص</option>
                  </select>
                </div>
                <div>
                  <label className="label">معرف المرسل (Sender ID)</label>
                  <input
                    type="text"
                    value={config.sms_sender_id}
                    onChange={(e) => setConfig({ ...config, sms_sender_id: e.target.value })}
                    className="input"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="label">مفتاح API</label>
                  <input
                    type="text"
                    value={config.sms_api_key}
                    onChange={(e) => setConfig({ ...config, sms_api_key: e.target.value })}
                    className="input"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="label">رقم واتساب</label>
                  <input
                    type="text"
                    value={config.whatsapp_phone_id}
                    onChange={(e) => setConfig({ ...config, whatsapp_phone_id: e.target.value })}
                    className="input"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="card bg-white/5 border border-white/10 p-4">
                <h3 className="font-semibold mb-3">حصص الرسائل حسب الباقة</h3>
                <div className="space-y-3">
                  {plans.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{plan.name_ar}</p>
                        <p className="text-xs text-white/50">{plan.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-white/60">رسائل / شهر</label>
                        <input
                          type="number"
                          className="input w-28"
                          value={(plan as any).sms_quota ?? 0}
                          onChange={(e) => updatePlanQuota(plan.id, parseInt(e.target.value || '0'))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quotas' && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">استهلاك الرسائل للمؤسسات</h2>
                  <p className="text-white/60 text-sm">عرض ومتابعة حدود الرسائل لكل مؤسسة</p>
                </div>
              </div>

              <div className="space-y-3">
                {quotas.map((quota) => {
                  const smsPercent =
                    quota.monthly_limit > 0 ? (quota.used_this_month / quota.monthly_limit) * 100 : 0;
                  const limitReached =
                    quota.monthly_limit > 0 && quota.used_this_month >= quota.monthly_limit;
                  return (
                    <div key={quota.organization.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-stc-gold/20 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-stc-gold" />
                          </div>
                          <div>
                            <p className="font-semibold">{quota.organization.name}</p>
                            <p className="text-xs text-white/50">{quota.organization.city || 'لا يوجد مدينة'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-xs text-white/60">الحد الشهري</label>
                          <input
                            type="number"
                            className="input w-28"
                            value={quota.monthly_limit}
                            onChange={(e) =>
                              updateQuota(
                                quota.organization.id,
                                parseInt(e.target.value || '0'),
                                quota.used_this_month
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-white/60">تم الارسال</span>
                            <span>
                              {quota.used_this_month} / {quota.monthly_limit}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                smsPercent > 90 ? 'bg-red-500' : smsPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(smsPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => consumeQuota(quota.organization.id)}
                          disabled={limitReached}
                          className={`btn-secondary whitespace-nowrap ${
                            limitReached ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                        >
                          {limitReached ? 'الحد مكتمل' : 'ارسال تجريبي'}
                        </button>
                      </div>
                      {limitReached ? (
                        <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span>تم استهلاك الحصة بالكامل</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm mt-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>متاح للإرسال</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
