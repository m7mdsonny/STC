import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../../../components/ui/StatCard';
import { Camera } from 'lucide-react';

describe('StatCard', () => {
  it('renders stat card with title and value', () => {
    render(
      <StatCard
        title="Total Cameras"
        value={42}
        icon={Camera}
      />
    );

    expect(screen.getByText('Total Cameras')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('displays trend indicator when provided', () => {
    render(
      <StatCard
        title="Visitors"
        value={100}
        icon={Camera}
        trend={{ value: 15, isPositive: true }}
      />
    );

    expect(screen.getByText('+15%')).toBeInTheDocument();
  });

  it('renders with different color variants', () => {
    const { rerender } = render(
      <StatCard
        title="Test"
        value={10}
        icon={Camera}
        color="gold"
      />
    );

    expect(screen.getByText('10')).toBeInTheDocument();

    rerender(
      <StatCard
        title="Test"
        value={10}
        icon={Camera}
        color="green"
      />
    );

    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
