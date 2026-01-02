import { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Edit2, Trash2, Building2,
  Mail, Phone, MapPin, Percent, DollarSign, CheckCircle, XCircle
} from 'lucide-react';
import { settingsApi } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import type { Reseller, Organization } from '../../types/database';

export function Resellers() {
  const [resellers, setResellers] = useState<(Reseller & { organizations_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    email: '',
    phone: '',
    company_name: '',
    tax_number: '',
    address: '',
    city: '',
    country: 'SA',
    commission_rate: 10,
    discount_rate: 5,
    credit_limit: 0,
    contact_person: '',
    is_active: true
  });

  useEffect(() => {
    fetchResellers();
  }, []);

  const fetchResellers = async () => {
    setLoading(true);
    try {
      const data = await settingsApi.getResellers();
      // Note: organizations_count would need to be included in API response
      setResellers(data.map(r => ({ ...r, organizations_count: 0 })));
    } catch (error) {
      console.error('Error fetching resellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingReseller) {
        await settingsApi.updateReseller(editingReseller.id, formData);
      } else {
        await settingsApi.createReseller(formData);
      }

      setShowModal(false);
      resetForm();
      fetchResellers();
    } catch (error) {
      console.error('Error saving reseller:', error);
    }
  };

  const deleteReseller = async (id: string) => {
    if (!confirm('هل انت متاكد من حذف هذا الموزع؟')) return;
    try {
      await settingsApi.deleteReseller(id);
      fetchResellers();
    } catch (error) {
      console.error('Error deleting reseller:', error);
    }
  };

  const toggleStatus = async (id: string, isActive: boolean) => {
    try {
      await settingsApi.updateReseller(id, { is_active: !isActive });
      fetchResellers();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_en: '',
      email: '',
      phone: '',
      company_name: '',
      tax_number: '',
      address: '',
      city: '',
      country: 'SA',
      commission_rate: 10,
      discount_rate: 5,
      credit_limit: 0,
      contact_person: '',
      is_active: true
    });
    setEditingReseller(null);
  };

  const openEditModal = (reseller: Reseller) => {
    setEditingReseller(reseller);
    setFormData({
      name: reseller.name,
      name_en: reseller.name_en || '',
      email: reseller.email,
      phone: reseller.phone || '',
      company_name: reseller.company_name || '',
      tax_number: reseller.tax_number || '',
      address: reseller.address || '',
      city: reseller.city || '',
      country: reseller.country,
      commission_rate: reseller.commission_rate,
      discount_rate: reseller.discount_rate,
      credit_limit: reseller.credit_limit,
      contact_person: reseller.contact_person || '',
      is_active: reseller.is_active
    });
    setShowModal(true);
  };

  const filteredResellers = resellers.filter(reseller =>
    reseller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reseller.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reseller.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: resellers.length,
    active: resellers.filter(r => r.is_active).length,
    totalOrgs: resellers.reduce((sum, r) => sum + (r.organizations_count || 0), 0),
    totalBalance: resellers.reduce((sum, r) => sum + r.current_balance, 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">الموزعين والشركاء</h1>
          <p className="text-white/60">ادارة الموزعين والوكلاء المعتمدين</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span>اضافة موزع</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-stc-gold/20 to-stc-gold/5">
              <Users className="w-6 h-6 text-stc-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-white/60">اجمالي الموزعين</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-white/60">نشط</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5">
              <Building2 className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalOrgs}</p>
              <p className="text-sm text-white/60">المؤسسات</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-500/5">
              <DollarSign className="w-6 h-6 text-teal-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalBalance.toLocaleString()}</p>
              <p className="text-sm text-white/60">الرصيد الاجمالي</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="بحث بالاسم، البريد، او الشركة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pr-12 w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredResellers.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا يوجد موزعين</h3>
          <p className="text-white/60">لم يتم اضافة اي موزعين بعد</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredResellers.map((reseller) => (
            <div key={reseller.id} className="card p-5 hover:bg-white/5 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-stc-gold/30 to-stc-gold/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-stc-gold">
                      {reseller.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{reseller.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        reseller.is_active
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {reseller.is_active ? 'نشط' : 'معطل'}
                      </span>
                    </div>
                    {reseller.company_name && (
                      <p className="text-sm text-white/60 mt-0.5">{reseller.company_name}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/50">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{reseller.email}</span>
                      </div>
                      {reseller.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span dir="ltr">{reseller.phone}</span>
                        </div>
                      )}
                      {reseller.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{reseller.city}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        <span>{reseller.organizations_count} مؤسسة</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <div className="flex items-center gap-2 text-sm">
                      <Percent className="w-4 h-4 text-white/50" />
                      <span>عمولة: {reseller.commission_rate}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60 mt-1">
                      <span>خصم: {reseller.discount_rate}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStatus(reseller.id, reseller.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        reseller.is_active
                          ? 'hover:bg-red-500/20'
                          : 'hover:bg-emerald-500/20'
                      }`}
                    >
                      {reseller.is_active ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(reseller)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5 text-white/60" />
                    </button>
                    <button
                      onClick={() => deleteReseller(reseller.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingReseller ? 'تعديل بيانات الموزع' : 'اضافة موزع جديد'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">الاسم بالعربية</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">الاسم بالانجليزية</label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">البريد الالكتروني</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">رقم الهاتف</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">اسم الشركة</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">الرقم الضريبي</label>
              <input
                type="text"
                value={formData.tax_number}
                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <label className="label">جهة الاتصال</label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">العنوان</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">نسبة العمولة %</label>
              <input
                type="number"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
                className="input"
                min={0}
                max={100}
                step={0.1}
              />
            </div>
            <div>
              <label className="label">نسبة الخصم %</label>
              <input
                type="number"
                value={formData.discount_rate}
                onChange={(e) => setFormData({ ...formData, discount_rate: parseFloat(e.target.value) })}
                className="input"
                min={0}
                max={100}
                step={0.1}
              />
            </div>
            <div>
              <label className="label">حد الائتمان</label>
              <input
                type="number"
                value={formData.credit_limit}
                onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) })}
                className="input"
                min={0}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary">
              الغاء
            </button>
            <button type="submit" className="btn-primary">
              {editingReseller ? 'حفظ التعديلات' : 'اضافة الموزع'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
