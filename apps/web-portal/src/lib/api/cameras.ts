import { apiClient, type PaginatedResponse } from '../apiClient';
import type { Camera, DeviceStatus } from '../../types/database';

interface CameraFilters {
  edge_server_id?: string;
  status?: DeviceStatus;
  page?: number;
  per_page?: number;
}

interface CreateCameraData {
  name: string;
  edge_server_id: string;
  rtsp_url: string; // RTSP URL: rtsp://ip:port/stream (credentials can be included in URL if needed)
  location?: string;
  resolution?: string;
  fps?: number;
  enabled_modules?: string[];
  organization_id?: string; // Required for super admin, auto-set for org users
}

export const camerasApi = {
  async getCameras(filters: CameraFilters = {}): Promise<PaginatedResponse<Camera>> {
    const { data, error } = await apiClient.get<PaginatedResponse<Camera>>('/cameras', filters as Record<string, string | number>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch cameras');
    }
    return data;
  },

  async getCamera(id: string): Promise<Camera> {
    const { data, error } = await apiClient.get<Camera>(`/cameras/${id}`);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch camera');
    }
    return data;
  },

  async createCamera(cameraData: CreateCameraData): Promise<Camera> {
    const { data, error } = await apiClient.post<Camera>('/cameras', cameraData);
    if (error || !data) {
      throw new Error(error || 'Failed to create camera');
    }
    return data;
  },

  async updateCamera(id: string, cameraData: Partial<CreateCameraData>): Promise<Camera> {
    const { data, error } = await apiClient.put<Camera>(`/cameras/${id}`, cameraData);
    if (error || !data) {
      throw new Error(error || 'Failed to update camera');
    }
    return data;
  },

  async deleteCamera(id: string): Promise<void> {
    const { error } = await apiClient.delete(`/cameras/${id}`);
    if (error) {
      throw new Error(error);
    }
  },

  async testConnection(rtspUrl: string): Promise<{ success: boolean; message: string }> {
    // RTSP URL: rtsp://ip:port/stream (credentials can be included in URL if needed)
    const { data, error } = await apiClient.post<{ success: boolean; message: string }>('/cameras/test-connection', {
      rtsp_url: rtspUrl,
    });
    if (error || !data) {
      throw new Error(error || 'Failed to test connection');
    }
    return data;
  },

  async getSnapshot(id: string): Promise<string> {
    const { data, error } = await apiClient.get<{ snapshot_url: string }>(`/cameras/${id}/snapshot`);
    if (error || !data) {
      throw new Error(error || 'Failed to get snapshot');
    }
    return data.snapshot_url;
  },

  async getStreamUrl(id: string): Promise<string | null> {
    try {
      const { data, error } = await apiClient.get<{ stream_url: string }>(`/cameras/${id}/stream`);
      if (error || !data) {
        return null;
      }
      return data.stream_url;
    } catch (error) {
      console.error(`Failed to get stream URL for camera ${id}:`, error);
      return null;
    }
  },
};
