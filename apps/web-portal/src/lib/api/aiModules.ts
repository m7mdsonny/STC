import { apiClient } from '../apiClient';

export interface AiModule {
  id: number;
  name: string; // CRITICAL FIX: Use 'name' as unique identifier (not module_key)
  display_name?: string;
  display_name_ar?: string;
  description: string | null;
  description_ar?: string | null;
  is_active: boolean; // CRITICAL FIX: Backend uses 'is_active' not 'is_enabled'
  display_order: number;
  config_schema?: Record<string, unknown>;
  default_config?: Record<string, unknown>;
  required_camera_type?: string | null;
  min_fps?: number;
  min_resolution?: string;
  icon?: string | null;
  // Removed fields that don't exist in database:
  // module_key, category, is_premium, min_plan_level
}

export interface AiModuleConfig {
  id: string;
  organization_id: number;
  module_id: number;
  is_enabled: boolean;
  is_licensed: boolean;
  config: Record<string, unknown>;
  confidence_threshold: number;
  alert_threshold: number;
  cooldown_seconds: number;
  schedule_enabled: boolean;
  schedule: Record<string, unknown>;
  module?: AiModule;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  max_cameras: number;
  max_edge_servers: number;
  max_users: number;
  max_storage_gb: number;
  event_retention_days: number;
  video_retention_days: number;
  features_enabled: string[];
  ai_modules_enabled: string[];
  price_monthly: number;
  price_yearly: number;
  currency: string;
  is_active: boolean;
  is_public: boolean;
  display_order: number;
}

export const aiModulesApi = {
  getModules: async (): Promise<AiModule[]> => {
    try {
      const response = await apiClient.get('/api/v1/ai-modules');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching AI modules:', error);
      return [];
    }
  },

  getModule: async (id: number): Promise<AiModule> => {
    const response = await apiClient.get(`/api/v1/ai-modules/${id}`);
    return response.data;
  },

  updateModule: async (id: number, data: Partial<AiModule>): Promise<AiModule> => {
    const response = await apiClient.put(`/api/v1/ai-modules/${id}`, data);
    return response.data;
  },

  getOrganizationConfigs: async (): Promise<AiModuleConfig[]> => {
    const response = await apiClient.get('/api/v1/ai-modules/configs');
    return response.data;
  },

  getOrganizationConfig: async (moduleId: number): Promise<AiModuleConfig | null> => {
    try {
      const response = await apiClient.get(`/api/v1/ai-modules/configs/${moduleId}`);
      return response.data;
    } catch {
      return null;
    }
  },

  updateOrganizationConfig: async (moduleId: number, data: Partial<AiModuleConfig>): Promise<AiModuleConfig> => {
    const response = await apiClient.put(`/api/v1/ai-modules/configs/${moduleId}`, data);
    return response.data;
  },

  enableModule: async (moduleId: number): Promise<AiModuleConfig> => {
    const response = await apiClient.post(`/api/v1/ai-modules/configs/${moduleId}/enable`);
    return response.data;
  },

  disableModule: async (moduleId: number): Promise<AiModuleConfig> => {
    const response = await apiClient.post(`/api/v1/ai-modules/configs/${moduleId}/disable`);
    return response.data;
  },
};

export const subscriptionPlansApi = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await apiClient.get('/api/v1/subscription-plans');
    return response.data;
  },

  getPlan: async (id: number): Promise<SubscriptionPlan> => {
    const response = await apiClient.get(`/api/v1/subscription-plans/${id}`);
    return response.data;
  },

  createPlan: async (data: Omit<SubscriptionPlan, 'id'>): Promise<SubscriptionPlan> => {
    const response = await apiClient.post('/api/v1/subscription-plans', data);
    return response.data;
  },

  updatePlan: async (id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
    const response = await apiClient.put(`/api/v1/subscription-plans/${id}`, data);
    return response.data;
  },

  deletePlan: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/subscription-plans/${id}`);
  },
};
