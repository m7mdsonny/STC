import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { OwnerGuide } from '../../pages/OwnerGuide';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    organization: { id: '1' },
  }),
}));

describe('OwnerGuide', () => {
  it('renders owner guide page', () => {
    render(
      <MemoryRouter>
        <OwnerGuide />
      </MemoryRouter>
    );

    expect(screen.getByText(/دليل المالك/i)).toBeInTheDocument();
  });

  it('displays guide steps', () => {
    render(
      <MemoryRouter>
        <OwnerGuide />
      </MemoryRouter>
    );

    expect(screen.getByText(/إنشاء Edge Server/i)).toBeInTheDocument();
  });

  it('expands guide step on click', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <OwnerGuide />
      </MemoryRouter>
    );

    const stepButton = screen.getByText(/إنشاء Edge Server/i);
    await user.click(stepButton);

    await waitFor(() => {
      expect(screen.getByText(/انتقل إلى صفحة/i)).toBeInTheDocument();
    });
  });
});
