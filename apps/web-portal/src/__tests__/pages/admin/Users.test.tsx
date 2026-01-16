import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Users } from '../../../pages/admin/Users';
import { usersApi } from '../../../lib/api';
import { organizationsApi } from '../../../lib/api';

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

vi.mock('../../../lib/api', () => ({
  usersApi: {
    getUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
  organizationsApi: {
    getOrganizations: vi.fn(),
  },
}));

describe('Users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usersApi.getUsers).mockResolvedValue({ data: [] } as any);
    vi.mocked(organizationsApi.getOrganizations).mockResolvedValue({ data: [] } as any);
  });

  it('renders users page', async () => {
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/المستخدمين/i)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    vi.mocked(usersApi.getUsers).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    expect(screen.getByText(/جاري التحميل/i)).toBeInTheDocument();
  });

  it('displays empty state when no users', async () => {
    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/لا يوجد مستخدمين/i)).toBeInTheDocument();
    });
  });

  it('opens create user modal', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Users />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /إضافة/i })).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /إضافة/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/إضافة مستخدم/i)).toBeInTheDocument();
    });
  });
});
