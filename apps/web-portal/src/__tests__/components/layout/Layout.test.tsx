import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '../../../components/layout/Layout';

vi.mock('../../../components/layout/Sidebar', () => ({
  Sidebar: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <div data-testid="sidebar" data-open={isOpen}>
      Sidebar
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('../../../components/layout/Header', () => ({
  Header: ({ onMenuClick, title }: { onMenuClick: () => void; title?: string }) => (
    <div data-testid="header">
      <button onClick={onMenuClick}>Menu</button>
      {title && <h1>{title}</h1>}
    </div>
  ),
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1' },
    profile: { id: '1' },
    organization: { id: '1' },
    loading: false,
    isSuperAdmin: false,
  }),
}));

vi.mock('../../../lib/api/alerts', () => ({
  alertsApi: {
    getAlerts: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('Layout', () => {
  it('renders main layout structure', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<div>Test Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByText(/STC AI-VAP/i)).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<Layout title="Test Page" />}>
            <Route path="/" element={<div>Test Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });
});
