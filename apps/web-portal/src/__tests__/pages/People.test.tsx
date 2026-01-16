import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { People } from '../../pages/People';
import { peopleApi } from '../../lib/api/people';
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

vi.mock('../../lib/api/people', () => ({
  peopleApi: {
    getPeople: vi.fn(),
    createPerson: vi.fn(),
    updatePerson: vi.fn(),
    deletePerson: vi.fn(),
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
    encodeFace: vi.fn(),
  },
}));

describe('People', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(peopleApi.getPeople).mockResolvedValue({ data: [] } as any);
    vi.mocked(edgeServersApi.getEdgeServers).mockResolvedValue({ data: [] } as any);
  });

  it('renders people page', async () => {
    render(
      <MemoryRouter>
        <People />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/الأشخاص/i)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    vi.mocked(peopleApi.getPeople).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <People />
      </MemoryRouter>
    );

    expect(screen.getByText(/جاري التحميل/i)).toBeInTheDocument();
  });

  it('displays empty state when no people', async () => {
    render(
      <MemoryRouter>
        <People />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/لا توجد أشخاص/i)).toBeInTheDocument();
    });
  });

  it('opens create person modal', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <People />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /إضافة/i })).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /إضافة/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/إضافة شخص/i)).toBeInTheDocument();
    });
  });
});
