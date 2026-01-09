import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../../pages/Login';

const mockSignIn = vi.fn();
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
  }),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  };
});

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // Use getByRole for heading to avoid multiple matches
    expect(screen.getByRole('heading', { name: /تسجيل الدخول/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/example@company.com/i)).toBeInTheDocument();
    // Password input may be type="password" or type="text" depending on showPassword state
    const passwordInput = screen.getByPlaceholderText(/\*\*\*\*\*\*\*\*/i) || 
                         document.querySelector('input[type="password"]') ||
                         document.querySelector('input[placeholder*="كلمة"]');
    expect(passwordInput).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ error: null });
    localStorage.setItem('auth_user', JSON.stringify({ role: 'admin' }));

    const { container } = render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/example@company.com/i);
    const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /تسجيل/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    }, { timeout: 3000 });
  });

  it('handles login failure with invalid credentials', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({
      error: new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة'),
    });

    const { container } = render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/example@company.com/i);
    const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /تسجيل/i });

    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpass');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const submitButton = screen.getByRole('button', { name: /تسجيل/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).not.toHaveBeenCalled();
    }, { timeout: 2000 });
  });
});
