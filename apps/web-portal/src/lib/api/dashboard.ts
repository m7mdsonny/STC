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

interface OrganizationModuleStatus {
  module_id: number;
  module_name: string;
  display_name: string;
  status: 'active' | 'disabled' | 'broken';
  enabled_count: number;
  total_count: number;
}

interface OrganizationLastActivity {
  last_event?: string | null;
  last_server_sync?: string | null;
  last_camera_update?: string | null;
}

interface OrganizationErrorSummary {
  critical_errors: number;
  high_errors: number;
  unresolved_alerts: number;
  total_errors: number;
}

interface DashboardData extends DashboardStats {
  organization_name?: string | null;
  recent_alerts: RecentAlert[];
  weekly_stats: { day: string; alerts: number; visitors: number }[];
  module_status?: OrganizationModuleStatus[];
  last_activity?: OrganizationLastActivity;
  error_summary?: OrganizationErrorSummary;
}

interface ModuleStatus {
  active: number;
  disabled: number;
  broken: number;
  total: number;
}

interface LastActivity {
  last_user_login?: string | null;
  last_edge_server_sync?: string | null;
  last_event?: string | null;
}

interface ErrorSummary {
  critical_errors: number;
  high_errors: number;
  unresolved_alerts: number;
  total_errors: number;
}

interface SystemHealth {
  database: { status: string; latency_ms: number };
  edge_servers: { status: string; online_ratio: number };
  overall: string;
}

interface AdminDashboardData {
  total_organizations: number;
  active_organizations?: number;
  active_licenses?: number;
  total_edge_servers: number;
  online_edge_servers?: number; // Backend provides this field
  total_cameras?: number;
  total_users: number;
  alerts_today: number;
  revenue_this_month?: number;
  revenue_previous_month?: number;
  revenue_year_total?: number;
  organizations_by_plan?: { plan: string; count: number }[];
  recent_activities?: { id: string; type: string; description: string; created_at: string }[];
  module_status?: ModuleStatus;
  last_activity?: LastActivity;
  error_summary?: ErrorSummary;
  system_health?: SystemHealth;
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
    const { data, error } = await apiClient.get<AdminDashboardData>('/dashboard/admin');
    if (error || !data) {
      throw new Error(error || 'Failed to fetch admin dashboard');
    }
    return data;
  },

  async getSystemHealth(): Promise<SystemHealth | null> {
    // TODO: Backend endpoint /admin/system-health not implemented yet
    // Return null for now, will be handled gracefully in SystemMonitor component
    try {
      const { data, error } = await apiClient.get<SystemHealth>('/admin/system-health');
      if (error || !data) {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },
};
