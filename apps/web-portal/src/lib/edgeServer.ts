import type { EdgeServer, Camera, Integration, AutomationRule, Alert } from '../types/database';

export interface EdgeServerStatus {
  status: string;
  server_id: string;
  organization_id: string;
  version: string;
  timestamp: string;
  cameras: number;
  integrations: number;
  modules: string[];
}

export interface CameraSnapshot {
  image: string;
  timestamp: string;
}

export interface PeopleCounts {
  in: number;
  out: number;
  current: number;
}

class EdgeServerService {
  private baseUrl: string | null = null;

  async setServerUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  async getServerUrlFromDB(serverId: string): Promise<string | null> {
    // This method is kept for compatibility but should use edgeServersApi
    // when needed. For now, return null to avoid direct database access.
    console.warn('getServerUrlFromDB: Direct database access deprecated, use edgeServersApi instead');
    return null;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
    if (!this.baseUrl) {
      console.error('Edge server URL not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Edge server request failed: ${endpoint}`, error);
      return null;
    }
  }

  async getStatus(): Promise<EdgeServerStatus | null> {
    return this.fetch('/status');
  }

  async getCameras(): Promise<Camera[]> {
    const result = await this.fetch<Camera[]>('/cameras');
    return result || [];
  }

  async getSnapshot(cameraId: string): Promise<CameraSnapshot | null> {
    return this.fetch(`/cameras/${cameraId}/snapshot`);
  }

  async getPeopleCounts(cameraId: string): Promise<PeopleCounts | null> {
    return this.fetch(`/cameras/${cameraId}/counts`);
  }

  async resetPeopleCounts(cameraId: string): Promise<boolean> {
    const result = await this.fetch(`/cameras/${cameraId}/counts/reset`, {
      method: 'POST',
    });
    return result !== null;
  }

  async getIntegrations(): Promise<Integration[]> {
    const result = await this.fetch<Integration[]>('/integrations');
    return result || [];
  }

  async testIntegration(integrationId: string): Promise<boolean> {
    const result = await this.fetch<{ status: string }>(`/integrations/${integrationId}/test`, {
      method: 'POST',
    });
    return result?.status === 'healthy';
  }

  async executeAction(integrationId: string, actionType: string, params: Record<string, unknown> = {}): Promise<boolean> {
    const result = await this.fetch<{ status: string }>('/actions/execute', {
      method: 'POST',
      body: JSON.stringify({
        integration_id: integrationId,
        action_type: actionType,
        params,
      }),
    });
    return result?.status === 'executed';
  }

  async getAutomationRules(): Promise<AutomationRule[]> {
    const result = await this.fetch<AutomationRule[]>('/automation/rules');
    return result || [];
  }

  async addAutomationRule(rule: Partial<AutomationRule>): Promise<string | null> {
    const result = await this.fetch<{ id: string }>('/automation/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
    return result?.id || null;
  }

  async removeAutomationRule(ruleId: string): Promise<boolean> {
    const result = await this.fetch(`/automation/rules/${ruleId}`, {
      method: 'DELETE',
    });
    return result !== null;
  }

  async getModules(): Promise<Array<{ id: string; name: string; name_ar: string; enabled: boolean; loaded: boolean }>> {
    const result = await this.fetch<Array<{ id: string; name: string; name_ar: string; enabled: boolean; loaded: boolean }>>('/modules');
    return result || [];
  }

  async getRecentAlerts(limit = 50): Promise<Alert[]> {
    const result = await this.fetch<Alert[]>(`/alerts/recent?limit=${limit}`);
    return result || [];
  }

  async forceSync(): Promise<boolean> {
    const result = await this.fetch('/sync', { method: 'POST' });
    return result !== null;
  }

  async healthCheck(): Promise<boolean> {
    const result = await this.fetch<{ status: string }>('/health');
    return result?.status === 'healthy';
  }

  async encodeFace(personName: string, category: string, imageFile: File, employeeId?: string, department?: string): Promise<string | null> {
    if (!this.baseUrl) return null;

    const formData = new FormData();
    formData.append('file', imageFile);

    const queryParams = new URLSearchParams({
      person_name: personName,
      category,
      ...(employeeId && { employee_id: employeeId }),
      ...(department && { department }),
    });

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/faces/encode?${queryParams}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Face encoding failed:', error);
      return null;
    }
  }

  async setRestrictedZones(cameraId: string, zones: number[][][]): Promise<boolean> {
    const result = await this.fetch('/intrusion/zones', {
      method: 'POST',
      body: JSON.stringify({
        camera_id: cameraId,
        zones,
      }),
    });
    return result !== null;
  }
}

export const edgeServerService = new EdgeServerService();
