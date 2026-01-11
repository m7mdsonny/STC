import { API_BASE_URL, apiClient } from '../apiClient';

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
    try {
      // CRITICAL FIX: Use proper error handling and response parsing
      const response = await apiClient.post<SystemBackup>('/backups', {
        description,
      });
      
      // Check for errors first
      if (response.error) {
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : (response.error?.message || 'Failed to create backup');
        throw new Error(errorMsg);
      }
      
      // Check if data exists
      if (!response.data) {
        // If no error but no data, check httpStatus
        if (response.httpStatus && response.httpStatus >= 400) {
          throw new Error(`Server returned status ${response.httpStatus}`);
        }
        throw new Error('No data received from server');
      }
      
      // Ensure file_path is string and add missing fields
      const backup = response.data;
      return {
        id: backup.id,
        file_path: typeof backup.file_path === 'string' 
          ? backup.file_path 
          : String(backup.file_path || 'backup.sql'),
        status: backup.status || 'completed',
        meta: backup.meta || {},
        created_by: backup.created_by,
        restored_at: backup.restored_at,
        restored_by: backup.restored_by,
        created_at: backup.created_at || new Date().toISOString(),
        updated_at: backup.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      // Re-throw with better error message
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create backup: ' + String(error));
    }
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
    const response = await fetch(`${API_BASE_URL}/backups/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || ''}`,
      },
    });
    if (!response.ok) throw new Error('Download failed');
    return response.blob();
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/backups/${id}`);
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to delete backup');
    }
    return response.data;
  },
};
