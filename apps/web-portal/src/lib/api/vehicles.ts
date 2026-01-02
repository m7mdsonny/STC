import { apiClient, type PaginatedResponse } from '../apiClient';
import type { RegisteredVehicle, VehicleCategory, VehicleAccessLog } from '../../types/database';

interface VehicleFilters {
  organization_id?: string;
  category?: VehicleCategory;
  is_active?: boolean;
  search?: string;
  page?: number;
  per_page?: number;
}

interface CreateVehicleData {
  plate_number: string;
  plate_ar?: string;
  owner_name?: string;
  vehicle_type?: string;
  vehicle_color?: string;
  category: VehicleCategory;
}

interface AccessLogFilters {
  vehicle_id?: string;
  camera_id?: string;
  direction?: string;
  access_granted?: boolean;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}

export const vehiclesApi = {
  async getVehicles(filters: VehicleFilters = {}): Promise<PaginatedResponse<RegisteredVehicle>> {
    const { data, error } = await apiClient.get<PaginatedResponse<RegisteredVehicle>>('/vehicles', filters as Record<string, string | number | boolean>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch vehicles');
    }
    return data;
  },

  async getVehicle(id: string): Promise<RegisteredVehicle> {
    const { data, error } = await apiClient.get<RegisteredVehicle>(`/vehicles/${id}`);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch vehicle');
    }
    return data;
  },

  async createVehicle(vehicleData: CreateVehicleData): Promise<RegisteredVehicle> {
    const { data, error } = await apiClient.post<RegisteredVehicle>('/vehicles', vehicleData);
    if (error || !data) {
      throw new Error(error || 'Failed to create vehicle');
    }
    return data;
  },

  async updateVehicle(id: string, vehicleData: Partial<CreateVehicleData>): Promise<RegisteredVehicle> {
    const { data, error } = await apiClient.put<RegisteredVehicle>(`/vehicles/${id}`, vehicleData);
    if (error || !data) {
      throw new Error(error || 'Failed to update vehicle');
    }
    return data;
  },

  async deleteVehicle(id: string): Promise<void> {
    const { error } = await apiClient.delete(`/vehicles/${id}`);
    if (error) {
      throw new Error(error);
    }
  },

  async toggleActive(id: string): Promise<RegisteredVehicle> {
    const { data, error } = await apiClient.post<RegisteredVehicle>(`/vehicles/${id}/toggle-active`);
    if (error || !data) {
      throw new Error(error || 'Failed to toggle vehicle status');
    }
    return data;
  },

  async getAccessLogs(filters: AccessLogFilters = {}): Promise<PaginatedResponse<VehicleAccessLog>> {
    const { data, error } = await apiClient.get<PaginatedResponse<VehicleAccessLog>>('/vehicles/access-logs', filters as Record<string, string | number | boolean>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch access logs');
    }
    return data;
  },
};
