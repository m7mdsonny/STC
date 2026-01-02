import { useState, useEffect } from 'react';
import { Plus, Search, Building2, Edit2, Pause } from 'lucide-react';
import { organizationsApi, subscriptionPlansApi } from '../../lib/api';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { getDetailedErrorMessage } from '../../lib/errorMessages';
import type { Organization, SubscriptionPlan } from '../../types/database';

export function Organizations() {
  const { showSuccess, showError } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    email: '',
    phone: '',
    city: '',
    subscription_plan: 'basic' as const,
    max_cameras: 4,
    max_edge_servers: 1,
  });

  useEffect(() => {
    fetchOrganizations();
    fetchPlans();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const response = await organizationsApi.getOrganizations();
      // Handle paginated response
      if (Array.isArray(response.data)) {
        setOrganizations(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setOrganizations(response.data.data);
      } else {
        setOrganizations([]);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await subscriptionPlansApi.getPlans();
      setPlans(res as unknown as SubscriptionPlan[]);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError('بيانات غير مكتملة', 'يرجى إدخال اسم المؤسسة');
      return;
    }

    try {
      // Ensure subscription_plan is set
      const submitData = {
        ...formData,
        subscription_plan: formData.subscription_plan || 'basic',
      };

      if (editingOrg) {
        await organizationsApi.updateOrganization(editingOrg.id, submitData);
        showSuccess('تم التحديث بنجاح', `تم تحديث بيانات المؤسسة ${formData.name} بنجاح`);
        setEditingOrg(null);
      } else {
        await organizationsApi.createOrganization(submitData);
        showSuccess('تم الإضافة بنجاح', `تم إضافة المؤسسة ${formData.name} بنجاح`);
      }
      await fetchOrganizations();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving organization:', error);
      const { title, message } = getDetailedErrorMessage(error, editingOrg ? 'تحديث المؤسسة' : 'إضافة المؤسسة', 'حدث خطأ في حفظ المؤسسة');
      showError(title, message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_en: '',
      email: '',
      phone: '',
      city: '',
      subscription_plan: 'basic' as const,
      max_cameras: 4,
      max_edge_servers: 1,
    });
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      name_en: org.name_en || '',
      email: org.email || '',
      phone: org.phone || '',
      city: org.city || '',
      subscription_plan: org.subscription_plan,
      max_cameras: org.max_cameras,
      max_edge_servers: org.max_edge_servers,
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (org: Organization) => {
    try {
      await organizationsApi.toggleActive(org.id);
      showSuccess(
        'تم التحديث',
        `تم ${org.is_active ? 'تعطيل' : 'تفعيل'} المؤسسة ${org.name} بنجاح`
      );
      fetchOrganizations();
    } catch (error) {
      console.error('Error toggling status:', error);
      const { title, message } = getDetailedErrorMessage(error, 'تغيير حالة المؤسسة', 'حدث خطأ في تغيير حالة المؤسسة');
      showError(title, message);
    }
  };

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(search.toLowerCase()) ||
    org.email?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: 'name',
      title: 'المؤسسة',
      render: (org: Organization) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-stc-gold/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-stc-gold" />
          </div>
          <div>
            <p className="font-medium">{org.name}</p>
            <p className="text-xs text-white/50">{org.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'subscription_plan',
      title: 'الباقة',
      render: (org: Organization) => (
        <span className={`badge ${
          org.subscription_plan === 'enterprise' ? 'badge-success' :
          org.subscription_plan === 'professional' ? 'badge-warning' : 'badge-info'
        }`}>
          {org.subscription_plan === 'enterprise' ? 'مؤسسي' :
           org.subscription_plan === 'professional' ? 'احترافي' : 'اساسي'}
        </span>
      ),
    },
    {
      key: 'limits',
      title: 'الحدود',
      render: (org: Organization) => (
        <div className="text-sm">
          <p>{org.max_cameras} كاميرا</p>
          <p className="text-white/50">{org.max_edge_servers} سيرفر</p>
        </div>
      ),
    },
    {
      key: 'is_active',
      title: 'الحالة',
      render: (org: Organization) => (
        <span className={`badge ${org.is_active ? 'badge-success' : 'badge-danger'}`}>
          {org.is_active ? 'نشط' : 'معلق'}
        </span>
      ),
    },
    {
      key: 'created_at',
      title: 'تاريخ الانشاء',
      render: (org: Organization) => (
        <span className="text-white/60">
          {new Date(org.created_at).toLocaleDateString('ar-EG')}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '',
      render: (org: Organization) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(org)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="تعديل"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(org)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={org.is_active ? 'تعليق' : 'تفعيل'}
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">المؤسسات</h1>
          <p className="text-white/60">ادارة المؤسسات والاشتراكات</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingOrg(null);
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>اضافة مؤسسة</span>
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث عن مؤسسة..."
            className="input pr-12"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredOrgs}
        loading={loading}
        emptyMessage="لا توجد مؤسسات"
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingOrg ? 'تعديل المؤسسة' : 'اضافة مؤسسة جديدة'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">اسم المؤسسة (عربي)</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">اسم المؤسسة (انجليزي)</label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="input"
                dir="ltr"
              />
            </div>
            <div>
              <label className="label">البريد الالكتروني</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                dir="ltr"
              />
            </div>
            <div>
              <label className="label">الهاتف</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                dir="ltr"
              />
            </div>
            <div>
              <label className="label">المدينة</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">الباقة</label>
              <select
                value={formData.subscription_plan}
                onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value as any })}
                className="select"
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.name}>{plan.name_ar}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">الحد الاقصى للكاميرات</label>
              <input
                type="number"
                value={formData.max_cameras}
                onChange={(e) => setFormData({ ...formData, max_cameras: parseInt(e.target.value) })}
                className="input"
                min="1"
                max="128"
              />
            </div>
            <div>
              <label className="label">الحد الاقصى للسيرفرات</label>
              <input
                type="number"
                value={formData.max_edge_servers}
                onChange={(e) => setFormData({ ...formData, max_edge_servers: parseInt(e.target.value) })}
                className="input"
                min="1"
                max="10"
              />
            </div>
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
              {editingOrg ? 'حفظ التعديلات' : 'اضافة المؤسسة'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
