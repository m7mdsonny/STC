import { useState } from 'react';
import { Shield, Key, Smartphone, History, Eye, EyeOff, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import { authApi } from '../../lib/api/auth';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../ui/Modal';

export function SecuritySettings() {
  const { user, profile } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('كلمة المرور يجب ان تكون 8 احرف على الاقل');
      return;
    }

    setChanging(true);

    try {
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setSuccess('تم تغيير كلمة المرور بنجاح');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setShowPasswordModal(false), 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'فشل تغيير كلمة المرور');
    }

    setChanging(false);
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strengthLabels = ['ضعيفة جدا', 'ضعيفة', 'متوسطة', 'جيدة', 'قوية', 'قوية جدا'];
  const strengthColors = ['bg-red-500', 'bg-red-400', 'bg-yellow-500', 'bg-yellow-400', 'bg-emerald-400', 'bg-emerald-500'];

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Key className="w-5 h-5 text-stc-gold" />
          كلمة المرور
        </h3>

        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">تغيير كلمة المرور</p>
              <p className="text-sm text-white/50">قم بتحديث كلمة المرور الخاصة بك بشكل دوري للحفاظ على امان حسابك</p>
            </div>
            <button onClick={() => setShowPasswordModal(true)} className="btn-secondary">
              تغيير
            </button>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-stc-gold" />
          المصادقة الثنائية (2FA)
        </h3>

        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">تفعيل المصادقة الثنائية</p>
              <p className="text-sm text-white/50">اضف طبقة حماية اضافية لحسابك باستخدام تطبيق المصادقة</p>
            </div>
            <button className="btn-secondary" disabled>
              قريبا
            </button>
          </div>
        </div>

        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-400">ننصح بتفعيل المصادقة الثنائية</p>
              <p className="text-sm text-white/60 mt-1">
                المصادقة الثنائية تضيف طبقة حماية اضافية وتمنع الوصول غير المصرح به لحسابك
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <History className="w-5 h-5 text-stc-gold" />
          سجل النشاط
        </h3>

        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">سجل تسجيلات الدخول</p>
              <p className="text-sm text-white/50">عرض سجل تسجيلات الدخول والنشاطات الاخيرة</p>
            </div>
            <button onClick={() => setShowActivityModal(true)} className="btn-secondary">
              عرض السجل
            </button>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-white/60 mb-3">اخر تسجيل دخول:</p>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-sm">{user?.email}</p>
              <p className="text-xs text-white/50">
                {profile?.last_login ? new Date(profile.last_login).toLocaleString('ar-SA') : 'الان'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-stc-gold" />
          الجلسات النشطة
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              <div>
                <p className="font-medium">الجلسة الحالية</p>
                <p className="text-sm text-white/50">هذا الجهاز - نشط الان</p>
              </div>
            </div>
            <span className="badge badge-success">نشط</span>
          </div>
        </div>

        <button className="mt-4 text-red-400 hover:text-red-300 text-sm">
          تسجيل الخروج من جميع الاجهزة الاخرى
        </button>
      </div>

      <div className="card p-6 border border-red-500/30">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          منطقة الخطر
        </h3>

        <div className="p-4 bg-red-500/10 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">حذف الحساب</p>
              <p className="text-sm text-white/50">حذف حسابك نهائيا وجميع البيانات المرتبطة به</p>
            </div>
            <button className="btn-danger" disabled>
              حذف الحساب
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setError('');
          setSuccess('');
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }}
        title="تغيير كلمة المرور"
      >
        <form onSubmit={changePassword} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {success}
            </div>
          )}

          <div>
            <label className="label">كلمة المرور الحالية</label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="input pl-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
              >
                {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">كلمة المرور الجديدة</label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="input pl-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
              >
                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordForm.newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-white/60">قوة كلمة المرور:</span>
                  <span className="text-xs">{strengthLabels[getPasswordStrength(passwordForm.newPassword)]}</span>
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${
                        i <= getPasswordStrength(passwordForm.newPassword)
                          ? strengthColors[getPasswordStrength(passwordForm.newPassword)]
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="label">تاكيد كلمة المرور الجديدة</label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="input pl-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
              >
                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
              <p className="text-red-400 text-xs mt-1">كلمة المرور غير متطابقة</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setShowPasswordModal(false)} className="btn-secondary">
              الغاء
            </button>
            <button type="submit" disabled={changing} className="btn-primary flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>{changing ? 'جاري التغيير...' : 'تغيير كلمة المرور'}</span>
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        title="سجل النشاط"
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <div className="p-3 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium">تسجيل دخول ناجح</p>
                  <p className="text-xs text-white/50">الان</p>
                </div>
              </div>
              <span className="text-xs text-white/40">القاهرة، مصر</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
