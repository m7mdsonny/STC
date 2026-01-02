import { useEffect, useState } from 'react';
import { Bell, Plus, Trash2, Save, Building2 } from 'lucide-react';
import { notificationsApi, organizationsApi } from '../../lib/api';
import type { AlertPriority, Organization } from '../../types/database';

const PRIORITY_LEVELS = [
  { value: 'low', label: 'منخفض' },
  { value: 'medium', label: 'متوسط' },
  { value: 'high', label: 'عالي' },
  { value: 'critical', label: 'حرج' },
];

export function AdminNotifications() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string | undefined>(undefined);
  const [priorities, setPriorities] = useState<AlertPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRule, setNewRule] = useState({
    notification_type: '',
    priority: 'medium',
    is_critical: false,
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    fetchPriorities();
  }, [selectedOrg]);

  const fetchOrganizations = async () => {
    try {
      const orgRes = await organizationsApi.getOrganizations();
      setOrganizations(orgRes.data);
      setSelectedOrg(orgRes.data[0]?.id);
    } catch (error) {
      console.error('Error fetching organizations', error);
    }
  };

  const fetchPriorities = async () => {
    if (!selectedOrg) {
      setPriorities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await notificationsApi.getNotificationPriorities(selectedOrg);
      setPriorities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching priorities', error);
      setPriorities([]);
      // Don't show alert on initial load if no org selected
      if (selectedOrg) {
        alert('حدث خطأ في تحميل قواعد الأولوية. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  const addPriority = async () => {
    if (!newRule.notification_type || !selectedOrg) {
      alert('يرجى اختيار المؤسسة وإدخال نوع الإشعار');
      return;
    }
    setSaving(true);
    try {
      const created = await notificationsApi.createNotificationPriority({
        ...newRule,
        organization_id: selectedOrg,
      });
      setPriorities((prev) => [...prev, created]);
      setNewRule({ notification_type: '', priority: 'medium', is_critical: false });
      alert('تم إضافة القاعدة بنجاح');
    } catch (error) {
      console.error('Error creating priority', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ في إضافة القاعدة';
      alert(`فشل إضافة القاعدة: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const updatePriority = async (id: string, changes: Partial<AlertPriority>) => {
    try {
      const updated = await notificationsApi.updateNotificationPriority(id, changes);
      setPriorities((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (error) {
      console.error('Error updating priority', error);
      alert('حدث خطأ في تحديث القاعدة. يرجى المحاولة مرة أخرى.');
    }
  };

  const removePriority = async (id: string) => {
    if (!confirm('حذف قاعدة الاولوية؟')) return;
    try {
      await notificationsApi.deleteNotificationPriority(id);
      setPriorities((prev) => prev.filter((p) => p.id !== id));
      alert('تم حذف القاعدة بنجاح');
    } catch (error) {
      console.error('Error deleting priority', error);
      alert('حدث خطأ في حذف القاعدة. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">أولوية الاشعارات</h1>
          <p className="text-white/60">تحديد مستويات الاولوية لكل مؤسسة</p>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-white/50" />
          <select
            className="input"
            value={selectedOrg || ''}
            onChange={(e) => setSelectedOrg(e.target.value || undefined)}
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5 text-stc-gold" />
            القواعد الحالية
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newRule.notification_type}
              onChange={(e) => setNewRule({ ...newRule, notification_type: e.target.value })}
              placeholder="نوع الاشعار (مثال: sms.alert)"
              className="input"
            />
            <select
              className="input w-32"
              value={newRule.priority}
              onChange={(e) => setNewRule({ ...newRule, priority: e.target.value })}
            >
              {PRIORITY_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={newRule.is_critical}
                onChange={(e) => setNewRule({ ...newRule, is_critical: e.target.checked })}
              />
              حرج
            </label>
            <button onClick={addPriority} className="btn-primary flex items-center gap-2" disabled={saving || !newRule.notification_type}>
              <Plus className="w-4 h-4" />
              <span>اضافة</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-white/60">جاري التحميل...</div>
        ) : (
          <div className="space-y-3">
            {priorities.length === 0 && <p className="text-white/60">لا توجد قواعد بعد.</p>}
            {priorities.map((priority) => (
              <div key={priority.id} className="p-3 bg-white/5 rounded-lg flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{priority.notification_type}</p>
                  <p className="text-xs text-white/50">المؤسسة: {priority.organization_id || 'افتراضي'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="input w-32"
                    value={priority.priority}
                    onChange={(e) => updatePriority(priority.id, { priority: e.target.value })}
                  >
                    {PRIORITY_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={priority.is_critical}
                      onChange={(e) => updatePriority(priority.id, { is_critical: e.target.checked })}
                    />
                    حرج
                  </label>
                  <button
                    onClick={() => removePriority(priority.id)}
                    className="p-2 rounded-lg hover:bg-white/10 text-red-400"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
