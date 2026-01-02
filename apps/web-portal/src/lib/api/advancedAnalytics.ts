import { apiClient } from '../apiClient';

export interface AnalyticsEvent {
  id: string;
  organization_id: number;
  event_date: string;
  event_hour: number | null;
  site_id: number | null;
  zone_id: string | null;
  camera_id: string | null;
  edge_server_id: number | null;
  event_type: string;
  ai_module: string | null;
  severity: string | null;
  event_count: number;
  acknowledged_count: number;
  resolved_count: number;
  false_positive_count: number;
  avg_response_time_seconds: number | null;
}

export interface AnalyticsReport {
  id: string;
  organization_id: number;
  name: string;
  description: string | null;
  report_type: string;
  parameters: Record<string, unknown>;
  filters: Record<string, unknown>;
  date_range_start: string | null;
  date_range_end: string | null;
  format: string;
  file_url: string | null;
  file_size: number | null;
  is_scheduled: boolean;
  schedule_cron: string | null;
  last_generated_at: string | null;
  next_scheduled_at: string | null;
  recipients: string[] | null;
  status: string;
  error_message: string | null;
  created_by: number | null;
}

export interface AnalyticsDashboard {
  id: string;
  organization_id: number;
  name: string;
  description: string | null;
  is_default: boolean;
  layout: Record<string, unknown>;
  is_public: boolean;
  shared_with: number[] | null;
  widgets?: AnalyticsWidget[];
}

export interface AnalyticsWidget {
  id: string;
  dashboard_id: string;
  name: string;
  widget_type: string;
  config: Record<string, unknown>;
  data_source: string | null;
  filters: Record<string, unknown>;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface AnalyticsSummary {
  total_events: number;
  total_acknowledged: number;
  total_resolved: number;
  total_false_positives: number;
  avg_response_time: number;
  events_by_type: Record<string, number>;
  events_by_severity: Record<string, number>;
  events_by_module: Record<string, number>;
}

export interface AnalyticsQueryParams {
  start_date?: string;
  end_date?: string;
  event_types?: string[];
  severities?: string[];
  ai_modules?: string[];
  camera_ids?: string[];
  edge_server_ids?: number[];
  group_by?: 'hour' | 'day' | 'week' | 'month';
}

export const advancedAnalyticsApi = {
  getSummary: async (params?: AnalyticsQueryParams): Promise<AnalyticsSummary> => {
    const response = await apiClient.get('/api/v1/analytics/summary', { params });
    return response.data;
  },

  getTimeSeries: async (params?: AnalyticsQueryParams): Promise<TimeSeriesData[]> => {
    const response = await apiClient.get('/api/v1/analytics/time-series', { params });
    return response.data;
  },

  getEventsByLocation: async (params?: AnalyticsQueryParams): Promise<Record<string, number>> => {
    const response = await apiClient.get('/api/v1/analytics/by-location', { params });
    return response.data;
  },

  getEventsByModule: async (params?: AnalyticsQueryParams): Promise<Record<string, number>> => {
    const response = await apiClient.get('/api/v1/analytics/by-module', { params });
    return response.data;
  },

  getResponseTimeMetrics: async (params?: AnalyticsQueryParams): Promise<{
    avg: number;
    min: number;
    max: number;
    p50: number;
    p90: number;
    p99: number;
  }> => {
    const response = await apiClient.get('/api/v1/analytics/response-times', { params });
    return response.data;
  },

  compareMetrics: async (params: {
    period1_start: string;
    period1_end: string;
    period2_start: string;
    period2_end: string;
  }): Promise<{
    period1: AnalyticsSummary;
    period2: AnalyticsSummary;
    change_percent: Record<string, number>;
  }> => {
    const response = await apiClient.get('/api/v1/analytics/compare', { params });
    return response.data;
  },

  getReports: async (): Promise<AnalyticsReport[]> => {
    const response = await apiClient.get('/api/v1/analytics/reports');
    return response.data;
  },

  getReport: async (id: string): Promise<AnalyticsReport> => {
    const response = await apiClient.get(`/api/v1/analytics/reports/${id}`);
    return response.data;
  },

  createReport: async (data: Partial<AnalyticsReport>): Promise<AnalyticsReport> => {
    const response = await apiClient.post('/api/v1/analytics/reports', data);
    return response.data;
  },

  updateReport: async (id: string, data: Partial<AnalyticsReport>): Promise<AnalyticsReport> => {
    const response = await apiClient.put(`/api/v1/analytics/reports/${id}`, data);
    return response.data;
  },

  deleteReport: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/analytics/reports/${id}`);
  },

  generateReport: async (id: string): Promise<{ status: string; file_url?: string }> => {
    const response = await apiClient.post(`/api/v1/analytics/reports/${id}/generate`);
    return response.data;
  },

  downloadReport: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/v1/analytics/reports/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getDashboards: async (): Promise<AnalyticsDashboard[]> => {
    const response = await apiClient.get('/api/v1/analytics/dashboards');
    return response.data;
  },

  getDashboard: async (id: string): Promise<AnalyticsDashboard> => {
    const response = await apiClient.get(`/api/v1/analytics/dashboards/${id}`);
    return response.data;
  },

  createDashboard: async (data: Partial<AnalyticsDashboard>): Promise<AnalyticsDashboard> => {
    const response = await apiClient.post('/api/v1/analytics/dashboards', data);
    return response.data;
  },

  updateDashboard: async (id: string, data: Partial<AnalyticsDashboard>): Promise<AnalyticsDashboard> => {
    const response = await apiClient.put(`/api/v1/analytics/dashboards/${id}`, data);
    return response.data;
  },

  deleteDashboard: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/analytics/dashboards/${id}`);
  },

  createWidget: async (dashboardId: string, data: Partial<AnalyticsWidget>): Promise<AnalyticsWidget> => {
    const response = await apiClient.post(`/api/v1/analytics/dashboards/${dashboardId}/widgets`, data);
    return response.data;
  },

  updateWidget: async (dashboardId: string, widgetId: string, data: Partial<AnalyticsWidget>): Promise<AnalyticsWidget> => {
    const response = await apiClient.put(`/api/v1/analytics/dashboards/${dashboardId}/widgets/${widgetId}`, data);
    return response.data;
  },

  deleteWidget: async (dashboardId: string, widgetId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/analytics/dashboards/${dashboardId}/widgets/${widgetId}`);
  },

  exportData: async (params: AnalyticsQueryParams & { format: 'csv' | 'json' }): Promise<Blob> => {
    const response = await apiClient.get('/api/v1/analytics/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
