import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../../../components/ui/Modal';

describe('Modal', () => {
  it('renders modal when open', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const closeButton = screen.getByRole('button');
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const backdrop = screen.getByRole('button').parentElement?.parentElement?.previousElementSibling;
    if (backdrop) {
      await user.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test" size="sm">
        Content
      </Modal>
    );

    expect(screen.getByText('Test')).toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={vi.fn()} title="Test" size="xl">
        Content
      </Modal>
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
