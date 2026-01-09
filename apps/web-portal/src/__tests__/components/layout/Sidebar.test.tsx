import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../../../components/layout/Sidebar';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    profile: { role: 'owner' },
    organization: { id: '1', name: 'Test Org' },
    signOut: vi.fn(),
    isSuperAdmin: false,
  }),
}));

describe('Sidebar', () => {
  it('renders sidebar', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText(/STC AI-VAP/i)).toBeInTheDocument();
  });

  it('closes sidebar when close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={onClose} />
      </MemoryRouter>
    );

    const closeButton = screen.getByRole('button', { name: /إغلاق/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('renders navigation links', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText(/لوحة التحكم/i)).toBeInTheDocument();
    expect(screen.getByText(/الكاميرات/i)).toBeInTheDocument();
  });

  it('hides sidebar when isOpen is false', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen={false} onClose={vi.fn()} />
      </MemoryRouter>
    );

    const sidebar = screen.queryByText(/STC AI-VAP/i);
    expect(sidebar).not.toBeVisible();
  });
});
