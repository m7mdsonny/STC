import { apiClient } from '../apiClient';
import type { PlatformBranding } from './superAdmin';

export const brandingApi = {
  async getPublicBranding(): Promise<PlatformBranding> {
    const { data, error } = await apiClient.get<PlatformBranding>('/branding', undefined, {
      skipAuthRedirect: true,
      skipAuthHeader: true,
    });
    if (error || !data) {
      throw new Error(error || 'Failed to load branding');
    }
    return data;
  },
};
