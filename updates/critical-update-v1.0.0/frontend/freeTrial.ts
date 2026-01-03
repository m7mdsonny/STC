import apiClient from './client';

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
    const response = await apiClient.request<{ message: string; success: boolean; request_id?: number }>({
      method: 'POST',
      url: '/public/free-trial',
      data,
    });
    return response;
  },

  // Get available modules for selection
  getAvailableModules: async (): Promise<string[]> => {
    const response = await apiClient.request<{ modules: string[] }>({
      method: 'GET',
      url: '/public/free-trial/modules',
    });
    return response.modules || [];
  },

  // Super Admin: List all requests
  list: async (params?: { status?: string; assigned_admin_id?: number }): Promise<FreeTrialRequest[]> => {
    const response = await apiClient.request<FreeTrialRequest[]>({
      method: 'GET',
      url: '/free-trial-requests',
      params,
    });
    return response;
  },

  // Super Admin: Get single request
  get: async (id: number): Promise<FreeTrialRequest> => {
    const response = await apiClient.request<FreeTrialRequest>({
      method: 'GET',
      url: `/free-trial-requests/${id}`,
    });
    return response;
  },

  // Super Admin: Update request
  update: async (id: number, data: UpdateFreeTrialRequest): Promise<FreeTrialRequest> => {
    const response = await apiClient.request<FreeTrialRequest>({
      method: 'PUT',
      url: `/free-trial-requests/${id}`,
      data,
    });
    return response;
  },

  // Super Admin: Create organization from request
  createOrganization: async (id: number): Promise<{ organization: any; message: string }> => {
    const response = await apiClient.request<{ organization: any; message: string }>({
      method: 'POST',
      url: `/free-trial-requests/${id}/create-organization`,
    });
    return response;
  },
};
