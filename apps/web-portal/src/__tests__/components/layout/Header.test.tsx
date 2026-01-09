import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '../../../components/layout/Header';
import { alertsApi } from '../../../lib/api/alerts';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    profile: { role: 'owner' },
    organization: { id: '1', name: 'Test Org' },
    isSuperAdmin: false,
  }),
}));

vi.mock('../../../lib/api/alerts', () => ({
  alertsApi: {
    getAlerts: vi.fn(),
  },
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(alertsApi.getAlerts).mockResolvedValue({ data: [] } as any);
  });

  it('renders header', () => {
    render(
      <MemoryRouter>
        <Header onMenuClick={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onMenuClick when menu button clicked', async () => {
    const user = userEvent.setup();
    const onMenuClick = vi.fn();

    render(
      <MemoryRouter>
        <Header onMenuClick={onMenuClick} />
      </MemoryRouter>
    );

    const menuButton = screen.getByRole('button');
    await user.click(menuButton);

    expect(onMenuClick).toHaveBeenCalled();
  });

  it('displays custom title', () => {
    render(
      <MemoryRouter>
        <Header onMenuClick={vi.fn()} title="Custom Title" />
      </MemoryRouter>
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });
});
