import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Building2, Bell, Shield, Server, Plus, Trash2, RefreshCw, Wifi, WifiOff, Activity, AlertTriangle, MapPin, Key } from 'lucide-react';
import { edgeServersApi } from '../lib/api/edgeServers';
import { licensesApi } from '../lib/api/licenses';
import { edgeServerService, EdgeServerStatus } from '../lib/edgeServer';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getDetailedErrorMessage } from '../lib/errorMessages';
import { Modal } from '../components/ui/Modal';
import { OrganizationSettings } from '../components/settings/OrganizationSettings';
import { NotificationSettings } from '../components/settings/NotificationSettings';
import { AlertPrioritySettings } from '../components/settings/AlertPrioritySettings';
import { SecuritySettings } from '../components/settings/SecuritySettings';
import type { EdgeServer, License } from '../types/database';

type TabId = 'organization' | 'servers' | 'notifications' | 'priorities' | 'security';

const TABS: { id: TabId; label: string; icon: typeof SettingsIcon }[] = [
  { id: 'organization', label: 'المؤسسة', icon: Building2 },
  { id: 'servers', label: 'السيرفرات', icon: Server },
  { id: 'notifications', label: 'الاشعارات', icon: Bell },
  { id: 'priorities', label: 'اولوية التنبيهات', icon: AlertTriangle },
  { id: 'security', label: 'الامان', icon: Shield },
];

export function Settings() {
  const { organization, canManage } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('organization');
  const [servers, setServers] = useState<EdgeServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverStatuses, setServerStatuses] = useState<Record<string, EdgeServerStatus | null>>({});
  const [testingServer, setTestingServer] = useState<string | null>(null);
  const [syncingServer, setSyncingServer] = useState<string | null>(null);
  const [editingServer, setEditingServer] = useState<EdgeServer | null>(null);

  const [serverForm, setServerForm] = useState({
    name: '',
    ip_address: '',
    location: '',
    license_id: '',
  });
  const [availableLicenses, setAvailableLicenses] = useState<License[]>([]);
  const [loadingLicenses, setLoadingLicenses] = useState(false);

  useEffect(() => {
    if (organization) {
      fetchData();
      fetchLicenses();
    }
  }, [organization]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await edgeServersApi.getEdgeServers({});
      setServers(result.data || []);
    } catch (error) {
      console.error('Failed to fetch edge servers:', error);
    }
    setLoading(false);
  };

  const fetchLicenses = async () => {
    if (!organization) return;
    setLoadingLicenses(true);
    try {
      const result = await licensesApi.getLicenses({
        organization_id: organization.id,
        per_page: 100,
      });
      // Filter to show only active licenses that are not bound to an edge server
      const unboundLicenses = result.data.filter(
        (license) => license.status === 'active' && !license.edge_server_id
      );
      setAvailableLicenses(unboundLicenses);
    } catch (error) {
      console.error('Failed to fetch licenses:', error);
    }
    setLoadingLicenses(false);
  };

  const addServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    if (!serverForm.name.trim()) {
      alert('يرجى إدخال اسم السيرفر');
      return;
    }

    try {
      if (editingServer) {
        await edgeServersApi.updateEdgeServer(editingServer.id, {
          name: serverForm.name,
          location: serverForm.location || undefined,
        });
        showSuccess('تم التحديث بنجاح', `تم تحديث بيانات السيرفر ${serverForm.name} بنجاح`);
      } else {
        const newServer = await edgeServersApi.createEdgeServer({
          name: serverForm.name,
          location: serverForm.location || undefined,
          license_id: serverForm.license_id || undefined,
        });
        showSuccess(
          'تم الإضافة بنجاح',
          `تم إضافة السيرفر ${serverForm.name} بنجاح. معرف السيرفر: ${newServer.edge_id || newServer.id}\n${newServer.license ? `تم ربطه بالترخيص: ${newServer.license.license_key}` : 'يرجى ربطه بترخيص لاحقاً'}\nيرجى استخدام معرف السيرفر في Edge Server للربط.`
        );
      }

      setShowServerModal(false);
      setServerForm({ name: '', ip_address: '', location: '', license_id: '' });
      setEditingServer(null);
      fetchData();
      fetchLicenses(); // Refresh licenses after creating server
    } catch (error: any) {
      console.error('Failed to save edge server:', error);
      const { title, message } = getDetailedErrorMessage(error, 'حفظ السيرفر', 'حدث خطأ في حفظ السيرفر');
      showError(title, message);
    }
  };

  const editServer = (server: EdgeServer) => {
    setEditingServer(server);
    setServerForm({
      name: server.name,
      ip_address: server.ip_address || '',
      location: (server.system_info as Record<string, string>)?.location || '',
      license_id: server.license_id || '',
    });
    setShowServerModal(true);
  };

  const deleteServer = async (id: string) => {
    const server = servers.find(s => s.id === id);
    if (!confirm(`هل أنت متأكد من حذف السيرفر ${server?.name || ''}؟ سيتم حذف جميع الكاميرات المرتبطة به.`)) return;
    try {
      await edgeServersApi.deleteEdgeServer(id);
      showSuccess('تم الحذف بنجاح', `تم حذف السيرفر ${server?.name || ''} من النظام`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete edge server:', error);
      const { title, message } = getDetailedErrorMessage(error, 'حذف السيرفر', 'حدث خطأ في حذف السيرفر');
      showError(title, message);
    }
  };

  const testServerConnection = async (server: EdgeServer) => {
    if (!server.ip_address) return;
    setTestingServer(server.id);
    try {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      await edgeServerService.setServerUrl(`${protocol}//${server.ip_address}:8000`);
      const status = await edgeServerService.getStatus();
      setServerStatuses(prev => ({ ...prev, [server.id]: status }));

      // The status update should be handled by the edge server itself via heartbeat
      // but we can trigger a sync if needed
      if (status) {
        await edgeServersApi.syncConfig(server.id);
        showSuccess('اتصال ناجح', `تم الاتصال بسيرفر ${server.name} بنجاح`);
      } else {
        showError('فشل الاتصال', `فشل الاتصال بسيرفر ${server.name}. تأكد من تشغيل Edge Server`);
      }

      fetchData();
    } catch (error) {
      console.error('Failed to test server connection:', error);
      const { title, message } = getDetailedErrorMessage(error, 'اختبار الاتصال', 'فشل اختبار الاتصال بالسيرفر');
      showError(title, message);
    }
    setTestingServer(null);
  };

  const forceSync = async (server: EdgeServer) => {
    if (!server.ip_address) return;
    setSyncingServer(server.id);
    try {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      await edgeServerService.setServerUrl(`${protocol}//${server.ip_address}:8000`);
      await edgeServerService.forceSync();
      await edgeServersApi.syncConfig(server.id);
    } catch (error) {
      console.error('Failed to sync server:', error);
    }
    setSyncingServer(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الاعدادات</h1>
        <p className="text-white/60">اعدادات النظام والمؤسسة والاشعارات</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <div className="card p-2 sticky top-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-stc-gold/20 text-stc-gold'
                    : 'text-white/70 hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {activeTab === 'organization' && <OrganizationSettings />}

          {activeTab === 'servers' && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold">سيرفرات الحافة (Edge Servers)</h2>
                    <p className="text-sm text-white/50">
                      يمكنك اضافة عدة سيرفرات في مواقع مختلفة، كل سيرفر يدير مجموعة كاميرات
                    </p>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => {
                        setEditingServer(null);
                        setServerForm({ name: '', ip_address: '', location: '', license_id: '' });
                        setShowServerModal(true);
                      }}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>اضافة سيرفر</span>
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : servers.length === 0 ? (
                  <div className="text-center py-12 text-white/50">
                    <Server className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg mb-2">لا توجد سيرفرات مسجلة</p>
                    <p className="text-sm">قم باضافة سيرفر حافة للبدء في ربط الكاميرات</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {servers.map((server) => {
                      const status = serverStatuses[server.id];
                      const location = (server.system_info as Record<string, string>)?.location;

                      return (
                        <div
                          key={server.id}
                          className={`p-5 rounded-xl border transition-all ${
                            server.status === 'online'
                              ? 'bg-emerald-500/5 border-emerald-500/30'
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-3 rounded-xl ${
                                  server.status === 'online' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                                }`}
                              >
                                {server.status === 'online' ? (
                                  <Wifi className="w-6 h-6 text-emerald-400" />
                                ) : (
                                  <WifiOff className="w-6 h-6 text-red-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-lg">{server.name}</p>
                                <p className="text-sm text-white/50 font-mono">
                                  {server.ip_address || 'لم يتم تحديد IP'}
                                </p>
                                {location && (
                                  <p className="text-xs text-white/40 flex items-center gap-1 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    {location}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span
                              className={`badge ${
                                server.status === 'online' ? 'badge-success' : 'badge-danger'
                              }`}
                            >
                              {server.status === 'online' ? 'متصل' : 'غير متصل'}
                            </span>
                          </div>

                          {server.version && (
                            <p className="text-xs text-white/40 mb-4">الاصدار: {server.version}</p>
                          )}

                          {status && (
                            <div className="grid grid-cols-3 gap-3 mb-4">
                              <div className="p-3 bg-black/20 rounded-lg text-center">
                                <p className="text-xl font-bold text-stc-gold">{status.cameras}</p>
                                <p className="text-xs text-white/50">كاميرات</p>
                              </div>
                              <div className="p-3 bg-black/20 rounded-lg text-center">
                                <p className="text-xl font-bold text-emerald-400">{status.integrations}</p>
                                <p className="text-xs text-white/50">تكاملات</p>
                              </div>
                              <div className="p-3 bg-black/20 rounded-lg text-center">
                                <p className="text-xl font-bold text-blue-400">{status.modules.length}</p>
                                <p className="text-xs text-white/50">وحدات AI</p>
                              </div>
                            </div>
                          )}

                          {canManage && (
                            <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                              {server.ip_address && (
                                <>
                                  <button
                                    onClick={() => testServerConnection(server)}
                                    disabled={testingServer === server.id}
                                    className="btn-secondary flex-1 flex items-center justify-center gap-2"
                                  >
                                    <RefreshCw
                                      className={`w-4 h-4 ${
                                        testingServer === server.id ? 'animate-spin' : ''
                                      }`}
                                    />
                                    <span>اختبار</span>
                                  </button>
                                  {server.status === 'online' && (
                                    <button
                                      onClick={() => forceSync(server)}
                                      disabled={syncingServer === server.id}
                                      className="btn-secondary flex-1 flex items-center justify-center gap-2"
                                    >
                                      <Activity
                                        className={`w-4 h-4 ${
                                          syncingServer === server.id ? 'animate-pulse' : ''
                                        }`}
                                      />
                                      <span>مزامنة</span>
                                    </button>
                                  )}
                                </>
                              )}
                              <button
                                onClick={() => editServer(server)}
                                className="p-2 hover:bg-white/10 rounded-lg"
                              >
                                <SettingsIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteServer(server.id)}
                                className="p-2 hover:bg-red-500/20 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'priorities' && <AlertPrioritySettings />}
          {activeTab === 'security' && <SecuritySettings />}
        </div>
      </div>

      <Modal
        isOpen={showServerModal}
        onClose={() => {
          setShowServerModal(false);
          setEditingServer(null);
          setServerForm({ name: '', ip_address: '', location: '', license_id: '' });
        }}
        title={editingServer ? 'تعديل السيرفر' : 'اضافة سيرفر جديد'}
      >
        <form onSubmit={addServer} className="space-y-4">
          <div>
            <label className="label">اسم السيرفر</label>
            <input
              type="text"
              value={serverForm.name}
              onChange={(e) => setServerForm({ ...serverForm, name: e.target.value })}
              className="input"
              placeholder="مثال: سيرفر الفرع الرئيسي"
              required
            />
          </div>
          <div>
            <label className="label">عنوان IP</label>
            <input
              type="text"
              value={serverForm.ip_address}
              onChange={(e) => setServerForm({ ...serverForm, ip_address: e.target.value })}
              className="input"
              dir="ltr"
              placeholder="192.168.1.100"
            />
          </div>
          <div>
            <label className="label">الموقع / الفرع</label>
            <input
              type="text"
              value={serverForm.location}
              onChange={(e) => setServerForm({ ...serverForm, location: e.target.value })}
              className="input"
              placeholder="مثال: المبنى الرئيسي - الطابق الاول"
            />
          </div>
          <div>
            <label className="label flex items-center gap-2">
              <Key className="w-4 h-4" />
              الترخيص (اختياري)
            </label>
            {loadingLicenses ? (
              <div className="input flex items-center justify-center py-2">
                <div className="w-4 h-4 border-2 border-stc-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <select
                value={serverForm.license_id}
                onChange={(e) => setServerForm({ ...serverForm, license_id: e.target.value })}
                className="input"
              >
                <option value="">-- اختر ترخيص (اختياري) --</option>
                {availableLicenses.map((license) => (
                  <option key={license.id} value={license.id}>
                    {license.license_key} - {license.plan} ({license.max_cameras} كاميرات)
                  </option>
                ))}
              </select>
            )}
            {availableLicenses.length === 0 && !loadingLicenses && (
              <p className="text-xs text-white/50 mt-1">
                لا توجد تراخيص متاحة غير مربوطة. يمكنك إضافة السيرفر بدون ترخيص وربطه لاحقاً.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setShowServerModal(false);
                setEditingServer(null);
              }}
              className="btn-secondary"
            >
              الغاء
            </button>
            <button type="submit" className="btn-primary">
              {editingServer ? 'حفظ التعديلات' : 'اضافة'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
