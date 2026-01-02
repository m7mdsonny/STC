import { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Search, Trash2, Edit2, Building2, CheckCircle, XCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { usersApi, organizationsApi } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { getDetailedErrorMessage } from '../../lib/errorMessages';
import type { User, Organization, UserRole } from '../../types/database';

import { getRoleLabel, getRoleBadgeClass, normalizeRole } from '../../lib/rbac';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'super_admin', label: 'مدير النظام' },
  { value: 'owner', label: 'مالك المؤسسة' },
  { value: 'admin', label: 'مدير المؤسسة' },
  { value: 'editor', label: 'محرر' },
  { value: 'viewer', label: 'مشاهد' },
];

export function Users() {
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<(User & { organization?: Organization })[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'viewer' as UserRole,
    organization_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, orgsRes] = await Promise.all([
        usersApi.getUsers(),
        organizationsApi.getOrganizations(),
      ]);

      // Handle paginated response for organizations
      const orgsData = Array.isArray(orgsRes.data) ? orgsRes.data : (orgsRes.data?.data || []);
      setOrganizations(orgsData);

      // Handle paginated response for users
      const usersData = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.data || []);
      const enriched = usersData.map(user => ({
        ...user,
        organization: orgsData.find(o => o.id === user.organization_id),
      }));
      setUsers(enriched);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editingUser) {
        await usersApi.updateUser(editingUser.id, {
          name: formData.name,
          phone: formData.phone || undefined,
          role: formData.role,
          organization_id: formData.role === 'super_admin' ? undefined : formData.organization_id || undefined,
        });
      } else {
        await usersApi.createUser({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone || undefined,
          role: formData.role,
          organization_id: formData.role === 'super_admin' ? undefined : formData.organization_id || undefined,
        });
      }

      setShowModal(false);
      resetForm();
      await fetchData();
      showSuccess(
        editingUser ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح',
        editingUser ? `تم تحديث بيانات المستخدم ${formData.name} بنجاح` : `تم إضافة المستخدم ${formData.name} بنجاح`
      );
    } catch (err) {
      const { title, message } = getDetailedErrorMessage(err, editingUser ? 'تحديث المستخدم' : 'إضافة المستخدم', 'حدث خطأ في حفظ المستخدم');
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
      showSuccess('تم الحذف بنجاح', `تم حذف المستخدم ${user?.name || ''} من النظام`);
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
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
      fetchData();
    } catch (error) {
      console.error('Error toggling status:', error);
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
      organization_id: user.organization_id || '',
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
      role: 'viewer',
      organization_id: '',
    });
    setError('');
    setShowPassword(false);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesOrg = orgFilter === 'all' || user.organization_id === orgFilter;
    return matchesSearch && matchesRole && matchesOrg;
  });

  const getRoleBadge = (role: UserRole) => {
    return getRoleBadgeClass(role);
  };

  const getRoleLabelDisplay = (role: UserRole) => {
    const normalized = normalizeRole(role);
    return getRoleLabel(normalized);
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    admins: users.filter(u => u.role === 'super_admin').length,
    orgOwners: users.filter(u => normalizeRole(u.role) === 'owner').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">المستخدمين</h1>
          <p className="text-white/60">ادارة مستخدمي المنصة</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span>اضافة مستخدم</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-stc-gold/20 to-stc-gold/5">
              <UsersIcon className="w-6 h-6 text-stc-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-white/60">اجمالي المستخدمين</p>
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
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5">
              <UsersIcon className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.admins}</p>
              <p className="text-sm text-white/60">مدير نظام</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
              <Building2 className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.orgOwners}</p>
              <p className="text-sm text-white/60">مالك مؤسسة</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="بحث بالاسم او البريد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pr-12 w-full"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input"
          >
            <option value="all">كل الصلاحيات</option>
            {ROLES.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="input"
          >
            <option value="all">كل المؤسسات</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card p-12 text-center">
          <UsersIcon className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا يوجد مستخدمين</h3>
          <p className="text-white/60">لم يتم اضافة اي مستخدمين بعد</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-right p-4 font-medium text-white/70">المستخدم</th>
                <th className="text-right p-4 font-medium text-white/70">البريد</th>
                <th className="text-right p-4 font-medium text-white/70">الصلاحية</th>
                <th className="text-right p-4 font-medium text-white/70">المؤسسة</th>
                <th className="text-right p-4 font-medium text-white/70">الحالة</th>
                <th className="text-right p-4 font-medium text-white/70">اخر دخول</th>
                <th className="text-right p-4 font-medium text-white/70">اجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-stc-gold/20 flex items-center justify-center">
                        <span className="text-stc-gold font-semibold">
                          {user.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        {user.phone && <p className="text-xs text-white/50">{user.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-white/70" dir="ltr">{user.email}</td>
                  <td className="p-4">
                    <span className={`badge ${getRoleBadge(user.role)}`}>
                      {getRoleLabelDisplay(user.role)}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.organization ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-white/50" />
                        <span>{user.organization.name}</span>
                      </div>
                    ) : (
                      <span className="text-white/40">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                      className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'} cursor-pointer`}
                    >
                      {user.is_active ? 'نشط' : 'معطل'}
                    </button>
                  </td>
                  <td className="p-4 text-white/60">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString('ar-EG') : '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingUser ? 'تعديل مستخدم' : 'اضافة مستخدم جديد'}
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
                  maxLength={255}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">الصلاحية</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="input"
                required
              >
                {ROLES.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">المؤسسة</label>
              <select
                value={formData.organization_id}
                onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                className="input"
                disabled={formData.role === 'super_admin'}
                required={formData.role !== 'super_admin'}
              >
                <option value="">
                  {formData.role === 'super_admin' ? 'لا يوجد' : 'اختر المؤسسة'}
                </option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
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
              <span>{editingUser ? 'حفظ التغييرات' : 'اضافة المستخدم'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
