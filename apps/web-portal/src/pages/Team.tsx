import { useState, useEffect } from 'react';
import { Users, Plus, Search, Trash2, Edit2, CheckCircle, Eye, EyeOff, Loader2, Shield, UserCog } from 'lucide-react';
import { usersApi } from '../lib/api/users';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getDetailedErrorMessage } from '../lib/errorMessages';
import { Modal } from '../components/ui/Modal';
import { canManageOrganization, getRoleLabel, getRoleBadgeClass, normalizeRole } from '../lib/rbac';
import type { User, UserRole } from '../types/database';

const ORG_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'owner', label: 'مالك', description: 'صلاحيات كاملة على المؤسسة' },
  { value: 'admin', label: 'مدير', description: 'صلاحيات كاملة على المؤسسة' },
  { value: 'editor', label: 'محرر', description: 'ادارة الكاميرات والتنبيهات' },
  { value: 'viewer', label: 'مشاهد', description: 'عرض البيانات فقط' },
];

export function Team() {
  const { profile, organization } = useAuth();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canManageUsers = canManageOrganization(profile?.role);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'org_viewer' as UserRole,
  });

  useEffect(() => {
    if (organization?.id) {
      fetchUsers();
    }
  }, [organization?.id]);

  const fetchUsers = async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const result = await usersApi.getUsers({
        organization_id: organization.id,
      });
      setUsers(result.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editingUser) {
        const updateData = {
          name: formData.name,
          phone: formData.phone || undefined,
          role: formData.role,
        };

        await usersApi.updateUser(editingUser.id, updateData);
      } else {
        const createData = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone || undefined,
          role: formData.role,
          organization_id: organization?.id,
        };

        await usersApi.createUser(createData);
      }

      setShowModal(false);
      resetForm();
      showSuccess(
        editingUser ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح',
        editingUser ? `تم تحديث بيانات ${formData.name} بنجاح` : `تم إضافة ${formData.name} إلى الفريق بنجاح`
      );
      fetchUsers();
    } catch (err) {
      const { title, message } = getDetailedErrorMessage(err, editingUser ? 'تحديث العضو' : 'إضافة العضو', 'حدث خطأ في حفظ العضو');
      setError(message);
      showError(title, message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUser = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (!confirm(`هل أنت متأكد من حذف المستخدم ${user?.name || ''}؟`)) return;
    try {
      await usersApi.deleteUser(id);
      showSuccess('تم الحذف بنجاح', `تم حذف المستخدم ${user?.name || ''} من الفريق`);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      const { title, message } = getDetailedErrorMessage(error, 'حذف المستخدم', 'حدث خطأ في حذف المستخدم');
      showError(title, message);
    }
  };

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    const user = users.find(u => u.id === id);
    try {
      await usersApi.toggleActive(id);
      showSuccess(
        'تم التحديث',
        `تم ${currentStatus ? 'تعطيل' : 'تفعيل'} المستخدم ${user?.name || ''} بنجاح`
      );
      fetchUsers();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      const { title, message } = getDetailedErrorMessage(error, 'تغيير حالة المستخدم', 'حدث خطأ في تغيير حالة المستخدم');
      showError(title, message);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      phone: user.phone || '',
      role: user.role,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      name: '',
      phone: '',
      role: 'org_viewer',
    });
    setError('');
    setShowPassword(false);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: UserRole) => {
    return getRoleBadgeClass(role);
  };

  const getRoleLabelDisplay = (role: UserRole) => {
    return getRoleLabel(role);
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    admins: users.filter(u => {
      const role = normalizeRole(u.role);
      return role === 'admin' || role === 'owner';
    }).length,
    operators: users.filter(u => normalizeRole(u.role) === 'editor').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">فريق العمل</h1>
          <p className="text-white/60">ادارة اعضاء فريق المؤسسة</p>
        </div>
        {canManageUsers && (
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <span>اضافة عضو</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-stc-gold/20 to-stc-gold/5">
              <Users className="w-6 h-6 text-stc-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-white/60">اجمالي الفريق</p>
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
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
              <Shield className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.admins}</p>
              <p className="text-sm text-white/60">مديرين</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5">
              <UserCog className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.operators}</p>
              <p className="text-sm text-white/60">مشغلين</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="بحث بالاسم او البريد..."
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
      ) : filteredUsers.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا يوجد اعضاء</h3>
          <p className="text-white/60">لم يتم اضافة اي اعضاء للفريق بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-stc-gold/20 flex items-center justify-center">
                    <span className="text-stc-gold font-semibold text-lg">
                      {user.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-white/50" dir="ltr">{user.email}</p>
                  </div>
                </div>
                {canManageUsers && normalizeRole(user.role) !== 'owner' && user.id !== profile?.id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-2 hover:bg-blue-500/20 rounded"
                      title="تعديل"
                    >
                      <Edit2 className="w-4 h-4 text-blue-400" />
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="p-2 hover:bg-red-500/20 rounded"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className={`badge ${getRoleBadge(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
                {canManageUsers && normalizeRole(user.role) !== 'owner' ? (
                  <button
                    onClick={() => toggleUserStatus(user.id, user.is_active)}
                    className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'} cursor-pointer`}
                  >
                    {user.is_active ? 'نشط' : 'معطل'}
                  </button>
                ) : (
                  <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {user.is_active ? 'نشط' : 'معطل'}
                  </span>
                )}
              </div>

              {user.phone && (
                <p className="text-sm text-white/50 mt-3" dir="ltr">{user.phone}</p>
              )}

              {user.last_login && (
                <p className="text-xs text-white/40 mt-2">
                  اخر دخول: {new Date(user.last_login).toLocaleDateString('ar-EG')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingUser ? 'تعديل عضو' : 'اضافة عضو جديد'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">الاسم</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                placeholder="+966"
              />
            </div>
          </div>

          <div>
            <label className="label">البريد الالكتروني</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              dir="ltr"
              required
              disabled={!!editingUser}
            />
          </div>

          {!editingUser && (
            <div>
              <label className="label">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input pl-12"
                  dir="ltr"
                  required
                  minLength={6}
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
          )}

          <div>
            <label className="label">الصلاحية</label>
            <div className="space-y-2">
              {ORG_ROLES.map(role => (
                <label
                  key={role.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.role === role.value
                      ? 'border-stc-gold bg-stc-gold/10'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={formData.role === role.value}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    formData.role === role.value ? 'border-stc-gold' : 'border-white/30'
                  }`}>
                    {formData.role === role.value && (
                      <div className="w-2 h-2 rounded-full bg-stc-gold" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{role.label}</p>
                    <p className="text-xs text-white/50">{role.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="btn-secondary"
            >
              الغاء
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editingUser ? 'حفظ التغييرات' : 'اضافة العضو'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
