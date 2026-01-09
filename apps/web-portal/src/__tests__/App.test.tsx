import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';

vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    profile: null,
    organization: null,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    isSuperAdmin: false,
    isOrgAdmin: false,
    canManage: false,
  }),
}));

vi.mock('../contexts/BrandingContext', () => ({
  BrandingProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useBranding: () => ({ branding: null, loading: false }),
}));

vi.mock('../contexts/ToastContext', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    toasts: [],
    removeToast: vi.fn(),
  }),
}));

vi.mock('../lib/api/settings', () => ({
  settingsApi: {
    getPublishedLanding: vi.fn().mockResolvedValue({
      content: {},
      published: true,
    }),
    submitContactForm: vi.fn().mockResolvedValue({ message: 'Success', success: true }),
  },
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mounts without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('initializes router correctly', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
    expect(window.location.pathname).toBeDefined();
  });
});
