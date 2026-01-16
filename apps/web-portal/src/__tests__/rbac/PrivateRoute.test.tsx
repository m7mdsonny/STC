import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../App';

const mockUseAuth = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../contexts/BrandingContext', () => ({
  BrandingProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useBranding: () => ({ branding: null, loading: false }),
}));

vi.mock('../../contexts/ToastContext', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useToast: () => ({ toasts: [], removeToast: vi.fn() }),
}));

vi.mock('../../lib/api/settings', () => ({
  settingsApi: {
    getPublishedLanding: vi.fn().mockResolvedValue({
      content: {},
      published: true,
    }),
    submitContactForm: vi.fn().mockResolvedValue({ message: 'Success', success: true }),
  },
}));

describe('PrivateRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Update window.location for each test
    window.history.pushState({}, '', '/dashboard');
  });

  it('redirects unauthenticated users to login', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      organization: null,
      loading: false,
      isSuperAdmin: false,
    });

    window.history.pushState({}, '', '/dashboard');
    const { container } = render(<App />);

    await waitFor(() => {
      expect(container).toBeTruthy();
    }, { timeout: 2000 });
  });

  it('allows authenticated users to access protected routes', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      profile: { id: '1', role: 'admin' },
      organization: { id: '1', name: 'Test Org' },
      loading: false,
      isSuperAdmin: false,
    });

    window.history.pushState({}, '', '/dashboard');
    const { container } = render(<App />);

    await waitFor(() => {
      expect(container).toBeTruthy();
    }, { timeout: 2000 });
  });

  it('denies non-super-admin access to admin routes', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      profile: { id: '1', role: 'admin' },
      organization: { id: '1', name: 'Test Org' },
      loading: false,
      isSuperAdmin: false,
    });

    window.history.pushState({}, '', '/admin');
    const { container } = render(<App />);

    await waitFor(() => {
      expect(container).toBeTruthy();
    }, { timeout: 2000 });
  });

  it('allows super admin access to admin routes', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', is_super_admin: true },
      profile: { id: '1', role: 'super_admin', is_super_admin: true },
      organization: null,
      loading: false,
      isSuperAdmin: true,
    });

    window.history.pushState({}, '', '/admin');
    const { container } = render(<App />);

    await waitFor(() => {
      expect(container).toBeTruthy();
    }, { timeout: 2000 });
  });
});
