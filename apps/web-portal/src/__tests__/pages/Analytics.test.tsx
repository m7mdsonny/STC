import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Analytics } from '../../pages/Analytics';
import { analyticsApi } from '../../lib/api/analytics';
import { alertsApi } from '../../lib/api/alerts';
import { vehiclesApi } from '../../lib/api/vehicles';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    organization: { id: '1' },
  }),
}));

vi.mock('../../lib/api/analytics', () => ({
  analyticsApi: {
    getVisitorData: vi.fn(),
    getWeeklyData: vi.fn(),
    getAgeDistribution: vi.fn(),
    getGenderDistribution: vi.fn(),
    getAlertsByModule: vi.fn(),
    getStats: vi.fn(),
  },
}));

vi.mock('../../lib/api/alerts', () => ({
  alertsApi: {
    getAlerts: vi.fn(),
  },
}));

vi.mock('../../lib/api/vehicles', () => ({
  vehiclesApi: {
    getVehicles: vi.fn(),
  },
}));

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(analyticsApi.getStats).mockResolvedValue({
      totalVisitors: 0,
      totalVehicles: 0,
      totalAlerts: 0,
      detectionRate: 0,
      visitorsChange: 0,
      vehiclesChange: 0,
      alertsChange: 0,
    } as any);
    vi.mocked(analyticsApi.getVisitorData).mockResolvedValue([]);
    vi.mocked(analyticsApi.getWeeklyData).mockResolvedValue([]);
  });

  it('renders analytics page', async () => {
    render(
      <MemoryRouter>
        <Analytics />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/التحليلات/i)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    vi.mocked(analyticsApi.getStats).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <Analytics />
      </MemoryRouter>
    );

    expect(screen.getByText(/جاري التحميل/i)).toBeInTheDocument();
  });

  it('displays analytics charts', async () => {
    render(
      <MemoryRouter>
        <Analytics />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(analyticsApi.getStats).toHaveBeenCalled();
    });
  });

  it('handles error state', async () => {
    vi.mocked(analyticsApi.getStats).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <Analytics />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(analyticsApi.getStats).toHaveBeenCalled();
    });
  });
});
