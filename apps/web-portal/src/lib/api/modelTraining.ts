import { apiClient } from '../apiClient';

export interface TrainingDataset {
  id: string;
  organization_id: number | null;
  name: string;
  description: string | null;
  ai_module: string;
  sample_count: number;
  labeled_count: number;
  verified_count: number;
  label_schema: Array<{ name: string; color: string }>;
  environment: string;
  version: string;
  status: string;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingSample {
  id: string;
  dataset_id: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  labels: Array<{ label: string; bbox?: number[] }>;
  annotations: Array<Record<string, unknown>>;
  source_camera_id: string | null;
  captured_at: string | null;
  metadata: Record<string, unknown>;
  is_labeled: boolean;
  is_verified: boolean;
  labeled_by: number | null;
  verified_by: number | null;
  quality_score: number | null;
  rejection_reason: string | null;
}

export interface TrainingJob {
  id: string;
  organization_id: number | null;
  name: string;
  description: string | null;
  ai_module: string;
  dataset_id: string | null;
  base_model_version: string | null;
  training_config: Record<string, unknown>;
  hyperparameters: Record<string, unknown>;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress_percent: number;
  current_epoch: number | null;
  total_epochs: number | null;
  metrics: {
    accuracy?: number;
    loss?: number;
    val_accuracy?: number;
    val_loss?: number;
  };
  training_logs: string | null;
  output_model_version: string | null;
  started_at: string | null;
  completed_at: string | null;
  estimated_completion: string | null;
  error_message: string | null;
  created_by: number | null;
  created_at: string;
}

export interface AiModelVersion {
  id: string;
  ai_module: string;
  version: string;
  name: string | null;
  description: string | null;
  training_job_id: string | null;
  base_version_id: string | null;
  model_file_url: string | null;
  model_file_size: number | null;
  config_file_url: string | null;
  accuracy: number | null;
  precision_score: number | null;
  recall_score: number | null;
  f1_score: number | null;
  inference_time_ms: number | null;
  min_edge_version: string | null;
  supported_platforms: string[] | null;
  status: 'draft' | 'testing' | 'approved' | 'released' | 'deprecated';
  is_approved: boolean;
  approved_by: number | null;
  approved_at: string | null;
  is_released: boolean;
  released_at: string | null;
  release_notes: string | null;
}

export interface ModelDeployment {
  id: string;
  model_version_id: string;
  edge_server_id: number;
  status: 'pending' | 'downloading' | 'installing' | 'completed' | 'failed';
  progress_percent: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  retry_count: number;
  edge_server?: {
    id: number;
    edge_id: string;
    name: string;
  };
}

export const modelTrainingApi = {
  getDatasets: async (): Promise<TrainingDataset[]> => {
    try {
      // FIXED: Remove duplicate /api/v1 prefix
      const response = await apiClient.get('/training/datasets');
      // The backend returns a paginated response with data in the `data` property. Normalise to array.
      const data = (response as any).data;
      if (!data) return [];
      // If the backend wraps paginated results (Laravel) under 'data' key, flatten accordingly.
      if (Array.isArray(data.data)) {
        return data.data as TrainingDataset[];
      }
      return Array.isArray(data) ? (data as TrainingDataset[]) : [];
    } catch (error) {
      console.error('Error fetching datasets:', error);
      return [];
    }
  },

  getDataset: async (id: string): Promise<TrainingDataset> => {
    // FIXED: Remove duplicate /api/v1 prefix
    const response = await apiClient.get(`/training/datasets/${id}`);
    return response.data;
  },

  createDataset: async (data: Partial<TrainingDataset>): Promise<TrainingDataset> => {
    // FIXED: Remove duplicate /api/v1 prefix
    const response = await apiClient.post('/training/datasets', data);
    return response.data;
  },

  updateDataset: async (id: string, data: Partial<TrainingDataset>): Promise<TrainingDataset> => {
    // FIXED: Remove duplicate /api/v1 prefix
    const response = await apiClient.put(`/training/datasets/${id}`, data);
    return response.data;
  },

  deleteDataset: async (id: string): Promise<void> => {
    // FIXED: Remove duplicate /api/v1 prefix
    await apiClient.delete(`/training/datasets/${id}`);
  },

  getSamples: async (datasetId: string, params?: {
    page?: number;
    per_page?: number;
    is_labeled?: boolean;
    is_verified?: boolean;
  }): Promise<{ data: TrainingSample[]; total: number }> => {
    // FIXED: Remove duplicate /api/v1 prefix
    const response = await apiClient.get(`/training/datasets/${datasetId}/samples`, { params });
    return response.data;
  },

  uploadSample: async (datasetId: string, file: File, metadata?: Record<string, unknown>): Promise<TrainingSample> => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    // FIXED: Remove duplicate /api/v1 prefix - apiClient already includes it
    const response = await apiClient.post(`/training/datasets/${datasetId}/samples`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateSample: async (datasetId: string, sampleId: string, data: Partial<TrainingSample>): Promise<TrainingSample> => {
    // FIXED: Remove duplicate /api/v1 prefix
    const response = await apiClient.put(`/training/datasets/${datasetId}/samples/${sampleId}`, data);
    return response.data;
  },

  deleteSample: async (datasetId: string, sampleId: string): Promise<void> => {
    // FIXED: Remove duplicate /api/v1 prefix
    await apiClient.delete(`/training/datasets/${datasetId}/samples/${sampleId}`);
  },

  verifySample: async (datasetId: string, sampleId: string, approved: boolean, reason?: string): Promise<TrainingSample> => {
    // FIXED: Remove duplicate /api/v1 prefix
    const response = await apiClient.post(`/training/datasets/${datasetId}/samples/${sampleId}/verify`, {
      approved,
      rejection_reason: reason,
    });
    return response.data;
  },

  getJobs: async (params?: { status?: string; ai_module?: string }): Promise<TrainingJob[]> => {
    try {
      // FIXED: Remove duplicate /api/v1 prefix
      const response = await apiClient.get('/training/jobs', { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }
  },

  getJob: async (id: string): Promise<TrainingJob> => {
    // FIXED: Remove duplicate /api/v1 prefix
    const response = await apiClient.get(`/training/jobs/${id}`);
    return response.data;
  },

  createJob: async (data: Partial<TrainingJob>): Promise<TrainingJob> => {
    // FIXED: Remove duplicate /api/v1 prefix
    const response = await apiClient.post('/training/jobs', data);
    return response.data;
  },

  cancelJob: async (id: string): Promise<TrainingJob> => {
    // FIXED: Remove duplicate /api/v1 prefix
    const response = await apiClient.post(`/training/jobs/${id}/cancel`);
    return response.data;
  },

  getJobLogs: async (id: string): Promise<string> => {
    // FIXED: Remove duplicate /api/v1 prefix
    const response = await apiClient.get(`/training/jobs/${id}/logs`);
    return response.data;
  },

  getModelVersions: async (params?: { ai_module?: string; status?: string }): Promise<AiModelVersion[]> => {
    try {
      // FIXED: Remove duplicate /api/v1 prefix
      const response = await apiClient.get('/training/models', { params });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching model versions:', error);
      return [];
    }
  },

  getModelVersion: async (id: string): Promise<AiModelVersion> => {
    // FIXED: Remove duplicate /api/v1 prefix
    const response = await apiClient.get(`/training/models/${id}`);
    return response.data;
  },

  updateModelVersion: async (id: string, data: Partial<AiModelVersion>): Promise<AiModelVersion> => {
    // FIXED: Remove duplicate /api/v1 prefix
    const response = await apiClient.put(`/training/models/${id}`, data);
    return response.data;
  },

  approveModelVersion: async (id: string): Promise<AiModelVersion> => {
    // FIXED: Remove duplicate /api/v1 prefix
    const response = await apiClient.post(`/training/models/${id}/approve`);
    return response.data;
  },

  releaseModelVersion: async (id: string, releaseNotes?: string): Promise<AiModelVersion> => {
    // FIXED: Remove duplicate /api/v1 prefix
    const response = await apiClient.post(`/training/models/${id}/release`, { release_notes: releaseNotes });
    return response.data;
  },

  deprecateModelVersion: async (id: string): Promise<AiModelVersion> => {
    // FIXED: Remove duplicate /api/v1 prefix
    const response = await apiClient.post(`/training/models/${id}/deprecate`);
    return response.data;
  },

  getDeployments: async (modelVersionId: string): Promise<ModelDeployment[]> => {
    try {
      // FIXED: Remove duplicate /api/v1 prefix
      const response = await apiClient.get(`/training/models/${modelVersionId}/deployments`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching deployments:', error);
      return [];
    }
  },

  deployToEdgeServer: async (modelVersionId: string, edgeServerId: number): Promise<ModelDeployment> => {
    // FIXED: Remove duplicate /api/v1 prefix
    const response = await apiClient.post(`/training/models/${modelVersionId}/deploy`, {
      edge_server_id: edgeServerId,
    });
    return response.data;
  },

  deployToAllEdgeServers: async (modelVersionId: string): Promise<ModelDeployment[]> => {
    // FIXED: Remove duplicate /api/v1 prefix
    const response = await apiClient.post(`/training/models/${modelVersionId}/deploy-all`);
    return response.data;
  },

  retryDeployment: async (deploymentId: string): Promise<ModelDeployment> => {
    // FIXED: Remove duplicate /api/v1 prefix
    const response = await apiClient.post(`/training/deployments/${deploymentId}/retry`);
    return response.data;
  },
};
