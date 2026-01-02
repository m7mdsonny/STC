import { useState, useEffect } from 'react';
import { Server, Activity, WifiOff, AlertCircle, Check, X, RefreshCw } from 'lucide-react';
import { edgeServersApi } from '../../lib/api/edgeServers';
import { useAuth } from '../../contexts/AuthContext';

interface EdgeServer {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'error';
  last_heartbeat: string;
  version: string;
  ip_address: string;
  hardware_id: string;
  cameras_count?: number;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
}

export function EdgeServerMonitor() {
  const { organization } = useAuth();
  const [servers, setServers] = useState<EdgeServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (organization?.id) {
      fetchServers();
    }
  }, [organization?.id]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchServers();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, organization?.id]);

  const fetchServers = async () => {
    if (!organization?.id) return;

    try {
      const response = await edgeServersApi.getEdgeServers({ per_page: 100 });

      const serversWithStatus = (response.data || []).map((server) => {
        const lastHeartbeat = new Date(server.last_heartbeat || new Date());
        const now = new Date();
        const diffMinutes = (now.getTime() - lastHeartbeat.getTime()) / (1000 * 60);

        let status: 'online' | 'offline' | 'error' = 'online';
        if (diffMinutes > 5) {
          status = 'offline';
        } else if (diffMinutes > 2) {
          status = 'error';
        }

        return {
          ...server,
          status,
          cameras_count: 0, // This would need to be added to the API response if needed
        };
      });

      setServers(serversWithStatus);
    } catch (error) {
      console.error('Error fetching edge servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-emerald-400';
      case 'error':
        return 'text-yellow-400';
      case 'offline':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-400/20';
      case 'error':
        return 'bg-yellow-400/20';
      case 'offline':
        return 'bg-red-400/20';
      default:
        return 'bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Check className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'offline':
        return <X className="w-4 h-4" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'متصل';
      case 'error':
        return 'بطيء';
      case 'offline':
        return 'غير متصل';
      default:
        return 'غير معروف';
    }
  };

  const getLastHeartbeatText = (lastHeartbeat: string) => {
    const date = new Date(lastHeartbeat);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) {
      return `${diffSeconds} ثانية`;
    } else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes} دقيقة`;
    } else {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours} ساعة`;
    }
  };

  const onlineCount = servers.filter((s) => s.status === 'online').length;
  const offlineCount = servers.filter((s) => s.status === 'offline').length;
  const errorCount = servers.filter((s) => s.status === 'error').length;

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3"></div>
          <div className="h-20 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-stc-gold/20 to-stc-gold/5">
            <Server className="w-5 h-5 text-stc-gold" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">السيرفرات المحلية</h2>
            <p className="text-sm text-white/60">
              {onlineCount} متصل • {errorCount} بطيء • {offlineCount} غير متصل
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg transition-colors ${
              autoRefresh ? 'bg-stc-gold/20 text-stc-gold' : 'bg-white/5 text-white/60'
            }`}
            title={autoRefresh ? 'إيقاف التحديث التلقائي' : 'تفعيل التحديث التلقائي'}
          >
            <Activity className="w-5 h-5" />
          </button>
          <button
            onClick={() => fetchServers()}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="تحديث"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {servers.length === 0 ? (
        <div className="text-center py-12">
          <Server className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60 mb-2">لا توجد سيرفرات محلية مسجلة</p>
          <p className="text-sm text-white/40">
            قم بتشغيل Edge Server وسيظهر هنا تلقائياً
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {servers.map((server) => (
            <div
              key={server.id}
              className="p-4 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-all border border-white/10"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getStatusBg(server.status)}`}>
                    <Server className={`w-5 h-5 ${getStatusColor(server.status)}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{server.name}</h3>
                    <p className="text-sm text-white/60">{server.ip_address}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusBg(server.status)}`}>
                  <span className={getStatusColor(server.status)}>
                    {getStatusIcon(server.status)}
                  </span>
                  <span className={`text-sm font-medium ${getStatusColor(server.status)}`}>
                    {getStatusText(server.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-white/10">
                <div>
                  <p className="text-xs text-white/60 mb-1">الإصدار</p>
                  <p className="font-medium">{server.version}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60 mb-1">الكاميرات</p>
                  <p className="font-medium">{server.cameras_count}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60 mb-1">آخر اتصال</p>
                  <p className="font-medium">{getLastHeartbeatText(server.last_heartbeat)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60 mb-1">المعرف</p>
                  <p className="font-medium text-xs truncate">
                    {server.hardware_id ? `${server.hardware_id.slice(0, 8)}...` : 'غير متوفر'}
                  </p>
                </div>
              </div>

              {(server.cpu_usage || server.memory_usage || server.disk_usage) && (
                <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-white/10">
                  {server.cpu_usage !== undefined && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/60">CPU</span>
                        <span className="text-xs font-medium">{server.cpu_usage}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-stc-gold rounded-full transition-all"
                          style={{ width: `${server.cpu_usage}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {server.memory_usage !== undefined && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/60">RAM</span>
                        <span className="text-xs font-medium">{server.memory_usage}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${server.memory_usage}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {server.disk_usage !== undefined && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/60">Disk</span>
                        <span className="text-xs font-medium">{server.disk_usage}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${server.disk_usage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
