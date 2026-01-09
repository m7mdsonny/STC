import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Check, Eye, X, Search, Filter, Calendar, Camera, Clock, MapPin, Bell, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { alertsApi } from '../lib/api/alerts';
import { camerasApi } from '../lib/api/cameras';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/ui/Modal';
import type { Alert, Camera as CameraType } from '../types/database';
import { AI_MODULES } from '../types/database';

export function Alerts() {
  const { organization, canManage } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (organization) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [organization]);

  const playAlertSound = useCallback(() => {
    const audio = new Audio('/alert-sound.mp3');
    audio.play().catch(() => {});
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertsRes, camerasRes] = await Promise.all([
        alertsApi.getAlerts({ per_page: 100 }),
        camerasApi.getCameras({ per_page: 100 }),
      ]);

      setAlerts(alertsRes.data || []);
      setCameras(camerasRes.data || []);
    } catch {
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      if (status === 'acknowledged') {
        await alertsApi.acknowledgeAlert(id);
      } else if (status === 'resolved') {
        await alertsApi.resolveAlert(id);
      } else if (status === 'false_alarm') {
        await alertsApi.markFalseAlarm(id);
      }
      await fetchData();
      setSelectedAlert(null);
    } catch {
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-blue-500';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'badge-danger';
      case 'high': return 'badge-warning';
      case 'medium': return 'badge-gold';
      default: return 'badge-info';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return 'badge-danger';
      case 'acknowledged': return 'badge-warning';
      case 'resolved': return 'badge-success';
      default: return '';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'جديد';
      case 'acknowledged': return 'تم الاطلاع';
      case 'resolved': return 'محلول';
      case 'false_alarm': return 'انذار كاذب';
      default: return status;
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical': return 'حرج';
      case 'high': return 'مرتفع';
      case 'medium': return 'متوسط';
      default: return 'منخفض';
    }
  };

  const getCameraName = (cameraId: string) => {
    return cameras.find(c => c.id === cameraId)?.name || 'غير محدد';
  };

  const getModuleName = (moduleId: string) => {
    return AI_MODULES.find(m => m.id === moduleId)?.nameAr || moduleId;
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesModule = moduleFilter === 'all' || alert.module === moduleFilter;
    return matchesSearch && matchesStatus && matchesSeverity && matchesModule;
  });

  const newCount = alerts.filter(a => a.status === 'new').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">التنبيهات</h1>
          <p className="text-white/60">مراقبة وادارة تنبيهات النظام</p>
        </div>
        <div className="flex items-center gap-4">
          {newCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 font-medium">{newCount} تنبيه جديد</span>
            </div>
          )}
          {criticalCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <span className="text-orange-400 font-medium">{criticalCount} حرج</span>
            </div>
          )}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'bg-stc-gold/20 text-stc-gold' : 'bg-white/10 text-white/50'}`}
            title={soundEnabled ? 'اصوات التنبيه مفعلة' : 'اصوات التنبيه معطلة'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="تحديث"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="بحث في التنبيهات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pr-12 w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="all">كل الحالات</option>
              <option value="new">جديد</option>
              <option value="acknowledged">تم الاطلاع</option>
              <option value="resolved">محلول</option>
              <option value="false_alarm">انذار كاذب</option>
            </select>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="input"
            >
              <option value="all">كل الاهمية</option>
              <option value="critical">حرج</option>
              <option value="high">مرتفع</option>
              <option value="medium">متوسط</option>
              <option value="low">منخفض</option>
            </select>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="input"
            >
              <option value="all">كل الوحدات</option>
              {AI_MODULES.map((module) => (
                <option key={module.id} value={module.id}>{module.nameAr}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد تنبيهات</h3>
          <p className="text-white/60">لم يتم رصد اي تنبيهات حتى الان</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`card p-4 cursor-pointer hover:ring-1 hover:ring-white/20 transition-all ${
                alert.status === 'new' ? 'ring-1 ring-red-500/50' : ''
              }`}
              onClick={() => setSelectedAlert(alert)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(alert.severity)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-semibold">{alert.title}</h3>
                      {alert.description && (
                        <p className="text-sm text-white/60 mt-1 line-clamp-1">{alert.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`badge ${getSeverityBadge(alert.severity)}`}>
                        {getSeverityText(alert.severity)}
                      </span>
                      <span className={`badge ${getStatusBadge(alert.status)}`}>
                        {getStatusText(alert.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
                    <div className="flex items-center gap-1">
                      <Camera className="w-4 h-4" />
                      <span>{getCameraName(alert.camera_id)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{getModuleName(alert.module)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(alert.created_at).toLocaleString('ar-EG')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title="تفاصيل التنبيه"
        size="lg"
      >
        {selectedAlert && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className={`w-3 h-3 rounded-full mt-1.5 ${getSeverityColor(selectedAlert.severity)}`} />
              <div>
                <h3 className="text-xl font-semibold">{selectedAlert.title}</h3>
                {selectedAlert.description && (
                  <p className="text-white/60 mt-2">{selectedAlert.description}</p>
                )}
              </div>
            </div>

            {selectedAlert.snapshot_url && (
              <div className="aspect-video bg-black/50 rounded-lg overflow-hidden">
                <img
                  src={selectedAlert.snapshot_url}
                  alt="Alert snapshot"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-sm text-white/50 mb-1">الحالة</p>
                <span className={`badge ${getStatusBadge(selectedAlert.status)}`}>
                  {getStatusText(selectedAlert.status)}
                </span>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-sm text-white/50 mb-1">الاهمية</p>
                <span className={`badge ${getSeverityBadge(selectedAlert.severity)}`}>
                  {getSeverityText(selectedAlert.severity)}
                </span>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-sm text-white/50 mb-1">الكاميرا</p>
                <p className="font-medium">{getCameraName(selectedAlert.camera_id)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-sm text-white/50 mb-1">الوحدة</p>
                <p className="font-medium">{getModuleName(selectedAlert.module)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-sm text-white/50 mb-1">وقت الانشاء</p>
                <p className="font-medium">{new Date(selectedAlert.created_at).toLocaleString('ar-EG')}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-sm text-white/50 mb-1">نوع الحدث</p>
                <p className="font-medium">{selectedAlert.type}</p>
              </div>
            </div>

            {canManage && selectedAlert.status !== 'resolved' && (
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                {selectedAlert.status === 'new' && (
                  <button
                    onClick={() => updateStatus(selectedAlert.id, 'acknowledged')}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>تم الاطلاع</span>
                  </button>
                )}
                <button
                  onClick={() => updateStatus(selectedAlert.id, 'false_alarm')}
                  className="btn-secondary flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>انذار كاذب</span>
                </button>
                <button
                  onClick={() => updateStatus(selectedAlert.id, 'resolved')}
                  className="btn-primary flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>تم الحل</span>
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
