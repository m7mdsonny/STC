import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Vehicles } from '../../pages/Vehicles';
import { vehiclesApi } from '../../lib/api/vehicles';

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

vi.mock('../../lib/api/vehicles', () => ({
  vehiclesApi: {
    getVehicles: vi.fn(),
    createVehicle: vi.fn(),
    updateVehicle: vi.fn(),
    deleteVehicle: vi.fn(),
  },
}));

describe('Vehicles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vehiclesApi.getVehicles).mockResolvedValue({ data: [] } as any);
  });

  it('renders vehicles page', async () => {
    render(
      <MemoryRouter>
        <Vehicles />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/المركبات/i)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    vi.mocked(vehiclesApi.getVehicles).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <Vehicles />
      </MemoryRouter>
    );

    expect(screen.getByText(/جاري التحميل/i)).toBeInTheDocument();
  });

  it('displays empty state when no vehicles', async () => {
    render(
      <MemoryRouter>
        <Vehicles />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/لا توجد مركبات/i)).toBeInTheDocument();
    });
  });

  it('opens create vehicle modal', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Vehicles />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /إضافة/i })).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /إضافة/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/إضافة مركبة/i)).toBeInTheDocument();
    });
  });
});
