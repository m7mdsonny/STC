import { apiClient, type PaginatedResponse } from '../apiClient';
import type { AttendanceRecord } from '../../types/database';

interface AttendanceFilters {
  organization_id?: string;
  person_id?: string;
  camera_id?: string;
  date?: string;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}

interface AttendanceSummary {
  person_id: string;
  person_name: string;
  employee_id: string | null;
  department: string | null;
  total_days: number;
  present_days: number;
  late_days: number;
  early_departure_days: number;
  total_hours: number;
  average_check_in: string;
  average_check_out: string;
}

interface DailyReport {
  date: string;
  total_employees: number;
  present: number;
  absent: number;
  late: number;
  early_departure: number;
  records: AttendanceRecord[];
}

export const attendanceApi = {
  async getRecords(filters: AttendanceFilters = {}): Promise<PaginatedResponse<AttendanceRecord>> {
    const { data, error } = await apiClient.get<PaginatedResponse<AttendanceRecord>>('/attendance', filters as Record<string, string | number>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch attendance records');
    }
    return data;
  },

  async getRecord(id: string): Promise<AttendanceRecord> {
    const { data, error } = await apiClient.get<AttendanceRecord>(`/attendance/${id}`);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch attendance record');
    }
    return data;
  },

  async getSummary(filters: { from: string; to: string; department?: string }): Promise<AttendanceSummary[]> {
    const { data, error } = await apiClient.get<AttendanceSummary[]>('/attendance/summary', filters as Record<string, string>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch attendance summary');
    }
    return data;
  },

  async getDailyReport(date: string): Promise<DailyReport> {
    const { data, error } = await apiClient.get<DailyReport>(`/attendance/daily/${date}`);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch daily report');
    }
    return data;
  },

  async getPersonHistory(personId: string, filters: { from?: string; to?: string } = {}): Promise<PaginatedResponse<AttendanceRecord>> {
    const { data, error } = await apiClient.get<PaginatedResponse<AttendanceRecord>>(`/attendance/person/${personId}`, filters as Record<string, string>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch person history');
    }
    return data;
  },

  async manualCheckIn(personId: string, cameraId: string): Promise<AttendanceRecord> {
    const { data, error } = await apiClient.post<AttendanceRecord>('/attendance/check-in', { person_id: personId, camera_id: cameraId });
    if (error || !data) {
      throw new Error(error || 'Failed to check in');
    }
    return data;
  },

  async manualCheckOut(recordId: string): Promise<AttendanceRecord> {
    const { data, error } = await apiClient.post<AttendanceRecord>(`/attendance/${recordId}/check-out`);
    if (error || !data) {
      throw new Error(error || 'Failed to check out');
    }
    return data;
  },
};
