import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { EdgeServerStatus } from '../../../components/ui/EdgeServerStatus';
import { edgeServersApi } from '../../../lib/api/edgeServers';
import { edgeServerService } from '../../../lib/edgeServer';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    organization: { id: '1' },
  }),
}));

vi.mock('../../../lib/api/edgeServers', () => ({
  edgeServersApi: {
    getEdgeServers: vi.fn(),
  },
}));

vi.mock('../../../lib/edgeServer', () => ({
  edgeServerService: {
    setServerUrl: vi.fn(),
    getStatus: vi.fn(),
  },
}));

describe('EdgeServerStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders edge server status', async () => {
    vi.mocked(edgeServersApi.getEdgeServers).mockResolvedValue({
      data: [{ id: '1', ip_address: '192.168.1.1' }],
    } as any);
    vi.mocked(edgeServerService.getStatus).mockResolvedValue({
      cameras: 5,
      integrations: 2,
      modules: ['face'],
    } as any);

    render(
      <MemoryRouter>
        <EdgeServerStatus />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/السيرفر المحلي/i)).toBeInTheDocument();
    });
  });

  it('displays loading state', () => {
    vi.mocked(edgeServersApi.getEdgeServers).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <EdgeServerStatus />
      </MemoryRouter>
    );

    expect(screen.getByText(/جاري الاتصال/i)).toBeInTheDocument();
  });

  it('displays disconnected state', async () => {
    vi.mocked(edgeServersApi.getEdgeServers).mockResolvedValue({ data: [] } as any);

    render(
      <MemoryRouter>
        <EdgeServerStatus />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/غير متصل/i)).toBeInTheDocument();
    });
  });

  it('refreshes status on button click', async () => {
    const user = userEvent.setup();
    vi.mocked(edgeServersApi.getEdgeServers).mockResolvedValue({
      data: [{ id: '1', ip_address: '192.168.1.1' }],
    } as any);
    vi.mocked(edgeServerService.getStatus).mockResolvedValue({
      cameras: 5,
      integrations: 2,
      modules: [],
    } as any);

    render(
      <MemoryRouter>
        <EdgeServerStatus />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTitle(/تحديث/i)).toBeInTheDocument();
    });

    const refreshButton = screen.getByTitle(/تحديث/i);
    await user.click(refreshButton);

    await waitFor(() => {
      expect(edgeServerService.getStatus).toHaveBeenCalledTimes(2);
    });
  });
});
