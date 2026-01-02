import { apiClient, type PaginatedResponse } from '../apiClient';

export interface AiCommand {
  id: number;
  organization_id: string | null;
  title: string;
  status: string;
  payload: Record<string, unknown> | null;
  acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
  targets?: AiCommandTarget[];
}

export interface AiCommandTarget {
  id: number;
  ai_command_id: number;
  target_type: string;
  target_id: string | null;
  meta: Record<string, unknown> | null;
}

export interface AiCommandLog {
  id: number;
  ai_command_id: number;
  status: string;
  message: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export const aiCommandsApi = {
  async list(filters?: { status?: string; organization_id?: string; page?: number }): Promise<PaginatedResponse<AiCommand>> {
    const { data, error } = await apiClient.get<PaginatedResponse<AiCommand>>('/ai-commands', filters);
    if (error || !data) {
      throw new Error(error || 'Failed to load commands');
    }
    return data;
  },

  async create(payload: { title: string; organization_id?: string; payload?: Record<string, unknown>; targets?: Array<{ target_type: string; target_id?: string; meta?: Record<string, unknown> }> }): Promise<AiCommand> {
    const { data, error } = await apiClient.post<AiCommand>('/ai-commands', payload);
    if (error || !data) {
      throw new Error(error || 'Failed to create command');
    }
    return data;
  },

  async ack(id: number, message?: string): Promise<AiCommand> {
    const { data, error } = await apiClient.post<AiCommand>(`/ai-commands/${id}/ack`, { message });
    if (error || !data) {
      throw new Error(error || 'Failed to acknowledge command');
    }
    return data;
  },

  async retry(id: number): Promise<AiCommand> {
    const { data, error } = await apiClient.post<AiCommand>(`/ai-commands/${id}/retry`);
    if (error || !data) {
      throw new Error(error || 'Failed to retry command');
    }
    return data;
  },

  async logs(id: number): Promise<AiCommandLog[]> {
    const { data, error } = await apiClient.get<AiCommandLog[]>(`/ai-commands/${id}/logs`);
    if (error || !data) {
      throw new Error(error || 'Failed to load logs');
    }
    return data;
  },
};
