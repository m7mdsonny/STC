import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Organizations } from '../../../pages/admin/Organizations';
import { organizationsApi } from '../../../lib/api';
import { subscriptionPlansApi } from '../../../lib/api';

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

vi.mock('../../../lib/api', () => ({
  organizationsApi: {
    getOrganizations: vi.fn(),
    createOrganization: vi.fn(),
    updateOrganization: vi.fn(),
    deleteOrganization: vi.fn(),
  },
  subscriptionPlansApi: {
    getPlans: vi.fn(),
  },
}));

describe('Organizations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(organizationsApi.getOrganizations).mockResolvedValue({ data: [] } as any);
    vi.mocked(subscriptionPlansApi.getPlans).mockResolvedValue({ data: [] } as any);
  });

  it('renders organizations page', async () => {
    render(
      <MemoryRouter>
        <Organizations />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/المؤسسات/i)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    vi.mocked(organizationsApi.getOrganizations).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <Organizations />
      </MemoryRouter>
    );

    expect(screen.getByText(/جاري التحميل/i)).toBeInTheDocument();
  });

  it('displays empty state when no organizations', async () => {
    render(
      <MemoryRouter>
        <Organizations />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/لا توجد مؤسسات/i)).toBeInTheDocument();
    });
  });

  it('opens create organization modal', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Organizations />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /إضافة/i })).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /إضافة/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/إضافة مؤسسة/i)).toBeInTheDocument();
    });
  });
});
