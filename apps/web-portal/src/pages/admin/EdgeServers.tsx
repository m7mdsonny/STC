import { useState, useEffect } from 'react';
import {
  Server, Search, RefreshCw, Activity, Wifi, WifiOff,
  Clock, MapPin, Camera, Key, MoreVertical, Eye,
  AlertTriangle, CheckCircle, XCircle, Settings, Trash2
} from 'lucide-react';
import { edgeServersApi } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import type { EdgeServerExtended, Organization, License } from '../../types/database';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export function EdgeServers() {
  const [servers, setServers] = useState<EdgeServerExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedServer, setSelectedServer] = useState<EdgeServerExtended | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchServers = async () => {
    try {
      const response = await edgeServersApi.getEdgeServers();
      setServers(response.data as EdgeServerExtended[]);
    } catch (error) {
      console.error('Error fetching servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchServers();
    setRefreshing(false);
  };

  const getStatusInfo = (server: EdgeServerExtended) => {
    const now = new Date();
    const lastHeartbeat = server.last_heartbeat ? new Date(server.last_heartbeat) : null;
    const diffMinutes = lastHeartbeat ? (now.getTime() - lastHeartbeat.getTime()) / 60000 : Infinity;

    if (server.configuration_mode) {
      return {
        status: 'config',
        color: 'text-orange-400',
        bg: 'bg-orange-500/20',
        icon: Settings,
        label: 'وضع الاعداد'
      };
    }
    if (diffMinutes < 2) {
      return {
        status: 'online',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/20',
        icon: Wifi,
        label: 'متصل'
      };
    }
    if (diffMinutes < 5) {
      return {
        status: 'warning',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/20',
        icon: AlertTriangle,
        label: 'بطيء'
      };
    }
    return {
      status: 'offline',
      color: 'text-red-400',
      bg: 'bg-red-500/20',
      icon: WifiOff,
      label: 'غير متصل'
    };
  };

  const deleteServer = async (id: string) => {
    if (!confirm('هل انت متاكد من حذف هذا السيرفر؟ سيتم حذف جميع الكاميرات المرتبطة.')) return;
    try {
      await edgeServersApi.deleteEdgeServer(id);
      fetchServers();
    } catch (error) {
      console.error('Error deleting server:', error);
    }
  };

  const filteredServers = servers.filter(server => {
    const matchesSearch =
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.hardware_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;

    const statusInfo = getStatusInfo(server);
    return matchesSearch && statusInfo.status === statusFilter;
  });

  const stats = {
    total: servers.length,
    online: servers.filter(s => getStatusInfo(s).status === 'online').length,
    offline: servers.filter(s => getStatusInfo(s).status === 'offline').length,
    config: servers.filter(s => s.configuration_mode).length
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">سيرفرات Edge</h1>
          <p className="text-white/60">مراقبة وادارة سيرفرات الحافة</p>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-stc-gold/20 to-stc-gold/5">
              <Server className="w-6 h-6 text-stc-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-white/60">اجمالي السيرفرات</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
              <Wifi className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.online}</p>
              <p className="text-sm text-white/60">متصل</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5">
              <WifiOff className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.offline}</p>
              <p className="text-sm text-white/60">غير متصل</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5">
              <Settings className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.config}</p>
              <p className="text-sm text-white/60">وضع الاعداد</p>
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
              placeholder="بحث بالاسم، المعرف، او المؤسسة..."
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
            <option value="online">متصل</option>
            <option value="offline">غير متصل</option>
            <option value="config">وضع الاعداد</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredServers.length === 0 ? (
        <div className="card p-12 text-center">
          <Server className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد سيرفرات</h3>
          <p className="text-white/60">لم يتم تسجيل اي سيرفرات Edge بعد</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredServers.map((server) => {
            const statusInfo = getStatusInfo(server);
            const StatusIcon = statusInfo.icon;

            return (
              <div key={server.id} className="card p-5 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${statusInfo.bg}`}>
                      <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{server.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-white/60 mt-1">{server.organization?.name || 'غير محدد'}</p>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/50">
                        {server.hardware_id && (
                          <div className="flex items-center gap-1">
                            <Key className="w-4 h-4" />
                            <span className="font-mono text-xs">{server.hardware_id.substring(0, 16)}...</span>
                          </div>
                        )}
                        {server.ip_address && (
                          <div className="flex items-center gap-1">
                            <Activity className="w-4 h-4" />
                            <span>{server.ip_address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Camera className="w-4 h-4" />
                          <span>{server.cameras_count} كاميرا</span>
                        </div>
                        {server.last_heartbeat && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {formatDistanceToNow(new Date(server.last_heartbeat), {
                                addSuffix: true,
                                locale: ar
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {server.license && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        server.license.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                        server.license.status === 'trial' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {server.license.plan}
                      </span>
                    )}
                    <button
                      onClick={() => { setSelectedServer(server); setShowDetailsModal(true); }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5 text-white/60" />
                    </button>
                    <button
                      onClick={() => deleteServer(server.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>

                {server.system_info && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {server.system_info.cpu_percent !== undefined && (
                        <div>
                          <span className="text-white/50">CPU</span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  (server.system_info.cpu_percent as number) > 80 ? 'bg-red-500' :
                                  (server.system_info.cpu_percent as number) > 60 ? 'bg-yellow-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${server.system_info.cpu_percent}%` }}
                              />
                            </div>
                            <span className="text-white/70">{server.system_info.cpu_percent}%</span>
                          </div>
                        </div>
                      )}
                      {server.system_info.memory_percent !== undefined && (
                        <div>
                          <span className="text-white/50">الذاكرة</span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  (server.system_info.memory_percent as number) > 80 ? 'bg-red-500' :
                                  (server.system_info.memory_percent as number) > 60 ? 'bg-yellow-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${server.system_info.memory_percent}%` }}
                              />
                            </div>
                            <span className="text-white/70">{server.system_info.memory_percent}%</span>
                          </div>
                        </div>
                      )}
                      {server.system_info.disk_percent !== undefined && (
                        <div>
                          <span className="text-white/50">القرص</span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  (server.system_info.disk_percent as number) > 80 ? 'bg-red-500' :
                                  (server.system_info.disk_percent as number) > 60 ? 'bg-yellow-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${server.system_info.disk_percent}%` }}
                              />
                            </div>
                            <span className="text-white/70">{server.system_info.disk_percent}%</span>
                          </div>
                        </div>
                      )}
                      {server.version && (
                        <div>
                          <span className="text-white/50">الاصدار</span>
                          <p className="text-white/70 mt-1">{server.version}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="تفاصيل السيرفر"
        size="lg"
      >
        {selectedServer && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/50">الاسم</label>
                <p className="font-medium">{selectedServer.name}</p>
              </div>
              <div>
                <label className="text-sm text-white/50">المؤسسة</label>
                <p className="font-medium">{selectedServer.organization?.name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-white/50">معرف الجهاز</label>
                <p className="font-mono text-sm">{selectedServer.hardware_id || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-white/50">عنوان IP</label>
                <p className="font-mono text-sm">{selectedServer.ip_address || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-white/50">اخر اتصال</label>
                <p>{selectedServer.last_heartbeat ?
                  new Date(selectedServer.last_heartbeat).toLocaleString('ar-SA') : '-'}</p>
              </div>
              <div>
                <label className="text-sm text-white/50">الاصدار</label>
                <p>{selectedServer.version || '-'}</p>
              </div>
            </div>

            {selectedServer.license && (
              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="font-medium mb-3">معلومات الترخيص</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-white/50">مفتاح الترخيص</label>
                    <p className="font-mono">{selectedServer.license.license_key}</p>
                  </div>
                  <div>
                    <label className="text-white/50">الباقة</label>
                    <p className="capitalize">{selectedServer.license.plan}</p>
                  </div>
                  <div>
                    <label className="text-white/50">الحالة</label>
                    <p>{selectedServer.license.status}</p>
                  </div>
                  <div>
                    <label className="text-white/50">ينتهي في</label>
                    <p>{selectedServer.license.expires_at ?
                      new Date(selectedServer.license.expires_at).toLocaleDateString('ar-SA') : '-'}</p>
                  </div>
                </div>
                {selectedServer.license.modules && (
                  <div className="mt-3">
                    <label className="text-white/50 text-sm">الموديولات المفعلة</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(selectedServer.license.modules as string[]).map((mod) => (
                        <span key={mod} className="px-2 py-1 bg-stc-gold/20 text-stc-gold rounded text-xs">
                          {mod}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedServer.system_info && (
              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="font-medium mb-3">معلومات النظام</h4>
                <pre className="text-xs bg-black/30 p-3 rounded overflow-x-auto">
                  {JSON.stringify(selectedServer.system_info, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
