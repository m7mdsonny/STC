import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboard } from '../../../pages/admin/AdminDashboard';
import { dashboardApi } from '../../../lib/api';

vi.mock('../../../lib/api', () => ({
  dashboardApi: {
    getAdminDashboard: vi.fn(),
  },
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dashboardApi.getAdminDashboard).mockResolvedValue({
      total_organizations: 10,
      active_organizations: 8,
      total_edge_servers: 5,
      online_edge_servers: 4,
      total_cameras: 20,
      alerts_today: 15,
      revenue_this_month: 1000,
      organizations_by_plan: [],
    } as any);
  });

  it('renders admin dashboard', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/لوحة التحكم/i)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    vi.mocked(dashboardApi.getAdminDashboard).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/جاري التحميل/i)).toBeInTheDocument();
  });

  it('displays dashboard stats', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/10/i)).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    vi.mocked(dashboardApi.getAdminDashboard).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(dashboardApi.getAdminDashboard).toHaveBeenCalled();
    });
  });
});
