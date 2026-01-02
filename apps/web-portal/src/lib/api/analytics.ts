import { apiClient } from '../apiClient';
import type { AudienceStats } from '../../types/database';

interface AnalyticsFilters {
  camera_id?: string;
  from?: string;
  to?: string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

interface AudienceOverview {
  total_visitors: number;
  male_count: number;
  female_count: number;
  age_distribution: {
    age_0_12: number;
    age_13_19: number;
    age_20_35: number;
    age_36_50: number;
    age_51_65: number;
    age_65_plus: number;
  };
  peak_hours: { hour: number; count: number }[];
  trend: { date: string; count: number }[];
}

interface CounterStats {
  camera_id: string;
  camera_name: string;
  entries: number;
  exits: number;
  current_occupancy: number;
  max_occupancy: number;
  hourly_breakdown: { hour: number; entries: number; exits: number }[];
}

interface AlertsAnalytics {
  total: number;
  by_severity: { severity: string; count: number }[];
  by_module: { module: string; count: number }[];
  by_status: { status: string; count: number }[];
  response_time_avg_minutes: number;
  trend: { date: string; count: number }[];
}

export const analyticsApi = {
  async getAudienceStats(filters: AnalyticsFilters = {}): Promise<AudienceStats[]> {
    const { data, error } = await apiClient.get<AudienceStats[]>('/analytics/audience', filters as Record<string, string>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch audience stats');
    }
    return data;
  },

  async getAudienceOverview(filters: AnalyticsFilters = {}): Promise<AudienceOverview> {
    const { data, error } = await apiClient.get<AudienceOverview>('/analytics/audience/overview', filters as Record<string, string>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch audience overview');
    }
    return data;
  },

  async getCounterStats(filters: AnalyticsFilters = {}): Promise<CounterStats[]> {
    const { data, error } = await apiClient.get<CounterStats[]>('/analytics/counter', filters as Record<string, string>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch counter stats');
    }
    return data;
  },

  async getAlertsAnalytics(filters: AnalyticsFilters = {}): Promise<AlertsAnalytics> {
    const { data, error } = await apiClient.get<AlertsAnalytics>('/analytics/alerts', filters as Record<string, string>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch alerts analytics');
    }
    return data;
  },

  async getProductivityStats(filters: AnalyticsFilters = {}): Promise<{
    average_productivity: number;
    idle_time_percent: number;
    active_time_percent: number;
    by_camera: { camera_id: string; camera_name: string; productivity: number }[];
    trend: { date: string; productivity: number }[];
  }> {
    const { data, error } = await apiClient.get('/analytics/productivity', filters as Record<string, string>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch productivity stats');
    }
    return data;
  },
};
