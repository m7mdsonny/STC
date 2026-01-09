import { apiClient } from '../apiClient';

export interface UpdateManifest {
  version: string;
  version_type: 'major' | 'minor' | 'patch' | 'hotfix';
  title: string;
  description?: string;
  release_notes?: string;
  changelog?: string;
  requires_version?: string;
  files?: Record<string, string>; // source => destination
  affected_modules?: string[];
  requires_manual_update?: boolean;
}

export interface SystemUpdate {
  id: string;
  path: string;
  manifest: UpdateManifest;
  installed: boolean;
}

export interface SystemUpdateResponse {
  current_version: string;
  updates: SystemUpdate[];
}

export const systemUpdatesApi = {
  async getUpdates(): Promise<SystemUpdateResponse> {
    try {
      const response = await apiClient.get<SystemUpdateResponse>('/system-updates');
      
      if (response.error) {
        console.error('API Error:', response.error);
        throw new Error(response.error);
      }
      
      if (!response.data) {
        console.warn('No data in response, returning empty updates');
        return {
          current_version: '1.0.0',
          updates: [],
        };
      }
      
      // Handle both direct data and nested data structure
      const data = response.data as any;
      
      // Direct structure
      if (data.current_version !== undefined && Array.isArray(data.updates)) {
        return {
          current_version: data.current_version || '1.0.0',
          updates: data.updates || [],
        };
      }
      
      // Nested structure
      if (data.data && data.data.current_version) {
        return {
          current_version: data.data.current_version || '1.0.0',
          updates: data.data.updates || [],
        };
      }
      
      // Fallback
      console.warn('Unexpected response structure:', data);
      return {
        current_version: '1.0.0',
        updates: [],
      };
    } catch (error) {
      console.error('Error fetching updates:', error);
      throw error;
    }
  },

  async getCurrentVersion(): Promise<string> {
    const { data, error } = await apiClient.get<{ version: string }>('/system-updates/current-version');
    if (error || !data) {
      throw new Error(error || 'Failed to get current version');
    }
    return data.version;
  },

  async uploadPackage(file: File): Promise<{ update_id: string; version: string; manifest: UpdateManifest }> {
    const formData = new FormData();
    formData.append('package', file);
    
    const response = await apiClient.post<{ 
      success: boolean;
      message: string;
      data: { update_id: string; version: string; manifest: UpdateManifest };
    }>('/system-updates/upload', formData);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    const data = response.data as any;
    
    // Handle different response structures
    if (data.data) {
      return data.data;
    }
    if (data.update_id && data.version) {
      return {
        update_id: data.update_id,
        version: data.version,
        manifest: data.manifest,
      };
    }
    
    throw new Error('Invalid response format from server');
  },

  async installUpdate(updateId: string): Promise<void> {
    const { error } = await apiClient.post(`/system-updates/${updateId}/install`);
    if (error) {
      throw new Error(error);
    }
  },

  async rollback(backupId: string): Promise<void> {
    const { error } = await apiClient.post(`/system-updates/rollback/${backupId}`);
    if (error) {
      throw new Error(error);
    }
  },
};

