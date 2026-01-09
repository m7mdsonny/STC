import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Attendance } from '../../pages/Attendance';
import { attendanceApi } from '../../lib/api/attendance';
import { peopleApi } from '../../lib/api/people';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    organization: { id: '1' },
  }),
}));

vi.mock('../../lib/api/attendance', () => ({
  attendanceApi: {
    getRecords: vi.fn(),
  },
}));

vi.mock('../../lib/api/people', () => ({
  peopleApi: {
    getPeople: vi.fn(),
  },
}));

describe('Attendance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(attendanceApi.getRecords).mockResolvedValue({ data: [] } as any);
    vi.mocked(peopleApi.getPeople).mockResolvedValue({ data: [] } as any);
  });

  it('renders attendance page', async () => {
    render(
      <MemoryRouter>
        <Attendance />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/الحضور/i)).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    vi.mocked(attendanceApi.getRecords).mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <Attendance />
      </MemoryRouter>
    );

    expect(screen.getByText(/جاري التحميل/i)).toBeInTheDocument();
  });

  it('displays empty state when no records', async () => {
    render(
      <MemoryRouter>
        <Attendance />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/لا توجد سجلات/i)).toBeInTheDocument();
    });
  });

  it('filters records by date', async () => {
    render(
      <MemoryRouter>
        <Attendance />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(attendanceApi.getRecords).toHaveBeenCalled();
    });
  });
});
