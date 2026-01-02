import { useState, useEffect } from 'react';
import { Car, Plus, Search, Trash2, Edit2, CheckCircle, XCircle, Shield, Star, Truck } from 'lucide-react';
import { vehiclesApi } from '../lib/api/vehicles';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getDetailedErrorMessage } from '../lib/errorMessages';
import { Modal } from '../components/ui/Modal';
import type { RegisteredVehicle } from '../types/database';

const CATEGORIES = [
  { id: 'employee', name: 'موظف', color: 'bg-blue-500' },
  { id: 'vip', name: 'VIP', color: 'bg-stc-gold' },
  { id: 'visitor', name: 'زائر', color: 'bg-emerald-500' },
  { id: 'delivery', name: 'توصيل', color: 'bg-orange-500' },
  { id: 'blacklist', name: 'قائمة سوداء', color: 'bg-red-500' },
];

const VEHICLE_TYPES = [
  { id: 'sedan', name: 'سيدان' },
  { id: 'suv', name: 'SUV' },
  { id: 'pickup', name: 'بيك اب' },
  { id: 'van', name: 'فان' },
  { id: 'truck', name: 'شاحنة' },
  { id: 'motorcycle', name: 'دراجة نارية' },
];

export function Vehicles() {
  const { organization, canManage } = useAuth();
  const { showSuccess, showError } = useToast();
  const [vehicles, setVehicles] = useState<RegisteredVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<RegisteredVehicle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    plate_number: '',
    plate_ar: '',
    owner_name: '',
    vehicle_type: 'sedan',
    vehicle_color: '',
    category: 'employee' as RegisteredVehicle['category'],
  });

  useEffect(() => {
    if (organization) {
      fetchVehicles();
    }
  }, [organization]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const result = await vehiclesApi.getVehicles({
        organization_id: organization?.id,
      });
      setVehicles(result.data || []);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) {
      showError('خطأ في تسجيل الدخول', 'يرجى التأكد من تسجيل الدخول بشكل صحيح');
      return;
    }

    if (!formData.plate_number.trim()) {
      showError('بيانات غير مكتملة', 'يرجى إدخال رقم اللوحة');
      return;
    }

    try {
      const payload = {
        plate_number: formData.plate_number,
        plate_ar: formData.plate_ar || undefined,
        owner_name: formData.owner_name || undefined,
        vehicle_type: formData.vehicle_type || undefined,
        vehicle_color: formData.vehicle_color || undefined,
        category: formData.category,
      };

      if (editingVehicle) {
        await vehiclesApi.updateVehicle(editingVehicle.id, payload);
        showSuccess('تم التحديث بنجاح', `تم تحديث بيانات المركبة ${formData.plate_number} بنجاح`);
      } else {
        await vehiclesApi.createVehicle(payload);
        showSuccess('تم الإضافة بنجاح', `تم إضافة المركبة ${formData.plate_number} إلى النظام بنجاح`);
      }

      setShowModal(false);
      setEditingVehicle(null);
      resetForm();
      fetchVehicles();
    } catch (error: any) {
      console.error('Failed to save vehicle:', error);
      const { title, message } = getDetailedErrorMessage(error, 'حفظ المركبة', 'حدث خطأ في حفظ المركبة');
      showError(title, message);
    }
  };

  const handleDelete = async (id: string) => {
    const vehicle = vehicles.find(v => v.id === id);
    if (!confirm(`هل أنت متأكد من حذف المركبة ${vehicle?.plate_number || ''}؟`)) return;
    try {
      await vehiclesApi.deleteVehicle(id);
      showSuccess('تم الحذف بنجاح', `تم حذف المركبة ${vehicle?.plate_number || ''} من النظام`);
      fetchVehicles();
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      const { title, message } = getDetailedErrorMessage(error, 'حذف المركبة', 'حدث خطأ في حذف المركبة');
      showError(title, message);
    }
  };

  const toggleActive = async (vehicle: RegisteredVehicle) => {
    try {
      await vehiclesApi.toggleActive(vehicle.id);
      const newStatus = vehicle.is_active ? 'تعطيل' : 'تفعيل';
      showSuccess('تم التحديث', `تم ${newStatus} المركبة ${vehicle.plate_number} بنجاح`);
      fetchVehicles();
    } catch (error) {
      console.error('Failed to toggle vehicle status:', error);
      const { title, message } = getDetailedErrorMessage(error, 'تغيير حالة المركبة', 'حدث خطأ في تغيير حالة المركبة');
      showError(title, message);
    }
  };

  const resetForm = () => {
    setFormData({
      plate_number: '',
      plate_ar: '',
      owner_name: '',
      vehicle_type: 'sedan',
      vehicle_color: '',
      category: 'employee',
    });
  };

  const openEditModal = (vehicle: RegisteredVehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      plate_number: vehicle.plate_number,
      plate_ar: vehicle.plate_ar || '',
      owner_name: vehicle.owner_name || '',
      vehicle_type: vehicle.vehicle_type || 'sedan',
      vehicle_color: vehicle.vehicle_color || '',
      category: vehicle.category,
    });
    setShowModal(true);
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vehicle.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (vehicle.plate_ar?.includes(searchQuery));
    const matchesCategory = categoryFilter === 'all' || vehicle.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  };

  const stats = {
    total: vehicles.length,
    employees: vehicles.filter(v => v.category === 'employee').length,
    vip: vehicles.filter(v => v.category === 'vip').length,
    blacklist: vehicles.filter(v => v.category === 'blacklist').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">المركبات</h1>
          <p className="text-white/60">ادارة قاعدة بيانات المركبات</p>
        </div>
        {canManage && (
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <span>اضافة مركبة</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-stc-gold/20 to-stc-gold/5">
              <Car className="w-6 h-6 text-stc-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-white/60">الاجمالي</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
              <Car className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.employees}</p>
              <p className="text-sm text-white/60">موظفين</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-stc-gold/20 to-stc-gold/5">
              <Star className="w-6 h-6 text-stc-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.vip}</p>
              <p className="text-sm text-white/60">VIP</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.blacklist}</p>
              <p className="text-sm text-white/60">قائمة سوداء</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="بحث برقم اللوحة او اسم المالك..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pr-12 w-full"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input"
          >
            <option value="all">كل الفئات</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="card p-12 text-center">
          <Car className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد مركبات</h3>
          <p className="text-white/60 mb-4">ابدا باضافة مركبات لقاعدة البيانات</p>
          {canManage && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              اضافة مركبة
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-right p-4 font-medium text-white/70">اللوحة</th>
                <th className="text-right p-4 font-medium text-white/70">المالك</th>
                <th className="text-right p-4 font-medium text-white/70">النوع</th>
                <th className="text-right p-4 font-medium text-white/70">اللون</th>
                <th className="text-right p-4 font-medium text-white/70">الفئة</th>
                <th className="text-right p-4 font-medium text-white/70">الحالة</th>
                {canManage && <th className="text-right p-4 font-medium text-white/70">اجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => {
                const category = getCategoryInfo(vehicle.category);
                return (
                  <tr key={vehicle.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div>
                        <p className="font-medium font-mono" dir="ltr">{vehicle.plate_number}</p>
                        {vehicle.plate_ar && (
                          <p className="text-sm text-white/60">{vehicle.plate_ar}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-white/80">{vehicle.owner_name || '-'}</td>
                    <td className="p-4 text-white/60">
                      {VEHICLE_TYPES.find(t => t.id === vehicle.vehicle_type)?.name || vehicle.vehicle_type}
                    </td>
                    <td className="p-4 text-white/60">{vehicle.vehicle_color || '-'}</td>
                    <td className="p-4">
                      <span className={`badge text-white ${category.color}`}>
                        {category.name}
                      </span>
                    </td>
                    <td className="p-4">
                      {vehicle.is_active ? (
                        <span className="badge badge-success">نشط</span>
                      ) : (
                        <span className="badge">غير نشط</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditModal(vehicle)} className="p-2 hover:bg-white/10 rounded">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => toggleActive(vehicle)} className="p-2 hover:bg-white/10 rounded">
                            {vehicle.is_active ? (
                              <XCircle className="w-4 h-4 text-red-400" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            )}
                          </button>
                          <button onClick={() => handleDelete(vehicle.id)} className="p-2 hover:bg-red-500/20 rounded">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingVehicle(null); resetForm(); }}
        title={editingVehicle ? 'تعديل المركبة' : 'اضافة مركبة جديدة'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">رقم اللوحة (انجليزي)</label>
              <input
                type="text"
                value={formData.plate_number}
                onChange={(e) => setFormData({ ...formData, plate_number: e.target.value.toUpperCase() })}
                className="input font-mono"
                placeholder="ABC 1234"
                dir="ltr"
                required
              />
            </div>
            <div>
              <label className="label">رقم اللوحة (عربي)</label>
              <input
                type="text"
                value={formData.plate_ar}
                onChange={(e) => setFormData({ ...formData, plate_ar: e.target.value })}
                className="input"
                placeholder="ا ب ج 1234"
              />
            </div>
          </div>

          <div>
            <label className="label">اسم المالك</label>
            <input
              type="text"
              value={formData.owner_name}
              onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">نوع المركبة</label>
              <select
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                className="input"
              >
                {VEHICLE_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">اللون</label>
              <input
                type="text"
                value={formData.vehicle_color}
                onChange={(e) => setFormData({ ...formData, vehicle_color: e.target.value })}
                className="input"
                placeholder="ابيض، اسود، احمر..."
              />
            </div>
          </div>

          <div>
            <label className="label">الفئة</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.id as RegisteredVehicle['category'] })}
                  className={`p-3 rounded-lg border text-sm transition-all flex items-center gap-2 ${
                    formData.category === cat.id
                      ? 'bg-stc-gold/20 border-stc-gold text-stc-gold'
                      : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => { setShowModal(false); setEditingVehicle(null); resetForm(); }}
              className="btn-secondary"
            >
              الغاء
            </button>
            <button type="submit" className="btn-primary">
              {editingVehicle ? 'حفظ التعديلات' : 'اضافة المركبة'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
