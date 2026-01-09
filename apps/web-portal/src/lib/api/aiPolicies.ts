import { apiClient } from '../apiClient';

export interface AiPolicyEvent {
  id: number;
  ai_policy_id: number;
  event_type: string;
  label: string | null;
  payload: Record<string, unknown> | null;
  weight: number | null;
  created_at: string;
  updated_at: string;
}

export interface AiPolicyEffective {
  id?: number;
  organization_id?: number | string | null;
  name?: string;
  is_enabled?: boolean;
  modules?: Record<string, unknown> | string[];
  thresholds?: Record<string, unknown>;
  actions?: Record<string, unknown>;
  feature_flags?: Record<string, unknown>;
  events?: AiPolicyEvent[];
}

export const aiPoliciesApi = {
  async getEffective(organizationId?: string | number): Promise<AiPolicyEffective | null> {
    const params = organizationId ? { organization_id: organizationId } : undefined;
    const { data, error } = await apiClient.get<AiPolicyEffective>('/ai-policies/effective', params);
    if (error || !data) {
      return null;
    }
    return data;
  },
};
