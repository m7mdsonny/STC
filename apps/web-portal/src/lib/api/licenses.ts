import { apiClient, type PaginatedResponse } from '../apiClient';
import type { License, LicenseStatus, SubscriptionPlanType } from '../../types/database';

interface LicenseFilters {
  organization_id?: string;
  status?: LicenseStatus;
  plan?: SubscriptionPlanType;
  page?: number;
  per_page?: number;
}

interface CreateLicenseData {
  organization_id: string;
  plan: SubscriptionPlanType;
  max_cameras: number;
  modules: string[];
  expires_at?: string;
}

interface LicenseValidation {
  valid: boolean;
  license?: License;
  message?: string;
  grace_period?: boolean;
}

export const licensesApi = {
  async getLicenses(filters: LicenseFilters = {}): Promise<PaginatedResponse<License>> {
    const { data, error } = await apiClient.get<PaginatedResponse<License>>('/licenses', filters as Record<string, string | number>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch licenses');
    }
    return data;
  },

  async getLicense(id: string): Promise<License> {
    const { data, error } = await apiClient.get<License>(`/licenses/${id}`);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch license');
    }
    return data;
  },

  async createLicense(licenseData: CreateLicenseData): Promise<License> {
    const { data, error } = await apiClient.post<License>('/licenses', licenseData);
    if (error || !data) {
      throw new Error(error || 'Failed to create license');
    }
    return data;
  },

  async updateLicense(id: string, licenseData: Partial<CreateLicenseData>): Promise<License> {
    const { data, error } = await apiClient.put<License>(`/licenses/${id}`, licenseData);
    if (error || !data) {
      throw new Error(error || 'Failed to update license');
    }
    return data;
  },

  async deleteLicense(id: string): Promise<void> {
    const { error } = await apiClient.delete(`/licenses/${id}`);
    if (error) {
      throw new Error(error);
    }
  },

  async activate(id: string): Promise<License> {
    const { data, error } = await apiClient.post<License>(`/licenses/${id}/activate`);
    if (error || !data) {
      throw new Error(error || 'Failed to activate license');
    }
    return data;
  },

  async suspend(id: string): Promise<License> {
    const { data, error } = await apiClient.post<License>(`/licenses/${id}/suspend`);
    if (error || !data) {
      throw new Error(error || 'Failed to suspend license');
    }
    return data;
  },

  async renew(id: string, expiresAt: string): Promise<License> {
    const { data, error } = await apiClient.post<License>(`/licenses/${id}/renew`, { expires_at: expiresAt });
    if (error || !data) {
      throw new Error(error || 'Failed to renew license');
    }
    return data;
  },

  async validate(licenseKey: string): Promise<LicenseValidation> {
    const { data, error } = await apiClient.post<LicenseValidation>('/licenses/validate', { license_key: licenseKey });
    if (error || !data) {
      throw new Error(error || 'Failed to validate license');
    }
    return data;
  },

  async regenerateKey(id: string): Promise<License> {
    const { data, error } = await apiClient.post<License>(`/licenses/${id}/regenerate-key`);
    if (error || !data) {
      throw new Error(error || 'Failed to regenerate key');
    }
    return data;
  },
};
