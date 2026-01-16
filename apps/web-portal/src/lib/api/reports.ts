import { API_BASE_URL, apiClient } from '../apiClient';

interface ReportFilters {
  organization_id?: string;
  date?: string;
  week_start?: string;
  month?: string;
  start_date?: string;
  end_date?: string;
  camera_id?: string;
  ai_module?: string;
  severity?: string;
}

interface ReportData {
  period_type: string;
  start_date: string;
  end_date: string;
  summary: {
    total_events: number;
    critical_events: number;
    high_events: number;
    unresolved_events: number;
    avg_risk_score: number | null;
    unique_cameras: number;
    unique_modules: number;
  };
  time_series: { period: string; count: number }[];
  by_module: { module: string; count: number }[];
  by_severity: { severity: string; count: number }[];
  top_cameras: { camera_id: string; count: number }[];
  high_risk_events: any[];
}

export const reportsApi = {
  async getDaily(filters: ReportFilters = {}): Promise<ReportData> {
    const { data, error } = await apiClient.get<ReportData>('/reports/daily', filters as Record<string, string>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch daily report');
    }
    return data;
  },

  async getWeekly(filters: ReportFilters = {}): Promise<ReportData> {
    const { data, error } = await apiClient.get<ReportData>('/reports/weekly', filters as Record<string, string>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch weekly report');
    }
    return data;
  },

  async getMonthly(filters: ReportFilters = {}): Promise<ReportData> {
    const { data, error } = await apiClient.get<ReportData>('/reports/monthly', filters as Record<string, string>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch monthly report');
    }
    return data;
  },

  async getCustom(filters: ReportFilters & { start_date: string; end_date: string }): Promise<ReportData> {
    const { data, error } = await apiClient.get<ReportData>('/reports/custom', filters as Record<string, string>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch custom report');
    }
    return data;
  },

  async exportCsv(filters: ReportFilters = {}): Promise<void> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const url = `/reports/export/csv${params.toString() ? `?${params.toString()}` : ''}`;
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Accept': 'text/csv',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(fullUrl, { headers });
    if (!response.ok) {
      throw new Error('Failed to export CSV');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `events_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  },

  async exportPdf(filters: ReportFilters = {}): Promise<void> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const url = `/reports/export/pdf${params.toString() ? `?${params.toString()}` : ''}`;
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Accept': 'text/html',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(fullUrl, { headers });
    if (!response.ok) {
      throw new Error('Failed to export PDF');
    }
    
    const html = await response.text();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  },
};
