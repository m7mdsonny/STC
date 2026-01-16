import { useState, useEffect } from 'react';
import { Key, Search, Copy, CheckCircle, XCircle, Calendar, Building2 } from 'lucide-react';
import { licensesApi, organizationsApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { License, Organization } from '../../types/database';

export function Licenses() {
  const { isSuperAdmin } = useAuth();
  const [licenses, setLicenses] = useState<(License & { organization?: Organization })[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [licensesRes, orgsRes] = await Promise.all([
        licensesApi.getLicenses(),
        organizationsApi.getOrganizations(),
      ]);

      setOrganizations(orgsRes.data);

      const enriched = licensesRes.data.map(license => ({
        ...license,
        organization: orgsRes.data.find(o => o.id === license.organization_id),
      }));
      setLicenses(enriched);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = license.license_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      license.organization?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || license.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'badge-success';
      case 'trial': return 'badge-warning';
      case 'expired': return 'badge-danger';
      default: return '';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'trial': return 'تجريبي';
      case 'expired': return 'منتهي';
      case 'suspended': return 'موقوف';
      default: return status;
    }
  };

  const stats = {
    total: licenses.length,
    active: licenses.filter(l => l.status === 'active').length,
    trial: licenses.filter(l => l.status === 'trial').length,
    expired: licenses.filter(l => l.status === 'expired').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">التراخيص</h1>
          <p className="text-white/60">عرض تراخيص المنصة (للقراءة فقط - يتم إنشاء التراخيص تلقائياً مع المؤسسات)</p>
        </div>
        {/* BUSINESS LOGIC: Licenses are auto-created with organizations - no manual creation allowed */}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-stc-gold/20 to-stc-gold/5">
              <Key className="w-6 h-6 text-stc-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-white/60">الاجمالي</p>
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
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5">
              <Calendar className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.trial}</p>
              <p className="text-sm text-white/60">تجريبي</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.expired}</p>
              <p className="text-sm text-white/60">منتهي</p>
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
              placeholder="بحث بالمفتاح او المؤسسة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pr-12 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="trial">تجريبي</option>
            <option value="expired">منتهي</option>
            <option value="suspended">موقوف</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredLicenses.length === 0 ? (
        <div className="card p-12 text-center">
          <Key className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد تراخيص</h3>
          <p className="text-white/60">لم يتم انشاء اي تراخيص بعد</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-right p-4 font-medium text-white/70">مفتاح الترخيص</th>
                <th className="text-right p-4 font-medium text-white/70">المؤسسة</th>
                <th className="text-right p-4 font-medium text-white/70">الباقة</th>
                <th className="text-right p-4 font-medium text-white/70">الكاميرات</th>
                <th className="text-right p-4 font-medium text-white/70">الحالة</th>
                <th className="text-right p-4 font-medium text-white/70">تاريخ الانتهاء</th>
                <th className="text-right p-4 font-medium text-white/70">اجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredLicenses.map((license) => (
                <tr key={license.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm bg-white/10 px-2 py-1 rounded">{license.license_key}</code>
                      <button onClick={() => copyKey(license.license_key)} className="p-1 hover:bg-white/10 rounded">
                        {copiedKey === license.license_key ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-white/50" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-white/50" />
                      <span>{license.organization?.name || '-'}</span>
                    </div>
                  </td>
                  <td className="p-4 capitalize">{license.plan}</td>
                  <td className="p-4">{license.max_cameras}</td>
                  <td className="p-4">
                    <span className={`badge ${getStatusBadge(license.status)}`}>
                      {getStatusText(license.status)}
                    </span>
                  </td>
                  <td className="p-4 text-white/60">
                    {license.expires_at ? new Date(license.expires_at).toLocaleDateString('ar-EG') : '-'}
                  </td>
                  <td className="p-4">
                    <span className="text-white/40 text-sm">للقراءة فقط</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
