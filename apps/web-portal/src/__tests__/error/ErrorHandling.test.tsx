import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';

global.fetch = vi.fn();

describe('Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('handles 401 Unauthorized', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: 'Unauthorized' }),
    });

    const response = await apiClient.get('/test');

    expect(response.error).toBeDefined();
    expect(response.status).toBe(401);
  });

  it('handles 403 Forbidden', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ message: 'Forbidden' }),
    });

    const response = await apiClient.get('/test');

    expect(response.error).toBeDefined();
    expect(response.status).toBe(403);
  });

  it('handles 404 Not Found', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ message: 'Not Found' }),
    });

    const response = await apiClient.get('/test');

    expect(response.error).toBeDefined();
    expect(response.status).toBe(404);
  });

  it('handles 500 Server Error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ message: 'Internal Server Error' }),
    });

    const response = await apiClient.get('/test');

    expect(response.error).toBeDefined();
    expect(response.status).toBe(500);
  });

  it('handles network errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network request failed'));

    const response = await apiClient.get('/test');

    await waitFor(() => {
      expect(response.error).toBeDefined();
    });
  });

  it('handles timeout errors', async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 100);

    (global.fetch as any).mockImplementationOnce(() =>
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AbortError')), 200);
      })
    );

    const response = await apiClient.get('/test');

    await waitFor(() => {
      expect(response.error).toBeDefined();
    });
  });
});
