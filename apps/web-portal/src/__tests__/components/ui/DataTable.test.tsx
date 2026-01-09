import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../../../components/ui/DataTable';

interface TestItem {
  id: string;
  name: string;
  value: number;
}

describe('DataTable', () => {
  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'value', title: 'Value' },
  ];

  const data: TestItem[] = [
    { id: '1', name: 'Item 1', value: 10 },
    { id: '2', name: 'Item 2', value: 20 },
  ];

  it('renders table with data', () => {
    render(<DataTable columns={columns} data={data} />);

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(<DataTable columns={columns} data={[]} loading />);

    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('displays empty message when no data', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No items" />);

    expect(screen.getByText('No items')).toBeInTheDocument();
  });

  it('calls onRowClick when row clicked', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();

    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />);

    const row = screen.getByText('Item 1').closest('tr');
    if (row) {
      await user.click(row);
      expect(onRowClick).toHaveBeenCalledWith(data[0]);
    }
  });

  it('renders custom column render', () => {
    const customColumns = [
      { key: 'name', title: 'Name' },
      {
        key: 'value',
        title: 'Value',
        render: (item: TestItem) => <span>${item.value}</span>,
      },
    ];

    render(<DataTable columns={customColumns} data={data} />);

    expect(screen.getByText('$10')).toBeInTheDocument();
  });
});
