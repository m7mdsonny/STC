import { useState, useEffect } from 'react';
import {
  Database, Brain, Play, CheckCircle, XCircle, Clock,
  Upload, Trash2, Eye, Download, Server, Activity,
  BarChart3, FileText, AlertCircle, RefreshCw, Plus,
  Pause, Settings, Package, Rocket, Archive
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { modelTrainingApi } from '../../lib/api/modelTraining';
import { useToast } from '../../contexts/ToastContext';
import type { TrainingDataset, TrainingJob, AiModelVersion, ModelDeployment } from '../../lib/api/modelTraining';
import { formatDistanceToNow } from 'date-fns';

type TabType = 'datasets' | 'jobs' | 'versions' | 'deployments';

export function ModelTraining() {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('datasets');
  const [loading, setLoading] = useState(true);

  const [datasets, setDatasets] = useState<TrainingDataset[]>([]);
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [modelVersions, setModelVersions] = useState<AiModelVersion[]>([]);
  const [deployments, setDeployments] = useState<ModelDeployment[]>([]);

  const [showCreateDatasetModal, setShowCreateDatasetModal] = useState(false);
  const [showUploadSampleModal, setShowUploadSampleModal] = useState(false);
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [showJobLogsModal, setShowJobLogsModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);

  const [selectedDataset, setSelectedDataset] = useState<TrainingDataset | null>(null);
  const [selectedJob, setSelectedJob] = useState<TrainingJob | null>(null);
  const [selectedModel, setSelectedModel] = useState<AiModelVersion | null>(null);
  const [jobLogs, setJobLogs] = useState<string>('');
  const [releaseNotes, setReleaseNotes] = useState('');

  const [newDataset, setNewDataset] = useState({
    name: '',
    description: '',
    ai_module: 'face_recognition',
    label_schema: [{ name: 'person', color: '#3B82F6' }]
  });

  const [newJob, setNewJob] = useState({
    name: '',
    description: '',
    dataset_id: '',
    ai_module: 'face_recognition',
    base_model_version: '',
    hyperparameters: {
      epochs: 10,
      batch_size: 32,
      learning_rate: 0.001
    }
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'datasets') {
        const data = await modelTrainingApi.getDatasets();
        setDatasets(Array.isArray(data) ? data : []);
      } else if (activeTab === 'jobs') {
        const data = await modelTrainingApi.getJobs();
        setJobs(Array.isArray(data) ? data : []);
      } else if (activeTab === 'versions') {
        const data = await modelTrainingApi.getModelVersions();
        setModelVersions(Array.isArray(data) ? data : []);
      } else if (activeTab === 'deployments' && selectedModel) {
        const data = await modelTrainingApi.getDeployments(selectedModel.id);
        setDeployments(Array.isArray(data) ? data : []);
      } else if (activeTab === 'deployments' && !selectedModel) {
        setDeployments([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays to prevent crashes
      if (activeTab === 'datasets') setDatasets([]);
      else if (activeTab === 'jobs') setJobs([]);
      else if (activeTab === 'versions') setModelVersions([]);
      else if (activeTab === 'deployments') setDeployments([]);
      
      // Show user-friendly error message
      showError('خطأ في التحميل', 'فشل تحميل البيانات. قد تكون واجهة برمجة التطبيقات غير متاحة بعد.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDataset = async () => {
    try {
      await modelTrainingApi.createDataset(newDataset);
      showSuccess('تم الإنشاء', 'تم إنشاء مجموعة البيانات بنجاح');
      setShowCreateDatasetModal(false);
      setNewDataset({
        name: '',
        description: '',
        ai_module: 'face_recognition',
        label_schema: [{ name: 'person', color: '#3B82F6' }]
      });
      fetchData();
    } catch (error) {
      console.error('Error creating dataset:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل إنشاء مجموعة البيانات';
      showError('خطأ', errorMessage);
    }
  };

  const handleUploadSample = async () => {
    if (!uploadFile || !selectedDataset) return;
    try {
      await modelTrainingApi.uploadSample(selectedDataset.id, uploadFile);
      showSuccess('تم الرفع', 'تم رفع العينة بنجاح');
      setShowUploadSampleModal(false);
      setUploadFile(null);
      fetchData();
    } catch (error) {
      console.error('Error uploading sample:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل رفع العينة';
      showError('خطأ', errorMessage);
    }
  };

  const handleDeleteDataset = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف مجموعة البيانات هذه؟')) return;
    try {
      await modelTrainingApi.deleteDataset(id);
      showSuccess('تم الحذف', 'تم حذف مجموعة البيانات بنجاح');
      fetchData();
    } catch (error) {
      console.error('Error deleting dataset:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل حذف مجموعة البيانات';
      showError('خطأ', errorMessage);
    }
  };

  const handleCreateJob = async () => {
    try {
      await modelTrainingApi.createJob(newJob);
      showSuccess('تم الإنشاء', 'تم إنشاء مهمة التدريب بنجاح');
      setShowCreateJobModal(false);
      setNewJob({
        name: '',
        description: '',
        dataset_id: '',
        ai_module: 'face_recognition',
        base_model_version: '',
        hyperparameters: {
          epochs: 10,
          batch_size: 32,
          learning_rate: 0.001
        }
      });
      fetchData();
    } catch (error) {
      console.error('Error creating job:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل إنشاء مهمة التدريب';
      showError('خطأ', errorMessage);
    }
  };

  const handleCancelJob = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذه المهمة؟')) return;
    try {
      await modelTrainingApi.cancelJob(id);
      showSuccess('تم الإلغاء', 'تم إلغاء المهمة بنجاح');
      fetchData();
    } catch (error) {
      console.error('Error canceling job:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل إلغاء المهمة';
      showError('خطأ', errorMessage);
    }
  };

  const handleViewLogs = async (job: TrainingJob) => {
    setSelectedJob(job);
    try {
      const logs = await modelTrainingApi.getJobLogs(job.id);
      setJobLogs(logs);
      setShowJobLogsModal(true);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleApproveModel = async (id: string) => {
    try {
      await modelTrainingApi.approveModelVersion(id);
      showSuccess('تم الموافقة', 'تم الموافقة على النموذج بنجاح');
      fetchData();
    } catch (error) {
      console.error('Error approving model:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل الموافقة على النموذج';
      showError('خطأ', errorMessage);
    }
  };

  const handleReleaseModel = async () => {
    if (!selectedModel) return;
    try {
      await modelTrainingApi.releaseModelVersion(selectedModel.id, releaseNotes);
      showSuccess('تم الإصدار', 'تم إصدار النموذج بنجاح');
      setShowReleaseModal(false);
      setReleaseNotes('');
      setSelectedModel(null);
      fetchData();
    } catch (error) {
      console.error('Error releasing model:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل إصدار النموذج';
      showError('خطأ', errorMessage);
    }
  };

  const handleDeprecateModel = async (id: string) => {
    if (!confirm('هل أنت متأكد من إيقاف استخدام هذا النموذج؟')) return;
    try {
      await modelTrainingApi.deprecateModelVersion(id);
      fetchData();
    } catch (error) {
      console.error('Error deprecating model:', error);
    }
  };

  const handleDeployToServer = async (edgeServerId: number) => {
    if (!selectedModel) return;
    try {
      await modelTrainingApi.deployToEdgeServer(selectedModel.id, edgeServerId);
      fetchData();
    } catch (error) {
      console.error('Error deploying model:', error);
    }
  };

  const handleDeployToAll = async () => {
    if (!selectedModel) return;
    if (!confirm('Deploy this model to all edge servers?')) return;
    try {
      await modelTrainingApi.deployToAllEdgeServers(selectedModel.id);
      fetchData();
    } catch (error) {
      console.error('Error deploying model:', error);
    }
  };

  const handleRetryDeployment = async (id: string) => {
    try {
      await modelTrainingApi.retryDeployment(id);
      fetchData();
    } catch (error) {
      console.error('Error retrying deployment:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-gray-500/20 text-gray-400', label: 'Pending' },
      queued: { color: 'bg-gray-500/20 text-gray-400', label: 'Queued' },
      running: { color: 'bg-blue-500/20 text-blue-400', label: 'Running' },
      completed: { color: 'bg-green-500/20 text-green-400', label: 'Completed' },
      failed: { color: 'bg-red-500/20 text-red-400', label: 'Failed' },
      cancelled: { color: 'bg-gray-500/20 text-gray-400', label: 'Cancelled' },
      draft: { color: 'bg-gray-500/20 text-gray-400', label: 'Draft' },
      testing: { color: 'bg-blue-500/20 text-blue-400', label: 'Testing' },
      approved: { color: 'bg-green-500/20 text-green-400', label: 'Approved' },
      released: { color: 'bg-blue-500/20 text-blue-400', label: 'Released' },
      deprecated: { color: 'bg-orange-500/20 text-orange-400', label: 'Deprecated' },
      downloading: { color: 'bg-blue-500/20 text-blue-400', label: 'Downloading' },
      installing: { color: 'bg-blue-500/20 text-blue-400', label: 'Installing' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const renderDatasetsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Training Datasets</h2>
          <p className="text-white/60">Manage datasets for AI model training</p>
        </div>
        <button
          onClick={() => setShowCreateDatasetModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Dataset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {datasets.map((dataset) => (
          <div key={dataset.id} className="card p-6 hover:border-blue-500/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">{dataset.name}</h3>
                  <p className="text-sm text-white/60">{dataset.ai_module}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-white/70 mb-4">{dataset.description}</p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <div className="text-lg font-semibold">{dataset.sample_count}</div>
                <div className="text-xs text-white/60">Total</div>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <div className="text-lg font-semibold">{dataset.labeled_count}</div>
                <div className="text-xs text-white/60">Labeled</div>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <div className="text-lg font-semibold">{dataset.verified_count}</div>
                <div className="text-xs text-white/60">Verified</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedDataset(dataset);
                  setShowUploadSampleModal(true);
                }}
                className="flex-1 btn-secondary text-sm py-2"
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
              <button
                onClick={() => handleDeleteDataset(dataset.id)}
                className="btn-secondary text-red-400 hover:bg-red-500/20 p-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderJobsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Training Jobs</h2>
          <p className="text-white/60">Monitor and manage training jobs</p>
        </div>
        <button
          onClick={() => setShowCreateJobModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Job
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-right p-4 text-sm font-medium text-white/70">Job Name</th>
                <th className="text-right p-4 text-sm font-medium text-white/70">AI Module</th>
                <th className="text-right p-4 text-sm font-medium text-white/70">Status</th>
                <th className="text-right p-4 text-sm font-medium text-white/70">Progress</th>
                <th className="text-right p-4 text-sm font-medium text-white/70">Metrics</th>
                <th className="text-right p-4 text-sm font-medium text-white/70">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-white/5">
                  <td className="p-4">
                    <div>
                      <div className="font-medium">{job.name}</div>
                      <div className="text-sm text-white/60">{job.description}</div>
                    </div>
                  </td>
                  <td className="p-4 text-sm">{job.ai_module}</td>
                  <td className="p-4">{getStatusBadge(job.status)}</td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{job.progress_percent}%</span>
                        {job.current_epoch && job.total_epochs && (
                          <span className="text-white/60">
                            Epoch {job.current_epoch}/{job.total_epochs}
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${job.progress_percent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {job.metrics && (
                      <div className="text-sm space-y-1">
                        {job.metrics.accuracy && (
                          <div>Acc: {(job.metrics.accuracy * 100).toFixed(1)}%</div>
                        )}
                        {job.metrics.loss && (
                          <div className="text-white/60">Loss: {job.metrics.loss.toFixed(4)}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewLogs(job)}
                        className="btn-secondary p-2"
                        title="View Logs"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      {job.status === 'running' && (
                        <button
                          onClick={() => handleCancelJob(job.id)}
                          className="btn-secondary text-red-400 hover:bg-red-500/20 p-2"
                          title="Cancel Job"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderVersionsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Model Versions</h2>
          <p className="text-white/60">Manage AI model versions and releases</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {modelVersions.map((model) => (
          <div key={model.id} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/20">
                  <Brain className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{model.name || model.version}</h3>
                    {getStatusBadge(model.status)}
                  </div>
                  <p className="text-sm text-white/60 mt-1">{model.ai_module}</p>
                  <p className="text-sm text-white/70 mt-2">{model.description}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {model.accuracy && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-sm text-white/60 mb-1">Accuracy</div>
                  <div className="text-xl font-semibold">{(model.accuracy * 100).toFixed(1)}%</div>
                </div>
              )}
              {model.precision_score && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-sm text-white/60 mb-1">Precision</div>
                  <div className="text-xl font-semibold">{(model.precision_score * 100).toFixed(1)}%</div>
                </div>
              )}
              {model.recall_score && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-sm text-white/60 mb-1">Recall</div>
                  <div className="text-xl font-semibold">{(model.recall_score * 100).toFixed(1)}%</div>
                </div>
              )}
              {model.f1_score && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-sm text-white/60 mb-1">F1 Score</div>
                  <div className="text-xl font-semibold">{(model.f1_score * 100).toFixed(1)}%</div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!model.is_approved && model.status === 'testing' && (
                <button
                  onClick={() => handleApproveModel(model.id)}
                  className="btn-primary flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
              )}
              {model.is_approved && !model.is_released && (
                <button
                  onClick={() => {
                    setSelectedModel(model);
                    setShowReleaseModal(true);
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Rocket className="w-4 h-4" />
                  Release
                </button>
              )}
              {model.is_released && model.status !== 'deprecated' && (
                <>
                  <button
                    onClick={() => {
                      setSelectedModel(model);
                      setActiveTab('deployments');
                      fetchData();
                    }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Server className="w-4 h-4" />
                    Deploy
                  </button>
                  <button
                    onClick={() => handleDeprecateModel(model.id)}
                    className="btn-secondary text-orange-400 hover:bg-orange-500/20 flex items-center gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    Deprecate
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDeploymentsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Model Deployments</h2>
          <p className="text-white/60">Deploy models to edge servers</p>
        </div>
        {selectedModel && (
          <button
            onClick={handleDeployToAll}
            className="btn-primary flex items-center gap-2"
          >
            <Server className="w-4 h-4" />
            Deploy to All Servers
          </button>
        )}
      </div>

      {selectedModel ? (
        <>
          <div className="card p-4 bg-blue-500/10 border-blue-500/30">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-blue-400" />
              <div>
                <div className="font-semibold">Selected Model: {selectedModel.name || selectedModel.version}</div>
                <div className="text-sm text-white/60">{selectedModel.ai_module}</div>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-white/70">Edge Server</th>
                    <th className="text-left p-4 text-sm font-medium text-white/70">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-white/70">Progress</th>
                    <th className="text-left p-4 text-sm font-medium text-white/70">Details</th>
                    <th className="text-left p-4 text-sm font-medium text-white/70">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {deployments.map((deployment) => (
                    <tr key={deployment.id} className="hover:bg-white/5">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Server className="w-4 h-4 text-white/60" />
                          <div>
                            <div className="font-medium">
                              {deployment.edge_server?.name || `Server ${deployment.edge_server_id}`}
                            </div>
                            <div className="text-sm text-white/60">
                              {deployment.edge_server?.edge_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(deployment.status)}</td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="text-sm">{deployment.progress_percent}%</div>
                          <div className="w-32 bg-white/10 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${deployment.progress_percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm space-y-1">
                          {deployment.started_at && (
                            <div className="text-white/60">
                              Started {formatDistanceToNow(new Date(deployment.started_at), { addSuffix: true })}
                            </div>
                          )}
                          {deployment.error_message && (
                            <div className="text-red-400 text-xs">{deployment.error_message}</div>
                          )}
                          {deployment.retry_count > 0 && (
                            <div className="text-orange-400 text-xs">
                              Retries: {deployment.retry_count}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {deployment.status === 'failed' && (
                          <button
                            onClick={() => handleRetryDeployment(deployment.id)}
                            className="btn-secondary flex items-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <p className="text-white/60">Select a model from the Model Versions tab to view deployments</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">تدريب نماذج الذكاء الاصطناعي</h1>
          <p className="text-white/60">تدريب ونشر نماذج الذكاء الاصطناعي المخصصة</p>
        </div>
        <button
          onClick={fetchData}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('datasets')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'datasets'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            مجموعات البيانات
          </div>
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'jobs'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            مهام التدريب
          </div>
        </button>
        <button
          onClick={() => setActiveTab('versions')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'versions'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Model Versions
          </div>
        </button>
        <button
          onClick={() => setActiveTab('deployments')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'deployments'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Deployments
          </div>
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading...</p>
        </div>
      ) : (
        <>
          {activeTab === 'datasets' && renderDatasetsTab()}
          {activeTab === 'jobs' && renderJobsTab()}
          {activeTab === 'versions' && renderVersionsTab()}
          {activeTab === 'deployments' && renderDeploymentsTab()}
        </>
      )}

      <Modal
        isOpen={showCreateDatasetModal}
        onClose={() => setShowCreateDatasetModal(false)}
        title="Create Training Dataset"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Dataset Name</label>
            <input
              type="text"
              value={newDataset.name}
              onChange={(e) => setNewDataset({ ...newDataset, name: e.target.value })}
              className="input"
              placeholder="Enter dataset name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={newDataset.description}
              onChange={(e) => setNewDataset({ ...newDataset, description: e.target.value })}
              className="input"
              rows={3}
              placeholder="Enter dataset description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">AI Module</label>
            <select
              value={newDataset.ai_module}
              onChange={(e) => setNewDataset({ ...newDataset, ai_module: e.target.value })}
              className="input"
            >
              <option value="face_recognition">Face Recognition</option>
              <option value="object_detection">Object Detection</option>
              <option value="license_plate">License Plate Recognition</option>
              <option value="person_detection">Person Detection</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Label Schema</label>
            <div className="space-y-2">
              {newDataset.label_schema.map((label, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={label.name}
                    onChange={(e) => {
                      const updated = [...newDataset.label_schema];
                      updated[index].name = e.target.value;
                      setNewDataset({ ...newDataset, label_schema: updated });
                    }}
                    className="input flex-1"
                    placeholder="Label name"
                  />
                  <input
                    type="color"
                    value={label.color}
                    onChange={(e) => {
                      const updated = [...newDataset.label_schema];
                      updated[index].color = e.target.value;
                      setNewDataset({ ...newDataset, label_schema: updated });
                    }}
                    className="w-12 h-10 rounded-lg cursor-pointer"
                  />
                  <button
                    onClick={() => {
                      const updated = newDataset.label_schema.filter((_, i) => i !== index);
                      setNewDataset({ ...newDataset, label_schema: updated });
                    }}
                    className="btn-secondary text-red-400 hover:bg-red-500/20 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  setNewDataset({
                    ...newDataset,
                    label_schema: [...newDataset.label_schema, { name: '', color: '#3B82F6' }]
                  });
                }}
                className="btn-secondary w-full"
              >
                <Plus className="w-4 h-4" />
                Add Label
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setShowCreateDatasetModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleCreateDataset} className="btn-primary">
              Create Dataset
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showUploadSampleModal}
        onClose={() => setShowUploadSampleModal(false)}
        title="Upload Training Sample"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Dataset</label>
            <input
              type="text"
              value={selectedDataset?.name || ''}
              disabled
              className="input bg-white/5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sample File</label>
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="input"
              accept="image/*,video/*"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setShowUploadSampleModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleUploadSample} className="btn-primary" disabled={!uploadFile}>
              Upload
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCreateJobModal}
        onClose={() => setShowCreateJobModal(false)}
        title="Create Training Job"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Job Name</label>
            <input
              type="text"
              value={newJob.name}
              onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
              className="input"
              placeholder="Enter job name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={newJob.description}
              onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
              className="input"
              rows={2}
              placeholder="Enter job description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Dataset</label>
            <select
              value={newJob.dataset_id}
              onChange={(e) => setNewJob({ ...newJob, dataset_id: e.target.value })}
              className="input"
            >
              <option value="">Select dataset</option>
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">AI Module</label>
            <select
              value={newJob.ai_module}
              onChange={(e) => setNewJob({ ...newJob, ai_module: e.target.value })}
              className="input"
            >
              <option value="face_recognition">Face Recognition</option>
              <option value="object_detection">Object Detection</option>
              <option value="license_plate">License Plate Recognition</option>
              <option value="person_detection">Person Detection</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Base Model Version</label>
            <input
              type="text"
              value={newJob.base_model_version}
              onChange={(e) => setNewJob({ ...newJob, base_model_version: e.target.value })}
              className="input"
              placeholder="e.g., v1.0.0"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium">Hyperparameters</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-white/60 mb-1">Epochs</label>
                <input
                  type="number"
                  value={newJob.hyperparameters.epochs}
                  onChange={(e) => setNewJob({
                    ...newJob,
                    hyperparameters: { ...newJob.hyperparameters, epochs: parseInt(e.target.value) }
                  })}
                  className="input"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Batch Size</label>
                <input
                  type="number"
                  value={newJob.hyperparameters.batch_size}
                  onChange={(e) => setNewJob({
                    ...newJob,
                    hyperparameters: { ...newJob.hyperparameters, batch_size: parseInt(e.target.value) }
                  })}
                  className="input"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Learning Rate</label>
                <input
                  type="number"
                  step="0.0001"
                  value={newJob.hyperparameters.learning_rate}
                  onChange={(e) => setNewJob({
                    ...newJob,
                    hyperparameters: { ...newJob.hyperparameters, learning_rate: parseFloat(e.target.value) }
                  })}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setShowCreateJobModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleCreateJob} className="btn-primary">
              Create Job
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showJobLogsModal}
        onClose={() => setShowJobLogsModal(false)}
        title={`Job Logs: ${selectedJob?.name}`}
        size="xl"
      >
        <div className="bg-black/50 rounded-lg p-4 font-mono text-sm max-h-96 overflow-auto">
          <pre className="text-green-400 whitespace-pre-wrap">{jobLogs || 'No logs available'}</pre>
        </div>
      </Modal>

      <Modal
        isOpen={showReleaseModal}
        onClose={() => setShowReleaseModal(false)}
        title="Release Model"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Model</label>
            <input
              type="text"
              value={selectedModel?.name || selectedModel?.version || ''}
              disabled
              className="input bg-white/5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Release Notes</label>
            <textarea
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              className="input"
              rows={4}
              placeholder="Enter release notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setShowReleaseModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleReleaseModel} className="btn-primary">
              Release Model
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
