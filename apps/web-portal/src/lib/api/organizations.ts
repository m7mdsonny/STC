import { apiClient, type PaginatedResponse } from '../apiClient';
import type { Organization, SubscriptionPlanType } from '../../types/database';

interface OrganizationFilters {
  is_active?: boolean;
  subscription_plan?: SubscriptionPlanType;
  reseller_id?: string;
  page?: number;
  per_page?: number;
}

interface CreateOrganizationData {
  name: string;
  name_en?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  tax_number?: string;
  subscription_plan?: SubscriptionPlanType;
  reseller_id?: string;
}

interface OrganizationStats {
  users_count: number;
  edge_servers_count: number;
  cameras_count: number;
  alerts_today: number;
  storage_used_gb: number;
}

export const organizationsApi = {
  async getOrganizations(filters: OrganizationFilters = {}): Promise<PaginatedResponse<Organization>> {
    const { data, error } = await apiClient.get<PaginatedResponse<Organization>>('/organizations', filters as Record<string, string | number | boolean>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch organizations');
    }
    return data;
  },

  async getOrganization(id: string): Promise<Organization> {
    const { data, error } = await apiClient.get<Organization>(`/organizations/${id}`);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch organization');
    }
    return data;
  },

  async createOrganization(orgData: CreateOrganizationData): Promise<Organization> {
    const { data, error } = await apiClient.post<Organization>('/organizations', orgData);
    if (error || !data) {
      throw new Error(error || 'Failed to create organization');
    }
    return data;
  },

  async updateOrganization(id: string, orgData: Partial<CreateOrganizationData>): Promise<Organization> {
    const { data, error } = await apiClient.put<Organization>(`/organizations/${id}`, orgData);
    if (error || !data) {
      throw new Error(error || 'Failed to update organization');
    }
    return data;
  },

  async deleteOrganization(id: string): Promise<void> {
    const { error } = await apiClient.delete(`/organizations/${id}`);
    if (error) {
      throw new Error(error);
    }
  },

  async getStats(id: string): Promise<OrganizationStats> {
    const { data, error } = await apiClient.get<OrganizationStats>(`/organizations/${id}/stats`);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch organization stats');
    }
    return data;
  },

  async toggleActive(id: string): Promise<Organization> {
    const { data, error } = await apiClient.post<Organization>(`/organizations/${id}/toggle-active`);
    if (error || !data) {
      throw new Error(error || 'Failed to toggle organization status');
    }
    return data;
  },

  async updatePlan(id: string, plan: SubscriptionPlanType): Promise<Organization> {
    const { data, error } = await apiClient.put<Organization>(`/organizations/${id}/plan`, { subscription_plan: plan });
    if (error || !data) {
      throw new Error(error || 'Failed to update plan');
    }
    return data;
  },
};
