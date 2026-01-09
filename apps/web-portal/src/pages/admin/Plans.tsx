import { useState, useEffect } from 'react';
import { CreditCard, Edit2, Check, X } from 'lucide-react';
import { settingsApi } from '../../lib/api';
import type { SubscriptionPlan } from '../../types/database';
import { AI_MODULES } from '../../types/database';

export function Plans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SubscriptionPlan>>({});

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await settingsApi.getPlans();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan.id);
    setEditForm({
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      max_cameras: plan.max_cameras,
      max_edge_servers: plan.max_edge_servers,
    });
  };

  const saveEdit = async () => {
    if (!editingPlan) return;
    try {
      await settingsApi.updatePlan(editingPlan, editForm);
      setEditingPlan(null);
      setEditForm({});
      await fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ في حفظ الباقة');
    }
  };

  const cancelEdit = () => {
    setEditingPlan(null);
    setEditForm({});
  };

  const getPlanColor = (name: string) => {
    switch (name.toLowerCase()) {
      case 'basic': return 'from-blue-500/20 to-blue-500/5 border-blue-500/30';
      case 'professional': return 'from-stc-gold/20 to-stc-gold/5 border-stc-gold/30';
      case 'enterprise': return 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30';
      default: return 'from-white/10 to-white/5 border-white/20';
    }
  };

  const getPlanIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'basic': return 'text-blue-400';
      case 'professional': return 'text-stc-gold';
      case 'enterprise': return 'text-emerald-400';
      default: return 'text-white/60';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الباقات</h1>
        <p className="text-white/60">ادارة باقات الاشتراك</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`card p-6 bg-gradient-to-br border ${getPlanColor(plan.name)}`}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">{plan.name_ar}</h3>
                <p className="text-sm text-white/60">{plan.name}</p>
              </div>
              <CreditCard className={`w-8 h-8 ${getPlanIcon(plan.name)}`} />
            </div>

            {editingPlan === plan.id ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/50">السعر الشهري (ج.م)</label>
                  <input
                    type="number"
                    value={editForm.price_monthly}
                    onChange={(e) => setEditForm({ ...editForm, price_monthly: parseFloat(e.target.value) })}
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50">السعر السنوي (ج.م)</label>
                  <input
                    type="number"
                    value={editForm.price_yearly}
                    onChange={(e) => setEditForm({ ...editForm, price_yearly: parseFloat(e.target.value) })}
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50">الحد الاقصى للكاميرات</label>
                  <input
                    type="number"
                    value={editForm.max_cameras}
                    onChange={(e) => setEditForm({ ...editForm, max_cameras: parseInt(e.target.value) })}
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50">الحد الاقصى للسيرفرات</label>
                  <input
                    type="number"
                    value={editForm.max_edge_servers}
                    onChange={(e) => setEditForm({ ...editForm, max_edge_servers: parseInt(e.target.value) })}
                    className="input mt-1"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={saveEdit} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    حفظ
                  </button>
                  <button onClick={cancelEdit} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                    <X className="w-4 h-4" />
                    الغاء
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{plan.price_monthly.toLocaleString()}</span>
                    <span className="text-white/60">ج.م / شهر</span>
                  </div>
                  <p className="text-sm text-white/50 mt-1">
                    او {plan.price_yearly.toLocaleString()} ج.م / سنة
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <span className="text-white/70">الكاميرات</span>
                    <span className="font-medium">{plan.max_cameras}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <span className="text-white/70">السيرفرات</span>
                    <span className="font-medium">{plan.max_edge_servers}</span>
                  </div>
                  <div className="py-2">
                    <p className="text-white/70 mb-2">الوحدات المتاحة:</p>
                    <div className="flex flex-wrap gap-1">
                      {plan.available_modules?.map((moduleId) => {
                        const module = AI_MODULES.find(m => m.id === moduleId);
                        return module ? (
                          <span key={moduleId} className="text-xs px-2 py-1 bg-white/10 rounded">
                            {module.nameAr}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => startEdit(plan)}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  تعديل
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">مقارنة الباقات</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-right p-3 font-medium text-white/70">الميزة</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center p-3 font-medium">{plan.name_ar}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="p-3 text-white/70">السعر الشهري</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="p-3 text-center">{plan.price_monthly} ج.م</td>
                ))}
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-3 text-white/70">الكاميرات</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="p-3 text-center">{plan.max_cameras}</td>
                ))}
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-3 text-white/70">السيرفرات</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="p-3 text-center">{plan.max_edge_servers}</td>
                ))}
              </tr>
              {AI_MODULES.map((module) => (
                <tr key={module.id} className="border-b border-white/5">
                  <td className="p-3 text-white/70">{module.nameAr}</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="p-3 text-center">
                      {plan.available_modules?.includes(module.id) ? (
                        <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-white/30 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
