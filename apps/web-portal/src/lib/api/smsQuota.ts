import { apiClient } from '../apiClient';

export interface SmsQuota {
  id: string;
  organization_id: string;
  monthly_limit: number;
  used_this_month: number;
  resets_at: string | null;
  created_at: string;
  updated_at: string;
}

export const smsQuotaApi = {
  async getQuota(organizationId: string): Promise<SmsQuota> {
    const { data, error } = await apiClient.get<SmsQuota>(`/organizations/${organizationId}/sms-quota`);
    if (error || !data) {
      throw new Error(error || 'Failed to load SMS quota');
    }
    return data;
  },

  async updateQuota(organizationId: string, payload: Partial<SmsQuota>): Promise<SmsQuota> {
    const { data, error } = await apiClient.put<SmsQuota>(`/organizations/${organizationId}/sms-quota`, payload);
    if (error || !data) {
      throw new Error(error || 'Failed to update SMS quota');
    }
    return data;
  },

  async consume(organizationId: string, count = 1): Promise<{ allowed: boolean; quota?: SmsQuota }> {
    const { data, error } = await apiClient.post<{ allowed: boolean; quota: SmsQuota }>(
      `/organizations/${organizationId}/sms-quota/consume`,
      { count },
      { skipAuthRedirect: true }
    );
    if (error || !data) {
      throw new Error(error || 'Failed to consume SMS quota');
    }
    return data;
  },
};
