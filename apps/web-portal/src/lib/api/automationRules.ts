import { apiClient, type PaginatedResponse } from '../apiClient';
import type { AutomationRule, AutomationLog } from '../../types/database';

interface AutomationRuleFilters {
  organization_id?: string;
  integration_id?: string;
  trigger_module?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

interface CreateAutomationRuleData {
  name: string;
  name_ar?: string;
  description?: string;
  integration_id?: string;
  trigger_module: string;
  trigger_event: string;
  trigger_conditions?: Record<string, unknown>;
  action_type: string;
  action_command: Record<string, unknown>;
  cooldown_seconds?: number;
  priority?: number;
}

interface AutomationLogFilters {
  automation_rule_id?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}

export const automationRulesApi = {
  async getRules(filters: AutomationRuleFilters = {}): Promise<PaginatedResponse<AutomationRule>> {
    const { data, error } = await apiClient.get<PaginatedResponse<AutomationRule>>('/automation-rules', filters as Record<string, string | number | boolean>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch automation rules');
    }
    return data;
  },

  async getRule(id: string): Promise<AutomationRule> {
    const { data, error } = await apiClient.get<AutomationRule>(`/automation-rules/${id}`);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch automation rule');
    }
    return data;
  },

  async createRule(ruleData: CreateAutomationRuleData): Promise<AutomationRule> {
    const { data, error } = await apiClient.post<AutomationRule>('/automation-rules', ruleData);
    if (error || !data) {
      throw new Error(error || 'Failed to create automation rule');
    }
    return data;
  },

  async updateRule(id: string, ruleData: Partial<CreateAutomationRuleData>): Promise<AutomationRule> {
    const { data, error } = await apiClient.put<AutomationRule>(`/automation-rules/${id}`, ruleData);
    if (error || !data) {
      throw new Error(error || 'Failed to update automation rule');
    }
    return data;
  },

  async deleteRule(id: string): Promise<void> {
    const { error } = await apiClient.delete(`/automation-rules/${id}`);
    if (error) {
      throw new Error(error);
    }
  },

  async toggleActive(id: string): Promise<AutomationRule> {
    const { data, error } = await apiClient.post<AutomationRule>(`/automation-rules/${id}/toggle-active`);
    if (error || !data) {
      throw new Error(error || 'Failed to toggle rule status');
    }
    return data;
  },

  async testRule(id: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await apiClient.post<{ success: boolean; message: string }>(`/automation-rules/${id}/test`);
    if (error || !data) {
      throw new Error(error || 'Failed to test rule');
    }
    return data;
  },

  async getLogs(filters: AutomationLogFilters = {}): Promise<PaginatedResponse<AutomationLog>> {
    const { data, error } = await apiClient.get<PaginatedResponse<AutomationLog>>('/automation-rules/logs', filters as Record<string, string | number | boolean>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch automation logs');
    }
    return data;
  },

  async getAvailableTriggers(): Promise<{ module: string; events: string[] }[]> {
    const { data, error } = await apiClient.get<{ module: string; events: string[] }[]>('/automation-rules/triggers');
    if (error || !data) {
      throw new Error(error || 'Failed to fetch available triggers');
    }
    return data;
  },

  async getAvailableActions(): Promise<{ type: string; name: string; icon: string }[]> {
    const { data, error } = await apiClient.get<{ type: string; name: string; icon: string }[]>('/automation-rules/actions');
    if (error || !data) {
      throw new Error(error || 'Failed to fetch available actions');
    }
    return data;
  },
};
