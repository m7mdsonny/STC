import { useState, useEffect } from 'react';
import {
  Brain,
  Search,
  Edit2,
  Save,
  X,
  Flame,
  ShieldAlert,
  Users,
  Car,
  UserCheck,
  HardHat,
  Factory,
  Package,
  Waves,
  Loader2
} from 'lucide-react';
import { aiModulesApi } from '../../lib/api/aiModules';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import type { AiModule } from '../../lib/api/aiModules';

const moduleIcons: Record<string, any> = {
  fire_detection: Flame,
  intrusion_detection: ShieldAlert,
  face_recognition: UserCheck,
  vehicle_recognition: Car,
  crowd_detection: Users,
  ppe_detection: HardHat,
  production_monitoring: Factory,
  warehouse_monitoring: Package,
  drowning_detection: Waves,
};

export function AIModulesAdmin() {
  const [modules, setModules] = useState<AiModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingModule, setEditingModule] = useState<AiModule | null>(null);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  const [editForm, setEditForm] = useState({
    name: '',
    display_name: '',
    display_name_ar: '',
    description: '',
    description_ar: '',
    is_active: true, // CRITICAL FIX: Use is_active not is_enabled
    display_order: 0,
  });

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const data = await aiModulesApi.getModules();
      setModules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching modules:', error);
      setModules([]);
      showError('خطأ في التحميل', 'فشل تحميل وحدات الذكاء الاصطناعي');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModule = async (module: AiModule) => {
    try {
      // CRITICAL FIX: Use is_active not is_enabled
      await aiModulesApi.updateModule(module.id, {
        is_active: !module.is_active,
      });
      showSuccess('تم التحديث', `تم ${module.is_active ? 'تعطيل' : 'تفعيل'} الموديول بنجاح`);
      await fetchModules();
    } catch (error) {
      console.error('Error toggling module:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل تحديث حالة الموديول';
      showError('خطأ', errorMessage);
    }
  };

  const openEditModal = (module: AiModule) => {
    setEditingModule(module);
    setEditForm({
      name: module.name,
      display_name: module.display_name || '',
      display_name_ar: module.display_name_ar || '',
      description: module.description || '',
      description_ar: module.description_ar || '',
      is_active: module.is_active, // CRITICAL FIX: Use is_active
      display_order: module.display_order || 0,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule) return;

    setSaving(true);
    try {
      await aiModulesApi.updateModule(editingModule.id, editForm);
      showSuccess('تم الحفظ', 'تم تحديث معلومات الموديول بنجاح');
      setShowEditModal(false);
      setEditingModule(null);
      await fetchModules();
    } catch (error) {
      console.error('Error updating module:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل تحديث الموديول';
      showError('خطأ في الحفظ', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // CRITICAL FIX: Remove category filter (category doesn't exist in DB)
  const filteredModules = modules.filter(module => {
    if (!module) return false;
    const matchesSearch = (module.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (module.display_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: modules.length,
    enabled: modules.filter(m => m.is_active).length, // CRITICAL FIX: Use is_active
    disabled: modules.filter(m => !m.is_active).length,
  };

  // Removed getPlanLevelText and getCategoryBadgeColor (fields don't exist)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة موديولات الذكاء الاصطناعي</h1>
          <p className="text-white/60">إدارة إعدادات وتوفر موديولات الذكاء الاصطناعي على مستوى المنصة</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
              <Brain className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-white/60">إجمالي الموديولات</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
              <Brain className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.enabled}</p>
              <p className="text-sm text-white/60">مفعّل</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5">
              <Brain className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.disabled}</p>
              <p className="text-sm text-white/60">معطّل</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="بحث في الموديولات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-12 w-full"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-stc-gold animate-spin" />
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="card p-12 text-center">
          <Brain className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد موديولات</h3>
          <p className="text-white/60">لا توجد موديولات ذكاء اصطناعي تطابق معايير البحث</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredModules.map((module) => {
            const Icon = Brain; // Use Brain icon for all modules
            return (
              <div key={module.id} className="card p-6 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
                      <Icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{module.display_name || module.name}</h3>
                      <p className="text-sm text-white/50 font-mono">{module.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openEditModal(module)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-white/60" />
                  </button>
                </div>

                <p className="text-white/70 text-sm mb-4 line-clamp-2">
                  {module.description || 'لا يوجد وصف متاح'}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-sm text-white/60">
                    الحالة: {module.is_active ? 'مفعّل' : 'معطّل'}
                  </span>
                  <button
                    onClick={() => handleToggleModule(module)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      module.is_active ? 'bg-blue-500' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        module.is_active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingModule(null);
        }}
        title="تعديل موديول الذكاء الاصطناعي"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="label">اسم الموديول (مفتاح فريد)</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="input"
              required
              disabled
            />
            <p className="text-xs text-white/50 mt-1">لا يمكن تغيير المفتاح الفريد</p>
          </div>

          <div>
            <label className="label">اسم العرض (عربي)</label>
            <input
              type="text"
              value={editForm.display_name}
              onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">اسم العرض (إنجليزي)</label>
            <input
              type="text"
              value={editForm.display_name_ar}
              onChange={(e) => setEditForm({ ...editForm, display_name_ar: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">الوصف</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="input min-h-[100px]"
              rows={3}
            />
          </div>

          <div>
            <label className="label">الوصف (عربي)</label>
            <textarea
              value={editForm.description_ar}
              onChange={(e) => setEditForm({ ...editForm, description_ar: e.target.value })}
              className="input min-h-[100px]"
              rows={3}
            />
          </div>

          <div>
            <label className="label">ترتيب العرض</label>
            <input
              type="number"
              value={editForm.display_order}
              onChange={(e) => setEditForm({ ...editForm, display_order: parseInt(e.target.value) || 0 })}
              className="input"
              min="0"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5"
              />
              <div>
                <p className="font-medium">تفعيل الموديول</p>
                <p className="text-sm text-white/50">جعل الموديول متاحاً على مستوى المنصة</p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="btn-secondary flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
