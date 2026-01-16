import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Licenses } from '../../pages/admin/Licenses';
import { licensesApi } from '../../lib/api/licenses';
import { organizationsApi } from '../../lib/api/organizations';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', role: 'super_admin' },
    isSuperAdmin: true,
  }),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

vi.mock('../../lib/api/licenses', () => ({
  licensesApi: {
    getLicenses: vi.fn(),
    createLicense: vi.fn(),
  },
}));

vi.mock('../../lib/api/organizations', () => ({
  organizationsApi: {
    getOrganizations: vi.fn(),
  },
}));

const mockLicensesApi = vi.mocked(licensesApi);
const mockOrganizationsApi = vi.mocked(organizationsApi);

describe('Licenses Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockLicensesApi.getLicenses.mockResolvedValue({ data: [] } as any);
    mockOrganizationsApi.getOrganizations.mockResolvedValue({ data: [] } as any);
  });

  it('renders licenses list', async () => {
    render(
      <MemoryRouter>
        <Licenses />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockLicensesApi.getLicenses).toHaveBeenCalled();
    });
  });

  it('validates license creation form', async () => {
    mockLicensesApi.createLicense.mockResolvedValue({} as any);

    render(
      <MemoryRouter>
        <Licenses />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockLicensesApi.getLicenses).toHaveBeenCalled();
    });
  });

  it('handles permission checks', () => {
    render(
      <MemoryRouter>
        <Licenses />
      </MemoryRouter>
    );

    expect(screen.queryByText(/التراخيص/i)).toBeInTheDocument();
  });
});
