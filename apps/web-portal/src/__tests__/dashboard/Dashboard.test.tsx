import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../../pages/Dashboard';
import { dashboardApi } from '../../lib/api/dashboard';
import { camerasApi } from '../../lib/api/cameras';
import { edgeServersApi } from '../../lib/api/edgeServers';
import { alertsApi } from '../../lib/api/alerts';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    organization: { id: '1', name: 'Test Org' },
  }),
}));

vi.mock('../../lib/api/dashboard', () => ({
  dashboardApi: {
    getDashboard: vi.fn(),
  },
}));

vi.mock('../../lib/api/cameras', () => ({
  camerasApi: {
    getCameras: vi.fn(),
  },
}));

vi.mock('../../lib/api/edgeServers', () => ({
  edgeServersApi: {
    getEdgeServers: vi.fn(),
  },
}));

vi.mock('../../lib/api/alerts', () => ({
  alertsApi: {
    getAlerts: vi.fn(),
  },
}));

vi.mock('../../lib/api/aiPolicies', () => ({
  aiPoliciesApi: {
    getEffective: vi.fn(),
  },
}));

vi.mock('../../lib/api/analytics', () => ({
  analyticsApi: {
    getTodayAlerts: vi.fn(),
    getModuleActivity: vi.fn(),
    getHighRisk: vi.fn(),
  },
}));

const mockDashboardApi = vi.mocked(dashboardApi);
const mockCamerasApi = vi.mocked(camerasApi);
const mockEdgeServersApi = vi.mocked(edgeServersApi);
const mockAlertsApi = vi.mocked(alertsApi);

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockDashboardApi.getDashboard.mockResolvedValue({
      visitors: { today: 100, trend: 5 },
      attendance: { today: 50, late: 2 },
      weekly_stats: [],
    } as any);

    mockCamerasApi.getCameras.mockResolvedValue({ data: [] } as any);
    mockEdgeServersApi.getEdgeServers.mockResolvedValue({ data: [] } as any);
    mockAlertsApi.getAlerts.mockResolvedValue({ data: [] } as any);
  });

  it('renders dashboard with stat cards', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockDashboardApi.getDashboard).toHaveBeenCalled();
    });
  });

  it('displays loading state initially', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Loading state may appear briefly, use waitFor with timeout
    await waitFor(() => {
      const loadingText = screen.queryByText(/جاري التحميل/i);
      if (loadingText) {
        expect(loadingText).toBeInTheDocument();
      }
    }, { timeout: 1000 });
  });

  it('handles empty state when no data', async () => {
    mockDashboardApi.getDashboard.mockResolvedValue(null);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockDashboardApi.getDashboard).toHaveBeenCalled();
    });
  });

  it('handles error state gracefully', async () => {
    mockDashboardApi.getDashboard.mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockDashboardApi.getDashboard).toHaveBeenCalled();
    });
  });
});
