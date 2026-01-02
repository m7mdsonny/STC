import { apiClient, type PaginatedResponse } from '../apiClient';
import type { Alert, AlertSeverity, AlertStatus } from '../../types/database';

interface AlertFilters {
  status?: AlertStatus;
  severity?: AlertSeverity;
  module?: string;
  camera_id?: string;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}

export const alertsApi = {
  async getAlerts(filters: AlertFilters = {}): Promise<PaginatedResponse<Alert>> {
    const { data, error } = await apiClient.get<PaginatedResponse<Alert>>('/alerts', filters as Record<string, string | number>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch alerts');
    }
    return data;
  },

  async getAlert(id: string): Promise<Alert> {
    const { data, error } = await apiClient.get<Alert>(`/alerts/${id}`);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch alert');
    }
    return data;
  },

  async acknowledgeAlert(id: string): Promise<Alert> {
    const { data, error } = await apiClient.post<Alert>(`/alerts/${id}/acknowledge`);
    if (error || !data) {
      throw new Error(error || 'Failed to acknowledge alert');
    }
    return data;
  },

  async resolveAlert(id: string): Promise<Alert> {
    const { data, error } = await apiClient.post<Alert>(`/alerts/${id}/resolve`);
    if (error || !data) {
      throw new Error(error || 'Failed to resolve alert');
    }
    return data;
  },

  async markFalseAlarm(id: string): Promise<Alert> {
    const { data, error } = await apiClient.post<Alert>(`/alerts/${id}/false-alarm`);
    if (error || !data) {
      throw new Error(error || 'Failed to mark as false alarm');
    }
    return data;
  },

  async bulkAcknowledge(ids: string[]): Promise<void> {
    const { error } = await apiClient.post('/alerts/bulk-acknowledge', { ids });
    if (error) {
      throw new Error(error);
    }
  },

  async bulkResolve(ids: string[]): Promise<void> {
    const { error } = await apiClient.post('/alerts/bulk-resolve', { ids });
    if (error) {
      throw new Error(error);
    }
  },
};
