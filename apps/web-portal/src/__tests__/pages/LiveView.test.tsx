import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LiveView } from '../../pages/LiveView';
import { camerasApi } from '../../lib/api/cameras';
import { edgeServersApi } from '../../lib/api/edgeServers';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    organization: { id: '1' },
  }),
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

vi.mock('../../lib/edgeServer', () => ({
  edgeServerService: {
    setServerUrl: vi.fn(),
    getStreamUrl: vi.fn(),
  },
}));

describe('LiveView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(camerasApi.getCameras).mockResolvedValue({ data: [] } as any);
    vi.mocked(edgeServersApi.getEdgeServers).mockResolvedValue({ data: [] } as any);
  });

  it('renders live view page', async () => {
    render(
      <MemoryRouter>
        <LiveView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/المشاهدة المباشرة/i)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    vi.mocked(camerasApi.getCameras).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <LiveView />
      </MemoryRouter>
    );

    expect(screen.getByText(/جاري التحميل/i)).toBeInTheDocument();
  });

  it('displays empty state when no cameras', async () => {
    render(
      <MemoryRouter>
        <LiveView />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/لا توجد كاميرات/i)).toBeInTheDocument();
    });
  });
});
