import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ForgotPassword } from '../../pages/ForgotPassword';
import { authApi } from '../../lib/api/auth';

vi.mock('../../lib/api/auth', () => ({
  authApi: {
    requestPasswordReset: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  };
});

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders forgot password form', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /استعادة كلمة المرور/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/example@company.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /إرسال/i })).toBeInTheDocument();
  });

  it('displays loading state during submission', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.requestPasswordReset).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('Success'), 100)));

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/example@company.com/i);
    const submitButton = screen.getByRole('button', { name: /إرسال/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    expect(screen.getByRole('button', { name: /جاري/i })).toBeInTheDocument();
  });

  it('handles successful password reset request', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.requestPasswordReset).mockResolvedValue('تم ارسال رابط الاستعادة');

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/example@company.com/i);
    const submitButton = screen.getByRole('button', { name: /إرسال/i });

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/تم ارسال/i)).toBeInTheDocument();
    });
  });

  it('handles password reset request failure', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.requestPasswordReset).mockRejectedValue(new Error('البريد غير موجود'));

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/example@company.com/i);
    const submitButton = screen.getByRole('button', { name: /إرسال/i });

    await user.type(emailInput, 'wrong@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/البريد غير موجود/i)).toBeInTheDocument();
    });
  });

  it('validates email field', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const submitButton = screen.getByRole('button', { name: /إرسال/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(authApi.requestPasswordReset).not.toHaveBeenCalled();
    });
  });
});
