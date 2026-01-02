import { apiClient, type PaginatedResponse } from '../apiClient';
import type { User, UserRole } from '../../types/database';

interface UserFilters {
  organization_id?: string;
  role?: UserRole;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  organization_id?: string;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  is_active?: boolean;
  organization_id?: string;
}

export const usersApi = {
  async getUsers(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
    const { data, error } = await apiClient.get<PaginatedResponse<User>>('/users', filters as Record<string, string | number | boolean>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch users');
    }
    return data;
  },

  async getUser(id: string): Promise<User> {
    const { data, error } = await apiClient.get<User>(`/users/${id}`);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch user');
    }
    return data;
  },

  async createUser(userData: CreateUserData): Promise<User> {
    const { data, error } = await apiClient.post<User>('/users', userData);
    if (error || !data) {
      throw new Error(error || 'Failed to create user');
    }
    return data;
  },

  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    const { data, error } = await apiClient.put<User>(`/users/${id}`, userData);
    if (error || !data) {
      throw new Error(error || 'Failed to update user');
    }
    return data;
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await apiClient.delete(`/users/${id}`);
    if (error) {
      throw new Error(error);
    }
  },

  // resetPassword endpoint removed - use Laravel password reset flow instead
  // async resetPassword(id: string): Promise<{ message: string }> {
  //   const { data, error } = await apiClient.post<{ message: string }>(`/users/${id}/reset-password`);
  //   if (error || !data) {
  //     throw new Error(error || 'Failed to reset password');
  //   }
  //   return data;
  // },

  async toggleActive(id: string): Promise<User> {
    const { data, error } = await apiClient.post<User>(`/users/${id}/toggle-active`);
    if (error || !data) {
      throw new Error(error || 'Failed to toggle user status');
    }
    return data;
  },
};
