import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RequestDemo } from '../../pages/RequestDemo';
import { freeTrialApi } from '../../lib/api/freeTrial';

vi.mock('../../lib/api/freeTrial', () => ({
  freeTrialApi: {
    getAvailableModules: vi.fn(),
    submitRequest: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('RequestDemo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(freeTrialApi.getAvailableModules).mockResolvedValue([
      { key: 'face', name: 'Face Recognition', description: 'Test', category: 'security' },
    ]);
  });

  it('renders request demo form', async () => {
    render(
      <MemoryRouter>
        <RequestDemo />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /طلب تجريبي/i })).toBeInTheDocument();
    });
  });

  it('displays loading state while fetching modules', () => {
    vi.mocked(freeTrialApi.getAvailableModules).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <RequestDemo />
      </MemoryRouter>
    );

    expect(screen.getByText(/جاري التحميل/i)).toBeInTheDocument();
  });

  it('handles successful demo request submission', async () => {
    const user = userEvent.setup();
    vi.mocked(freeTrialApi.submitRequest).mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <RequestDemo />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/الاسم/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/الاسم/i);
    const emailInput = screen.getByPlaceholderText(/البريد/i);
    const submitButton = screen.getByRole('button', { name: /إرسال/i });

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(freeTrialApi.submitRequest).toHaveBeenCalled();
    });
  });

  it('handles demo request submission failure', async () => {
    const user = userEvent.setup();
    vi.mocked(freeTrialApi.submitRequest).mockRejectedValue(new Error('Submission failed'));

    render(
      <MemoryRouter>
        <RequestDemo />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/الاسم/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/الاسم/i);
    const emailInput = screen.getByPlaceholderText(/البريد/i);
    const submitButton = screen.getByRole('button', { name: /إرسال/i });

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Submission failed/i)).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <RequestDemo />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /إرسال/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /إرسال/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(freeTrialApi.submitRequest).not.toHaveBeenCalled();
    });
  });
});
