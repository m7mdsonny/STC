import { apiClient, type PaginatedResponse } from '../apiClient';
import type { NotificationSetting, NotificationLog, AlertPriority, OrganizationNotificationConfig, AlertSeverity, NotificationChannel } from '../../types/database';

interface NotificationLogFilters {
  channel?: NotificationChannel;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}

interface CreateAlertPriorityData {
  module: string;
  alert_type: string;
  severity: AlertSeverity;
  notification_channels: NotificationChannel[];
  auto_escalate?: boolean;
  escalation_minutes?: number;
  escalation_channel?: NotificationChannel;
  sound_enabled?: boolean;
  vibration_enabled?: boolean;
}

export const notificationsApi = {
  async getSettings(): Promise<NotificationSetting[]> {
    const { data, error } = await apiClient.get<NotificationSetting[]>('/notifications/settings');
    if (error || !data) {
      throw new Error(error || 'Failed to fetch notification settings');
    }
    return data;
  },

  async updateSetting(id: string, settingData: Partial<NotificationSetting>): Promise<NotificationSetting> {
    const { data, error } = await apiClient.put<NotificationSetting>(`/notifications/settings/${id}`, settingData);
    if (error || !data) {
      throw new Error(error || 'Failed to update notification setting');
    }
    return data;
  },

  async getOrgConfig(): Promise<OrganizationNotificationConfig> {
    const { data, error } = await apiClient.get<OrganizationNotificationConfig>('/notifications/config');
    if (error || !data) {
      throw new Error(error || 'Failed to fetch notification config');
    }
    return data;
  },

  async updateOrgConfig(configData: Partial<OrganizationNotificationConfig>): Promise<OrganizationNotificationConfig> {
    const { data, error } = await apiClient.put<OrganizationNotificationConfig>('/notifications/config', configData);
    if (error || !data) {
      throw new Error(error || 'Failed to update notification config');
    }
    return data;
  },

  async getAlertPriorities(): Promise<AlertPriority[]> {
    const { data, error } = await apiClient.get<AlertPriority[]>('/notifications/alert-priorities');
    if (error || !data) {
      throw new Error(error || 'Failed to fetch alert priorities');
    }
    return data;
  },

  async createAlertPriority(priorityData: CreateAlertPriorityData): Promise<AlertPriority> {
    const { data, error } = await apiClient.post<AlertPriority>('/notifications/alert-priorities', priorityData);
    if (error || !data) {
      throw new Error(error || 'Failed to create alert priority');
    }
    return data;
  },

  async updateAlertPriority(id: string, priorityData: Partial<CreateAlertPriorityData>): Promise<AlertPriority> {
    const { data, error } = await apiClient.put<AlertPriority>(`/notifications/alert-priorities/${id}`, priorityData);
    if (error || !data) {
      throw new Error(error || 'Failed to update alert priority');
    }
    return data;
  },

  async deleteAlertPriority(id: string): Promise<void> {
    const { error } = await apiClient.delete(`/notifications/alert-priorities/${id}`);
    if (error) {
      throw new Error(error);
    }
  },

  async getNotificationPriorities(organizationId?: string): Promise<AlertPriority[]> {
    const { data, error } = await apiClient.get<AlertPriority[]>('/notifications/alert-priorities', organizationId ? { organization_id: organizationId } : undefined);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch notification priorities');
    }
    return data;
  },

  async createNotificationPriority(payload: { organization_id?: string; notification_type: string; priority: string; is_critical?: boolean }): Promise<AlertPriority> {
    const { data, error } = await apiClient.post<AlertPriority>('/notifications/alert-priorities', payload);
    if (error || !data) {
      throw new Error(error || 'Failed to create notification priority');
    }
    return data;
  },

  async updateNotificationPriority(id: string, payload: Partial<{ notification_type: string; priority: string; is_critical: boolean }>): Promise<AlertPriority> {
    const { data, error } = await apiClient.put<AlertPriority>(`/notifications/alert-priorities/${id}`, payload);
    if (error || !data) {
      throw new Error(error || 'Failed to update notification priority');
    }
    return data;
  },

  async deleteNotificationPriority(id: string): Promise<void> {
    const { error } = await apiClient.delete(`/notifications/alert-priorities/${id}`);
    if (error) {
      throw new Error(error);
    }
  },

  async getLogs(filters: NotificationLogFilters = {}): Promise<PaginatedResponse<NotificationLog>> {
    const { data, error } = await apiClient.get<PaginatedResponse<NotificationLog>>('/notifications/logs', filters as Record<string, string | number>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch notification logs');
    }
    return data;
  },

  async sendTestNotification(channel: NotificationChannel, recipient: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await apiClient.post<{ success: boolean; message: string }>('/notifications/test', { channel, recipient });
    if (error || !data) {
      throw new Error(error || 'Failed to send test notification');
    }
    return data;
  },

  async getQuota(): Promise<{ sms_used: number; sms_limit: number; whatsapp_used: number; whatsapp_limit: number; calls_used: number; calls_limit: number }> {
    const { data, error } = await apiClient.get('/notifications/quota');
    if (error || !data) {
      throw new Error(error || 'Failed to fetch quota');
    }
    return data;
  },
};
