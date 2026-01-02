import { apiClient, type PaginatedResponse } from '../apiClient';
import type { EdgeServer, EdgeServerLog, DeviceStatus } from '../../types/database';

interface EdgeServerFilters {
  status?: DeviceStatus;
  page?: number;
  per_page?: number;
}

interface CreateEdgeServerData {
  name: string;
  location?: string;
  notes?: string;
  license_id?: string;
}

export const edgeServersApi = {
  async getEdgeServers(filters: EdgeServerFilters = {}): Promise<PaginatedResponse<EdgeServer>> {
    const { data, error } = await apiClient.get<PaginatedResponse<EdgeServer>>('/edge-servers', filters as Record<string, string | number>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch edge servers');
    }
    return data;
  },

  async getEdgeServer(id: string): Promise<EdgeServer> {
    const { data, error } = await apiClient.get<EdgeServer>(`/edge-servers/${id}`);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch edge server');
    }
    return data;
  },

  async createEdgeServer(serverData: CreateEdgeServerData): Promise<EdgeServer> {
    const { data, error } = await apiClient.post<EdgeServer>('/edge-servers', serverData);
    if (error || !data) {
      throw new Error(error || 'Failed to create edge server');
    }
    return data;
  },

  async updateEdgeServer(id: string, serverData: Partial<CreateEdgeServerData>): Promise<EdgeServer> {
    const { data, error } = await apiClient.put<EdgeServer>(`/edge-servers/${id}`, serverData);
    if (error || !data) {
      throw new Error(error || 'Failed to update edge server');
    }
    return data;
  },

  async deleteEdgeServer(id: string): Promise<void> {
    const { error } = await apiClient.delete(`/edge-servers/${id}`);
    if (error) {
      throw new Error(error);
    }
  },

  async getLogs(id: string, filters: { level?: string; from?: string; to?: string; page?: number } = {}): Promise<PaginatedResponse<EdgeServerLog>> {
    const { data, error } = await apiClient.get<PaginatedResponse<EdgeServerLog>>(`/edge-servers/${id}/logs`, filters as Record<string, string | number>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch logs');
    }
    return data;
  },

  async restart(id: string): Promise<void> {
    const { error } = await apiClient.post(`/edge-servers/${id}/restart`);
    if (error) {
      throw new Error(error);
    }
  },

  async syncConfig(id: string): Promise<void> {
    const { error } = await apiClient.post(`/edge-servers/${id}/sync-config`);
    if (error) {
      throw new Error(error);
    }
  },

  async getConfig(id: string): Promise<Record<string, unknown>> {
    const { data, error } = await apiClient.get<Record<string, unknown>>(`/edge-servers/${id}/config`);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch config');
    }
    return data;
  },
};
