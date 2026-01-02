import { useState, useEffect, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  ScanFace,
  Users,
  Car,
  UserCheck,
  Warehouse,
  Activity,
  PieChart,
  ShieldAlert,
  ShoppingBag,
  ChevronLeft,
  Check,
  Zap,
  Cloud,
  Server,
  Smartphone,
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  Twitter,
  Linkedin,
  Instagram
} from 'lucide-react';
import { settingsApi } from '../lib/api/settings';
import type { LandingSettings } from '../types/database';
import { useBranding } from '../contexts/BrandingContext';
import { useToast } from '../contexts/ToastContext';
import { getDetailedErrorMessage } from '../lib/errorMessages';

const modules = [
  { icon: Flame, title: 'كشف الحريق والدخان', description: 'كشف الحرائق والدخان في الوقت الفعلي مع تنبيهات فورية' },
  { icon: ScanFace, title: 'التعرف على الوجوه', description: 'التعرف على الموظفين والزوار والقائمة السوداء' },
  { icon: Users, title: 'عد الاشخاص', description: 'احصاء عدد الاشخاص في المناطق مع تنبيهات الازدحام' },
  { icon: Car, title: 'التعرف على المركبات', description: 'قراءة لوحات السيارات والتحكم في البوابات' },
  { icon: UserCheck, title: 'تسجيل الحضور', description: 'تسجيل حضور الموظفين تلقائيا بالوجه' },
  { icon: Warehouse, title: 'مراقبة المستودعات', description: 'مراقبة الحركة والسلامة في المستودعات' },
  { icon: Activity, title: 'مراقبة الانتاجية', description: 'تحليل نشاط العمال والانتاجية' },
  { icon: PieChart, title: 'تحليل الجمهور', description: 'تحليل العمر والجنس للزوار' },
  { icon: ShieldAlert, title: 'كشف التسلل', description: 'كشف الدخول غير المصرح به' },
  { icon: ShoppingBag, title: 'Market - سلوك مشبوه', description: 'كشف السلوك المشبوه ومنع الخسائر في المتاجر بدون استخدام التعرف على الوجوه' },
];

const plans = [
  {
    name: 'اساسي',
    price: '500',
    features: ['4 كاميرات', 'سيرفر واحد', 'كشف الحريق', 'عد الاشخاص', 'اشعارات Push و Email'],
    popular: false,
  },
  {
    name: 'احترافي',
    price: '1,500',
    features: ['16 كاميرا', '2 سيرفر', '5 موديولات', 'التعرف على الوجوه', 'تسجيل الحضور', 'SMS'],
    popular: true,
  },
  {
    name: 'مؤسسي',
    price: '5,000',
    features: ['64 كاميرا', '5 سيرفرات', 'كل الموديولات', 'WhatsApp', 'اتصال طوارئ', 'دعم مخصص'],
    popular: false,
  },
];

export function Landing() {
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { branding } = useBranding();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.getPublishedLanding();
      setSettings(data.content);
      setPublished(data.published);
    } catch (error) {
      console.error('Failed to fetch landing settings:', error);
      setPublished(false);
      // Don't show error toast for landing page - just use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    
    try {
      await settingsApi.submitContactForm({
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone || undefined,
        message: contactForm.message,
      });
      
      setSent(true);
      setContactForm({ name: '', email: '', phone: '', message: '' });
      showSuccess('تم إرسال رسالتك بنجاح', 'سنتواصل معك في أقرب وقت');
      setTimeout(() => setSent(false), 5000);
    } catch (error) {
      console.error('Error submitting contact form:', error);
      const errorMsg = getDetailedErrorMessage(error, 'إرسال الرسالة', 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.');
      showError(errorMsg.title, errorMsg.message);
    } finally {
      setSending(false);
    }
  };

  const whatsappLink = settings?.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}`
    : 'https://wa.me/966500000000';

  if (loading) {
    return (
      <div className="min-h-screen bg-stc-bg-dark flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stc-bg-dark">
      <header className="fixed top-0 left-0 right-0 z-50 bg-stc-bg-dark/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={branding?.logo_url || '/stc_solutions_logo.png'}
              alt="STC Solutions"
              className="h-20 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
            />
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#hero" className="text-white/70 hover:text-white transition-colors">الرئيسية</a>
            <a href="#features" className="text-white/70 hover:text-white transition-colors">المميزات</a>
            <a href="#modules" className="text-white/70 hover:text-white transition-colors">الموديولات</a>
            <a href="#pricing" className="text-white/70 hover:text-white transition-colors">الباقات</a>
            <a href="#contact" className="text-white/70 hover:text-white transition-colors">تواصل معنا</a>
          </nav>
          <Link to="/login" className="btn-primary flex items-center gap-2">
            <span>تسجيل الدخول</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <section id="hero" className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          {!published && (
            <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-200 px-4 py-3 inline-flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>هذه الصفحة غير منشورة حاليا - يتم عرض المحتوى الافتراضي.</span>
            </div>
          )}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-stc-gold/10 rounded-full text-stc-gold mb-6">
            <Zap className="w-4 h-4" />
            <span className="text-sm">منصة ذكاء اصطناعي متكاملة</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            {settings?.hero_title || 'منصة تحليل الفيديو بالذكاء الاصطناعي'}
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
            {settings?.hero_subtitle || 'حول كاميرات المراقبة الى عيون ذكية تحمي منشاتك وتحلل بياناتك في الوقت الفعلي مع 10 موديولات متخصصة'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="btn-primary text-lg px-8 py-4">
              {settings?.hero_button_text || 'ابدا تجربتك المجانية - 14 يوم'}
            </Link>
            <a href="#modules" className="btn-secondary text-lg px-8 py-4">
              اكتشف المميزات
            </a>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="card p-6 text-center">
              <Cloud className="w-12 h-12 text-stc-gold mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Cloud Platform</h3>
              <p className="text-white/60 text-sm">لوحة تحكم ويب شاملة لادارة كل شيء من اي مكان</p>
            </div>
            <div className="card p-6 text-center">
              <Server className="w-12 h-12 text-stc-gold mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Edge Server</h3>
              <p className="text-white/60 text-sm">معالجة محلية بالذكاء الاصطناعي تعمل بدون انترنت</p>
            </div>
            <div className="card p-6 text-center">
              <Smartphone className="w-12 h-12 text-stc-gold mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Mobile App</h3>
              <p className="text-white/60 text-sm">تطبيق موبايل لمتابعة التنبيهات والكاميرات</p>
            </div>
          </div>
        </div>
      </section>

      <section id="modules" className="py-20 px-4 bg-stc-navy/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">10 موديولات ذكية</h2>
            <p className="text-white/60 max-w-xl mx-auto">
              كل موديول مصمم لحل مشكلة محددة مع امكانية تفعيل اوامر تلقائية لكل حدث
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(settings?.features?.length ? settings.features : modules).map((module, index) => {
              const iconValue = (module as { icon?: unknown }).icon;
              const IconComponent = typeof iconValue === 'function'
                ? iconValue as ComponentType<{ className?: string }>
                : null;
              const iconContent = IconComponent ? (
                <IconComponent className="w-10 h-10 text-stc-gold mb-4" />
              ) : typeof iconValue === 'string' && iconValue ? (
                <div className="w-10 h-10 text-3xl text-stc-gold mb-4 flex items-center justify-center">
                  {iconValue}
                </div>
              ) : (
                <Zap className="w-10 h-10 text-stc-gold mb-4" />
              );

              return (
              <div key={index} className="card p-6 hover:scale-105 transition-transform">
                {iconContent}
                <h3 className="text-lg font-semibold text-white mb-2">{module.title}</h3>
                <p className="text-white/60 text-sm">{module.description}</p>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                اوامر الذكاء الاصطناعي
              </h2>
              <p className="text-white/70 mb-8">
                حدد ماذا يحدث عند كل حدث. عند كشف حريق يتم تشغيل السرينة وفتح ابواب الطوارئ.
                عند التعرف على سيارة VIP تفتح البوابة تلقائيا. اوامر مخصصة لكل موديول.
              </p>
              <div className="space-y-4">
                {[
                  'تشغيل السرينة عند كشف حريق',
                  'فتح البوابة للمركبات المعتمدة',
                  'ارسال اشعار للقائمة السوداء',
                  'تسجيل الحضور تلقائيا',
                  'تنبيه عند الازدحام',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-stc-gold/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-stc-gold" />
                    </div>
                    <span className="text-white/80">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-8">
              <div className="space-y-4">
                <div className="p-4 bg-red-500/20 rounded-xl border border-red-500/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Flame className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-red-400">كشف حريق</span>
                  </div>
                  <p className="text-sm text-white/60">تشغيل السرينة + فتح ابواب الطوارئ + اتصال طوارئ</p>
                </div>
                <div className="p-4 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Car className="w-5 h-5 text-emerald-500" />
                    <span className="font-semibold text-emerald-400">سيارة VIP</span>
                  </div>
                  <p className="text-sm text-white/60">فتح البوابة تلقائيا + اشعار الاستقبال</p>
                </div>
                <div className="p-4 bg-amber-500/20 rounded-xl border border-amber-500/30">
                  <div className="flex items-center gap-3 mb-2">
                    <ScanFace className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold text-amber-400">قائمة سوداء</span>
                  </div>
                  <p className="text-sm text-white/60">تنبيه امني فوري + تسجيل فيديو</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-4 bg-stc-navy/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">اختر باقتك</h2>
            <p className="text-white/60">جميع الباقات تشمل فترة تجريبية 14 يوم مجانا</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`card p-8 relative ${plan.popular ? 'border-stc-gold ring-2 ring-stc-gold/30' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-stc-gold text-stc-navy text-xs font-semibold px-4 py-1 rounded-full">
                      الاكثر طلبا
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-stc-gold">{plan.price}</span>
                  <span className="text-white/60"> جنيه / شهريا</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-stc-gold" />
                      <span className="text-white/80 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login"
                  className={`block text-center py-3 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-stc-gold text-stc-navy hover:bg-stc-gold-light'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  ابدا الان
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">تواصل معنا</h2>
            <p className="text-white/60 max-w-xl mx-auto">
              نحن هنا لمساعدتك. تواصل معنا للاستفسارات او طلب عرض تجريبي
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="space-y-8">
              <div className="card p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-stc-gold/20">
                    <Phone className="w-6 h-6 text-stc-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">الهاتف</h3>
                    <p className="text-white/60" dir="ltr">{settings?.contact_phone || '+966 11 000 0000'}</p>
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-stc-gold/20">
                    <Mail className="w-6 h-6 text-stc-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">البريد الالكتروني</h3>
                    <p className="text-white/60" dir="ltr">{settings?.contact_email || 'info@stc-solutions.com'}</p>
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-stc-gold/20">
                    <MapPin className="w-6 h-6 text-stc-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">العنوان</h3>
                    <p className="text-white/60">{settings?.contact_address || 'القاهرة، جمهورية مصر العربية'}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {settings?.social_twitter && (
                  <a href={settings.social_twitter} target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                    <Twitter className="w-5 h-5 text-white" />
                  </a>
                )}
                {settings?.social_linkedin && (
                  <a href={settings.social_linkedin} target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                    <Linkedin className="w-5 h-5 text-white" />
                  </a>
                )}
                {settings?.social_instagram && (
                  <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                    <Instagram className="w-5 h-5 text-white" />
                  </a>
                )}
              </div>
            </div>
            <div className="card p-8">
              <h3 className="text-xl font-semibold text-white mb-6">ارسل رسالة</h3>
              {sent ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-white text-lg">تم ارسال رسالتك بنجاح!</p>
                  <p className="text-white/60 mt-2">سنتواصل معك في اقرب وقت</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="input"
                      placeholder="الاسم"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="input"
                      placeholder="البريد الالكتروني"
                      dir="ltr"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="input"
                      placeholder="رقم الجوال"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="input min-h-[120px] resize-none"
                      placeholder="رسالتك..."
                      required
                    />
                  </div>
                  <button type="submit" disabled={sending} className="btn-primary w-full flex items-center justify-center gap-2">
                    {sending ? (
                      <span>جاري الارسال...</span>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>ارسال</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 px-4 border-t border-white/10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <img
              src={branding?.logo_dark_url || branding?.logo_url || '/stc_solutions_logo.png'}
              alt="STC Solutions"
              className="h-16 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
            />
            <p className="text-white/50 text-sm">
              {new Date().getFullYear()} {settings?.footer_text || 'STC Solutions. جميع الحقوق محفوظة'}
            </p>
          </div>
        </div>
      </footer>

      {(settings?.show_whatsapp_button !== false) && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-colors animate-bounce hover:animate-none"
          title="تواصل عبر واتساب"
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </a>
      )}
    </div>
  );
}
