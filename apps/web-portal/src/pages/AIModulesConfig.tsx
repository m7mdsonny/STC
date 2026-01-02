import { useState, useEffect } from 'react';
import {
  Brain,
  Search,
  Settings,
  Save,
  X,
  Flame,
  ShieldAlert,
  Users,
  Car,
  UserCheck,
  HardHat,
  Factory,
  Package,
  Waves,
  Lock,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { aiModulesApi } from '../lib/api/aiModules';
import { Modal } from '../components/ui/Modal';
import type { AiModule, AiModuleConfig } from '../lib/api/aiModules';

const moduleIcons: Record<string, any> = {
  fire_detection: Flame,
  intrusion_detection: ShieldAlert,
  face_recognition: UserCheck,
  vehicle_recognition: Car,
  crowd_detection: Users,
  ppe_detection: HardHat,
  production_monitoring: Factory,
  warehouse_monitoring: Package,
  drowning_detection: Waves,
};

export function AIModulesConfig() {
  const [modules, setModules] = useState<AiModule[]>([]);
  const [configs, setConfigs] = useState<AiModuleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configuringModule, setConfiguringModule] = useState<AiModule | null>(null);
  const [saving, setSaving] = useState(false);

  const [configForm, setConfigForm] = useState({
    confidence_threshold: 0.8,
    alert_threshold: 3,
    cooldown_seconds: 30,
    schedule_enabled: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [modulesData, configsData] = await Promise.all([
        aiModulesApi.getModules(),
        aiModulesApi.getOrganizationConfigs(),
      ]);
      setModules(modulesData.filter(m => m.is_enabled));
      setConfigs(configsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModuleConfig = (moduleId: number): AiModuleConfig | undefined => {
    return configs.find(c => c.module_id === moduleId);
  };

  const handleToggleModule = async (module: AiModule) => {
    try {
      const config = getModuleConfig(module.id);
      if (config?.is_enabled) {
        await aiModulesApi.disableModule(module.id);
      } else {
        await aiModulesApi.enableModule(module.id);
      }
      await fetchData();
    } catch (error) {
      console.error('Error toggling module:', error);
    }
  };

  const openConfigModal = (module: AiModule) => {
    const config = getModuleConfig(module.id);
    setConfiguringModule(module);
    setConfigForm({
      confidence_threshold: config?.confidence_threshold ?? 0.8,
      alert_threshold: config?.alert_threshold ?? 3,
      cooldown_seconds: config?.cooldown_seconds ?? 30,
      schedule_enabled: config?.schedule_enabled ?? false,
    });
    setShowConfigModal(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configuringModule) return;

    setSaving(true);
    try {
      await aiModulesApi.updateOrganizationConfig(configuringModule.id, configForm);
      setShowConfigModal(false);
      setConfiguringModule(null);
      await fetchData();
    } catch (error) {
      console.error('Error updating config:', error);
    } finally {
      setSaving(false);
    }
  };

  const filteredModules = modules.filter(module => {
    const config = getModuleConfig(module.id);
    const matchesSearch = module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.module_key.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'enabled') {
      matchesStatus = config?.is_enabled ?? false;
    } else if (statusFilter === 'disabled') {
      matchesStatus = !(config?.is_enabled ?? false);
    } else if (statusFilter === 'licensed') {
      matchesStatus = config?.is_licensed ?? false;
    }

    return matchesSearch && matchesStatus;
  });

  const stats = {
    available: modules.length,
    enabled: configs.filter(c => c.is_enabled).length,
    licensed: configs.filter(c => c.is_licensed).length,
    premium: modules.filter(m => m.is_premium).length,
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'security': return 'bg-red-500/20 text-red-400';
      case 'safety': return 'bg-orange-500/20 text-orange-400';
      case 'analytics': return 'bg-blue-500/20 text-blue-400';
      case 'operations': return 'bg-green-500/20 text-green-400';
      default: return 'bg-white/20 text-white/70';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">AI Modules Configuration</h1>
          <p className="text-white/60">Enable and configure AI modules for your organization</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
              <Brain className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.available}</p>
              <p className="text-sm text-white/60">Available</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.enabled}</p>
              <p className="text-sm text-white/60">Enabled</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
              <Lock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.licensed}</p>
              <p className="text-sm text-white/60">Licensed</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5">
              <Brain className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.premium}</p>
              <p className="text-sm text-white/60">Premium</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-12 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Modules</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
            <option value="licensed">Licensed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="card p-12 text-center">
          <Brain className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No modules found</h3>
          <p className="text-white/60">No AI modules match your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredModules.map((module) => {
            const config = getModuleConfig(module.id);
            const Icon = moduleIcons[module.module_key] || Brain;
            const isEnabled = config?.is_enabled ?? false;
            const isLicensed = config?.is_licensed ?? false;

            return (
              <div key={module.id} className="card p-6 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${
                      isEnabled ? 'from-blue-500/20 to-blue-500/5' : 'from-white/10 to-white/5'
                    }`}>
                      <Icon className={`w-6 h-6 ${isEnabled ? 'text-blue-400' : 'text-white/40'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{module.name}</h3>
                      <p className="text-sm text-white/50 font-mono">{module.module_key}</p>
                    </div>
                  </div>
                  {isEnabled && (
                    <button
                      onClick={() => openConfigModal(module)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4 text-white/60" />
                    </button>
                  )}
                </div>

                <p className="text-white/70 text-sm mb-4 line-clamp-2">
                  {module.description || 'No description available'}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryBadgeColor(module.category)}`}>
                    {module.category}
                  </span>
                  {module.is_premium && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
                      Premium
                    </span>
                  )}
                  {isLicensed ? (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Licensed
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Not Licensed
                    </span>
                  )}
                </div>

                {config && isEnabled && (
                  <div className="mb-4 p-3 bg-white/5 rounded-lg space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Confidence Threshold:</span>
                      <span className="font-medium">{(config.confidence_threshold * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Alert Threshold:</span>
                      <span className="font-medium">{config.alert_threshold} events</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Cooldown:</span>
                      <span className="font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {config.cooldown_seconds}s
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-sm text-white/60">
                    Status: {isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => handleToggleModule(module)}
                    disabled={!isLicensed}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isEnabled ? 'bg-blue-500' : 'bg-white/20'
                    } ${!isLicensed ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {!isLicensed && (
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                    This module requires a valid license. Please contact your administrator.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showConfigModal}
        onClose={() => {
          setShowConfigModal(false);
          setConfiguringModule(null);
        }}
        title={`Configure ${configuringModule?.name || 'Module'}`}
      >
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div>
            <label className="label">Confidence Threshold</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={configForm.confidence_threshold}
                onChange={(e) => setConfigForm({ ...configForm, confidence_threshold: parseFloat(e.target.value) })}
                className="flex-1"
              />
              <span className="font-mono text-sm bg-white/10 px-3 py-1 rounded min-w-[60px] text-center">
                {(configForm.confidence_threshold * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-white/50 mt-1">
              Minimum confidence level required for detection
            </p>
          </div>

          <div>
            <label className="label">Alert Threshold</label>
            <input
              type="number"
              value={configForm.alert_threshold}
              onChange={(e) => setConfigForm({ ...configForm, alert_threshold: parseInt(e.target.value) })}
              className="input"
              min={1}
              max={100}
            />
            <p className="text-xs text-white/50 mt-1">
              Number of events before triggering an alert
            </p>
          </div>

          <div>
            <label className="label">Cooldown Period (seconds)</label>
            <input
              type="number"
              value={configForm.cooldown_seconds}
              onChange={(e) => setConfigForm({ ...configForm, cooldown_seconds: parseInt(e.target.value) })}
              className="input"
              min={0}
              max={3600}
            />
            <p className="text-xs text-white/50 mt-1">
              Time to wait between consecutive alerts
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={configForm.schedule_enabled}
                onChange={(e) => setConfigForm({ ...configForm, schedule_enabled: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-white/5"
              />
              <div>
                <p className="font-medium">Enable Schedule</p>
                <p className="text-sm text-white/50">Only run module during specific hours</p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowConfigModal(false)}
              className="btn-secondary flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
