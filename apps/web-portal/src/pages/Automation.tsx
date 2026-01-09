import { useState, useEffect } from 'react';
import {
  Plus, Search, Zap, Flame, ScanFace, Users, Car, UserCheck, Warehouse,
  Activity, PieChart, ShieldAlert, Bell, Volume2, DoorOpen, DoorClosed,
  Unlock, Lock, Lightbulb, LightbulbOff, Wind, Phone, Globe, Radio, Settings,
  Edit2, Trash2, ToggleLeft, ToggleRight, ChevronDown
} from 'lucide-react';
import { automationRulesApi } from '../lib/api/automationRules';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getDetailedErrorMessage } from '../lib/errorMessages';
import { Modal } from '../components/ui/Modal';
import { AI_MODULES, MODULE_EVENTS, ACTION_TYPES, type AutomationRule } from '../types/database';

const moduleIcons: Record<string, React.ElementType> = {
  fire: Flame,
  face: ScanFace,
  counter: Users,
  vehicle: Car,
  attendance: UserCheck,
  warehouse: Warehouse,
  productivity: Activity,
  audience: PieChart,
  intrusion: ShieldAlert,
};

const actionIcons: Record<string, React.ElementType> = {
  notification: Bell,
  siren: Volume2,
  gate_open: DoorOpen,
  gate_close: DoorClosed,
  door_open: Unlock,
  door_lock: Lock,
  lights_on: Lightbulb,
  lights_off: LightbulbOff,
  hvac_adjust: Wind,
  emergency_call: Phone,
  http_request: Globe,
  mqtt_publish: Radio,
  custom: Settings,
};

export function Automation() {
  const { organization } = useAuth();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [selectedModule, setSelectedModule] = useState('fire');

  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    description: '',
    trigger_module: 'fire',
    trigger_event: 'fire_detected',
    trigger_conditions: {} as Record<string, unknown>,
    action_type: 'notification',
    action_command: {
      message: '',
      recipients: [],
    } as Record<string, unknown>,
    cooldown_seconds: 60,
    is_active: true,
    priority: 0,
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await automationRulesApi.getRules({ per_page: 100 });
      if (response.data) {
        setRules(response.data);
      }
    } catch (error) {
      console.error('Error fetching automation rules:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organization) {
      showError('خطأ في تسجيل الدخول', 'يرجى التأكد من تسجيل الدخول بشكل صحيح');
      return;
    }

    if (!formData.name.trim()) {
      showError('بيانات غير مكتملة', 'يرجى إدخال اسم القاعدة');
      return;
    }

    const ruleData = {
      ...formData,
      organization_id: organization.id,
    };

    try {
      if (editingRule) {
        await automationRulesApi.updateRule(editingRule.id, ruleData);
        showSuccess('تم التحديث بنجاح', `تم تحديث قاعدة ${formData.name} بنجاح`);
      } else {
        await automationRulesApi.createRule(ruleData);
        showSuccess('تم الإضافة بنجاح', `تم إضافة قاعدة ${formData.name} بنجاح`);
      }
      fetchRules();
      setShowModal(false);
    } catch (error: any) {
      console.error('Error saving automation rule:', error);
      const { title, message } = getDetailedErrorMessage(error, 'حفظ القاعدة', 'حدث خطأ في حفظ القاعدة');
      showError(title, message);
    }
  };

  const handleEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      name_ar: rule.name_ar || '',
      description: rule.description || '',
      trigger_module: rule.trigger_module,
      trigger_event: rule.trigger_event,
      trigger_conditions: rule.trigger_conditions || {},
      action_type: rule.action_type,
      action_command: rule.action_command,
      cooldown_seconds: rule.cooldown_seconds,
      is_active: rule.is_active,
      priority: rule.priority,
    });
    setSelectedModule(rule.trigger_module);
    setShowModal(true);
  };

  const handleToggle = async (rule: AutomationRule) => {
    try {
      await automationRulesApi.updateRule(rule.id, { is_active: !rule.is_active });
      const newStatus = rule.is_active ? 'تعطيل' : 'تفعيل';
      showSuccess('تم التحديث', `تم ${newStatus} القاعدة ${rule.name} بنجاح`);
      fetchRules();
    } catch (error) {
      console.error('Error toggling automation rule:', error);
      const { title, message } = getDetailedErrorMessage(error, 'تغيير حالة القاعدة', 'حدث خطأ في تغيير حالة القاعدة');
      showError(title, message);
    }
  };

  const handleDelete = async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!confirm(`هل أنت متأكد من حذف القاعدة ${rule?.name || ''}؟`)) return;

    try {
      await automationRulesApi.deleteRule(id);
      showSuccess('تم الحذف بنجاح', `تم حذف القاعدة ${rule?.name || ''} من النظام`);
      fetchRules();
    } catch (error) {
      console.error('Error deleting automation rule:', error);
      const { title, message } = getDetailedErrorMessage(error, 'حذف القاعدة', 'حدث خطأ في حذف القاعدة');
      showError(title, message);
    }
  };

  const filteredRules = rules.filter(rule =>
    rule.name.toLowerCase().includes(search.toLowerCase()) ||
    rule.name_ar?.toLowerCase().includes(search.toLowerCase())
  );

  const getModuleInfo = (moduleId: string) => {
    return AI_MODULES.find(m => m.id === moduleId);
  };

  const getEventLabel = (module: string, event: string) => {
    const events: Record<string, Record<string, string>> = {
      fire: { fire_detected: 'كشف حريق', smoke_detected: 'كشف دخان', fire_cleared: 'انتهاء الحريق' },
      face: { known_face: 'وجه معروف', unknown_face: 'وجه غير معروف', blacklist_face: 'قائمة سوداء', vip_detected: 'VIP' },
      counter: { count_threshold: 'تجاوز الحد', entry: 'دخول', exit: 'خروج', overcrowding: 'ازدحام' },
      vehicle: { known_vehicle: 'مركبة معروفة', unknown_vehicle: 'مركبة غير معروفة', blacklist_vehicle: 'قائمة سوداء', vip_vehicle: 'VIP' },
      attendance: { check_in: 'تسجيل دخول', check_out: 'تسجيل خروج', late_arrival: 'تاخير', early_departure: 'خروج مبكر' },
      warehouse: { motion_detected: 'حركة', restricted_area: 'منطقة محظورة', safety_violation: 'انتهاك سلامة' },
      productivity: { idle_detected: 'خمول', activity_change: 'تغير نشاط', break_exceeded: 'استراحة طويلة' },
      audience: { demographic_update: 'تحديث ديموغرافي', crowd_analysis: 'تحليل حشد' },
      intrusion: { intrusion_detected: 'تسلل', perimeter_breach: 'اختراق محيط', loitering: 'تسكع' },
    };
    return events[module]?.[event] || event;
  };

  const getActionLabel = (actionType: string) => {
    return ACTION_TYPES.find(a => a.id === actionType)?.name || actionType;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">اوامر الذكاء الاصطناعي</h1>
          <p className="text-white/60">حدد الاجراءات التلقائية لكل حدث</p>
        </div>
        <button
          onClick={() => {
            setEditingRule(null);
            setFormData({
              name: '',
              name_ar: '',
              description: '',
              trigger_module: 'fire',
              trigger_event: 'fire_detected',
              trigger_conditions: {},
              action_type: 'notification',
              action_command: { message: '', recipients: [] },
              cooldown_seconds: 60,
              is_active: true,
              priority: 0,
            });
            setSelectedModule('fire');
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>اضافة امر جديد</span>
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث عن امر..."
            className="input pr-12"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AI_MODULES.map((module) => {
          const moduleRules = filteredRules.filter(r => r.trigger_module === module.id);
          const Icon = moduleIcons[module.id];
          const activeCount = moduleRules.filter(r => r.is_active).length;

          return (
            <div key={module.id} className="card p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-stc-gold/20">
                  <Icon className="w-5 h-5 text-stc-gold" />
                </div>
                <div>
                  <h3 className="font-semibold">{module.nameAr}</h3>
                  <p className="text-xs text-white/50">
                    {activeCount} / {moduleRules.length} امر نشط
                  </p>
                </div>
              </div>

              {moduleRules.length === 0 ? (
                <p className="text-center text-white/40 text-sm py-4">لا توجد اوامر</p>
              ) : (
                <div className="space-y-2">
                  {moduleRules.slice(0, 3).map((rule) => {
                    const ActionIcon = actionIcons[rule.action_type] || Zap;
                    return (
                      <div
                        key={rule.id}
                        className={`p-3 rounded-lg border transition-all ${
                          rule.is_active
                            ? 'bg-white/5 border-stc-gold/30'
                            : 'bg-white/5 border-white/10 opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ActionIcon className="w-4 h-4 text-stc-gold" />
                            <span className="text-sm font-medium">{rule.name_ar || rule.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggle(rule)}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              {rule.is_active ? (
                                <ToggleRight className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-white/40" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEdit(rule)}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-white/50 mt-1">
                          {getEventLabel(rule.trigger_module, rule.trigger_event)} ← {getActionLabel(rule.action_type)}
                        </p>
                      </div>
                    );
                  })}
                  {moduleRules.length > 3 && (
                    <p className="text-center text-sm text-stc-gold">
                      +{moduleRules.length - 3} اوامر اخرى
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRule ? 'تعديل الامر' : 'اضافة امر جديد'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">اسم الامر (انجليزي)</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                dir="ltr"
                required
              />
            </div>
            <div>
              <label className="label">اسم الامر (عربي)</label>
              <input
                type="text"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">الوصف</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={2}
            />
          </div>

          <div className="p-4 bg-white/5 rounded-xl space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-stc-gold" />
              <span>المشغل (Trigger)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">الموديول</label>
                <select
                  value={formData.trigger_module}
                  onChange={(e) => {
                    const module = e.target.value;
                    setFormData({
                      ...formData,
                      trigger_module: module,
                      trigger_event: Object.keys(MODULE_EVENTS[module as keyof typeof MODULE_EVENTS])[0] || '',
                    });
                    setSelectedModule(module);
                  }}
                  className="select"
                >
                  {AI_MODULES.map((module) => (
                    <option key={module.id} value={module.id}>{module.nameAr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">الحدث</label>
                <select
                  value={formData.trigger_event}
                  onChange={(e) => setFormData({ ...formData, trigger_event: e.target.value })}
                  className="select"
                >
                  {MODULE_EVENTS[selectedModule as keyof typeof MODULE_EVENTS]?.map((event) => (
                    <option key={event} value={event}>
                      {getEventLabel(selectedModule, event)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-xl space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5 text-stc-gold" />
              <span>الاجراء (Action)</span>
            </h3>

            <div>
              <label className="label">نوع الاجراء</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {ACTION_TYPES.map((action) => {
                  const Icon = actionIcons[action.id];
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, action_type: action.id })}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        formData.action_type === action.id
                          ? 'bg-stc-gold/20 border-stc-gold text-stc-gold'
                          : 'bg-white/5 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-xs">{action.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {formData.action_type === 'notification' && (
              <div>
                <label className="label">رسالة الاشعار</label>
                <input
                  type="text"
                  value={(formData.action_command as any).message || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    action_command: { ...formData.action_command, message: e.target.value }
                  })}
                  className="input"
                  placeholder="تم كشف حريق في الكاميرا..."
                />
              </div>
            )}

            {formData.action_type === 'http_request' && (
              <div>
                <label className="label">رابط API</label>
                <input
                  type="url"
                  value={(formData.action_command as any).url || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    action_command: { ...formData.action_command, url: e.target.value }
                  })}
                  className="input"
                  dir="ltr"
                  placeholder="https://api.example.com/webhook"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">فترة الانتظار (ثواني)</label>
              <input
                type="number"
                value={formData.cooldown_seconds}
                onChange={(e) => setFormData({ ...formData, cooldown_seconds: parseInt(e.target.value) })}
                className="input"
                min="0"
                max="3600"
              />
              <p className="text-xs text-white/50 mt-1">
                الانتظار قبل تنفيذ الامر مرة اخرى
              </p>
            </div>
            <div>
              <label className="label">الاولوية</label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="input"
                min="0"
                max="100"
              />
              <p className="text-xs text-white/50 mt-1">
                الاوامر ذات الاولوية الاعلى تنفذ اولا
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-white/20 bg-white/5"
              />
              <span>تفعيل الامر</span>
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary"
            >
              الغاء
            </button>
            <button type="submit" className="btn-primary">
              {editingRule ? 'حفظ التعديلات' : 'اضافة الامر'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
