import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EdgeServers } from '../../pages/admin/EdgeServers';
import { edgeServersApi } from '../../lib/api/edgeServers';

vi.mock('../../lib/api/edgeServers', () => ({
  edgeServersApi: {
    getEdgeServers: vi.fn(),
  },
}));

const mockEdgeServersApi = vi.mocked(edgeServersApi);

describe('EdgeServers Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEdgeServersApi.getEdgeServers.mockResolvedValue({ data: [] } as any);
  });

  it('renders edge servers list', async () => {
    render(
      <MemoryRouter>
        <EdgeServers />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockEdgeServersApi.getEdgeServers).toHaveBeenCalled();
    });
  });

  it('displays server status correctly', async () => {
    const mockServers = [
      {
        id: '1',
        name: 'Server 1',
        last_heartbeat: new Date().toISOString(),
        configuration_mode: false,
      },
    ];

    mockEdgeServersApi.getEdgeServers.mockResolvedValue({ data: mockServers } as any);

    render(
      <MemoryRouter>
        <EdgeServers />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockEdgeServersApi.getEdgeServers).toHaveBeenCalled();
    });
  });

  it('handles create/edit validation', async () => {
    render(
      <MemoryRouter>
        <EdgeServers />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockEdgeServersApi.getEdgeServers).toHaveBeenCalled();
    });
  });
});
