import { apiClient } from '../apiClient';

export interface UpdateAnnouncement {
  id: number;
  title: string;
  body: string | null;
  is_published: boolean;
  organization_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export const updatesApi = {
  async list(): Promise<UpdateAnnouncement[]> {
    const { data, error } = await apiClient.get<UpdateAnnouncement[]>('/updates');
    if (error || !data) {
      throw new Error(error || 'Failed to load updates');
    }
    return data;
  },

  async create(payload: Partial<UpdateAnnouncement>): Promise<UpdateAnnouncement> {
    const { data, error } = await apiClient.post<UpdateAnnouncement>('/updates', payload);
    if (error || !data) {
      throw new Error(error || 'Failed to create update');
    }
    return data;
  },

  async update(id: number, payload: Partial<UpdateAnnouncement>): Promise<UpdateAnnouncement> {
    const { data, error } = await apiClient.put<UpdateAnnouncement>(`/updates/${id}`, payload);
    if (error || !data) {
      throw new Error(error || 'Failed to update record');
    }
    return data;
  },

  async remove(id: number): Promise<void> {
    const { error } = await apiClient.delete(`/updates/${id}`);
    if (error) throw new Error(error);
  },

  async toggle(id: number): Promise<UpdateAnnouncement> {
    const { data, error } = await apiClient.post<UpdateAnnouncement>(`/updates/${id}/toggle`);
    if (error || !data) {
      throw new Error(error || 'Failed to toggle publish');
    }
    return data;
  },
};
