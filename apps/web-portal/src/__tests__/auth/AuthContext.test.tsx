import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../lib/api/auth';
import { organizationsApi } from '../../lib/api/organizations';
import { apiClient } from '../../lib/apiClient';

vi.mock('../../lib/api/auth');
vi.mock('../../lib/api/organizations');
vi.mock('../../lib/apiClient', () => ({
  apiClient: {
    setToken: vi.fn(),
    getToken: vi.fn(() => null),
  },
}));

const mockAuthApi = vi.mocked(authApi);
const mockOrganizationsApi = vi.mocked(organizationsApi);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockOrganizationsApi.getOrganization.mockResolvedValue({ data: { id: '1', name: 'Test Org' } } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('provides authentication context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.signIn).toBeDefined();
    expect(result.current.signOut).toBeDefined();
  });

  it('handles sign in successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
    };

    mockAuthApi.login.mockResolvedValue({
      token: 'test-token',
      user: mockUser as any,
    });
    mockAuthApi.getCurrentUserDetailed.mockResolvedValue({
      user: mockUser as any,
      unauthorized: false,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await result.current.signIn('test@example.com', 'password123');

    await waitFor(() => {
      expect(mockAuthApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('handles sign out', async () => {
    mockAuthApi.logout.mockResolvedValue();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await result.current.signOut();

    await waitFor(() => {
      expect(mockAuthApi.logout).toHaveBeenCalled();
    });
  });
});
