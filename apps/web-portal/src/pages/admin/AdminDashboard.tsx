import { useState, useEffect } from 'react';
import { Building2, Server, Camera, AlertTriangle, TrendingUp, CreditCard } from 'lucide-react';
import { dashboardApi } from '../../lib/api';
import { StatCard } from '../../components/ui/StatCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalEdgeServers: number;
  onlineServers: number;
  totalCameras: number;
  todayAlerts: number;
  monthlyRevenue: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalEdgeServers: 0,
    onlineServers: 0,
    totalCameras: 0,
    todayAlerts: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [organizationsByPlan, setOrganizationsByPlan] = useState<{ plan: string; count: number }[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await dashboardApi.getAdminDashboard();

      setStats({
        totalOrganizations: data.total_organizations,
        activeOrganizations: data.active_organizations ?? data.total_organizations,
        totalEdgeServers: data.total_edge_servers,
        onlineServers: data.online_edge_servers ?? 0,
        totalCameras: data.total_cameras ?? 0,
        todayAlerts: data.alerts_today,
        monthlyRevenue: data.revenue_this_month ?? 0,
      });

      // Set organizations by plan distribution
      if (data.organizations_by_plan && Array.isArray(data.organizations_by_plan)) {
        setOrganizationsByPlan(data.organizations_by_plan);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة تحكم المشرف</h1>
          <p className="text-white/60">نظرة عامة على النظام</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="اجمالي المؤسسات"
          value={loading ? '-' : `${stats.activeOrganizations}/${stats.totalOrganizations}`}
          icon={Building2}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="الاجهزة المتصلة"
          value={loading ? '-' : `${stats.onlineServers}/${stats.totalEdgeServers}`}
          icon={Server}
          color="green"
        />
        <StatCard
          title="اجمالي الكاميرات"
          value={loading ? '-' : stats.totalCameras}
          icon={Camera}
          color="blue"
        />
        <StatCard
          title="تنبيهات اليوم"
          value={loading ? '-' : stats.todayAlerts}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">نمو المؤسسات والايرادات</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-stc-gold" />
                <span className="text-white/60">المؤسسات</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-white/60">الايرادات</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/60">جاري التحميل...</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/60">البيانات الشهرية ستكون متاحة قريباً</p>
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-6">توزيع الباقات</h2>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-white/60">جاري التحميل...</p>
            </div>
          ) : organizationsByPlan.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={organizationsByPlan.map((item, index) => ({
                        name: item.plan === 'basic' ? 'اساسي' : item.plan === 'premium' ? 'احترافي' : item.plan === 'enterprise' ? 'مؤسسي' : item.plan,
                        value: item.count,
                        color: item.plan === 'basic' ? '#3B82F6' : item.plan === 'premium' ? '#DCA000' : item.plan === 'enterprise' ? '#10B981' : '#8B5CF6',
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {organizationsByPlan.map((item, index) => {
                        const color = item.plan === 'basic' ? '#3B82F6' : item.plan === 'premium' ? '#DCA000' : item.plan === 'enterprise' ? '#10B981' : '#8B5CF6';
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1E1E6E',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {organizationsByPlan.map((item) => {
                  const total = organizationsByPlan.reduce((sum, p) => sum + p.count, 0);
                  const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  const color = item.plan === 'basic' ? '#3B82F6' : item.plan === 'premium' ? '#DCA000' : item.plan === 'enterprise' ? '#10B981' : '#8B5CF6';
                  const name = item.plan === 'basic' ? 'اساسي' : item.plan === 'premium' ? 'احترافي' : item.plan === 'enterprise' ? 'مؤسسي' : item.plan;
                  return (
                    <div key={item.plan} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-sm text-white/70">{name}</span>
                      </div>
                      <span className="text-sm font-medium">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-white/60">لا توجد بيانات</p>
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">الايرادات الشهرية</h2>
          <div className="flex items-center gap-2 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
            <span className="font-semibold">+23%</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-5 h-5 text-stc-gold" />
              <span className="text-white/60">هذا الشهر</span>
            </div>
            <p className="text-2xl font-bold">{stats.monthlyRevenue.toLocaleString()} ج.م</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              <span className="text-white/60">الشهر السابق</span>
            </div>
            <p className="text-2xl font-bold">-</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              <span className="text-white/60">اجمالي السنة</span>
            </div>
            <p className="text-2xl font-bold">-</p>
          </div>
        </div>
      </div>
    </div>
  );
}
