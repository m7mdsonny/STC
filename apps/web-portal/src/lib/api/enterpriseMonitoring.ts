import { apiClient } from '../apiClient';

export interface AiScenario {
  id: number;
  module: 'market' | 'factory';
  scenario_type: string;
  name: string;
  description: string;
  enabled: boolean;
  severity_threshold: number;
  config?: Record<string, any>;
  rules: AiScenarioRule[];
  camera_bindings: AiCameraBinding[];
  created_at: string;
  updated_at: string;
}

export interface AiScenarioRule {
  id: number;
  rule_type: string;
  rule_value: Record<string, any>;
  weight: number;
  enabled: boolean;
  order: number;
}

export interface AiCameraBinding {
  id: number;
  camera_id: number;
  camera_name?: string;
  enabled: boolean;
  camera_specific_config?: Record<string, any>;
}

export interface AiAlertPolicy {
  id: number;
  risk_level: 'medium' | 'high' | 'critical';
  notify_web: boolean;
  notify_mobile: boolean;
  notify_email: boolean;
  notify_sms: boolean;
  cooldown_minutes: number;
  notification_channels?: Record<string, any>;
}

export const enterpriseMonitoringApi = {
  async getScenarios(filters?: { module?: 'market' | 'factory' }): Promise<AiScenario[]> {
    const params: Record<string, string> = {};
    if (filters?.module) {
      params.module = filters.module;
    }
    const { data, error } = await apiClient.get<AiScenario[]>('/ai-scenarios', params);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch scenarios');
    }
    return data;
  },

  async getScenario(scenarioId: number): Promise<AiScenario> {
    const { data, error } = await apiClient.get<AiScenario>(`/ai-scenarios/${scenarioId}`);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch scenario');
    }
    return data;
  },

  async updateScenario(scenarioId: number, updates: Partial<AiScenario>): Promise<AiScenario> {
    const { data, error } = await apiClient.put<AiScenario>(`/ai-scenarios/${scenarioId}`, updates);
    if (error || !data) {
      throw new Error(error || 'Failed to update scenario');
    }
    return data;
  },

  async updateRule(scenarioId: number, ruleId: number, updates: Partial<AiScenarioRule>): Promise<AiScenarioRule> {
    const { data, error } = await apiClient.put<AiScenarioRule>(`/ai-scenarios/${scenarioId}/rules/${ruleId}`, updates);
    if (error || !data) {
      throw new Error(error || 'Failed to update rule');
    }
    return data;
  },

  async bindCamera(scenarioId: number, cameraId: number, enabled: boolean = true, config?: Record<string, any>): Promise<AiCameraBinding> {
    const { data, error } = await apiClient.post<AiCameraBinding>(`/ai-scenarios/${scenarioId}/bind-camera`, {
      camera_id: cameraId,
      enabled,
      camera_specific_config: config,
    });
    if (error || !data) {
      throw new Error(error || 'Failed to bind camera');
    }
    return data;
  },

  async unbindCamera(scenarioId: number, cameraId: number): Promise<void> {
    const { error } = await apiClient.delete(`/ai-scenarios/${scenarioId}/cameras/${cameraId}`);
    if (error) {
      throw new Error(error || 'Failed to unbind camera');
    }
  },

  async getAlertPolicies(): Promise<AiAlertPolicy[]> {
    const { data, error } = await apiClient.get<AiAlertPolicy[]>('/ai-alert-policies');
    if (error || !data) {
      throw new Error(error || 'Failed to fetch alert policies');
    }
    return data;
  },

  async updateAlertPolicy(policyId: number, updates: Partial<AiAlertPolicy>): Promise<AiAlertPolicy> {
    const { data, error } = await apiClient.put<AiAlertPolicy>(`/ai-alert-policies/${policyId}`, updates);
    if (error || !data) {
      throw new Error(error || 'Failed to update alert policy');
    }
    return data;
  },
};
