import { useState, useEffect } from 'react';
import { Building2, Save, MapPin, Phone, Mail, FileText, Calendar, CreditCard, Camera, Server, Upload, Image, X } from 'lucide-react';
import { organizationsApi } from '../../lib/api/organizations';
import { settingsApi } from '../../lib/api/settings';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getDetailedErrorMessage } from '../../lib/errorMessages';
import type { SubscriptionPlan } from '../../types/database';

export function OrganizationSettings() {
  const { organization, canManage } = useAuth();
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [stats, setStats] = useState({ cameras: 0, servers: 0, users: 0 });

  const [form, setForm] = useState({
    name: '',
    name_en: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    tax_number: '',
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (organization) {
      setForm({
        name: organization.name,
        name_en: organization.name_en || '',
        address: organization.address || '',
        city: organization.city || '',
        phone: organization.phone || '',
        email: organization.email || '',
        tax_number: organization.tax_number || '',
      });
      setLogoUrl(organization.logo_url || null);
      fetchPlanAndStats();
    }
  }, [organization]);

  const fetchPlanAndStats = async () => {
    if (!organization) return;

    try {
      const [plans, orgStats] = await Promise.all([
        settingsApi.getPlans(),
        organizationsApi.getStats(organization.id),
      ]);

      const planName = organization.subscription_plan === 'basic' ? 'Basic' :
                      organization.subscription_plan === 'professional' ? 'Professional' : 'Enterprise';
      const matchedPlan = plans.find(p => p.name === planName);
      if (matchedPlan) setPlan(matchedPlan);

      setStats({
        cameras: orgStats.cameras_count || 0,
        servers: orgStats.edge_servers_count || 0,
        users: orgStats.users_count || 0,
      });
    } catch (error) {
      console.error('Error fetching plan and stats:', error);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization || !canManage) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صحيح');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت');
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'https://stcsolutions.online/api/v1';
      
      const response = await fetch(`${apiUrl}/organizations/${organization.id}/upload-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setLogoUrl(data.url || data.logo_url);
        showSuccess('تم رفع الشعار بنجاح', 'تم تحديث شعار المؤسسة بنجاح');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'فشل رفع الشعار');
      }
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      const { title, message } = getDetailedErrorMessage(error, 'رفع الشعار', 'حدث خطأ في رفع الشعار');
      showError(title, message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = async () => {
    if (!organization || !canManage || !confirm('هل أنت متأكد من حذف الشعار؟')) return;
    
    try {
      await organizationsApi.updateOrganization(organization.id, { logo_url: null });
      setLogoUrl(null);
      showSuccess('تم الحذف بنجاح', 'تم حذف شعار المؤسسة بنجاح');
    } catch (error) {
      console.error('Error removing logo:', error);
      const { title, message } = getDetailedErrorMessage(error, 'حذف الشعار', 'حدث خطأ في حذف الشعار');
      showError(title, message);
    }
  };

  const saveSettings = async () => {
    if (!organization || !canManage) return;
    setSaving(true);

    try {
      await organizationsApi.updateOrganization(organization.id, form);
      showSuccess('تم الحفظ بنجاح', 'تم تحديث إعدادات المؤسسة بنجاح');
    } catch (error) {
      console.error('Error saving organization settings:', error);
      const { title, message } = getDetailedErrorMessage(error, 'حفظ الإعدادات', 'حدث خطأ في حفظ الإعدادات');
      showError(title, message);
    }

    setSaving(false);
  };

  const getPlanColor = () => {
    switch (organization?.subscription_plan) {
      case 'enterprise': return 'bg-gradient-to-r from-amber-500 to-amber-600';
      case 'professional': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className={`card p-6 ${getPlanColor()}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">الباقة: {plan?.name_ar || organization?.subscription_plan}</h3>
            <p className="text-white/80 text-sm mt-1">
              {plan?.price_monthly?.toLocaleString()} جنيه مصري / شهريا
            </p>
          </div>
          <CreditCard className="w-10 h-10 text-white/80" />
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-black/20 rounded-lg p-3 text-center">
            <Camera className="w-5 h-5 mx-auto mb-1 text-white/80" />
            <p className="text-xl font-bold text-white">{stats.cameras} / {organization?.max_cameras}</p>
            <p className="text-xs text-white/60">كاميرات</p>
          </div>
          <div className="bg-black/20 rounded-lg p-3 text-center">
            <Server className="w-5 h-5 mx-auto mb-1 text-white/80" />
            <p className="text-xl font-bold text-white">{stats.servers} / {organization?.max_edge_servers}</p>
            <p className="text-xs text-white/60">سيرفرات</p>
          </div>
          <div className="bg-black/20 rounded-lg p-3 text-center">
            <Building2 className="w-5 h-5 mx-auto mb-1 text-white/80" />
            <p className="text-xl font-bold text-white">{stats.users}</p>
            <p className="text-xs text-white/60">مستخدمين</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-stc-gold" />
          معلومات المؤسسة
        </h3>

        {/* Logo Upload Section */}
        <div className="mb-6 pb-6 border-b border-white/10">
          <label className="label mb-3">شعار المؤسسة</label>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 bg-white/5 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <Image className="w-8 h-8 text-white/40" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="btn-secondary cursor-pointer flex items-center gap-2 w-fit" htmlFor="logo-upload">
                <Upload className="w-4 h-4" />
                <span>{uploadingLogo ? 'جاري الرفع...' : 'رفع شعار'}</span>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={!canManage || uploadingLogo}
                />
              </label>
              {logoUrl && canManage && (
                <button
                  onClick={removeLogo}
                  className="btn-secondary flex items-center gap-2 w-fit text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                  <span>حذف الشعار</span>
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-white/50 mt-2">الحجم الموصى به: 200x200 بكسل، PNG أو JPG</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">اسم المؤسسة (عربي)</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              disabled={!canManage}
            />
          </div>
          <div>
            <label className="label">اسم المؤسسة (انجليزي)</label>
            <input
              type="text"
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              className="input"
              dir="ltr"
              disabled={!canManage}
            />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Phone className="w-5 h-5 text-stc-gold" />
          معلومات الاتصال
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label flex items-center gap-2">
              <Mail className="w-4 h-4" />
              البريد الالكتروني
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              dir="ltr"
              placeholder="info@company.com"
              disabled={!canManage}
            />
          </div>
          <div>
            <label className="label flex items-center gap-2">
              <Phone className="w-4 h-4" />
              رقم الهاتف
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input"
              dir="ltr"
              placeholder="+966 5x xxx xxxx"
              disabled={!canManage}
            />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-stc-gold" />
          العنوان
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">المدينة</label>
            <select
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="input"
              disabled={!canManage}
            >
              <option value="">اختر المدينة</option>
              <option value="القاهرة">القاهرة</option>
              <option value="الجيزة">الجيزة</option>
              <option value="الإسكندرية">الإسكندرية</option>
              <option value="شبرا الخيمة">شبرا الخيمة</option>
              <option value="بورسعيد">بورسعيد</option>
              <option value="السويس">السويس</option>
              <option value="الأقصر">الأقصر</option>
              <option value="أسوان">أسوان</option>
              <option value="طنطا">طنطا</option>
              <option value="المنصورة">المنصورة</option>
              <option value="أسيوط">أسيوط</option>
              <option value="الإسماعيلية">الإسماعيلية</option>
              <option value="دمياط">دمياط</option>
              <option value="الزقازيق">الزقازيق</option>
              <option value="قنا">قنا</option>
              <option value="سوهاج">سوهاج</option>
            </select>
          </div>
          <div>
            <label className="label">العنوان التفصيلي</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="input"
              placeholder="الحي، الشارع، رقم المبنى"
              disabled={!canManage}
            />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-stc-gold" />
          المعلومات الضريبية
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">الرقم الضريبي</label>
            <input
              type="text"
              value={form.tax_number}
              onChange={(e) => setForm({ ...form, tax_number: e.target.value })}
              className="input"
              dir="ltr"
              placeholder="300xxxxxxxxx"
              disabled={!canManage}
            />
          </div>
          <div>
            <label className="label">تاريخ الاشتراك</label>
            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
              <Calendar className="w-5 h-5 text-white/40" />
              <span className="text-white/70">
                {organization?.created_at ? new Date(organization.created_at).toLocaleDateString('ar-SA') : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {canManage && (
        <div className="flex justify-end">
          <button onClick={saveSettings} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-5 h-5" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
