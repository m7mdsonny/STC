import { useState, useEffect } from 'react';
import {
  Globe, Save, Phone, Mail, MapPin, MessageCircle, Twitter, Linkedin, Instagram,
  Type, FileText, Loader2, Image, BarChart3, Calendar, DollarSign, Sparkles,
  Check, X, Eye, EyeOff, AlertCircle, RefreshCw, Flame, ScanFace, Users, Car,
  UserCheck, ShieldAlert, ShoppingBag, HardHat, Factory, Clock
} from 'lucide-react';
import { settingsApi } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import type { LandingSettings } from '../../types/database';

// AI Modules icons mapping
const moduleIcons = {
  'كشف الحريق والدخان': Flame,
  'التعرف على الوجوه': ScanFace,
  'عد الاشخاص': Users,
  'التعرف على المركبات': Car,
  'تسجيل الحضور': UserCheck,
  'كشف التسلل': ShieldAlert,
  'مراقبة المتاجر': ShoppingBag,
  'سلامة العمال': HardHat,
  'مراقبة الانتاج': Factory,
  'كشف التكاسل': Clock,
};

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  popular: boolean;
}

interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

interface FeatureItem {
  title: string;
  description: string;
}

export function LandingSettingsPage() {
  const { showSuccess, showError } = useToast();
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [published, setPublished] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [form, setForm] = useState({
    hero_title: '',
    hero_subtitle: '',
    hero_button_text: '',
    about_title: '',
    about_description: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    whatsapp_number: '',
    show_whatsapp_button: true,
    footer_text: '',
    social_twitter: '',
    social_linkedin: '',
    social_instagram: '',
    features: [] as FeatureItem[],
  });

  // Pricing plans state
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([
    { name: 'أساسي', price: '500', period: 'شهرياً', features: ['4 كاميرات', 'سيرفر واحد', 'كشف الحريق', 'عد الاشخاص', 'اشعارات Push و Email'], popular: false },
    { name: 'احترافي', price: '1,500', period: 'شهرياً', features: ['16 كاميرا', '2 سيرفر', '5 موديولات', 'التعرف على الوجوه', 'تسجيل الحضور', 'SMS'], popular: true },
    { name: 'مؤسسي', price: '5,000', period: 'شهرياً', features: ['64 كاميرا', '5 سيرفرات', 'كل الموديولات', 'WhatsApp', 'اتصال طوارئ', 'دعم مخصص'], popular: false },
  ]);

  // Statistics state
  const [stats, setStats] = useState<StatItem[]>([
    { value: 500, suffix: '+', label: 'عميل نشط' },
    { value: 10, suffix: '', label: 'موديول ذكاء اصطناعي' },
    { value: 99.9, suffix: '%', label: 'وقت التشغيل' },
    { value: 24, suffix: '/7', label: 'دعم فني' },
  ]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsApi.getLandingSettings();
      setSettings(data.content);
      setPublished(data.published);
      
      // Load form data
      setForm({
        hero_title: data.content.hero_title || 'حول كاميراتك الى عيون ذكية',
        hero_subtitle: data.content.hero_subtitle || 'منصة تحليل الفيديو بالذكاء الاصطناعي - 10 موديولات متخصصة للمراقبة الذكية والأتمتة الكاملة',
        hero_button_text: data.content.hero_button_text || 'ابدأ الآن',
        about_title: data.content.about_title || 'عن المنصة',
        about_description: data.content.about_description || 'منصة متكاملة للمراقبة الذكية بالذكاء الاصطناعي',
        contact_email: data.content.contact_email || 'info@stcsolutions.online',
        contact_phone: data.content.contact_phone || '+966 50 000 0000',
        contact_address: data.content.contact_address || 'المملكة العربية السعودية',
        whatsapp_number: data.content.whatsapp_number || '+966500000000',
        show_whatsapp_button: data.content.show_whatsapp_button ?? true,
        footer_text: data.content.footer_text || '© 2026 STC Solutions. جميع الحقوق محفوظة.',
        social_twitter: data.content.social_twitter || '',
        social_linkedin: data.content.social_linkedin || '',
        social_instagram: data.content.social_instagram || '',
        features: data.content.features || [],
      });

      // Load pricing plans if available
      if (data.content.pricing_plans) {
        setPricingPlans(data.content.pricing_plans);
      }

      // Load stats if available
      if (data.content.stats) {
        setStats(data.content.stats);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showError('خطأ في التحميل', 'سيتم استخدام الإعدادات الافتراضية');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave = {
        ...form,
        pricing_plans: pricingPlans,
        stats: stats,
        published,
      };
      
      const response = await settingsApi.updateLandingSettings(dataToSave);
      setPublished(response.published);
      setSettings(response.content);
      setSaved(true);
      showSuccess('تم الحفظ', 'تم حفظ إعدادات صفحة الهبوط بنجاح');
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('فشل الحفظ', error instanceof Error ? error.message : 'حدث خطأ في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const addPricingPlan = () => {
    setPricingPlans([...pricingPlans, {
      name: 'باقة جديدة',
      price: '0',
      period: 'شهرياً',
      features: [],
      popular: false,
    }]);
  };

  const updatePricingPlan = (index: number, field: keyof PricingPlan, value: any) => {
    const updated = [...pricingPlans];
    updated[index] = { ...updated[index], [field]: value };
    setPricingPlans(updated);
  };

  const deletePricingPlan = (index: number) => {
    if (confirm('هل أنت متأكد من حذف هذه الباقة؟')) {
      setPricingPlans(pricingPlans.filter((_, i) => i !== index));
    }
  };

  const addFeatureToPlan = (planIndex: number) => {
    const updated = [...pricingPlans];
    updated[planIndex].features.push('ميزة جديدة');
    setPricingPlans(updated);
  };

  const updatePlanFeature = (planIndex: number, featureIndex: number, value: string) => {
    const updated = [...pricingPlans];
    updated[planIndex].features[featureIndex] = value;
    setPricingPlans(updated);
  };

  const deletePlanFeature = (planIndex: number, featureIndex: number) => {
    const updated = [...pricingPlans];
    updated[planIndex].features.splice(featureIndex, 1);
    setPricingPlans(updated);
  };

  const updateStat = (index: number, field: keyof StatItem, value: any) => {
    const updated = [...stats];
    updated[index] = { ...updated[index], [field]: value };
    setStats(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Globe className="w-8 h-8 text-stc-gold" />
            إعدادات صفحة الهبوط
          </h1>
          <p className="text-white/60 mt-1">تخصيص شامل لجميع محتوى الصفحة الرئيسية للمنصة</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              published ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/10 text-white/70 border border-white/10'
            }`}
          >
            {published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {published ? 'منشور' : 'غير منشور'}
          </span>
          
          <button
            onClick={() => setPublished(!published)}
            className={`btn-secondary flex items-center gap-2 ${published ? 'text-red-400' : 'text-emerald-400'}`}
            type="button"
          >
            {published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{published ? 'إيقاف النشر' : 'نشر الصفحة'}</span>
          </button>
          
          <button
            onClick={fetchSettings}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : saved ? (
              <>
                <Check className="w-5 h-5" />
                <span>تم الحفظ!</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>حفظ التغييرات</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alert */}
      {!published && (
        <div className="card p-4 bg-amber-500/10 border-amber-500/30">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-amber-200">
              الصفحة غير منشورة حالياً. المستخدمون لن يتمكنوا من مشاهدتها حتى تقوم بالنشر.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {/* Hero Section */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="p-3 rounded-xl bg-gradient-to-br from-stc-gold/20 to-stc-gold/5">
              <Globe className="w-6 h-6 text-stc-gold" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">القسم الرئيسي (Hero Section)</h2>
              <p className="text-sm text-white/50">أول ما يراه الزوار عند دخول الصفحة</p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="label flex items-center gap-2">
                <Type className="w-4 h-4" />
                العنوان الرئيسي
              </label>
              <input
                type="text"
                value={form.hero_title}
                onChange={(e) => setForm({ ...form, hero_title: e.target.value })}
                className="input"
                placeholder="حول كاميراتك الى عيون ذكية"
              />
              <p className="text-xs text-white/40 mt-1.5">سيظهر بخط كبير وبارز في أعلى الصفحة</p>
            </div>
            
            <div>
              <label className="label flex items-center gap-2">
                <FileText className="w-4 h-4" />
                النص التوضيحي
              </label>
              <textarea
                value={form.hero_subtitle}
                onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })}
                className="input min-h-[120px] resize-none"
                placeholder="منصة تحليل الفيديو بالذكاء الاصطناعي - 10 موديولات متخصصة للمراقبة الذكية والأتمتة الكاملة"
              />
              <p className="text-xs text-white/40 mt-1.5">وصف تفصيلي يشرح المنصة بشكل جذاب</p>
            </div>
            
            <div>
              <label className="label">نص زر الإجراء (CTA Button)</label>
              <input
                type="text"
                value={form.hero_button_text}
                onChange={(e) => setForm({ ...form, hero_button_text: e.target.value })}
                className="input"
                placeholder="ابدأ الآن"
              />
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
              <BarChart3 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">الإحصائيات</h2>
              <p className="text-sm text-white/50">أرقام تبرز نجاح المنصة</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label text-xs mb-1.5">القيمة</label>
                    <input
                      type="number"
                      value={stat.value}
                      onChange={(e) => updateStat(index, 'value', parseFloat(e.target.value) || 0)}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="label text-xs mb-1.5">اللاحقة</label>
                    <input
                      type="text"
                      value={stat.suffix}
                      onChange={(e) => updateStat(index, 'suffix', e.target.value)}
                      className="input text-sm"
                      placeholder="+, %, ..."
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="label text-xs mb-1.5">التسمية</label>
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => updateStat(index, 'label', e.target.value)}
                      className="input text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">خطط التسعير</h2>
                <p className="text-sm text-white/50">الباقات والأسعار المتاحة</p>
              </div>
            </div>
            <button onClick={addPricingPlan} className="btn-secondary">
              + إضافة باقة
            </button>
          </div>
          
          <div className="space-y-4">
            {pricingPlans.map((plan, planIndex) => (
              <div key={planIndex} className="p-5 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">الباقة #{planIndex + 1}</h3>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={plan.popular}
                        onChange={(e) => updatePricingPlan(planIndex, 'popular', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-white/70">الأكثر طلباً</span>
                    </label>
                    <button
                      onClick={() => deletePricingPlan(planIndex)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="label text-xs">اسم الباقة</label>
                    <input
                      type="text"
                      value={plan.name}
                      onChange={(e) => updatePricingPlan(planIndex, 'name', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label text-xs">السعر</label>
                    <input
                      type="text"
                      value={plan.price}
                      onChange={(e) => updatePricingPlan(planIndex, 'price', e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label text-xs">الفترة</label>
                    <select
                      value={plan.period}
                      onChange={(e) => updatePricingPlan(planIndex, 'period', e.target.value)}
                      className="input"
                    >
                      <option value="شهرياً">شهرياً</option>
                      <option value="سنوياً">سنوياً</option>
                      <option value="ربع سنوي">ربع سنوي</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="label text-xs mb-2 flex items-center justify-between">
                    <span>الميزات</span>
                    <button
                      onClick={() => addFeatureToPlan(planIndex)}
                      className="text-xs text-stc-gold hover:text-stc-gold-light"
                    >
                      + إضافة ميزة
                    </button>
                  </label>
                  <div className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-stc-gold flex-shrink-0" />
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updatePlanFeature(planIndex, featureIndex, e.target.value)}
                          className="input text-sm flex-1"
                        />
                        <button
                          onClick={() => deletePlanFeature(planIndex, featureIndex)}
                          className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* About Section */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">قسم "عن المنصة"</h2>
              <p className="text-sm text-white/50">معلومات تفصيلية عن المنصة</p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="label">عنوان القسم</label>
              <input
                type="text"
                value={form.about_title}
                onChange={(e) => setForm({ ...form, about_title: e.target.value })}
                className="input"
                placeholder="عن المنصة"
              />
            </div>
            <div>
              <label className="label">الوصف التفصيلي</label>
              <textarea
                value={form.about_description}
                onChange={(e) => setForm({ ...form, about_description: e.target.value })}
                className="input min-h-[150px] resize-none"
                placeholder="منصة متكاملة للمراقبة الذكية بالذكاء الاصطناعي..."
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
              <Phone className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">معلومات التواصل</h2>
              <p className="text-sm text-white/50">طرق التواصل مع الشركة</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="label flex items-center gap-2">
                <Mail className="w-4 h-4" />
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                className="input"
                placeholder="info@stcsolutions.online"
                dir="ltr"
              />
            </div>
            
            <div>
              <label className="label flex items-center gap-2">
                <Phone className="w-4 h-4" />
                رقم الهاتف
              </label>
              <input
                type="tel"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                className="input"
                placeholder="+966 50 000 0000"
                dir="ltr"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="label flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                العنوان
              </label>
              <input
                type="text"
                value={form.contact_address}
                onChange={(e) => setForm({ ...form, contact_address: e.target.value })}
                className="input"
                placeholder="المملكة العربية السعودية"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Button */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
              <MessageCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">زر الواتساب العائم</h2>
              <p className="text-sm text-white/50">زر تواصل سريع عبر WhatsApp</p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="font-medium">إظهار زر الواتساب</p>
                  <p className="text-sm text-white/50">زر عائم في الزاوية السفلية للتواصل السريع</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_whatsapp_button}
                  onChange={(e) => setForm({ ...form, show_whatsapp_button: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            
            <div>
              <label className="label">رقم الواتساب</label>
              <input
                type="tel"
                value={form.whatsapp_number}
                onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
                className="input"
                placeholder="+966500000000"
                dir="ltr"
              />
              <p className="text-xs text-white/50 mt-1.5">
                أدخل الرقم مع رمز الدولة بدون مسافات (مثال: +966500000000)
              </p>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
              <Twitter className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">وسائل التواصل الاجتماعي</h2>
              <p className="text-sm text-white/50">روابط حسابات التواصل الاجتماعي</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-5">
            <div>
              <label className="label flex items-center gap-2">
                <Twitter className="w-4 h-4 text-blue-400" />
                Twitter (X)
              </label>
              <input
                type="url"
                value={form.social_twitter}
                onChange={(e) => setForm({ ...form, social_twitter: e.target.value })}
                className="input"
                placeholder="https://twitter.com/username"
                dir="ltr"
              />
            </div>
            
            <div>
              <label className="label flex items-center gap-2">
                <Linkedin className="w-4 h-4 text-blue-400" />
                LinkedIn
              </label>
              <input
                type="url"
                value={form.social_linkedin}
                onChange={(e) => setForm({ ...form, social_linkedin: e.target.value })}
                className="input"
                placeholder="https://linkedin.com/company/..."
                dir="ltr"
              />
            </div>
            
            <div>
              <label className="label flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-400" />
                Instagram
              </label>
              <input
                type="url"
                value={form.social_instagram}
                onChange={(e) => setForm({ ...form, social_instagram: e.target.value })}
                className="input"
                placeholder="https://instagram.com/username"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="p-3 rounded-xl bg-gradient-to-br from-white/20 to-white/5">
              <Type className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">التذييل (Footer)</h2>
              <p className="text-sm text-white/50">نص حقوق الملكية</p>
            </div>
          </div>
          
          <div>
            <label className="label">نص الـ Footer</label>
            <input
              type="text"
              value={form.footer_text}
              onChange={(e) => setForm({ ...form, footer_text: e.target.value })}
              className="input"
              placeholder="© 2026 STC Solutions. جميع الحقوق محفوظة."
            />
          </div>
        </div>

        {/* AI Modules Features */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="p-3 rounded-xl bg-gradient-to-br from-stc-gold/20 to-stc-gold/5">
              <Sparkles className="w-6 h-6 text-stc-gold" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">موديولات الذكاء الاصطناعي (AI Modules)</h2>
              <p className="text-sm text-white/50">يتم عرضها تلقائياً من قاعدة البيانات (10 موديولات)</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(moduleIcons).map(([name, Icon]) => (
              <div key={name} className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                <Icon className="w-5 h-5 text-stc-gold" />
                <span className="text-sm">{name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/40 mt-4 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" />
            الموديولات يتم عرضها تلقائياً - يمكن تخصيصها من إعدادات الموديولات
          </p>
        </div>

        {/* Preview Link */}
        <div className="card p-6 bg-stc-gold/5 border-stc-gold/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-stc-gold" />
              <div>
                <p className="font-semibold">معاينة الصفحة</p>
                <p className="text-sm text-white/60">شاهد التغييرات قبل النشر</p>
              </div>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center gap-2"
            >
              <Globe className="w-4 h-4" />
              <span>فتح صفحة الهبوط</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
