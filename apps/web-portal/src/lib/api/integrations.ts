import { apiClient, type PaginatedResponse } from '../apiClient';
import type { Integration, IntegrationType } from '../../types/database';

interface IntegrationFilters {
  organization_id?: string;
  edge_server_id?: string;
  type?: IntegrationType;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

interface CreateIntegrationData {
  name: string;
  organization_id: string;
  edge_server_id: string;
  type: IntegrationType;
  connection_config: Record<string, unknown>;
}

interface TestResult {
  success: boolean;
  message: string;
  latency_ms?: number;
}

export const integrationsApi = {
  async getIntegrations(filters: IntegrationFilters = {}): Promise<PaginatedResponse<Integration>> {
    const { data, error } = await apiClient.get<PaginatedResponse<Integration>>('/integrations', filters as Record<string, string | number | boolean>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch integrations');
    }
    return data;
  },

  async getIntegration(id: string): Promise<Integration> {
    const { data, error } = await apiClient.get<Integration>(`/integrations/${id}`);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch integration');
    }
    return data;
  },

  async createIntegration(integrationData: CreateIntegrationData): Promise<Integration> {
    const { data, error } = await apiClient.post<Integration>('/integrations', integrationData);
    if (error || !data) {
      throw new Error(error || 'Failed to create integration');
    }
    return data;
  },

  async updateIntegration(id: string, integrationData: Partial<CreateIntegrationData>): Promise<Integration> {
    const { data, error } = await apiClient.put<Integration>(`/integrations/${id}`, integrationData);
    if (error || !data) {
      throw new Error(error || 'Failed to update integration');
    }
    return data;
  },

  async deleteIntegration(id: string): Promise<void> {
    const { error } = await apiClient.delete(`/integrations/${id}`);
    if (error) {
      throw new Error(error);
    }
  },

  async testConnection(id: string): Promise<TestResult> {
    const { data, error } = await apiClient.post<TestResult>(`/integrations/${id}/test`);
    if (error || !data) {
      throw new Error(error || 'Failed to test integration');
    }
    return data;
  },

  async toggleActive(id: string): Promise<Integration> {
    const { data, error } = await apiClient.post<Integration>(`/integrations/${id}/toggle-active`);
    if (error || !data) {
      throw new Error(error || 'Failed to toggle integration status');
    }
    return data;
  },

  async getAvailableTypes(): Promise<{ type: IntegrationType; name: string; description: string }[]> {
    const { data, error } = await apiClient.get<{ type: IntegrationType; name: string; description: string }[]>('/integrations/types');
    if (error || !data) {
      throw new Error(error || 'Failed to fetch integration types');
    }
    return data;
  },
};
