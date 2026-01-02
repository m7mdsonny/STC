import { apiClient } from '../apiClient';
import type { LandingSettings, SubscriptionPlan, Reseller } from '../../types/database';

export interface LandingSettingsResponse {
  content: LandingSettings;
  published: boolean;
}

interface SystemSettings {
  site_name: string;
  site_logo_url: string | null;
  default_language: string;
  default_timezone: string;
  maintenance_mode: boolean;
  allow_registration: boolean;
  require_email_verification: boolean;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  smtp_from_email: string | null;
  smtp_from_name: string | null;
  twilio_sid: string | null;
  twilio_phone: string | null;
  firebase_project_id: string | null;
}

interface SmsSettings {
  provider: 'twilio' | 'unifonic' | 'custom';
  api_key: string | null;
  api_secret: string | null;
  sender_id: string | null;
  whatsapp_enabled: boolean;
  whatsapp_number: string | null;
}

export const settingsApi = {
  async getLandingSettings(): Promise<LandingSettingsResponse> {
    const { data, error } = await apiClient.get<LandingSettingsResponse>('/settings/landing');
    if (error || !data) {
      throw new Error(error || 'Failed to fetch landing settings');
    }
    return data;
  },

  async updateLandingSettings(payload: Partial<LandingSettings> & { published?: boolean }): Promise<LandingSettingsResponse> {
    const { data, error } = await apiClient.put<LandingSettingsResponse>('/settings/landing', {
      content: payload,
      published: payload.published,
    });
    if (error || !data) {
      throw new Error(error || 'Failed to update landing settings');
    }
    return data;
  },

  async getPublishedLanding(): Promise<LandingSettingsResponse> {
    const { data, error } = await apiClient.get<LandingSettingsResponse>('/public/landing', undefined, {
      skipAuthRedirect: true,
      skipAuthHeader: true,
    });
    if (error || !data) {
      throw new Error(error || 'Failed to fetch published landing content');
    }
    return data;
  },

  async submitContactForm(payload: { name: string; email: string; phone?: string; message: string }): Promise<{ message: string; success: boolean }> {
    const { data, error } = await apiClient.post<{ message: string; success: boolean }>('/public/contact', payload, {
      skipAuthRedirect: true,
      skipAuthHeader: true,
    });
    if (error || !data) {
      throw new Error(error || 'Failed to submit contact form');
    }
    return data;
  },

  async getSystemSettings(): Promise<SystemSettings> {
    const { data, error } = await apiClient.get<SystemSettings>('/settings/system');
    if (error || !data) {
      throw new Error(error || 'Failed to fetch system settings');
    }
    return data;
  },

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const { data, error } = await apiClient.put<SystemSettings>('/settings/system', settings);
    if (error || !data) {
      throw new Error(error || 'Failed to update system settings');
    }
    return data;
  },

  async getSmsSettings(): Promise<SmsSettings> {
    const { data, error } = await apiClient.get<SmsSettings>('/settings/sms');
    if (error || !data) {
      throw new Error(error || 'Failed to fetch SMS settings');
    }
    return data;
  },

  async updateSmsSettings(settings: Partial<SmsSettings>): Promise<SmsSettings> {
    const { data, error } = await apiClient.put<SmsSettings>('/settings/sms', settings);
    if (error || !data) {
      throw new Error(error || 'Failed to update SMS settings');
    }
    return data;
  },

  async testSmsConnection(): Promise<{ success: boolean; message: string }> {
    const { data, error } = await apiClient.post<{ success: boolean; message: string }>('/settings/sms/test');
    if (error || !data) {
      throw new Error(error || 'Failed to test SMS connection');
    }
    return data;
  },

  async getPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await apiClient.get<SubscriptionPlan[]>('/settings/plans');
    if (error || !data) {
      throw new Error(error || 'Failed to fetch plans');
    }
    return data;
  },

  async updatePlan(id: string, planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const { data, error } = await apiClient.put<SubscriptionPlan>(`/settings/plans/${id}`, planData);
    if (error || !data) {
      throw new Error(error || 'Failed to update plan');
    }
    return data;
  },

  async getResellers(): Promise<Reseller[]> {
    const { data, error } = await apiClient.get<Reseller[]>('/settings/resellers');
    if (error || !data) {
      throw new Error(error || 'Failed to fetch resellers');
    }
    return data;
  },

  async createReseller(resellerData: Partial<Reseller>): Promise<Reseller> {
    const { data, error } = await apiClient.post<Reseller>('/settings/resellers', resellerData);
    if (error || !data) {
      throw new Error(error || 'Failed to create reseller');
    }
    return data;
  },

  async updateReseller(id: string, resellerData: Partial<Reseller>): Promise<Reseller> {
    const { data, error } = await apiClient.put<Reseller>(`/settings/resellers/${id}`, resellerData);
    if (error || !data) {
      throw new Error(error || 'Failed to update reseller');
    }
    return data;
  },

  async deleteReseller(id: string): Promise<void> {
    const { error } = await apiClient.delete(`/settings/resellers/${id}`);
    if (error) {
      throw new Error(error);
    }
  },

  async uploadLogo(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    const { data, error } = await apiClient.post<{ url: string }>('/settings/upload-logo', formData);
    if (error || !data) {
      throw new Error(error || 'Failed to upload logo');
    }
    return data;
  },
};
