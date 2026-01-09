import { useState, useEffect } from 'react';
import { Globe, Save, Phone, Mail, MapPin, MessageCircle, Twitter, Linkedin, Instagram, Type, FileText, Loader2 } from 'lucide-react';
import { settingsApi } from '../../lib/api';
import type { LandingSettings } from '../../types/database';

export function LandingSettingsPage() {
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [published, setPublished] = useState(false);

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
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsApi.getLandingSettings();
      setSettings(data.content);
      setPublished(data.published);
      setForm({
        hero_title: data.content.hero_title || '',
        hero_subtitle: data.content.hero_subtitle || '',
        hero_button_text: data.content.hero_button_text || '',
        about_title: data.content.about_title || '',
        about_description: data.content.about_description || '',
        contact_email: data.content.contact_email || '',
        contact_phone: data.content.contact_phone || '',
        contact_address: data.content.contact_address || '',
        whatsapp_number: data.content.whatsapp_number || '',
        show_whatsapp_button: data.content.show_whatsapp_button ?? true,
        footer_text: data.content.footer_text || '',
        social_twitter: data.content.social_twitter || '',
        social_linkedin: data.content.social_linkedin || '',
        social_instagram: data.content.social_instagram || '',
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const response = await settingsApi.updateLandingSettings({ ...form, published });
      setPublished(response.published);
      setSettings(response.content);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">اعدادات صفحة الهبوط</h1>
          <p className="text-white/60">تخصيص محتوى الصفحة الرئيسية للمنصة</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              published ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/70'
            }`}
          >
            {published ? 'منشور' : 'غير منشور'}
          </span>
          <button
            onClick={() => setPublished(!published)}
            className="btn-secondary"
            type="button"
          >
            {published ? 'ايقاف النشر' : 'نشر الصفحة'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saved ? (
              <>
                <Save className="w-5 h-5" />
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

      <div className="grid gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-stc-gold/20">
              <Globe className="w-5 h-5 text-stc-gold" />
            </div>
            <h2 className="text-lg font-semibold">القسم الرئيسي (Hero)</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">العنوان الرئيسي</label>
              <input
                type="text"
                value={form.hero_title}
                onChange={(e) => setForm({ ...form, hero_title: e.target.value })}
                className="input"
                placeholder="حول كاميراتك الى عيون ذكية"
              />
            </div>
            <div>
              <label className="label">الوصف</label>
              <textarea
                value={form.hero_subtitle}
                onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })}
                className="input min-h-[100px] resize-none"
                placeholder="منصة تحليل الفيديو بالذكاء الاصطناعي..."
              />
            </div>
            <div>
              <label className="label">نص الزر</label>
              <input
                type="text"
                value={form.hero_button_text}
                onChange={(e) => setForm({ ...form, hero_button_text: e.target.value })}
                className="input"
                placeholder="ابدا الان"
              />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold">عن المنصة</h2>
          </div>
          <div className="space-y-4">
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
              <label className="label">الوصف</label>
              <textarea
                value={form.about_description}
                onChange={(e) => setForm({ ...form, about_description: e.target.value })}
                className="input min-h-[100px] resize-none"
                placeholder="وصف المنصة..."
              />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Phone className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold">معلومات التواصل</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">البريد الالكتروني</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  className="input pr-12"
                  placeholder="info@company.com"
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <label className="label">رقم الهاتف</label>
              <div className="relative">
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="tel"
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  className="input pr-12"
                  placeholder="+966 11 000 0000"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="label">العنوان</label>
              <div className="relative">
                <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={form.contact_address}
                  onChange={(e) => setForm({ ...form, contact_address: e.target.value })}
                  className="input pr-12"
                  placeholder="القاهرة، جمهورية مصر العربية"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold">زر الواتساب</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="font-medium">اظهار زر الواتساب</p>
                  <p className="text-sm text-white/50">زر عائم للتواصل السريع</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_whatsapp_button}
                  onChange={(e) => setForm({ ...form, show_whatsapp_button: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
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
              <p className="text-xs text-white/50 mt-1">ادخل الرقم مع رمز الدولة بدون مسافات</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Twitter className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold">وسائل التواصل الاجتماعي</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="label flex items-center gap-2">
                <Twitter className="w-4 h-4" />
                <span>Twitter</span>
              </label>
              <input
                type="url"
                value={form.social_twitter}
                onChange={(e) => setForm({ ...form, social_twitter: e.target.value })}
                className="input"
                placeholder="https://twitter.com/..."
                dir="ltr"
              />
            </div>
            <div>
              <label className="label flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </label>
              <input
                type="url"
                value={form.social_linkedin}
                onChange={(e) => setForm({ ...form, social_linkedin: e.target.value })}
                className="input"
                placeholder="https://linkedin.com/..."
                dir="ltr"
              />
            </div>
            <div>
              <label className="label flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                <span>Instagram</span>
              </label>
              <input
                type="url"
                value={form.social_instagram}
                onChange={(e) => setForm({ ...form, social_instagram: e.target.value })}
                className="input"
                placeholder="https://instagram.com/..."
                dir="ltr"
              />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-white/20">
              <Type className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold">Footer</h2>
          </div>
          <div>
            <label className="label">نص الـ Footer</label>
            <input
              type="text"
              value={form.footer_text}
              onChange={(e) => setForm({ ...form, footer_text: e.target.value })}
              className="input"
              placeholder="جميع الحقوق محفوظة..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
