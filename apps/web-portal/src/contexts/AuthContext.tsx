import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from '../lib/api/auth';
import { organizationsApi } from '../lib/api/organizations';
import { apiClient } from '../lib/apiClient';
import { normalizeRole } from '../lib/rbac';
import type { User, Organization } from '../types/database';

const USER_STORAGE_KEY = 'auth_user';

interface AuthContextType {
  user: User | null;
  profile: User | null;
  organization: Organization | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  canManage: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token') || params.get('auth_token');

    if (tokenFromUrl) {
      handleTokenLogin(tokenFromUrl);
    } else {
      checkAuth();
    }
  }, []);

  const loadStoredUser = (): User | null => {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      return raw ? JSON.parse(raw) as User : null;
    } catch {
      return null;
    }
  };

  const clearStoredUser = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  const checkAuth = async () => {
    setLoading(true);
    try {
      if (!authApi.isAuthenticated()) {
        clearStoredUser();
        setUser(null);
        setProfile(null);
        setOrganization(null);
        setLoading(false);
        return;
      }

      const storedUser = loadStoredUser();
      if (storedUser) {
        setUser(storedUser);
        setProfile(storedUser);
      }

      const { user: currentUser, unauthorized } = await authApi.getCurrentUserDetailed({ skipRedirect: true });

      if (unauthorized) {
        authApi.clearSession();
        clearStoredUser();
        setUser(null);
        setProfile(null);
        setOrganization(null);
        return;
      }

      if (currentUser) {
        await setAuthenticatedUser(currentUser);
      } else if (!storedUser) {
        setUser(null);
        setProfile(null);
        setOrganization(null);
      }
    } catch {
      // Preserve stored session on transient failures; clearing happens only on explicit unauthorized responses
    } finally {
      setLoading(false);
    }
  };

  const setAuthenticatedUser = async (authUser: User) => {
    // Normalize role before storing
    const normalizedUser = {
      ...authUser,
      role: normalizeRole(authUser.role),
    };
    setUser(normalizedUser);
    setProfile(normalizedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));

    if (authUser.organization_id) {
      try {
        const org = await organizationsApi.getOrganization(authUser.organization_id);
        setOrganization(org);
      } catch {
        setOrganization(null);
      }
    } else {
      setOrganization(null);
    }
  };

  const handleTokenLogin = async (token: string) => {
    setLoading(true);
    try {
      const authenticatedUser = await authApi.authenticateWithToken(token);
      await setAuthenticatedUser(authenticatedUser);
    } catch {
      setUser(null);
      setProfile(null);
      setOrganization(null);
    } finally {
      setLoading(false);
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('auth_token');
      window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user: authUser } = await authApi.login({ email, password });
      await setAuthenticatedUser(authUser);

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      return { error: new Error(errorMessage) };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { user: authUser } = await authApi.register({
        email,
        password,
        password_confirmation: password,
        name,
      });
      await setAuthenticatedUser(authUser);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Registration failed') };
    }
  };

  const signOut = async () => {
    // Clear all state first
    clearStoredUser();
    setUser(null);
    setProfile(null);
    setOrganization(null);
    
    // Clear token from localStorage
    apiClient.setToken(null);
    localStorage.removeItem('auth_token');
    
    // Clear all localStorage items related to auth
    localStorage.removeItem(USER_STORAGE_KEY);
    
    try {
      // Try to revoke token on server (but don't wait if it fails)
      await authApi.logout().catch(() => {
        // Ignore errors - we're logging out anyway
      });
    } catch (error) {
      console.error('Failed to revoke session during sign out', error);
    } finally {
      // Force redirect to login page
      window.location.href = '/login';
    }
  };

  // Normalize role and compute permissions
  const normalizedRole = profile?.role ? normalizeRole(profile.role) : null;
  
  const isSuperAdmin = normalizedRole === 'super_admin' || profile?.is_super_admin === true;
  const isOrgAdmin = normalizedRole === 'owner' || normalizedRole === 'admin';
  const canManage = isSuperAdmin || isOrgAdmin;

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      organization,
      loading,
      signIn,
      signUp,
      signOut,
      isSuperAdmin,
      isOrgAdmin,
      canManage,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
