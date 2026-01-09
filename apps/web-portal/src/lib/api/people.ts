import { apiClient, type PaginatedResponse } from '../apiClient';
import type { RegisteredFace, PersonCategory } from '../../types/database';

interface PeopleFilters {
  organization_id?: string;
  category?: PersonCategory;
  department?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  per_page?: number;
}

interface CreatePersonData {
  person_name: string;
  employee_id?: string;
  department?: string;
  category: PersonCategory;
  photo_url?: string;
}

export const peopleApi = {
  async getPeople(filters: PeopleFilters = {}): Promise<PaginatedResponse<RegisteredFace>> {
    const { data, error } = await apiClient.get<PaginatedResponse<RegisteredFace>>('/people', filters as Record<string, string | number | boolean>);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch people');
    }
    return data;
  },

  async getPerson(id: string): Promise<RegisteredFace> {
    const { data, error } = await apiClient.get<RegisteredFace>(`/people/${id}`);
    if (error || !data) {
      throw new Error(error || 'Failed to fetch person');
    }
    return data;
  },

  async createPerson(personData: CreatePersonData): Promise<RegisteredFace> {
    const { data, error } = await apiClient.post<RegisteredFace>('/people', personData);
    if (error || !data) {
      throw new Error(error || 'Failed to create person');
    }
    return data;
  },

  async updatePerson(id: string, personData: Partial<CreatePersonData>): Promise<RegisteredFace> {
    const { data, error } = await apiClient.put<RegisteredFace>(`/people/${id}`, personData);
    if (error || !data) {
      throw new Error(error || 'Failed to update person');
    }
    return data;
  },

  async deletePerson(id: string): Promise<void> {
    const { error } = await apiClient.delete(`/people/${id}`);
    if (error) {
      throw new Error(error);
    }
  },

  async uploadPhoto(id: string, file: File): Promise<RegisteredFace> {
    const formData = new FormData();
    formData.append('photo', file);
    const { data, error } = await apiClient.post<RegisteredFace>(`/people/${id}/photo`, formData);
    if (error || !data) {
      throw new Error(error || 'Failed to upload photo');
    }
    return data;
  },

  async toggleActive(id: string): Promise<RegisteredFace> {
    const { data, error } = await apiClient.post<RegisteredFace>(`/people/${id}/toggle-active`);
    if (error || !data) {
      throw new Error(error || 'Failed to toggle person status');
    }
    return data;
  },

  async getDepartments(): Promise<string[]> {
    const { data, error } = await apiClient.get<string[]>('/people/departments');
    if (error || !data) {
      throw new Error(error || 'Failed to fetch departments');
    }
    return data;
  },
};
