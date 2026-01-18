import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Building2, Bell, Shield, Server, Plus, Trash2, RefreshCw, Wifi, WifiOff, Activity, AlertTriangle, MapPin, Key, Info } from 'lucide-react';
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
  const { organization, profile, canManage } = useAuth();
  const { showSuccess, showError } = useToast();
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
      // CRITICAL FIX: Ensure we get the actual array from paginated response
      const serversList = Array.isArray(result.data) ? result.data : (result.data?.data || []);
      setServers(serversList);
    } catch (error) {
      console.error('Failed to fetch edge servers:', error);
      showError('خطأ في التحميل', 'فشل تحميل قائمة السيرفرات');
    } finally {
      setLoading(false);
    }
  };

  const fetchLicenses = async () => {
    if (!organization) {
      console.warn('[Settings] Cannot fetch licenses: organization is missing');
      setAvailableLicenses([]);
      return;
    }
    setLoadingLicenses(true);
    try {
      // CRITICAL: licensesApi.getLicenses returns PaginatedResponse<License>
      // which has structure: { data: License[], total: number, ... }
      const paginatedResponse = await licensesApi.getLicenses({
        per_page: 100,
        // Note: organization_id filter is handled by backend based on user's organization_id
        // We don't need to pass it explicitly - backend will filter automatically
      });
      
      // Extract licenses array from paginated response
      // paginatedResponse structure: { data: License[], total: number, ... }
      const licensesList: License[] = paginatedResponse.data || [];
      
      console.log('[Settings] License fetch response', { 
        totalFromApi: paginatedResponse.total,
        licensesCount: licensesList.length,
        organizationId: organization.id,
        sampleLicense: licensesList[0] || null
      });
      
      // Filter to show only active licenses that are not bound to an edge server
      const unboundLicenses = licensesList.filter(
        (license) => {
          const isActive = license.status === 'active';
          const isUnbound = !license.edge_server_id;
          const belongsToOrg = license.organization_id === organization.id;
          
          return isActive && isUnbound && belongsToOrg;
        }
      );
      
      setAvailableLicenses(unboundLicenses);
      console.log('[Settings] Loaded licenses', { 
        total: licensesList.length, 
        unbound: unboundLicenses.length,
        organizationId: organization.id,
        unboundLicenseIds: unboundLicenses.map(l => l.id)
      });
    } catch (error: any) {
      console.error('[Settings] Failed to fetch licenses:', error);
      console.error('[Settings] Error details:', {
        message: error?.message,
        stack: error?.stack,
        response: error?.response
      });
      showError('خطأ في التحميل', 'فشل تحميل قائمة التراخيص. تأكد من وجود تراخيص نشطة للمؤسسة.');
      setAvailableLicenses([]); // Set empty array on error
    } finally {
      setLoadingLicenses(false);
    }
  };

  const addServer = async (e: React.FormEvent) => {
    e.preventDefault();
    const orgId = organization?.id || profile?.organization_id;

    if (!orgId) {
      console.error('[Settings] cannot submit edge server form: missing organization context', {
        organization,
        profile,
      });
      showError('بيانات المؤسسة مفقودة', 'لا يمكن إضافة السيرفر لأن بيانات المؤسسة غير متاحة. يرجى إعادة تسجيل الدخول ثم المحاولة مرة أخرى.');
      return;
    }

    if (!serverForm.name.trim()) {
      alert('يرجى إدخال اسم السيرفر');
      return;
    }

    console.log('[Settings] submit edge server form', {
      ...serverForm,
      editingServerId: editingServer?.id,
      organizationId: orgId,
    });

    try {
      if (editingServer) {
        await edgeServersApi.updateEdgeServer(editingServer.id, {
          name: serverForm.name,
          location: serverForm.location || undefined,
          // NOTE: IP address removed - Edge Server connects to Cloud via API + License Key
          // Edge Server registers itself via heartbeat endpoint, Cloud never connects to Edge
        });
        showSuccess('تم التحديث بنجاح', `تم تحديث بيانات السيرفر ${serverForm.name} بنجاح`);
      } else {
        const newServer = await edgeServersApi.createEdgeServer({
          organization_id: orgId,
          name: serverForm.name,
          location: serverForm.location || undefined,
          // NOTE: IP address removed - Edge Server connects to Cloud via API + License Key
          // Edge Server registers itself via heartbeat endpoint with license_id
          license_id: serverForm.license_id || undefined,
        });
        console.log('[Settings] edge server created', newServer);
        showSuccess(
          'تم الإضافة بنجاح',
          `تم إضافة السيرفر ${serverForm.name} بنجاح.\n\n${newServer.license ? `✅ تم ربطه بالترخيص: ${newServer.license.license_key}\n\n` : '⚠️ لم يتم ربط ترخيص - يرجى ربط ترخيص لاحقاً من صفحة الترخيصات\n\n'}` +
          `📋 الخطوات التالية:\n` +
          `1. افتح صفحة Setup في Edge Server (http://localhost:8080/setup)\n` +
          `2. أدخل Cloud API URL و License Key\n` +
          `3. Edge Server سيتم ربطه تلقائياً عند إرسال heartbeat\n\n` +
          `💡 ملاحظة: Edge Server سيتم ربطه تلقائياً عند إرسال heartbeat باستخدام License Key.`
        );
      }

      setShowServerModal(false);
      setServerForm({ name: '', location: '', license_id: '' });
      setEditingServer(null);
      // CRITICAL FIX: Force refresh immediately after creation
      await fetchData();
      await fetchLicenses(); // Refresh licenses after creating server
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
      location: (server.system_info as Record<string, string>)?.location || server.location || '',
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

  const checkServerStatus = async (server: EdgeServer) => {
    setTestingServer(server.id);
    try {
      // Check Edge Server status via Cloud API (NOT direct connection)
      // Edge status is derived from last heartbeat timestamp
      // NOTE: We don't test direct connection because Edge is behind NAT
      const status = await edgeServersApi.getStatus(server.id);
      setServerStatuses(prev => ({ 
        ...prev, 
        [server.id]: {
          status: status.online ? 'online' : 'offline',
          server_id: server.id.toString(),
          organization_id: status.organization_id.toString(),
          version: status.version || 'unknown',
          timestamp: status.last_seen_at || new Date().toISOString(),
          cameras: status.cameras_count,
          integrations: 0, // Not available from Cloud API
          modules: status.license.modules || [],
        }
      }));

      if (status.online) {
        // Edge is online (reporting heartbeat)
        const lastSeen = status.last_seen_at 
          ? new Date(status.last_seen_at).toLocaleString('ar-EG')
          : 'غير متوفر';
        showSuccess(
          'السيرفر متصل', 
          `السيرفر ${server.name} متصل ويعمل بشكل طبيعي.\nآخر heartbeat: ${lastSeen}\nالنسخة: ${status.version || 'غير معروف'}\nالكاميرات: ${status.cameras_count}`
        );
      } else {
        showError(
          'السيرفر غير متصل', 
          `السيرفر ${server.name} غير متصل.\n\nتأكد من:\n1. تشغيل Edge Server\n2. تكوين License Key في Edge Server\n3. أن Edge Server يرسل heartbeat إلى Cloud API`
        );
      }

      fetchData();
    } catch (error) {
      console.error('Failed to check server status:', error);
      const { title, message } = getDetailedErrorMessage(error, 'فحص الحالة', 'فشل فحص حالة السيرفر. يرجى المحاولة مرة أخرى');
      showError(title, message);
    } finally {
      setTestingServer(null);
    }
  };

  const forceSync = async (server: EdgeServer) => {
    // NOTE: Sync config is queued in Cloud database
    // Edge Server polls for config changes via heartbeat response
    // No direct connection needed
    
    setSyncingServer(server.id);
    try {
      // Call Cloud API to sync config (this will also sync cameras)
      const result = await edgeServersApi.syncConfig(server.id);
      
      if (result.cameras_synced !== undefined) {
        showSuccess(
          'تمت المزامنة بنجاح',
          `تمت مزامنة ${result.cameras_synced} من ${result.total_cameras} كاميرا بنجاح`
        );
      } else {
        showSuccess('تمت المزامنة', result.message || 'تم تسجيل طلب المزامنة. سيتم معالجته قريباً.');
      }
      
      // Refresh data after sync
      fetchData();
    } catch (error: any) {
      console.error('Failed to sync server:', error);
      const { title, message } = getDetailedErrorMessage(error, 'مزامنة السيرفر', 'حدث خطأ في مزامنة السيرفر');
      showError(title, message);
    } finally {
      setSyncingServer(null);
    }
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
                        setServerForm({ name: '', location: '', license_id: '' });
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
                        <div
                          key={server.id}
                          className={`p-5 rounded-xl border transition-all ${
                            isOnline
                              ? 'bg-emerald-500/5 border-emerald-500/30'
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-3 rounded-xl ${
                                  isOnline ? 'bg-emerald-500/20' : 'bg-red-500/20'
                                }`}
                              >
                                {isOnline ? (
                                  <Wifi className="w-6 h-6 text-emerald-400" />
                                ) : (
                                  <WifiOff className="w-6 h-6 text-red-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-lg">{server.name}</p>
                                {server.edge_id && (
                                  <p className="text-xs text-white/40 font-mono">
                                    Edge ID: {server.edge_id.substring(0, 8)}...
                                  </p>
                                )}
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
                                isOnline ? 'badge-success' : 'badge-danger'
                              }`}
                            >
                              {isOnline ? 'متصل' : 'غير متصل'}
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
                              <button
                                onClick={() => checkServerStatus(server)}
                                disabled={testingServer === server.id}
                                className="btn-secondary flex-1 flex items-center justify-center gap-2"
                              >
                                <RefreshCw
                                  className={`w-4 h-4 ${
                                    testingServer === server.id ? 'animate-spin' : ''
                                  }`}
                                />
                                <span>فحص الحالة</span>
                              </button>
                              {isOnline && (
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
          setServerForm({ name: '', location: '', license_id: '' });
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
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-300 flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>ملاحظة:</strong> السيرفر سيتم ربطه تلقائياً عند إرسال Heartbeat من Edge Server باستخدام License Key.
                لا حاجة لإدخال عنوان IP - Edge Server يتصل بالـ Cloud من تلقاء نفسه.
              </span>
            </p>
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
