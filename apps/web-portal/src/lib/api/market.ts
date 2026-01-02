import { apiClient, type PaginatedResponse } from '../apiClient';

export interface MarketEvent {
  id: string;
  event_type: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  camera_id: string | null;
  track_id: string | null;
  occurred_at: string;
  snapshot_url: string | null;
  confidence: number;
  title?: string;
  description?: string;
  actions?: string[];
}

export interface MarketDashboard {
  total_events: number;
  today_events: number;
  high_risk_count: number;
  critical_risk_count: number;
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  recent_events: MarketEvent[];
}

interface MarketEventFilters {
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  camera_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

export const marketApi = {
  async getDashboard(): Promise<MarketDashboard> {
    const { data, error } = await apiClient.get<MarketDashboard>('/market/dashboard');
    if (error || !data) {
      throw new Error(error || 'Failed to fetch market dashboard');
    }
    return data;
  },

  async getEvents(filters: MarketEventFilters = {}): Promise<PaginatedResponse<MarketEvent>> {
    const { data, error } = await apiClient.get<PaginatedResponse<MarketEvent>>('/market/events', filters as Record<string, string | number>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch market events');
    }
    return data;
  },

  async getEvent(id: string): Promise<MarketEvent> {
    const { data, error } = await apiClient.get<MarketEvent>(`/market/events/${id}`);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch market event');
    }
    return data;
  },
};
