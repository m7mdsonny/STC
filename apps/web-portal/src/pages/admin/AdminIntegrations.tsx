import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Building2, Server, Search, Filter, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { integrationsApi, organizationsApi, edgeServersApi } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import type { Integration, Organization, EdgeServer } from '../../types/database';

const INTEGRATION_TYPES = [
  { id: 'arduino', name: 'Arduino', description: 'اردوينو للتحكم بالاجهزة' },
  { id: 'raspberry_gpio', name: 'Raspberry Pi GPIO', description: 'منافذ GPIO للتحكم المباشر' },
  { id: 'modbus_tcp', name: 'Modbus TCP', description: 'بروتوكول صناعي للتحكم' },
  { id: 'http_rest', name: 'HTTP REST', description: 'واجهة برمجة HTTP' },
  { id: 'mqtt', name: 'MQTT', description: 'بروتوكول IoT للرسائل' },
  { id: 'tcp_socket', name: 'TCP Socket', description: 'اتصال TCP مباشر' },
];

interface IntegrationWithOrg extends Integration {
  organization?: Organization;
  edge_server?: EdgeServer;
}

export function AdminIntegrations() {
  const [integrations, setIntegrations] = useState<IntegrationWithOrg[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [edgeServers, setEdgeServers] = useState<EdgeServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrg, setFilterOrg] = useState<string>('');
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const [form, setForm] = useState({
    organization_id: '',
    edge_server_id: '',
    name: '',
    type: 'http_rest' as Integration['type'],
    connection_config: {
      host: '',
      port: '',
      topic: '',
      endpoint: '',
      api_key: '',
      device_id: '',
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [integrationsRes, orgsRes, serversRes] = await Promise.all([
        integrationsApi.getIntegrations(),
        organizationsApi.getOrganizations(),
        edgeServersApi.getEdgeServers(),
      ]);

      setIntegrations(integrationsRes.data);
      setOrganizations(orgsRes.data);
      setEdgeServers(serversRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServers = form.organization_id
    ? edgeServers.filter(s => s.organization_id === form.organization_id)
    : [];

  const addIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.organization_id || !form.edge_server_id || !form.name.trim()) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      await integrationsApi.createIntegration({
        name: form.name,
        type: form.type,
        organization_id: form.organization_id,
        edge_server_id: form.edge_server_id,
        connection_config: form.connection_config,
      });

      setShowModal(false);
      resetForm();
      await fetchData();
    } catch (error) {
      console.error('Error creating integration:', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ في إنشاء التكامل');
    }
  };

  const resetForm = () => {
    setForm({
      organization_id: '',
      edge_server_id: '',
      name: '',
      type: 'http_rest',
      connection_config: { host: '', port: '', topic: '', endpoint: '', api_key: '', device_id: '' },
    });
  };

  const toggleIntegration = async (integration: Integration) => {
    try {
      await integrationsApi.toggleActive(integration.id);
      fetchData();
    } catch (error) {
      console.error('Error toggling integration:', error);
    }
  };

  const deleteIntegration = async (id: string) => {
    if (!confirm('هل انت متاكد من حذف هذا التكامل؟')) return;
    try {
      await integrationsApi.deleteIntegration(id);
      await fetchData();
      alert('تم حذف التكامل بنجاح');
    } catch (error) {
      console.error('Error deleting integration:', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ في حذف التكامل');
    }
  };

  const testConnection = async (integration: Integration) => {
    setTestingConnection(integration.id);
    try {
      const result = await integrationsApi.testConnection(integration.id);
      setTestResults({
        ...testResults,
        [integration.id]: {
          success: result.success,
          message: result.message,
        },
      });
      
      if (result.success) {
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResults({
        ...testResults,
        [integration.id]: {
          success: false,
          message: error instanceof Error ? error.message : 'فشل اختبار الاتصال',
        },
      });
      alert(`❌ فشل اختبار الاتصال: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setTestingConnection(null);
    }
  };

  const getIntegrationConfig = () => {
    switch (form.type) {
      case 'mqtt':
        return ['host', 'port', 'topic', 'api_key'];
      case 'http_rest':
        return ['endpoint', 'api_key'];
      case 'modbus_tcp':
        return ['host', 'port', 'device_id'];
      case 'tcp_socket':
        return ['host', 'port'];
      case 'arduino':
        return ['port', 'device_id'];
      case 'raspberry_gpio':
        return ['device_id'];
      default:
        return [];
    }
  };

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.organization?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrg = !filterOrg || integration.organization_id === filterOrg;
    return matchesSearch && matchesOrg;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ادارة التكاملات</h1>
          <p className="text-white/60">ادارة تكاملات العملاء مع الانظمة الخارجية</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span>اضافة تكامل</span>
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pr-10 w-full"
              placeholder="بحث بالاسم او المؤسسة..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-white/40" />
            <select
              value={filterOrg}
              onChange={(e) => setFilterOrg(e.target.value)}
              className="input"
            >
              <option value="">كل المؤسسات</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredIntegrations.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <Key className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">لا توجد تكاملات</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredIntegrations.map((integration) => {
              const type = INTEGRATION_TYPES.find(t => t.id === integration.type);
              return (
                <div key={integration.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${integration.is_active ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                      <div>
                        <p className="font-semibold">{integration.name}</p>
                        <p className="text-sm text-white/50">{type?.name} - {type?.description}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-white/40">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {integration.organization?.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Server className="w-3 h-3" />
                            {integration.edge_server?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => testConnection(integration)}
                        disabled={testingConnection === integration.id}
                        className={`p-2 rounded-lg transition-colors ${
                          testingConnection === integration.id
                            ? 'bg-blue-500/20 cursor-wait'
                            : testResults[integration.id]?.success
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30'
                            : testResults[integration.id]
                            ? 'bg-red-500/20 hover:bg-red-500/30'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                        title="اختبار الاتصال"
                      >
                        {testingConnection === integration.id ? (
                          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        ) : testResults[integration.id]?.success ? (
                          <Wifi className="w-4 h-4 text-emerald-400" />
                        ) : testResults[integration.id] ? (
                          <WifiOff className="w-4 h-4 text-red-400" />
                        ) : (
                          <Wifi className="w-4 h-4 text-white/60" />
                        )}
                      </button>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={integration.is_active}
                          onChange={() => toggleIntegration(integration)}
                        />
                        <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stc-gold"></div>
                      </label>
                      <button onClick={() => deleteIntegration(integration.id)} className="p-2 hover:bg-red-500/20 rounded-lg">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title="اضافة تكامل جديد">
        <form onSubmit={addIntegration} className="space-y-4">
          <div>
            <label className="label">المؤسسة</label>
            <select
              value={form.organization_id}
              onChange={(e) => setForm({ ...form, organization_id: e.target.value, edge_server_id: '' })}
              className="input"
              required
            >
              <option value="">اختر المؤسسة</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">السيرفر</label>
            <select
              value={form.edge_server_id}
              onChange={(e) => setForm({ ...form, edge_server_id: e.target.value })}
              className="input"
              required
              disabled={!form.organization_id}
            >
              <option value="">اختر السيرفر</option>
              {filteredServers.map(server => (
                <option key={server.id} value={server.id}>{server.name}</option>
              ))}
            </select>
            {form.organization_id && filteredServers.length === 0 && (
              <p className="text-sm text-amber-400 mt-1">لا توجد سيرفرات لهذه المؤسسة</p>
            )}
          </div>

          <div>
            <label className="label">اسم التكامل</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="مثال: بوابة الدخول الرئيسية"
              required
            />
          </div>

          <div>
            <label className="label">نوع التكامل</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Integration['type'] })}
              className="input"
            >
              {INTEGRATION_TYPES.map(type => (
                <option key={type.id} value={type.id}>{type.name} - {type.description}</option>
              ))}
            </select>
          </div>

          {getIntegrationConfig().map(field => (
            <div key={field}>
              <label className="label">
                {field === 'host' ? 'عنوان المضيف (Host)' :
                 field === 'port' ? 'المنفذ (Port)' :
                 field === 'api_key' ? 'مفتاح API' :
                 field === 'device_id' ? 'معرف الجهاز' :
                 field === 'topic' ? 'الموضوع (Topic)' :
                 field === 'endpoint' ? 'نقطة النهاية (Endpoint)' : field}
              </label>
              <input
                type={field === 'api_key' ? 'password' : 'text'}
                value={form.connection_config[field as keyof typeof form.connection_config] || ''}
                onChange={(e) => setForm({
                  ...form,
                  connection_config: { ...form.connection_config, [field]: e.target.value },
                })}
                className="input"
                dir="ltr"
                placeholder={field === 'host' ? '192.168.1.100' :
                             field === 'port' ? '8080' :
                             field === 'api_key' ? 'أدخل مفتاح API' :
                             field === 'device_id' ? 'device-001' :
                             field === 'topic' ? '/sensors/temperature' :
                             field === 'endpoint' ? 'https://api.example.com/webhook' : ''}
              />
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary">الغاء</button>
            <button type="submit" className="btn-primary">اضافة</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
