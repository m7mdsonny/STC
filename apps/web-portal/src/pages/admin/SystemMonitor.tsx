import { useState, useEffect } from 'react';
import {
  Activity, Server, Database, Wifi, Clock, AlertTriangle,
  CheckCircle, XCircle, RefreshCw, BarChart3, Users, Building2,
  Camera, Bell, Cpu, HardDrive, Zap
} from 'lucide-react';
import { dashboardApi, edgeServersApi } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SystemStats {
  organizations: number;
  users: number;
  edgeServers: { total: number; online: number; offline: number };
  cameras: { total: number; online: number; offline: number };
  alerts: { today: number; unresolved: number };
  licenses: { total: number; active: number; expired: number };
}

interface EdgeServerStatus {
  id: string;
  name: string;
  organization_name: string;
  status: string;
  last_heartbeat: string | null;
  cameras_count: number;
}

interface SystemHealth {
  database: { status: string; latency_ms: number };
  cache: { status: string; hit_rate: number };
  storage: { status: string; used_gb: number; total_gb: number };
  api: { status: string; requests_per_minute: number };
}

export function SystemMonitor() {
  const { showError } = useToast();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentServers, setRecentServers] = useState<EdgeServerStatus[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setError(null);
    try {
      const [dashboardData, healthData, serversData] = await Promise.all([
        dashboardApi.getAdminDashboard().catch(() => null),
        dashboardApi.getSystemHealth().catch(() => null),
        edgeServersApi.getEdgeServers({ per_page: 100 }).catch(() => ({ data: [] })),
      ]);

      if (!dashboardData) {
        throw new Error('فشل تحميل بيانات لوحة التحكم');
      }

      // FIXED: Calculate online/offline counts from actual servers data
      // Note: getEdgeServers returns PaginatedResponse<EdgeServer>, not EdgeServerExtended
      // So cameras_count may not be available - will need to calculate from actual camera counts
      const serversList = Array.isArray(serversData.data) ? serversData.data : [];
      const now = new Date();
      
      // Calculate online servers based on last_heartbeat
      const onlineServers = serversList.filter((server: any) => {
        if (!server.last_heartbeat) return false;
        try {
          const heartbeatDate = new Date(server.last_heartbeat);
          const diff = (now.getTime() - heartbeatDate.getTime()) / 60000;
          return diff < 5; // Online if heartbeat within 5 minutes
        } catch {
          return false;
        }
      });
      
      // Use total from dashboard for accurate counts (since we only fetch 100 servers)
      const totalEdgeServers = dashboardData.total_edge_servers || 0;
      const onlineEdgeServersCount = onlineServers.length;
      const offlineEdgeServersCount = Math.max(0, totalEdgeServers - onlineEdgeServersCount);

      // For cameras, use dashboard total since we don't have cameras_count for all servers
      // TODO: Backend should provide online_cameras and offline_cameras counts in admin dashboard
      const totalCameras = dashboardData.total_cameras || 0;
      // Estimate: assume cameras are distributed proportionally across servers
      const onlineCameras = totalEdgeServers > 0 
        ? Math.round((totalCameras * onlineEdgeServersCount) / totalEdgeServers)
        : 0;
      const offlineCameras = Math.max(0, totalCameras - onlineCameras);

      setStats({
        organizations: dashboardData.total_organizations,
        users: dashboardData.total_users,
        edgeServers: {
          total: totalEdgeServers,
          online: onlineEdgeServersCount,
          offline: offlineEdgeServersCount,
        },
        cameras: {
          total: totalCameras,
          online: onlineCameras,
          offline: offlineCameras,
        },
        alerts: {
          today: dashboardData.alerts_today,
          unresolved: dashboardData.alerts_today, // TODO: Backend should provide unresolved count
        },
        licenses: {
          total: dashboardData.active_licenses,
          active: dashboardData.active_licenses,
          expired: 0, // TODO: Backend should provide expired count
        },
      });

      // FIXED: Use real servers data instead of empty array
      // Map servers to EdgeServerStatus format for display
      setRecentServers(serversList.slice(0, 10).map((server: any) => ({
        id: server.id || String(server.id),
        name: server.name || 'غير محدد',
        organization_name: server.organization?.name || server.organization_id || 'غير محدد',
        status: server.status || 'unknown',
        last_heartbeat: server.last_heartbeat || null,
        cameras_count: server.cameras_count || 0, // May be 0 if not provided by API
      })));

      // FIXED: Use real system health API instead of hardcoded status
      if (healthData) {
        setSystemHealth(healthData);
      }

      setLastUpdate(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ في تحميل البيانات';
      console.error('Error fetching data:', error);
      setError(errorMessage);
      // FIXED: Show user-visible error message
      showError('خطأ في تحميل البيانات', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getServerStatus = (server: EdgeServerStatus) => {
    if (!server.last_heartbeat) return { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'غير معروف' };

    const diff = (new Date().getTime() - new Date(server.last_heartbeat).getTime()) / 60000;
    if (diff < 2) return { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'متصل' };
    if (diff < 5) return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'بطيء' };
    return { color: 'text-red-400', bg: 'bg-red-500/20', label: 'غير متصل' };
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">خطأ في تحميل البيانات</h3>
          <p className="text-white/60 mb-4">{error}</p>
          <button onClick={fetchData} className="btn-primary">
            <RefreshCw className="w-4 h-4 mr-2" />
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">مراقبة النظام</h1>
          <p className="text-white/60">نظرة عامة على حالة المنصة</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-white/50">
            اخر تحديث: {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: ar })}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5">
              <Building2 className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.organizations}</p>
              <p className="text-xs text-white/60">المؤسسات</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-500/5">
              <Users className="w-6 h-6 text-teal-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.users}</p>
              <p className="text-xs text-white/60">المستخدمين</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
              <Server className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats?.edgeServers.online}/{stats?.edgeServers.total}
              </p>
              <p className="text-xs text-white/60">سيرفرات متصلة</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-500/5">
              <Camera className="w-6 h-6 text-sky-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stats?.cameras.online}/{stats?.cameras.total}
              </p>
              <p className="text-xs text-white/60">كاميرات متصلة</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5">
              <Bell className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.alerts.unresolved}</p>
              <p className="text-xs text-white/60">تنبيهات معلقة</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-stc-gold/20 to-stc-gold/5">
              <Zap className="w-6 h-6 text-stc-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.licenses.active}</p>
              <p className="text-xs text-white/60">تراخيص نشطة</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-stc-gold" />
              حالة السيرفرات
            </h3>
          </div>

          <div className="space-y-3">
            {recentServers.map((server) => {
              const status = getServerStatus(server);
              return (
                <div key={server.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${status.bg}`}>
                      <div className={`w-2 h-2 rounded-full ${status.color.replace('text-', 'bg-')} ${status.label === 'متصل' ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                      <p className="font-medium">{server.name}</p>
                      <p className="text-xs text-white/50">{server.organization_name}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className={`text-xs px-2 py-0.5 rounded ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                    <p className="text-xs text-white/40 mt-1">
                      {server.cameras_count} كاميرا
                    </p>
                  </div>
                </div>
              );
            })}

            {recentServers.length === 0 && (
              <div className="text-center py-8 text-white/50">
                لا توجد سيرفرات مسجلة
              </div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-stc-gold" />
              ملخص النظام
            </h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/70">سيرفرات Edge</span>
                <span className="text-sm font-medium">
                  {stats?.edgeServers.online} / {stats?.edgeServers.total}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{
                    width: stats?.edgeServers.total
                      ? `${(stats.edgeServers.online / stats.edgeServers.total) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/70">الكاميرات</span>
                <span className="text-sm font-medium">
                  {stats?.cameras.online} / {stats?.cameras.total}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all"
                  style={{
                    width: stats?.cameras.total
                      ? `${(stats.cameras.online / stats.cameras.total) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/70">التراخيص النشطة</span>
                <span className="text-sm font-medium">
                  {stats?.licenses.active} / {stats?.licenses.total}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stc-gold rounded-full transition-all"
                  style={{
                    width: stats?.licenses.total
                      ? `${(stats.licenses.active / stats.licenses.total) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-orange-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">تنبيهات اليوم</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats?.alerts.today}</p>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm">تراخيص منتهية</span>
                </div>
                <p className="text-2xl font-bold mt-1">{stats?.licenses.expired}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FIXED: Use real system health API instead of hardcoded status */}
      <div className="card p-5">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          حالة الخدمات
        </h3>

        {systemHealth ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                systemHealth.database.status === 'healthy' ? 'bg-emerald-500 animate-pulse' :
                systemHealth.database.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <div>
                <p className="font-medium">قاعدة البيانات</p>
                <p className="text-xs text-white/50">
                  {systemHealth.database.latency_ms}ms
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                systemHealth.api.status === 'healthy' ? 'bg-emerald-500 animate-pulse' :
                systemHealth.api.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <div>
                <p className="font-medium">Edge Functions</p>
                <p className="text-xs text-white/50">
                  {systemHealth.api.requests_per_minute} req/min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                systemHealth.cache.status === 'healthy' ? 'bg-emerald-500 animate-pulse' :
                systemHealth.cache.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <div>
                <p className="font-medium">المصادقة</p>
                <p className="text-xs text-white/50">
                  {systemHealth.cache.hit_rate}% hit rate
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                systemHealth.storage.status === 'healthy' ? 'bg-emerald-500 animate-pulse' :
                systemHealth.storage.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <div>
                <p className="font-medium">التخزين</p>
                <p className="text-xs text-white/50">
                  {systemHealth.storage.used_gb}GB / {systemHealth.storage.total_gb}GB
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-white/60">
            <p>معلومات حالة الخدمات ستكون متاحة قريباً</p>
            <p className="text-sm text-white/40 mt-2">يتم حالياً تطوير واجهة برمجة التطبيقات (API) لمعلومات حالة الخدمات</p>
          </div>
        )}
      </div>
    </div>
  );
}
