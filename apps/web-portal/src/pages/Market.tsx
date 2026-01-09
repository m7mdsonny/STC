import { useState, useEffect } from 'react';
import { AlertTriangle, Camera, TrendingUp, Clock, Search, Filter, Calendar, RefreshCw, Eye } from 'lucide-react';
import { marketApi, type MarketEvent } from '../lib/api/market';
import { camerasApi } from '../lib/api/cameras';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/ui/Modal';
import type { Camera as CameraType } from '../types/database';

export function Market() {
  const { organization } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<MarketEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [cameraFilter, setCameraFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (organization) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [organization, riskFilter, cameraFilter, page]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, eventsRes, camerasRes] = await Promise.all([
        marketApi.getDashboard(),
        marketApi.getEvents({
          risk_level: riskFilter !== 'all' ? riskFilter as any : undefined,
          camera_id: cameraFilter !== 'all' ? cameraFilter : undefined,
          page,
          per_page: 20,
        }),
        camerasApi.getCameras({ per_page: 100 }),
      ]);

      setDashboard(dashboardRes);
      setEvents(eventsRes.data || []);
      setTotalPages(eventsRes.last_page || 1);
      setCameras(camerasRes.data || []);
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    }
    setLoading(false);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-blue-500';
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'badge-danger';
      case 'high': return 'badge-warning';
      case 'medium': return 'badge-gold';
      default: return 'badge-info';
    }
  };

  const getRiskText = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'حرج';
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      default: return 'منخفض';
    }
  };

  const filteredEvents = events.filter(event => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        event.title?.toLowerCase().includes(query) ||
        event.event_type?.toLowerCase().includes(query) ||
        event.track_id?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getCameraName = (cameraId: string | null) => {
    if (!cameraId) return 'غير محدد';
    const camera = cameras.find(c => c.id === cameraId);
    return camera?.name || cameraId;
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Market - سلوك مشبوه</h1>
          <p className="page-subtitle">مراقبة السلوك المشبوه ومنع الخسائر</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      {loading && !dashboard ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid-stats">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">إجمالي الأحداث</p>
                    <p className="text-2xl font-bold text-white">{dashboard?.total_events || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">أحداث اليوم</p>
                    <p className="text-2xl font-bold text-white">{dashboard?.today_events || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">مخاطر عالية</p>
                    <p className="text-2xl font-bold text-white">{dashboard?.high_risk_count || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">مخاطر حرجة</p>
                    <p className="text-2xl font-bold text-white">{dashboard?.critical_risk_count || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pr-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={riskFilter}
                  onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
                  className="input-field"
                >
                  <option value="all">جميع مستويات الخطر</option>
                  <option value="low">منخفض</option>
                  <option value="medium">متوسط</option>
                  <option value="high">عالي</option>
                  <option value="critical">حرج</option>
                </select>
                <select
                  value={cameraFilter}
                  onChange={(e) => { setCameraFilter(e.target.value); setPage(1); }}
                  className="input-field"
                >
                  <option value="all">جميع الكاميرات</option>
                  {cameras.map(camera => (
                    <option key={camera.id} value={camera.id}>{camera.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="card">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">الأحداث الأخيرة</h2>
            </div>
            <div className="divide-y divide-white/10">
              {loading ? (
                <div className="p-8 text-center text-white/60">جاري التحميل...</div>
              ) : filteredEvents.length === 0 ? (
                <div className="p-8 text-center text-white/60">لا توجد أحداث</div>
              ) : (
                filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="p-4 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`badge ${getRiskBadge(event.risk_level)}`}>
                            {getRiskText(event.risk_level)}
                          </span>
                          <span className="text-sm text-white/60">
                            النقاط: {event.risk_score}
                          </span>
                          {event.camera_id && (
                            <div className="flex items-center gap-1 text-sm text-white/60">
                              <Camera className="w-4 h-4" />
                              {getCameraName(event.camera_id)}
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-white mb-1">
                          {event.title || 'سلوك مشبوه'}
                        </h3>
                        {event.description && (
                          <p className="text-sm text-white/60 mb-2">{event.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-white/40">
                          <span>{new Date(event.occurred_at).toLocaleString('ar-SA')}</span>
                          {event.track_id && (
                            <span>Track ID: {event.track_id}</span>
                          )}
                          {event.confidence > 0 && (
                            <span>الثقة: {Math.round(event.confidence * 100)}%</span>
                          )}
                        </div>
                      </div>
                      {event.snapshot_url && (
                        <div className="flex-shrink-0">
                          <img
                            src={event.snapshot_url}
                            alt="Snapshot"
                            className="w-24 h-24 object-cover rounded-lg border border-white/10"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {totalPages > 1 && (
              <div className="p-4 border-t border-white/10 flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary"
                >
                  السابق
                </button>
                <span className="text-white/60">
                  صفحة {page} من {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary"
                >
                  التالي
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title="تفاصيل الحدث"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">نوع الحدث</label>
              <p className="text-white">{selectedEvent.event_type}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">مستوى الخطر</label>
                <span className={`badge ${getRiskBadge(selectedEvent.risk_level)}`}>
                  {getRiskText(selectedEvent.risk_level)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">نقاط المخاطرة</label>
                <p className="text-white">{selectedEvent.risk_score}</p>
              </div>
            </div>
            {selectedEvent.camera_id && (
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">الكاميرا</label>
                <p className="text-white">{getCameraName(selectedEvent.camera_id)}</p>
              </div>
            )}
            {selectedEvent.track_id && (
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Track ID</label>
                <p className="text-white font-mono text-sm">{selectedEvent.track_id}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1">الوقت</label>
              <p className="text-white">{new Date(selectedEvent.occurred_at).toLocaleString('ar-SA')}</p>
            </div>
            {selectedEvent.snapshot_url && (
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">الصورة</label>
                <img
                  src={selectedEvent.snapshot_url}
                  alt="Snapshot"
                  className="w-full rounded-lg border border-white/10"
                />
              </div>
            )}
            {selectedEvent.description && (
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">الوصف</label>
                <p className="text-white">{selectedEvent.description}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
