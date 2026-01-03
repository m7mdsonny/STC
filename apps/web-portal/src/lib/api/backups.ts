import { apiClient } from '../apiClient';

export interface SystemBackup {
  id: number;
  file_path: string;
  status: string;
  meta?: {
    description?: string;
    file_size?: number;
    created_at?: string;
  };
  created_by?: number;
  restored_at?: string;
  restored_by?: number;
  created_at: string;
  updated_at: string;
}

export const backupsApi = {
  list: async (): Promise<SystemBackup[]> => {
    const response = await apiClient.request<SystemBackup[]>({
      method: 'GET',
      url: '/backups',
    });
    return response;
  },

  create: async (description?: string): Promise<SystemBackup> => {
    const response = await apiClient.request<SystemBackup>({
      method: 'POST',
      url: '/backups',
      data: {
        description,
      },
    });
    return response;
  },

  restore: async (id: number, confirmed: boolean = false): Promise<{ message: string }> => {
    // CRITICAL FIX: Send confirmed parameter (required by backend)
    const response = await apiClient.request<{ message: string }>({
      method: 'POST',
      url: `/backups/${id}/restore`,
      data: {
        confirmed,
      },
    });
    return response;
  },

  download: async (id: number): Promise<Blob> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/backups/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    if (!response.ok) throw new Error('Download failed');
    return response.blob();
  },
};
