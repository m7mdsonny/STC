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
  ip_address?: string;
  license_id?: string;
  organization_id?: string;
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
    console.log('[edgeServersApi] POST /edge-servers', serverData);
    const { data, error } = await apiClient.post<EdgeServer>('/edge-servers', serverData);
    console.log('[edgeServersApi] response /edge-servers', { data, error });
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

  async restart(id: string): Promise<{ message: string; edge_response?: any; warning?: string; note?: string }> {
    const { data, error } = await apiClient.post<{ message: string; edge_response?: any; warning?: string; note?: string }>(`/edge-servers/${id}/restart`);
    if (error || !data) {
      throw new Error(error || 'Failed to restart edge server');
    }
    return data;
  },

  async syncConfig(id: string): Promise<{ message: string; cameras_synced?: number; total_cameras?: number; edge_response?: any; warning?: string; note?: string }> {
    const { data, error } = await apiClient.post<{ message: string; cameras_synced?: number; total_cameras?: number; edge_response?: any; warning?: string; note?: string }>(`/edge-servers/${id}/sync-config`);
    if (error || !data) {
      throw new Error(error || 'Failed to sync edge server config');
    }
    return data;
  },

  async getConfig(id: string): Promise<Record<string, unknown>> {
    const { data, error } = await apiClient.get<Record<string, unknown>>(`/edge-servers/${id}/config`);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch config');
    }
    return data;
  },

  /**
   * Get Edge Server status from Cloud API (NOT from Edge directly)
   * Status is derived from last heartbeat timestamp stored in database
   */
  async getStatus(id: string): Promise<{
    online: boolean;
    last_seen_at: string | null;
    version: string | null;
    uptime: number | null;
    cameras_count: number;
    organization_id: number;
    license: {
      plan: string | null;
      max_cameras: number | null;
      modules: string[];
    };
    system_info: Record<string, unknown>;
  }> {
    const { data, error } = await apiClient.get<{
      online: boolean;
      last_seen_at: string | null;
      version: string | null;
      uptime: number | null;
      cameras_count: number;
      organization_id: number;
      license: {
        plan: string | null;
        max_cameras: number | null;
        modules: string[];
      };
      system_info: Record<string, unknown>;
    }>(`/edge-servers/${id}/status`);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch edge server status');
    }
    return data;
  },

  /**
   * Get cameras for an Edge Server from Cloud API (NOT from Edge directly)
   * Camera data is synced from Edge via heartbeat
   */
  async getCameras(id: string, filters: { status?: string; per_page?: number } = {}): Promise<PaginatedResponse<any>> {
    const { data, error } = await apiClient.get<PaginatedResponse<any>>(`/edge-servers/${id}/cameras`, filters as Record<string, string | number>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch cameras');
    }
    return data;
  },
};
