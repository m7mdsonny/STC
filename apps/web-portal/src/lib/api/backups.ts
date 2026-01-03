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
    // CRITICAL FIX: Use get method and handle response properly
    const response = await apiClient.get<SystemBackup[]>('/backups');
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to load backups');
    }
    // Ensure all backups have file_path as string
    return (Array.isArray(response.data) ? response.data : []).map(backup => ({
      ...backup,
      file_path: typeof backup.file_path === 'string' ? backup.file_path : String(backup.file_path || 'backup.sql'),
    }));
  },

  create: async (description?: string): Promise<SystemBackup> => {
    const response = await apiClient.post<SystemBackup>('/backups', {
      description,
    });
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to create backup');
    }
    return response.data;
  },

  restore: async (id: number, confirmed: boolean = false): Promise<{ message: string }> => {
    // CRITICAL FIX: Send confirmed parameter (required by backend)
    const response = await apiClient.post<{ message: string }>(`/backups/${id}/restore`, {
      confirmed,
    });
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to restore backup');
    }
    return response.data;
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
