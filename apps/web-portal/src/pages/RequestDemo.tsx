import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Loader2, CheckCircle2, X } from 'lucide-react';
import { freeTrialApi } from '../lib/api/freeTrial';

interface Module {
  key: string;
  name: string;
  description: string;
  category: string;
}

export function RequestDemo() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    job_title: '',
    message: '',
    selected_modules: [] as string[],
  });
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingModules, setLoadingModules] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      setLoadingModules(true);
      const modules = await freeTrialApi.getAvailableModules();
      setAvailableModules(modules);
    } catch (error) {
      console.error('Failed to load modules:', error);
    } finally {
      setLoadingModules(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await freeTrialApi.create({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        company_name: formData.company_name || undefined,
        job_title: formData.job_title || undefined,
        message: formData.message || undefined,
        selected_modules: formData.selected_modules,
      });

      if (result.success) {
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          company_name: '',
          job_title: '',
          message: '',
          selected_modules: [],
        });
      } else {
        setError(result.message || 'فشل إرسال الطلب');
      }
    } catch (error: any) {
      console.error('Failed to submit request:', error);
      setError(error.response?.data?.message || 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // TASK 1.B Step 1: Fix module selection - MUST support single or multiple selection
  const toggleModule = (moduleKey: string) => {
    setFormData(prev => {
      const currentSelection = prev.selected_modules;
      const isSelected = currentSelection.includes(moduleKey);
      
      // Toggle: if selected, remove; if not selected, add
      const newSelection = isSelected
        ? currentSelection.filter(k => k !== moduleKey)
        : [...currentSelection, moduleKey];
      
      return {
        ...prev,
        selected_modules: newSelection,
      };
    });
  };

  // TASK 1.B Step 2: Cancel button - return to landing page and clear form
  const handleCancel = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company_name: '',
      job_title: '',
      message: '',
      selected_modules: [],
    });
    navigate('/');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stc-bg-dark via-stc-bg-dark to-stc-bg-darker flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-green-500/20 rounded-full">
              <CheckCircle2 className="w-16 h-16 text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">تم إرسال طلبك بنجاح!</h2>
          <p className="text-white/70 mb-6">
            شكراً لتواصلك معنا. سنراجع طلبك وسنتواصل معك في أقرب وقت ممكن.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="w-full bg-stc-gold text-stc-bg-dark px-6 py-3 rounded-lg font-semibold hover:bg-stc-gold/90 transition-colors"
          >
            إرسال طلب آخر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stc-bg-dark via-stc-bg-dark to-stc-bg-darker py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">طلب تجربة مجانية / عرض توضيحي</h1>
          <p className="text-white/70 text-lg">
            املأ النموذج أدناه وسنتواصل معك قريباً لتقديم عرض توضيحي مخصص
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-white/90 font-medium mb-2">
                الاسم الكامل <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-stc-gold"
                placeholder="أدخل اسمك الكامل"
              />
            </div>

            <div>
              <label className="block text-white/90 font-medium mb-2">
                البريد الإلكتروني <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-stc-gold"
                placeholder="example@company.com"
              />
            </div>

            <div>
              <label className="block text-white/90 font-medium mb-2">رقم الهاتف</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-stc-gold"
                placeholder="+966 5XX XXX XXX"
              />
            </div>

            <div>
              <label className="block text-white/90 font-medium mb-2">اسم الشركة</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-stc-gold"
                placeholder="اسم شركتك أو مؤسستك"
              />
            </div>

            <div>
              <label className="block text-white/90 font-medium mb-2">المسمى الوظيفي</label>
              <input
                type="text"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-stc-gold"
                placeholder="مثال: مدير تقنية المعلومات"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-white/90 font-medium mb-2">الرسالة</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-stc-gold resize-none"
              placeholder="أخبرنا عن احتياجاتك أو أي معلومات إضافية..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-white/90 font-medium mb-4">
              وحدات الذكاء الاصطناعي المطلوبة
            </label>
            {loadingModules ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-stc-gold animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableModules.map((module) => (
                  <label
                    key={module.key}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.selected_modules.includes(module.key)
                        ? 'bg-stc-gold/20 border-stc-gold'
                        : 'bg-white/5 border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selected_modules.includes(module.key)}
                      onChange={() => toggleModule(module.key)}
                      className="mt-1 w-5 h-5 rounded border-white/20 bg-white/10 text-stc-gold focus:ring-stc-gold"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-white">{module.name}</p>
                      <p className="text-sm text-white/60 mt-1">{module.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            {/* TASK 1.B Step 2: Cancel button */}
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 bg-white/10 text-white px-6 py-4 rounded-lg font-semibold hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-white/20"
            >
              <X className="w-5 h-5" />
              <span>إلغاء</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-stc-gold text-stc-bg-dark px-6 py-4 rounded-lg font-semibold hover:bg-stc-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>إرسال الطلب</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
