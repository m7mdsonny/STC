import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Cameras } from '../../pages/Cameras';
import { camerasApi } from '../../lib/api/cameras';
import { edgeServersApi } from '../../lib/api/edgeServers';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    organization: { id: '1' },
    canManage: true,
  }),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

vi.mock('../../lib/api/cameras', () => ({
  camerasApi: {
    getCameras: vi.fn(),
    createCamera: vi.fn(),
    updateCamera: vi.fn(),
    deleteCamera: vi.fn(),
    toggleCamera: vi.fn(),
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
    getSnapshot: vi.fn(),
  },
}));

describe('Cameras', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(camerasApi.getCameras).mockResolvedValue({ data: [] } as any);
    vi.mocked(edgeServersApi.getEdgeServers).mockResolvedValue({ data: [] } as any);
  });

  it('renders cameras page', async () => {
    render(
      <MemoryRouter>
        <Cameras />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/الكاميرات/i)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    vi.mocked(camerasApi.getCameras).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <Cameras />
      </MemoryRouter>
    );

    expect(screen.getByText(/جاري التحميل/i)).toBeInTheDocument();
  });

  it('displays empty state when no cameras', async () => {
    render(
      <MemoryRouter>
        <Cameras />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/لا توجد كاميرات/i)).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    vi.mocked(camerasApi.getCameras).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <Cameras />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(camerasApi.getCameras).toHaveBeenCalled();
    });
  });

  it('opens create camera modal', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Cameras />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /إضافة/i })).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /إضافة/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/إضافة كاميرا/i)).toBeInTheDocument();
    });
  });

  it('handles camera creation', async () => {
    const user = userEvent.setup();
    vi.mocked(camerasApi.createCamera).mockResolvedValue({ data: { id: '1' } } as any);

    render(
      <MemoryRouter>
        <Cameras />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /إضافة/i })).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /إضافة/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/اسم الكاميرا/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/اسم الكاميرا/i);
    const submitButton = screen.getByRole('button', { name: /حفظ/i });

    await user.type(nameInput, 'Test Camera');
    await user.click(submitButton);

    await waitFor(() => {
      expect(camerasApi.createCamera).toHaveBeenCalled();
    });
  });
});
