import { apiClient } from '../apiClient';

export interface FreeTrialRequest {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  message?: string;
  selected_modules?: string[];
  status: 'new' | 'contacted' | 'demo_scheduled' | 'demo_completed' | 'converted' | 'rejected';
  admin_notes?: string;
  assigned_admin_id?: number;
  converted_organization_id?: number;
  contacted_at?: string;
  demo_scheduled_at?: string;
  demo_completed_at?: string;
  converted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFreeTrialRequest {
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  message?: string;
  selected_modules?: string[];
}

export interface UpdateFreeTrialRequest {
  status?: FreeTrialRequest['status'];
  admin_notes?: string;
  assigned_admin_id?: number;
}

export const freeTrialApi = {
  // Public: Create free trial request
  create: async (data: CreateFreeTrialRequest): Promise<{ success: boolean; message: string; request_id?: number }> => {
    const response = await apiClient.post<{ message: string; success: boolean; request_id?: number }>('/public/free-trial', data);
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to create free trial request');
    }
    return response.data;
  },

  // Get available modules for selection
  getAvailableModules: async (): Promise<Array<{ key: string; name: string; description: string; category: string }>> => {
    const response = await apiClient.get<Array<{ key: string; name: string; description: string; category: string }>>('/public/free-trial/modules');
    if (response.error || !response.data) {
      return [];
    }
    return Array.isArray(response.data) ? response.data : [];
  },

  // Super Admin: List all requests
  list: async (params?: { status?: string; assigned_admin_id?: number }): Promise<FreeTrialRequest[]> => {
    // TASK 1.C: Use get method with params for proper query string handling
    const response = await apiClient.get<FreeTrialRequest[]>('/free-trial-requests', params);
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to load free trial requests');
    }
    return Array.isArray(response.data) ? response.data : [];
  },

  // Super Admin: Get single request
  get: async (id: number): Promise<FreeTrialRequest> => {
    const response = await apiClient.get<FreeTrialRequest>(`/free-trial-requests/${id}`);
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to load free trial request');
    }
    return response.data;
  },

  // Super Admin: Update request
  update: async (id: number, data: UpdateFreeTrialRequest): Promise<FreeTrialRequest> => {
    const response = await apiClient.put<FreeTrialRequest>(`/free-trial-requests/${id}`, data);
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to update free trial request');
    }
    return response.data;
  },

  // Super Admin: Create organization from request
  createOrganization: async (id: number): Promise<{ organization: any; message: string }> => {
    const response = await apiClient.post<{ organization: any; message: string }>(`/free-trial-requests/${id}/create-organization`);
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to create organization');
    }
    return response.data;
  },
};
