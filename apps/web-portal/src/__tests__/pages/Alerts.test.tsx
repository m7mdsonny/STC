import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Alerts } from '../../pages/Alerts';
import { alertsApi } from '../../lib/api/alerts';
import { camerasApi } from '../../lib/api/cameras';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    organization: { id: '1' },
    canManage: true,
  }),
}));

vi.mock('../../lib/api/alerts', () => ({
  alertsApi: {
    getAlerts: vi.fn(),
    updateAlert: vi.fn(),
    deleteAlert: vi.fn(),
  },
}));

vi.mock('../../lib/api/cameras', () => ({
  camerasApi: {
    getCameras: vi.fn(),
  },
}));

describe('Alerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(alertsApi.getAlerts).mockResolvedValue({ data: [] } as any);
    vi.mocked(camerasApi.getCameras).mockResolvedValue({ data: [] } as any);
  });

  it('renders alerts page', async () => {
    render(
      <MemoryRouter>
        <Alerts />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/التنبيهات/i)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    vi.mocked(alertsApi.getAlerts).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <Alerts />
      </MemoryRouter>
    );

    expect(screen.getByText(/جاري التحميل/i)).toBeInTheDocument();
  });

  it('displays empty state when no alerts', async () => {
    render(
      <MemoryRouter>
        <Alerts />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/لا توجد تنبيهات/i)).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    vi.mocked(alertsApi.getAlerts).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <Alerts />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(alertsApi.getAlerts).toHaveBeenCalled();
    });
  });

  it('filters alerts by status', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Alerts />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/التنبيهات/i)).toBeInTheDocument();
    });

    const filterButton = screen.getByRole('button', { name: /فلترة/i });
    if (filterButton) {
      await user.click(filterButton);
    }
  });

  it('refreshes alerts', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Alerts />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/التنبيهات/i)).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /تحديث/i });
    if (refreshButton) {
      await user.click(refreshButton);
      await waitFor(() => {
        expect(alertsApi.getAlerts).toHaveBeenCalledTimes(2);
      });
    }
  });
});
