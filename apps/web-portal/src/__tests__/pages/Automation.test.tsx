import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Automation } from '../../pages/Automation';
import { automationRulesApi } from '../../lib/api/automationRules';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    organization: { id: '1' },
  }),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

vi.mock('../../lib/api/automationRules', () => ({
  automationRulesApi: {
    getRules: vi.fn(),
    createRule: vi.fn(),
    updateRule: vi.fn(),
    deleteRule: vi.fn(),
    toggleRule: vi.fn(),
  },
}));

describe('Automation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(automationRulesApi.getRules).mockResolvedValue({ data: [] } as any);
  });

  it('renders automation page', async () => {
    render(
      <MemoryRouter>
        <Automation />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/الأتمتة/i)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    vi.mocked(automationRulesApi.getRules).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <Automation />
      </MemoryRouter>
    );

    expect(screen.getByText(/جاري التحميل/i)).toBeInTheDocument();
  });

  it('displays empty state when no rules', async () => {
    render(
      <MemoryRouter>
        <Automation />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/لا توجد قواعد/i)).toBeInTheDocument();
    });
  });

  it('opens create rule modal', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Automation />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /إضافة/i })).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /إضافة/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/إضافة قاعدة/i)).toBeInTheDocument();
    });
  });
});
