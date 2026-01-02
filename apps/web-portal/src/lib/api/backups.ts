import { apiClient } from '../apiClient';

export interface SystemBackup {
  id: number;
  file_path: string;
  status: string;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export const backupsApi = {
  async list(): Promise<SystemBackup[]> {
    const response = await apiClient.get<SystemBackup[]>('/api/v1/backups');
    return Array.isArray(response.data) ? response.data : [];
  },

  async create(): Promise<SystemBackup> {
    const response = await apiClient.post<SystemBackup>('/api/v1/backups');
    return response.data;
  },

  async restore(id: number): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`/api/v1/backups/${id}/restore`);
    return response.data;
  },
};
