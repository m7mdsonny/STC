import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getDetailedErrorMessage } from '../lib/errorMessages';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Home } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: loginError } = await signIn(email, password);

      if (loginError) {
        const errorMsg = getDetailedErrorMessage(loginError, 'تسجيل الدخول', 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
        setError(errorMsg.message);
        showError(errorMsg.title, errorMsg.message);
        setLoading(false);
        return;
      }
      
      showSuccess('تم تسجيل الدخول بنجاح', 'مرحباً بك في النظام');

      // Wait a bit to ensure user state is set
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Navigate based on user role from stored user
      try {
        const storedUserStr = localStorage.getItem('auth_user');
        if (storedUserStr) {
          const storedUser = JSON.parse(storedUserStr);
          const userRole = storedUser.role || '';
          const isSuperAdmin = userRole === 'super_admin' || storedUser.is_super_admin === true;
          
          if (isSuperAdmin) {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } else {
          navigate('/dashboard');
        }
      } catch {
        navigate('/dashboard');
      }
    } catch (err) {
      const { title, message } = getDetailedErrorMessage(err, 'تسجيل الدخول', 'تعذر تسجيل الدخول حالياً، حاول مرة أخرى');
      setError(message);
      showError(title, message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stc-bg-dark flex flex-col lg:flex-row-reverse">
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <img src="/stc_solutions_logo.png" alt="STC Solutions" className="h-16 mx-auto mb-4" />
          </div>

          <div className="card p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">تسجيل الدخول</h2>
              <p className="text-white/60">ادخل بياناتك للوصول الى لوحة التحكم</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="label">البريد الالكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pr-12"
                    placeholder="example@company.com"
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="label">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pr-12 pl-12"
                    placeholder="********"
                    required
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5" />
                  <span className="text-white/70">تذكرني</span>
                </label>
                <Link to="/forgot-password" className="text-stc-gold hover:underline">نسيت كلمة المرور؟</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري التسجيل...</span>
                  </>
                ) : (
                  <span>تسجيل الدخول</span>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10">
              <Link
                to="/"
                className="btn-secondary w-full flex items-center justify-center gap-2 text-sm py-3"
              >
                <Home className="w-4 h-4" />
                <span>العودة للصفحة الرئيسية</span>
              </Link>
            </div>
          </div>

          <p className="text-center mt-6 text-white/50 text-sm">
            ليس لديك حساب؟{' '}
            <Link to="/#contact" className="text-stc-gold hover:underline">تواصل معنا</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 bg-stc-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-stc-gold/10 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center w-full">
          <img src="/stc_solutions_logo.png" alt="STC Solutions" className="h-20 mb-8" />
          <h1 className="text-4xl font-bold text-white mb-4">
            مرحبا بك في
            <br />
            <span className="text-stc-gold">STC AI-VAP</span>
          </h1>
          <p className="text-white/70 text-lg max-w-md">
            منصة تحليل الفيديو بالذكاء الاصطناعي
            <br />
            حول كاميراتك الى عيون ذكية
          </p>
          <div className="mt-12 grid grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-stc-gold">9+</p>
              <p className="text-white/60 text-sm">موديولات ذكية</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-stc-gold">128</p>
              <p className="text-white/60 text-sm">كاميرا كحد اقصى</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-stc-gold">24/7</p>
              <p className="text-white/60 text-sm">مراقبة مستمرة</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-stc-bg-dark to-transparent" />
      </div>
    </div>
  );
}
