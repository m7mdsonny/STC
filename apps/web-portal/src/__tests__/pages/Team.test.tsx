import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Team } from '../../pages/Team';
import { usersApi } from '../../lib/api/users';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    profile: { role: 'owner' },
    organization: { id: '1' },
  }),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

vi.mock('../../lib/api/users', () => ({
  usersApi: {
    getUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

describe('Team', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usersApi.getUsers).mockResolvedValue({ data: [] } as any);
  });

  it('renders team page', async () => {
    render(
      <MemoryRouter>
        <Team />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/الفريق/i)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    vi.mocked(usersApi.getUsers).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <Team />
      </MemoryRouter>
    );

    expect(screen.getByText(/جاري التحميل/i)).toBeInTheDocument();
  });

  it('displays empty state when no users', async () => {
    render(
      <MemoryRouter>
        <Team />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/لا يوجد مستخدمين/i)).toBeInTheDocument();
    });
  });

  it('denies access without manage permissions', async () => {
    vi.mock('../../contexts/AuthContext', () => ({
      useAuth: () => ({
        profile: { role: 'viewer' },
        organization: { id: '1' },
      }),
    }));

    render(
      <MemoryRouter>
        <Team />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/غير مصرح/i)).toBeInTheDocument();
    });
  });
});
