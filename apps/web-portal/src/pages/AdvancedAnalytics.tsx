import { useState, useEffect } from 'react';
import {
  Calendar,
  Download,
  FileText,
  Filter,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Loader2,
  Plus,
  FileDown,
  Mail,
  ChevronDown,
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { advancedAnalyticsApi, AnalyticsSummary, TimeSeriesData, AnalyticsReport } from '../lib/api/advancedAnalytics';
import { camerasApi } from '../lib/api/cameras';
import { edgeServersApi } from '../lib/api/edgeServers';
import { aiModulesApi } from '../lib/api/aiModules';

interface DateRange {
  start: string;
  end: string;
}

interface Filters {
  eventTypes: string[];
  severities: string[];
  aiModules: string[];
  cameraIds: string[];
  edgeServerIds: number[];
}

const EVENT_TYPES = [
  'intrusion_detection',
  'fire_detection',
  'face_recognition',
  'vehicle_recognition',
  'people_counter',
  'weapon_detection',
  'object_detection',
];

const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#10B981',
  info: '#6B7280',
};

export function AdvancedAnalytics() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  });
  const [customDateRange, setCustomDateRange] = useState<DateRange>(dateRange);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    eventTypes: [],
    severities: [],
    aiModules: [],
    cameraIds: [],
    edgeServerIds: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [reports, setReports] = useState<AnalyticsReport[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [edgeServers, setEdgeServers] = useState<any[]>([]);
  const [aiModules, setAiModules] = useState<any[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    description: '',
    format: 'pdf',
    isScheduled: false,
    scheduleCron: '',
    recipients: '',
  });

  useEffect(() => {
    fetchData();
    fetchFilterOptions();
  }, [dateRange, filters]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        start_date: dateRange.start,
        end_date: dateRange.end,
        event_types: filters.eventTypes.length > 0 ? filters.eventTypes : undefined,
        severities: filters.severities.length > 0 ? filters.severities : undefined,
        ai_modules: filters.aiModules.length > 0 ? filters.aiModules : undefined,
        camera_ids: filters.cameraIds.length > 0 ? filters.cameraIds : undefined,
        edge_server_ids: filters.edgeServerIds.length > 0 ? filters.edgeServerIds : undefined,
      };

      const [summaryData, timeSeriesData] = await Promise.all([
        advancedAnalyticsApi.getSummary(params),
        advancedAnalyticsApi.getTimeSeries({ ...params, group_by: 'day' }),
      ]);

      setSummary(summaryData);
      setTimeSeries(timeSeriesData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [camerasData, serversData, modulesData] = await Promise.all([
        camerasApi.getCameras({ per_page: 1000 }),
        edgeServersApi.getEdgeServers({ per_page: 1000 }),
        aiModulesApi.getModules(),
      ]);

      setCameras(camerasData.data || []);
      setEdgeServers(serversData.data || []);
      setAiModules(modulesData || []);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const reportsData = await advancedAnalyticsApi.getReports();
      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const applyPreset = (preset: string) => {
    const end = new Date();
    const start = new Date();

    switch (preset) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'last7':
        start.setDate(start.getDate() - 7);
        break;
      case 'last30':
        start.setDate(start.getDate() - 30);
        break;
      case 'thisMonth':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      default:
        return;
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
    setShowCustomDate(false);
  };

  const applyCustomDateRange = () => {
    setDateRange(customDateRange);
    setShowCustomDate(false);
  };

  const toggleFilter = (filterType: keyof Filters, value: any) => {
    setFilters((prev) => {
      const currentValues = prev[filterType] as any[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, [filterType]: newValues };
    });
  };

  const handleExportCSV = async () => {
    try {
      const blob = await advancedAnalyticsApi.exportData({
        start_date: dateRange.start,
        end_date: dateRange.end,
        format: 'csv',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${dateRange.start}-to-${dateRange.end}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const report = await advancedAnalyticsApi.createReport({
        name: `Analytics Report ${new Date().toISOString()}`,
        report_type: 'analytics_summary',
        format: 'pdf',
        date_range_start: dateRange.start,
        date_range_end: dateRange.end,
        parameters: {},
        filters: filters,
      });

      const result = await advancedAnalyticsApi.generateReport(report.id);
      if (result.file_url) {
        window.open(result.file_url, '_blank');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const handleCreateReport = async () => {
    try {
      const report = await advancedAnalyticsApi.createReport({
        name: newReport.name,
        description: newReport.description,
        report_type: 'analytics_summary',
        format: newReport.format as 'pdf' | 'csv',
        date_range_start: dateRange.start,
        date_range_end: dateRange.end,
        parameters: {},
        filters: filters,
        is_scheduled: newReport.isScheduled,
        schedule_cron: newReport.isScheduled ? newReport.scheduleCron : null,
        recipients: newReport.recipients ? newReport.recipients.split(',').map((e) => e.trim()) : null,
      });

      setReports([...reports, report]);
      setShowReportModal(false);
      setNewReport({
        name: '',
        description: '',
        format: 'pdf',
        isScheduled: false,
        scheduleCron: '',
        recipients: '',
      });
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  const acknowledgedRate = summary
    ? summary.total_events > 0
      ? ((summary.total_acknowledged / summary.total_events) * 100).toFixed(1)
      : '0.0'
    : '0.0';

  const resolvedRate = summary
    ? summary.total_events > 0
      ? ((summary.total_resolved / summary.total_events) * 100).toFixed(1)
      : '0.0'
    : '0.0';

  const falsePositiveRate = summary
    ? summary.total_events > 0
      ? ((summary.total_false_positives / summary.total_events) * 100).toFixed(1)
      : '0.0'
    : '0.0';

  const avgResponseTime = summary
    ? summary.avg_response_time > 0
      ? summary.avg_response_time < 60
        ? `${summary.avg_response_time.toFixed(1)}s`
        : `${(summary.avg_response_time / 60).toFixed(1)}m`
      : 'N/A'
    : 'N/A';

  const maxTimeSeriesValue = timeSeries.length > 0 ? Math.max(...timeSeries.map((d) => d.value)) : 0;

  const eventsByTypeEntries = summary ? Object.entries(summary.events_by_type) : [];
  const totalEventsByType = eventsByTypeEntries.reduce((sum, [, count]) => sum + count, 0);

  const eventsBySeverityEntries = summary ? Object.entries(summary.events_by_severity) : [];
  const maxSeverityCount = Math.max(...eventsBySeverityEntries.map(([, count]) => count), 1);

  const eventsByModuleEntries = summary ? Object.entries(summary.events_by_module) : [];
  const maxModuleCount = Math.max(...eventsByModuleEntries.map(([, count]) => count), 1);

  if (loading && !summary) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Advanced Analytics</h1>
            <p className="text-white/60">Comprehensive analytics and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => applyPreset('today')}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => applyPreset('last7')}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              Last 7 days
            </button>
            <button
              onClick={() => applyPreset('last30')}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              Last 30 days
            </button>
            <button
              onClick={() => applyPreset('thisMonth')}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              This month
            </button>
            <button
              onClick={() => setShowCustomDate(!showCustomDate)}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Custom
            </button>

            {showCustomDate && (
              <div className="flex items-center gap-3 ml-4">
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) =>
                    setCustomDateRange({ ...customDateRange, start: e.target.value })
                  }
                  className="input"
                />
                <span className="text-white/60">to</span>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) =>
                    setCustomDateRange({ ...customDateRange, end: e.target.value })
                  }
                  className="input"
                />
                <button onClick={applyCustomDateRange} className="btn-primary">
                  Apply
                </button>
              </div>
            )}

            <div className="ml-auto text-white/60 text-sm">
              {dateRange.start} to {dateRange.end}
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Event Types
                </label>
                <div className="space-y-2">
                  {EVENT_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm text-white/70">
                      <input
                        type="checkbox"
                        checked={filters.eventTypes.includes(type)}
                        onChange={() => toggleFilter('eventTypes', type)}
                        className="rounded border-white/20 bg-white/5 text-blue-500"
                      />
                      {type.replace(/_/g, ' ')}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Severity
                </label>
                <div className="space-y-2">
                  {SEVERITIES.map((severity) => (
                    <label key={severity} className="flex items-center gap-2 text-sm text-white/70">
                      <input
                        type="checkbox"
                        checked={filters.severities.includes(severity)}
                        onChange={() => toggleFilter('severities', severity)}
                        className="rounded border-white/20 bg-white/5 text-blue-500"
                      />
                      {severity}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  AI Modules
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {aiModules.map((module) => (
                    <label key={module.id} className="flex items-center gap-2 text-sm text-white/70">
                      <input
                        type="checkbox"
                        checked={filters.aiModules.includes(module.module_key)}
                        onChange={() => toggleFilter('aiModules', module.module_key)}
                        className="rounded border-white/20 bg-white/5 text-blue-500"
                      />
                      {module.name}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Cameras
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {cameras.map((camera) => (
                    <label key={camera.id} className="flex items-center gap-2 text-sm text-white/70">
                      <input
                        type="checkbox"
                        checked={filters.cameraIds.includes(camera.id)}
                        onChange={() => toggleFilter('cameraIds', camera.id)}
                        className="rounded border-white/20 bg-white/5 text-blue-500"
                      />
                      {camera.name}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Edge Servers
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {edgeServers.map((server) => (
                    <label key={server.id} className="flex items-center gap-2 text-sm text-white/70">
                      <input
                        type="checkbox"
                        checked={filters.edgeServerIds.includes(server.id)}
                        onChange={() => toggleFilter('edgeServerIds', server.id)}
                        className="rounded border-white/20 bg-white/5 text-blue-500"
                      />
                      {server.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
                <Activity className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {summary?.total_events.toLocaleString() || 0}
            </p>
            <p className="text-sm text-white/60">Total Events</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{acknowledgedRate}%</p>
            <p className="text-sm text-white/60">Acknowledged Rate</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
                <CheckCircle className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{resolvedRate}%</p>
            <p className="text-sm text-white/60">Resolved Rate</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{avgResponseTime}</p>
            <p className="text-sm text-white/60">Avg Response Time</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{falsePositiveRate}%</p>
            <p className="text-sm text-white/60">False Positive Rate</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Events Over Time
              </h2>
            </div>
            <div className="h-64">
              {timeSeries.length > 0 ? (
                <div className="flex items-end justify-between h-full gap-1">
                  {timeSeries.map((data, index) => {
                    const height = maxTimeSeriesValue > 0 ? (data.value / maxTimeSeriesValue) * 100 : 0;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center justify-end group">
                        <div className="relative w-full">
                          <div
                            className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-400 hover:to-blue-300"
                            style={{ height: `${height}%`, minHeight: data.value > 0 ? '4px' : '0' }}
                          />
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {data.value} events
                          </div>
                        </div>
                        <div className="text-xs text-white/40 mt-2 truncate w-full text-center">
                          {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-white/40">
                  No data available
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-blue-500" />
                Events by Type
              </h2>
            </div>
            <div className="h-64">
              {eventsByTypeEntries.length > 0 ? (
                <div className="space-y-3">
                  {eventsByTypeEntries.slice(0, 8).map(([type, count], index) => {
                    const percentage = totalEventsByType > 0 ? (count / totalEventsByType) * 100 : 0;
                    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
                    const color = colors[index % colors.length];
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white/70">{type.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-medium text-white">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${percentage}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-white/40">
                  No data available
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Events by Severity</h2>
            </div>
            <div className="h-64">
              {eventsBySeverityEntries.length > 0 ? (
                <div className="flex items-end justify-between h-full gap-4">
                  {eventsBySeverityEntries.map(([severity, count]) => {
                    const height = (count / maxSeverityCount) * 100;
                    return (
                      <div key={severity} className="flex-1 flex flex-col items-center">
                        <div className="text-lg font-semibold text-white mb-2">{count}</div>
                        <div className="w-full relative group">
                          <div
                            className="w-full rounded-t transition-all"
                            style={{
                              height: `${height}%`,
                              minHeight: count > 0 ? '20px' : '0',
                              backgroundColor: SEVERITY_COLORS[severity] || '#6B7280',
                            }}
                          />
                        </div>
                        <div className="text-sm text-white/60 mt-3 capitalize">{severity}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-white/40">
                  No data available
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Events by AI Module</h2>
            </div>
            <div className="h-64">
              {eventsByModuleEntries.length > 0 ? (
                <div className="space-y-4">
                  {eventsByModuleEntries.slice(0, 6).map(([module, count]) => {
                    const width = (count / maxModuleCount) * 100;
                    return (
                      <div key={module}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-white/70">{module}</span>
                          <span className="text-sm font-medium text-white">{count}</span>
                        </div>
                        <div className="w-full h-8 bg-white/5 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg transition-all"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-white/40">
                  No data available
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Export Options</h2>
            <div className="flex items-center gap-3">
              <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2">
                <FileDown className="w-4 h-4" />
                Export CSV
              </button>
              <button onClick={handleExportPDF} className="btn-primary flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Reports</h2>
            <button
              onClick={() => setShowReportModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Report
            </button>
          </div>

          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <h3 className="font-medium text-white">{report.name}</h3>
                      <p className="text-sm text-white/60">
                        {report.is_scheduled ? (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            Scheduled
                          </span>
                        ) : (
                          'One-time'
                        )}
                        {' • '}
                        {report.format.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        report.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : report.status === 'failed'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {report.status}
                    </span>
                    {report.file_url && (
                      <button
                        onClick={() => window.open(report.file_url!, '_blank')}
                        className="btn-secondary text-sm"
                      >
                        Download
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-white/40">
              No reports available. Create your first report to get started.
            </div>
          )}
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold text-white mb-4">Create New Report</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Report Name
                </label>
                <input
                  type="text"
                  value={newReport.name}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                  className="input w-full"
                  placeholder="Monthly Analytics Report"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Description
                </label>
                <textarea
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                  className="input w-full"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Format</label>
                <select
                  value={newReport.format}
                  onChange={(e) => setNewReport({ ...newReport, format: e.target.value })}
                  className="input w-full"
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={newReport.isScheduled}
                    onChange={(e) =>
                      setNewReport({ ...newReport, isScheduled: e.target.checked })
                    }
                    className="rounded border-white/20 bg-white/5 text-blue-500"
                  />
                  Schedule Report
                </label>
              </div>

              {newReport.isScheduled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Schedule (Cron Expression)
                    </label>
                    <input
                      type="text"
                      value={newReport.scheduleCron}
                      onChange={(e) =>
                        setNewReport({ ...newReport, scheduleCron: e.target.value })
                      }
                      className="input w-full"
                      placeholder="0 0 * * 1"
                    />
                    <p className="text-xs text-white/40 mt-1">
                      Example: 0 0 * * 1 (Every Monday at midnight)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Recipients (comma-separated emails)
                    </label>
                    <input
                      type="text"
                      value={newReport.recipients}
                      onChange={(e) =>
                        setNewReport({ ...newReport, recipients: e.target.value })
                      }
                      className="input w-full"
                      placeholder="user1@example.com, user2@example.com"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowReportModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReport}
                disabled={!newReport.name}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Report
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
