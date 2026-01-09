import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { authApi } from '../lib/api/auth';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus('idle');
    setMessage('');

    try {
      const responseMessage = await authApi.requestPasswordReset(email);
      setStatus('success');
      setMessage(responseMessage || 'تم ارسال رابط استعادة كلمة المرور إلى بريدك.');
    } catch (error) {
      setStatus('error');
      setMessage((error as Error).message || 'تعذر ارسال طلب الاستعادة حالياً. جرب مرة أخرى لاحقاً.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stc-bg-dark flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="card p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-white">استعادة كلمة المرور</h1>
            <p className="text-white/60">أدخل بريدك الالكتروني وسنرسل لك رابط اعادة التعيين</p>
          </div>

          {status === 'success' && (
            <div className="p-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 flex gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{message}</span>
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 flex gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!email || submitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري الارسال...</span>
                </>
              ) : (
                <>
                  <span>ارسال رابط الاستعادة</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-sm text-white/70">
            <p className="mb-2">تذكرت كلمة المرور؟</p>
            <Link to="/login" className="text-stc-gold hover:underline">
              العودة لتسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
