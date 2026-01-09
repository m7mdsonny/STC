import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Settings } from '../../pages/Settings';
import { edgeServersApi } from '../../lib/api/edgeServers';
import { licensesApi } from '../../lib/api/licenses';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    organization: { id: '1' },
    profile: { role: 'owner' },
    canManage: true,
  }),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

vi.mock('../../lib/api/edgeServers', () => ({
  edgeServersApi: {
    getEdgeServers: vi.fn(),
    createEdgeServer: vi.fn(),
    updateEdgeServer: vi.fn(),
    deleteEdgeServer: vi.fn(),
  },
}));

vi.mock('../../lib/api/licenses', () => ({
  licensesApi: {
    getLicenses: vi.fn(),
  },
}));

vi.mock('../../lib/edgeServer', () => ({
  edgeServerService: {
    setServerUrl: vi.fn(),
    getStatus: vi.fn(),
    sync: vi.fn(),
  },
}));

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(edgeServersApi.getEdgeServers).mockResolvedValue({ data: [] } as any);
    vi.mocked(licensesApi.getLicenses).mockResolvedValue({ data: [] } as any);
  });

  it('renders settings page', async () => {
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/الإعدادات/i)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    vi.mocked(edgeServersApi.getEdgeServers).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    expect(screen.getByText(/جاري التحميل/i)).toBeInTheDocument();
  });

  it('switches between tabs', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/الإعدادات/i)).toBeInTheDocument();
    });

    const notificationsTab = screen.getByText(/الاشعارات/i);
    if (notificationsTab) {
      await user.click(notificationsTab);
    }
  });
});
