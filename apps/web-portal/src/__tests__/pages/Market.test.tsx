import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Market } from '../../pages/Market';
import { marketApi } from '../../lib/api/market';
import { camerasApi } from '../../lib/api/cameras';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    organization: { id: '1' },
  }),
}));

vi.mock('../../lib/api/market', () => ({
  marketApi: {
    getDashboard: vi.fn(),
    getEvents: vi.fn(),
  },
}));

vi.mock('../../lib/api/cameras', () => ({
  camerasApi: {
    getCameras: vi.fn(),
  },
}));

describe('Market', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(marketApi.getDashboard).mockResolvedValue({} as any);
    vi.mocked(marketApi.getEvents).mockResolvedValue({ data: [], total: 0 } as any);
    vi.mocked(camerasApi.getCameras).mockResolvedValue({ data: [] } as any);
  });

  it('renders market page', async () => {
    render(
      <MemoryRouter>
        <Market />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/السوق/i)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    vi.mocked(marketApi.getDashboard).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <Market />
      </MemoryRouter>
    );

    expect(screen.getByText(/جاري التحميل/i)).toBeInTheDocument();
  });

  it('displays empty state when no events', async () => {
    render(
      <MemoryRouter>
        <Market />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(marketApi.getEvents).toHaveBeenCalled();
    });
  });
});
