import { useState, useEffect, useMemo } from 'react';
import { Camera, AlertTriangle, Users, UserCheck, Server, Zap, BarChart3, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../lib/api/dashboard';
import { camerasApi } from '../lib/api/cameras';
import { edgeServersApi } from '../lib/api/edgeServers';
import { alertsApi } from '../lib/api/alerts';
import { aiPoliciesApi, type AiPolicyEffective } from '../lib/api/aiPolicies';
import { analyticsApi } from '../lib/api/analytics';
import { useAuth } from '../contexts/AuthContext';
import { StatCard } from '../components/ui/StatCard';
import { EdgeServerStatus } from '../components/ui/EdgeServerStatus';
import { EdgeServerMonitor } from '../components/ui/EdgeServerMonitor';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import type { Alert, Camera as CameraType, EdgeServer } from '../types/database';
import { AI_MODULES } from '../types/database';

export function Dashboard() {
  const { organization } = useAuth();
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [servers, setServers] = useState<EdgeServer[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [policy, setPolicy] = useState<AiPolicyEffective | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    visitors: { today: number; trend: number };
    attendance: { today: number; late: number };
    weekly_stats: { day: string; alerts: number; visitors: number }[];
  } | null>(null);
  const [analyticsData, setAnalyticsData] = useState<{
    todayAlerts: number;
    moduleActivity: { module: string; count: number }[];
    highRiskCount: number;
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (organization) {
      fetchData();
      
      // Auto-refresh analytics every 30 seconds for near real-time updates
      const analyticsInterval = setInterval(() => {
        if (organization?.id) {
          // Only refresh analytics data, not all dashboard data
          analyticsApi.getModuleActivity({ organization_id: organization.id.toString() })
            .then(moduleActivityRes => {
              setAnalyticsData(prev => ({
                ...prev,
                moduleActivity: moduleActivityRes || [],
              }));
            })
            .catch(() => {
              // Silent fail - keep existing data
            });
        }
      }, 30000); // 30 seconds
      
      return () => clearInterval(analyticsInterval);
    }
  }, [organization]);

  const fetchData = async () => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [camerasRes, serversRes, alertsRes, effectivePolicy, dashboardRes] = await Promise.all([
        camerasApi.getCameras({ per_page: 100 }).catch(() => ({ data: [] })),
        edgeServersApi.getEdgeServers({ per_page: 100 }).catch(() => ({ data: [] })),
        alertsApi.getAlerts({ per_page: 10 }).catch(() => ({ data: [] })),
        aiPoliciesApi.getEffective(organization.id).catch(() => null),
        dashboardApi.getDashboard(organization.id).catch(() => null),
      ]);

      // Fetch analytics data
      setAnalyticsLoading(true);
      try {
        const [todayAlertsRes, moduleActivityRes, highRiskRes] = await Promise.all([
          analyticsApi.getTodayAlerts({ organization_id: organization.id.toString() }).catch(() => ({ count: 0 })),
          analyticsApi.getModuleActivity({ organization_id: organization.id.toString() }).catch(() => []),
          analyticsApi.getHighRisk({ organization_id: organization.id.toString(), threshold: 80 }).catch(() => []),
        ]);

        setAnalyticsData({
          todayAlerts: todayAlertsRes.count || 0,
          moduleActivity: moduleActivityRes || [],
          highRiskCount: Array.isArray(highRiskRes) ? highRiskRes.length : 0,
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setAnalyticsData({
          todayAlerts: 0,
          moduleActivity: [],
          highRiskCount: 0,
        });
      } finally {
        setAnalyticsLoading(false);
      }

      setCameras(Array.isArray(camerasRes.data) ? camerasRes.data : []);
      setServers(Array.isArray(serversRes.data) ? serversRes.data : []);
      setAlerts(Array.isArray(alertsRes.data) ? alertsRes.data : []);
      setPolicy(effectivePolicy);
      
      if (dashboardRes) {
        setDashboardData({
          visitors: dashboardRes.visitors || { today: 0, trend: 0 },
          attendance: dashboardRes.attendance || { today: 0, late: 0 },
          weekly_stats: dashboardRes.weekly_stats || [],
        });
      } else {
        setDashboardData({
          visitors: { today: 0, trend: 0 },
          attendance: { today: 0, late: 0 },
          weekly_stats: [],
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty arrays to prevent crashes
      setCameras([]);
      setServers([]);
      setAlerts([]);
      setPolicy(null);
      setDashboardData({
        visitors: { today: 0, trend: 0 },
        attendance: { today: 0, late: 0 },
        weekly_stats: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // CRITICAL: Calculate online status from real heartbeat data (not cached status)
  // Server status = real heartbeat + active connection
  // Calculate in useMemo to recalculate on every render with fresh timestamp
  const onlineServers = useMemo(() => {
    const now = new Date();
    return servers.filter(s => {
      if (!s.last_heartbeat) return false;
      try {
        const heartbeatDate = new Date(s.last_heartbeat);
        const diff = (now.getTime() - heartbeatDate.getTime()) / 60000;
        return diff < 5; // Online if heartbeat within 5 minutes
      } catch {
        return false;
      }
    }).length;
  }, [servers]);
  
  // Camera status comes from database (updated via heartbeat from edge server)
  // Real status based on RTSP stream availability
  const onlineCameras = cameras.filter(c => c.status === 'online').length;
  const newAlerts = alerts.filter(a => a.status === 'new').length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">مرحبا، {organization?.name}</h1>
          <p className="page-subtitle">نظرة عامة على نظام المراقبة</p>
        </div>
        <Link to="/automation" className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4">
          <Zap className="w-4 h-4" />
          <span>اوامر الذكاء الاصطناعي</span>
        </Link>
      </div>

      <div className="grid-stats">
        <StatCard
          title="الكاميرات المتصلة"
          value={loading ? '-' : `${onlineCameras}/${cameras.length}`}
          icon={Camera}
          color="green"
        />
        <StatCard
          title="التنبيهات الجديدة"
          value={loading || analyticsLoading ? '-' : (analyticsData?.todayAlerts ?? newAlerts)}
          icon={AlertTriangle}
          color={(analyticsData?.todayAlerts ?? newAlerts) > 0 ? 'red' : 'blue'}
        />
        <StatCard
          title="الزوار اليوم"
          value={loading ? '-' : dashboardData?.visitors.today ?? 0}
          icon={Users}
          trend={dashboardData?.visitors.trend ? { value: dashboardData.visitors.trend, isPositive: dashboardData.visitors.trend >= 0 } : undefined}
        />
        {/* Attendance widget hidden - feature not implemented yet */}
        {/* <StatCard
          title="الحضور اليوم"
          value={loading ? '-' : dashboardData?.attendance.today ?? 0}
          icon={UserCheck}
          color="blue"
        /> */}
      </div>

      <EdgeServerMonitor />

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">سياسة الذكاء الاصطناعي الفعالة</h2>
          <Link to="/admin" className="text-xs text-stc-gold hover:underline">
            ادارة السياسات
          </Link>
        </div>
        {loading ? (
          <p className="text-white/60 text-sm">جاري التحميل...</p>
        ) : policy ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1">الحالة</p>
              <p className="font-semibold">{policy.is_enabled ? 'مفعلة' : 'معطلة'}</p>
              <p className="text-[11px] text-white/40 truncate">{policy.name || 'بدون اسم'}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1">الموديولات</p>
              <p className="font-semibold">
                {Array.isArray(policy.modules)
                  ? policy.modules.length
                  : Object.keys(policy.modules || {}).length}
              </p>
              <p className="text-[11px] text-white/40">مفعلة لكل السياسات</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1">الاجراءات</p>
              <p className="font-semibold">{Object.keys(policy.actions || {}).length}</p>
              <p className="text-[11px] text-white/40">اجراءات مرتبطة</p>
            </div>
          </div>
        ) : (
          <p className="text-white/60 text-sm">لا توجد سياسة فعالة حالياً</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">احصائيات الاسبوع</h2>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-white/60">التنبيهات</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-stc-gold" />
                <span className="text-white/60">الزوار</span>
              </div>
            </div>
          </div>
          <div className="h-52 min-h-[208px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={208}>
              <BarChart data={dashboardData?.weekly_stats || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E1E6E',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="visitors" fill="#DCA000" radius={[3, 3, 0, 0]} />
                <Bar dataKey="alerts" fill="#EF4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">التنبيهات الاخيرة</h2>
            <Link to="/alerts" className="text-xs text-stc-gold hover:underline">
              عرض الكل
            </Link>
          </div>
          <div className="space-y-2">
            {!alerts || alerts.length === 0 ? (
              <p className="text-center text-white/50 py-6 text-sm">لا توجد تنبيهات</p>
            ) : (
              (alerts || []).slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-2.5 bg-white/5 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${getSeverityColor(alert.severity)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{alert.title}</p>
                      <p className="text-[10px] text-white/50">
                        {new Date(alert.created_at).toLocaleString('ar-EG')}
                      </p>
                    </div>
                    <span className={`badge text-[10px] px-2 py-0.5 ${
                      alert.status === 'new' ? 'badge-danger' :
                      alert.status === 'acknowledged' ? 'badge-warning' : 'badge-success'
                    }`}>
                      {alert.status === 'new' ? 'جديد' :
                       alert.status === 'acknowledged' ? 'تم الاطلاع' : 'محلول'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Module Activity Analytics Section */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">نشاط وحدات الذكاء الاصطناعي</h2>
          <Link to="/analytics" className="text-xs text-stc-gold hover:underline flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            <span>عرض التفاصيل</span>
          </Link>
        </div>
        {analyticsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-stc-gold border-t-transparent rounded-full animate-spin" />
            <span className="text-white/60 text-sm mr-2">جاري التحميل...</span>
          </div>
        ) : !analyticsData?.moduleActivity || analyticsData.moduleActivity.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">لا توجد بيانات تحليلات حتى الآن</p>
            <p className="text-xs text-white/40 mt-1">التحليلات ستظهر تلقائياً عند معالجة الفيديوهات</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pie Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.moduleActivity.map(item => ({
                      name: AI_MODULES.find(m => m.id === item.module)?.nameAr || item.module,
                      value: item.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.moduleActivity.map((entry, index) => {
                      const colors = ['#DCA000', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Module List */}
            <div className="space-y-2">
              {analyticsData.moduleActivity
                .sort((a, b) => b.count - a.count)
                .slice(0, 8)
                .map((item) => {
                  const moduleInfo = AI_MODULES.find(m => m.id === item.module);
                  const percentage = analyticsData.moduleActivity.reduce((sum, m) => sum + m.count, 0) > 0
                    ? (item.count / analyticsData.moduleActivity.reduce((sum, m) => sum + m.count, 0)) * 100
                    : 0;
                  return (
                    <div key={item.module} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">
                          {moduleInfo?.nameAr || item.module}
                        </span>
                        <span className="text-lg font-bold text-stc-gold">
                          {item.count.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-stc-gold h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-white/50 mt-1">{percentage.toFixed(1)}% من إجمالي النشاط</p>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <EdgeServerStatus />

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">حالة السيرفرات</h2>
            <Link to="/settings" className="text-xs text-stc-gold hover:underline">
              الاعدادات
            </Link>
          </div>
          <div className="space-y-2">
            {servers.length === 0 ? (
              <p className="text-center text-white/50 py-6 text-sm">لا توجد سيرفرات</p>
            ) : (
              servers.map((server) => {
                // CRITICAL: Calculate real status from heartbeat (not cached status)
                const isOnline = server.last_heartbeat ? (() => {
                  try {
                    const heartbeatDate = new Date(server.last_heartbeat);
                    const diff = (new Date().getTime() - heartbeatDate.getTime()) / 60000;
                    return diff < 5; // Online if heartbeat within 5 minutes
                  } catch {
                    return false;
                  }
                })() : false;
                
                return (
                  <div key={server.id} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Server className={`w-4 h-4 ${isOnline ? 'text-emerald-500' : 'text-red-500'}`} />
                      <div>
                        <p className="font-medium text-sm">{server.name}</p>
                        <p className="text-[10px] text-white/50">{server.ip_address || 'غير محدد'}</p>
                      </div>
                    </div>
                    <span className={`badge text-[10px] px-2 py-0.5 ${isOnline ? 'badge-success' : 'badge-danger'}`}>
                      {isOnline ? 'متصل' : 'غير متصل'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">حالة الكاميرات</h2>
            <Link to="/cameras" className="text-xs text-stc-gold hover:underline">
              عرض الكل
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {cameras.length === 0 ? (
              <p className="col-span-2 text-center text-white/50 py-6 text-sm">لا توجد كاميرات</p>
            ) : (
              cameras.slice(0, 4).map((camera) => (
                <div key={camera.id} className="p-2.5 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      camera.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium text-xs truncate">{camera.name}</span>
                  </div>
                  <p className="text-[10px] text-white/50 truncate">{camera.location || 'غير محدد'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
