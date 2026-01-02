import { apiClient } from '../apiClient';
import type { User } from '../../types/database';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

function extractUserPayload(payload: unknown): User | null {
  if (!payload || typeof payload !== 'object') return null;

  const candidate = payload as { user?: unknown; data?: unknown; id?: unknown };

  if (candidate.user && typeof candidate.user === 'object') {
    return candidate.user as User;
  }

  if (candidate.data && typeof candidate.data === 'object') {
    const dataBlock = candidate.data as { user?: unknown; id?: unknown };

    if (dataBlock.user && typeof dataBlock.user === 'object') {
      return dataBlock.user as User;
    }

    if (dataBlock.id) {
      return dataBlock as unknown as User;
    }
  }

  if (candidate.id) {
    return candidate as unknown as User;
  }

  return null;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const normalizedCredentials = {
      ...credentials,
      email: credentials.email.trim().toLowerCase(),
    };

    const { data, error, status, httpStatus, errors } = await apiClient.post<unknown>('/auth/login', normalizedCredentials, {
      skipAuthRedirect: true,
      skipAuthHeader: true,
    });
    if (error || !data) {
      const validationMessage = (status === 422 || status === 403 || httpStatus === 422)
        && errors
        ? Object.values(errors).flat()[0]
        : undefined;

      throw new Error(validationMessage || error || 'Login failed');
    }

    const token = (data as { token?: string; access_token?: string }).token
      || (data as { token?: string; access_token?: string }).access_token;

    if (!token) {
      throw new Error('Login response missing token');
    }

    apiClient.setToken(token);

    const inlineUser = extractUserPayload(data);
    if (inlineUser) {
      return { token, user: inlineUser };
    }

    const currentUser = await this.getCurrentUser({ skipRedirect: true });
    if (!currentUser) {
      throw new Error('Login succeeded but user profile could not be loaded');
    }

    return { token, user: currentUser };
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const { data, error } = await apiClient.post<unknown>('/auth/register', userData, {
      skipAuthHeader: true,
      skipAuthRedirect: true,
    });
    if (error || !data) {
      throw new Error(error || 'Registration failed');
    }
    const token = (data as { token?: string; access_token?: string }).token
      || (data as { token?: string; access_token?: string }).access_token;
    if (!token) {
      throw new Error('Registration response missing token');
    }

    apiClient.setToken(token);

    const inlineUser = extractUserPayload(data);
    if (inlineUser) {
      return { token, user: inlineUser };
    }

    const currentUser = await this.getCurrentUser({ skipRedirect: true });
    if (!currentUser) {
      throw new Error('Registration succeeded but user profile could not be loaded');
    }

    return { token, user: currentUser };
  },

  async logout(): Promise<void> {
    try {
      // Try to revoke token on server
      await apiClient.post('/auth/logout', undefined, { skipAuthRedirect: true });
    } catch (error) {
      // Ignore errors - we're logging out anyway
      console.error('Logout API error (ignored):', error);
    } finally {
      // Always clear token locally
      apiClient.setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  },

  clearSession() {
    apiClient.setToken(null);
  },

  async getCurrentUser(options?: { skipRedirect?: boolean }): Promise<User | null> {
    const { data, error } = await apiClient.get<unknown>('/auth/me', undefined, {
      skipAuthRedirect: options?.skipRedirect,
    });
    if (error || !data) {
      return null;
    }

    return extractUserPayload(data);
  },

  async getCurrentUserDetailed(options?: { skipRedirect?: boolean }): Promise<{ user: User | null; unauthorized: boolean; error?: string }>
  {
    const { data, error, status, httpStatus } = await apiClient.get<unknown>('/auth/me', undefined, {
      skipAuthRedirect: options?.skipRedirect,
    });

    return {
      user: extractUserPayload(data),
      unauthorized: status === 401 || httpStatus === 401 || (status !== undefined && status >= 400),
      error,
    };
  },

  async authenticateWithToken(token: string): Promise<User> {
    apiClient.setToken(token);
    const user = await this.getCurrentUser({ skipRedirect: true });
    if (!user) {
      apiClient.setToken(null);
      throw new Error('Invalid or expired token');
    }
    return user;
  },

  async updateProfile(profileData: Partial<User>): Promise<User> {
    const { data, error } = await apiClient.put<User>('/auth/profile', profileData);
    if (error || !data) {
      throw new Error(error || 'Failed to update profile');
    }
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const { error } = await apiClient.put('/auth/password', {
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: newPassword,
    });
    if (error) {
      throw new Error(error);
    }
  },

  async requestPasswordReset(email: string): Promise<string> {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await apiClient.post<{ message?: string }>(
      '/auth/forgot-password',
      { email: normalizedEmail },
      { skipAuthHeader: true, skipAuthRedirect: true },
    );

    if (error) {
      throw new Error(error === 'An error occurred'
        ? 'تعذر ارسال طلب الاستعادة حالياً'
        : error);
    }

    return (data as { message?: string } | undefined)?.message
      || 'تم إرسال رابط الاستعادة في حال كان البريد مسجلاً لدينا';
  },

  isAuthenticated(): boolean {
    return !!apiClient.getToken();
  },
};
