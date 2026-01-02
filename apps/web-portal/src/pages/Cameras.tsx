import { useState, useEffect, useCallback } from 'react';
import { Camera, Plus, Settings, Trash2, Power, PowerOff, MapPin, Server, Search, Filter, Grid, List, Play, RefreshCw, Eye, Image } from 'lucide-react';
import { camerasApi } from '../lib/api/cameras';
import { edgeServersApi } from '../lib/api/edgeServers';
import { edgeServerService, CameraSnapshot } from '../lib/edgeServer';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getDetailedErrorMessage } from '../lib/errorMessages';
import { Modal } from '../components/ui/Modal';
import type { Camera as CameraType, EdgeServer } from '../types/database';
import { AI_MODULES } from '../types/database';

export function Cameras() {
  const { organization, canManage } = useAuth();
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [servers, setServers] = useState<EdgeServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [snapshots, setSnapshots] = useState<Record<string, string>>({});
  const [loadingSnapshots, setLoadingSnapshots] = useState<Record<string, boolean>>({});
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<CameraType | null>(null);
  const [liveSnapshot, setLiveSnapshot] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    rtsp_url: '',
    username: '',
    password: '',
    edge_server_id: '',
    resolution: '1920x1080',
    fps: 15,
    enabled_modules: [] as string[],
  });

  useEffect(() => {
    if (organization) {
      fetchData();
    }
  }, [organization]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [camerasRes, serversRes] = await Promise.all([
        camerasApi.getCameras({ per_page: 100 }),
        edgeServersApi.getEdgeServers({ per_page: 100 }),
      ]);
      setCameras(camerasRes.data || []);
      const serversData = serversRes.data || [];
      setServers(serversData);
      const onlineServer = serversData.find(s => s.status === 'online' && s.ip_address);
      if (onlineServer?.ip_address) {
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        await edgeServerService.setServerUrl(`${protocol}//${onlineServer.ip_address}:8000`);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const fetchSnapshot = useCallback(async (cameraId: string) => {
    setLoadingSnapshots(prev => ({ ...prev, [cameraId]: true }));
    const snapshot = await edgeServerService.getSnapshot(cameraId);
    if (snapshot?.image) {
      setSnapshots(prev => ({ ...prev, [cameraId]: snapshot.image }));
    }
    setLoadingSnapshots(prev => ({ ...prev, [cameraId]: false }));
  }, []);

  const openLiveView = async (camera: CameraType) => {
    setSelectedCamera(camera);
    setShowLiveModal(true);
    setLiveSnapshot(null);
    const snapshot = await edgeServerService.getSnapshot(camera.id);
    if (snapshot?.image) {
      setLiveSnapshot(snapshot.image);
    }
  };

  const refreshLiveView = async () => {
    if (!selectedCamera) return;
    setLiveSnapshot(null);
    const snapshot = await edgeServerService.getSnapshot(selectedCamera.id);
    if (snapshot?.image) {
      setLiveSnapshot(snapshot.image);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    if (!formData.edge_server_id) {
      showError('بيانات غير مكتملة', 'يرجى اختيار سيرفر Edge');
      return;
    }

    const payload = {
      ...formData,
      organization_id: organization.id,
    };

    try {
      // Check if Edge Server is online before creating/updating camera
      const selectedServer = servers.find(s => s.id === formData.edge_server_id);
      if (selectedServer && !selectedServer.online) {
        const proceed = confirm(
          `تحذير: السيرفر ${selectedServer.name} غير متصل حالياً.\n` +
          `سيتم حفظ الكاميرا في قاعدة البيانات، لكن لن يتم مزامنتها مع Edge Server حتى يعود الاتصال.\n\n` +
          `هل تريد المتابعة؟`
        );
        if (!proceed) return;
      }

      if (editingCamera) {
        const response = await camerasApi.updateCamera(editingCamera.id, payload);
        showSuccess('تم التحديث بنجاح', `تم تحديث بيانات الكاميرا ${formData.name} بنجاح`);
      } else {
        const response = await camerasApi.createCamera(payload);
        showSuccess('تم الإضافة بنجاح', `تم إضافة الكاميرا ${formData.name} وربطها بالسيرفر المحلي بنجاح`);
        
        // Warn if Edge Server is offline
        if (selectedServer && !selectedServer.online) {
          showError(
            'تحذير: السيرفر غير متصل',
            `تم حفظ الكاميرا في قاعدة البيانات، لكن لن يتم مزامنتها مع Edge Server حتى يعود الاتصال.`
          );
        }
      }

      setShowModal(false);
      setEditingCamera(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving camera:', error);
      const { title, message } = getDetailedErrorMessage(error, 'حفظ الكاميرا', 'حدث خطأ في حفظ الكاميرا');
      showError(title, message);
    }
  };

  const handleDelete = async (id: string) => {
    const camera = cameras.find(c => c.id === id);
    if (!confirm(`هل أنت متأكد من حذف الكاميرا ${camera?.name || ''}؟`)) return;
    try {
      await camerasApi.deleteCamera(id);
      showSuccess('تم الحذف بنجاح', `تم حذف الكاميرا ${camera?.name || ''} من النظام`);
      fetchData();
    } catch (error) {
      console.error('Error deleting camera:', error);
      const { title, message } = getDetailedErrorMessage(error, 'حذف الكاميرا', 'حدث خطأ في حذف الكاميرا');
      showError(title, message);
    }
  };

  const toggleStatus = async (camera: CameraType) => {
    const newStatus = camera.status === 'online' ? 'offline' : 'online';
    try {
      await camerasApi.updateCamera(camera.id, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error toggling camera status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      rtsp_url: '',
      username: '',
      password: '',
      edge_server_id: '',
      resolution: '1920x1080',
      fps: 15,
      enabled_modules: [],
    });
  };

  const openEditModal = (camera: CameraType) => {
    setEditingCamera(camera);
    setFormData({
      name: camera.name,
      location: camera.location || '',
      rtsp_url: camera.rtsp_url,
      username: camera.username || '',
      password: '',
      edge_server_id: camera.edge_server_id,
      resolution: camera.resolution,
      fps: camera.fps,
      enabled_modules: camera.enabled_modules || [],
    });
    setShowModal(true);
  };

  const toggleModule = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      enabled_modules: prev.enabled_modules.includes(moduleId)
        ? prev.enabled_modules.filter(m => m !== moduleId)
        : [...prev.enabled_modules, moduleId],
    }));
  };

  const filteredCameras = cameras.filter(camera => {
    const matchesSearch = camera.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (camera.location?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || camera.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getServerName = (serverId: string) => {
    return servers.find(s => s.id === serverId)?.name || 'غير محدد';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">الكاميرات</h1>
          <p className="text-white/60">ادارة كاميرات المراقبة</p>
        </div>
        {canManage && (
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <span>اضافة كاميرا</span>
          </button>
        )}
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="بحث بالاسم او الموقع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pr-12 w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="all">كل الحالات</option>
              <option value="online">متصل</option>
              <option value="offline">غير متصل</option>
              <option value="error">خطا</option>
            </select>
            <div className="flex bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-stc-gold text-stc-navy' : 'text-white/60 hover:text-white'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-stc-gold text-stc-navy' : 'text-white/60 hover:text-white'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredCameras.length === 0 ? (
        <div className="card p-12 text-center">
          <Camera className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد كاميرات</h3>
          <p className="text-white/60 mb-4">ابدا باضافة كاميرات للمراقبة</p>
          {canManage && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              اضافة كاميرا
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCameras.map((camera) => (
            <div key={camera.id} className="card overflow-hidden group">
              <div className="aspect-video bg-black/50 relative">
                {snapshots[camera.id] ? (
                  <img
                    src={snapshots[camera.id]}
                    alt={camera.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-white/20" />
                  </div>
                )}
                <div className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium ${
                  camera.status === 'online' ? 'bg-emerald-500/20 text-emerald-400' :
                  camera.status === 'error' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {camera.status === 'online' ? 'متصل' : camera.status === 'error' ? 'خطا' : 'غير متصل'}
                </div>
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {camera.status === 'online' && (
                    <>
                      <button
                        onClick={() => openLiveView(camera)}
                        className="p-2 bg-stc-gold/90 rounded hover:bg-stc-gold"
                        title="عرض مباشر"
                      >
                        <Eye className="w-4 h-4 text-stc-navy" />
                      </button>
                      <button
                        onClick={() => fetchSnapshot(camera.id)}
                        className="p-2 bg-black/50 rounded hover:bg-black/70"
                        title="تحديث الصورة"
                        disabled={loadingSnapshots[camera.id]}
                      >
                        <RefreshCw className={`w-4 h-4 ${loadingSnapshots[camera.id] ? 'animate-spin' : ''}`} />
                      </button>
                    </>
                  )}
                  {canManage && (
                    <>
                      <button
                        onClick={() => toggleStatus(camera)}
                        className="p-2 bg-black/50 rounded hover:bg-black/70"
                      >
                        {camera.status === 'online' ? (
                          <PowerOff className="w-4 h-4 text-red-400" />
                        ) : (
                          <Power className="w-4 h-4 text-emerald-400" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(camera)}
                        className="p-2 bg-black/50 rounded hover:bg-black/70"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(camera.id)}
                        className="p-2 bg-black/50 rounded hover:bg-red-500/50"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-2">{camera.name}</h3>
                <div className="space-y-1 text-sm text-white/60">
                  {camera.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{camera.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    <span>{getServerName(camera.edge_server_id)}</span>
                  </div>
                </div>
                {camera.enabled_modules && camera.enabled_modules.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {camera.enabled_modules.slice(0, 3).map((moduleId) => {
                      const module = AI_MODULES.find(m => m.id === moduleId);
                      return module ? (
                        <span key={moduleId} className="badge badge-gold text-xs">
                          {module.nameAr}
                        </span>
                      ) : null;
                    })}
                    {camera.enabled_modules.length > 3 && (
                      <span className="badge text-xs">+{camera.enabled_modules.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-right p-4 font-medium text-white/70">الكاميرا</th>
                <th className="text-right p-4 font-medium text-white/70">الموقع</th>
                <th className="text-right p-4 font-medium text-white/70">السيرفر</th>
                <th className="text-right p-4 font-medium text-white/70">الحالة</th>
                <th className="text-right p-4 font-medium text-white/70">الوحدات</th>
                {canManage && <th className="text-right p-4 font-medium text-white/70">اجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {filteredCameras.map((camera) => (
                <tr key={camera.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <Camera className="w-5 h-5 text-stc-gold" />
                      </div>
                      <span className="font-medium">{camera.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-white/60">{camera.location || '-'}</td>
                  <td className="p-4 text-white/60">{getServerName(camera.edge_server_id)}</td>
                  <td className="p-4">
                    <span className={`badge ${
                      camera.status === 'online' ? 'badge-success' :
                      camera.status === 'error' ? 'badge-danger' : ''
                    }`}>
                      {camera.status === 'online' ? 'متصل' : camera.status === 'error' ? 'خطا' : 'غير متصل'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-white/60">{camera.enabled_modules?.length || 0} وحدة</span>
                  </td>
                  {canManage && (
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(camera)} className="p-2 hover:bg-white/10 rounded">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(camera.id)} className="p-2 hover:bg-red-500/20 rounded">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingCamera(null); resetForm(); }}
        title={editingCamera ? 'تعديل الكاميرا' : 'اضافة كاميرا جديدة'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">اسم الكاميرا</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">الموقع</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">رابط RTSP</label>
            <input
              type="text"
              value={formData.rtsp_url}
              onChange={(e) => setFormData({ ...formData, rtsp_url: e.target.value })}
              className="input"
              placeholder="rtsp://ip:port/stream"
              dir="ltr"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">اسم المستخدم</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input"
                dir="ltr"
              />
            </div>
            <div>
              <label className="label">كلمة المرور</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                dir="ltr"
                placeholder={editingCamera ? '(اتركه فارغا للابقاء على الحالي)' : ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">السيرفر</label>
              <select
                value={formData.edge_server_id}
                onChange={(e) => setFormData({ ...formData, edge_server_id: e.target.value })}
                className="input"
                required
              >
                <option value="">اختر السيرفر</option>
                {servers.map((server) => (
                  <option key={server.id} value={server.id}>{server.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">الدقة</label>
              <select
                value={formData.resolution}
                onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                className="input"
              >
                <option value="1920x1080">1080p (Full HD)</option>
                <option value="1280x720">720p (HD)</option>
                <option value="640x480">480p (SD)</option>
              </select>
            </div>
            <div>
              <label className="label">عدد الاطارات (FPS)</label>
              <input
                type="number"
                value={formData.fps}
                onChange={(e) => setFormData({ ...formData, fps: parseInt(e.target.value) })}
                className="input"
                min={1}
                max={30}
              />
            </div>
          </div>

          <div>
            <label className="label">الوحدات المفعلة</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {AI_MODULES.map((module) => (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => toggleModule(module.id)}
                  className={`p-3 rounded-lg border text-sm text-right transition-all ${
                    formData.enabled_modules.includes(module.id)
                      ? 'bg-stc-gold/20 border-stc-gold text-stc-gold'
                      : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                  }`}
                >
                  {module.nameAr}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => { setShowModal(false); setEditingCamera(null); resetForm(); }}
              className="btn-secondary"
            >
              الغاء
            </button>
            <button type="submit" className="btn-primary">
              {editingCamera ? 'حفظ التعديلات' : 'اضافة الكاميرا'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showLiveModal}
        onClose={() => { setShowLiveModal(false); setSelectedCamera(null); setLiveSnapshot(null); }}
        title={selectedCamera ? `${selectedCamera.name} - عرض مباشر` : 'عرض مباشر'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
            {liveSnapshot ? (
              <img src={liveSnapshot} alt="Live" className="w-full h-full object-contain" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 text-stc-gold animate-spin mb-2" />
                <span className="text-white/60">جاري تحميل الصورة...</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">
              {selectedCamera?.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {selectedCamera.location}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={refreshLiveView} className="btn-secondary flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                <span>تحديث</span>
              </button>
            </div>
          </div>
          {selectedCamera?.enabled_modules && selectedCamera.enabled_modules.length > 0 && (
            <div className="p-4 bg-white/5 rounded-lg">
              <p className="text-sm text-white/60 mb-2">الوحدات المفعلة:</p>
              <div className="flex flex-wrap gap-2">
                {selectedCamera.enabled_modules.map((moduleId) => {
                  const module = AI_MODULES.find(m => m.id === moduleId);
                  return module ? (
                    <span key={moduleId} className="badge badge-gold text-xs">
                      {module.nameAr}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
