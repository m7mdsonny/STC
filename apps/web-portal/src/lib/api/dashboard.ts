import { apiClient } from '../apiClient';

interface DashboardStats {
  edge_servers: { online: number; total: number };
  cameras: { online: number; total: number };
  alerts: { today: number; unresolved: number };
  attendance: { today: number; late: number };
  visitors: { today: number; trend: number };
}

interface RecentAlert {
  id: string;
  module: string;
  event_type: string;
  severity: string;
  title: string;
  created_at: string;
  status: string;
}

interface DashboardData extends DashboardStats {
  recent_alerts: RecentAlert[];
  weekly_stats: { day: string; alerts: number; visitors: number }[];
}

interface AdminDashboardData {
  total_organizations: number;
  active_licenses: number;
  total_edge_servers: number;
  total_cameras: number;
  total_users: number;
  alerts_today: number;
  revenue_this_month: number;
  organizations_by_plan: { plan: string; count: number }[];
  recent_activities: { id: string; type: string; description: string; created_at: string }[];
}

interface SystemHealth {
  database: { status: string; latency_ms: number };
  cache: { status: string; hit_rate: number };
  storage: { status: string; used_gb: number; total_gb: number };
  api: { status: string; requests_per_minute: number };
}

export const dashboardApi = {
  async getDashboard(organizationId?: string): Promise<DashboardData> {
    const params = organizationId ? { organization_id: organizationId } : {};
    const { data, error } = await apiClient.get<DashboardData>('/dashboard', params);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch dashboard');
    }
    return data;
  },

  async getStats(organizationId?: string): Promise<DashboardStats> {
    const params = organizationId ? { organization_id: organizationId } : {};
    const { data, error } = await apiClient.get<DashboardStats>('/dashboard/stats', params);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch stats');
    }
    return data;
  },

  async getAdminDashboard(): Promise<AdminDashboardData> {
    const { data, error } = await apiClient.get<AdminDashboardData>('/admin/dashboard');
    if (error || !data) {
      throw new Error(error || 'Failed to fetch admin dashboard');
    }
    return data;
  },

  async getSystemHealth(): Promise<SystemHealth> {
    const { data, error } = await apiClient.get<SystemHealth>('/admin/system-health');
    if (error || !data) {
      throw new Error(error || 'Failed to fetch system health');
    }
    return data;
  },
};
