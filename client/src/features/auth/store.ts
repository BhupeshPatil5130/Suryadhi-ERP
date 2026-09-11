import { create } from 'zustand';
import { authApi } from './api';
import type { User } from '@/types';
import { showToast } from '@/lib/toast';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: User) => void;
}

/**
 * Extract a human-readable error message from any axios error shape.
 * Handles: { error: "msg" }, { details: [{field, message}] }, network errors, and raw strings.
 */
function extractErrorMessage(err: any, fallback: string): string {
  // Axios response error
  if (err?.response?.data) {
    const data = err.response.data;

    // Zod validation errors: { error: 'Validation failed', details: [{field, message}] }
    if (Array.isArray(data.details) && data.details.length > 0) {
      const first = data.details[0];
      if (first.field && first.message) {
        return `${first.field}: ${first.message}`;
      }
      // If details items are strings
      if (typeof first === 'string') return first;
    }

    // Standard API error: { error: "some message" }
    if (typeof data.error === 'string' && data.error.length > 0) {
      return data.error;
    }

    // Fallback: { message: "..." }
    if (typeof data.message === 'string' && data.message.length > 0) {
      return data.message;
    }
  }

  // Axios network error (no response at all)
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return 'Cannot connect to the server. Please check your internet connection.';
  }

  // Plain Error object
  if (err?.message && typeof err.message === 'string' && err.message.length > 0) {
    // Avoid showing raw JS errors to users
    if (err.message.includes('Cannot read properties') || err.message.includes('undefined')) {
      return fallback;
    }
    return err.message;
  }

  return fallback;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username, password) => {
    try {
      const { data } = await authApi.login(username, password);
      if (data.success) {
        localStorage.setItem('accessToken', data.data.accessToken);
        if (data.data.refreshToken) {
          localStorage.setItem('refreshToken', data.data.refreshToken);
        }
        set({ user: data.data.user, isAuthenticated: true, isLoading: false });
        showToast(`Welcome back, ${data.data.user?.firstName || username}!`, 'success');
      } else {
        const errorMsg = data.error || 'Login failed. Please check your credentials.';
        showToast(errorMsg, 'error');
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      // Don't re-toast if we already threw from the `else` branch above
      if (!(err instanceof Error && err.message && !(err as any).response)) {
        const errorMsg = extractErrorMessage(err, 'Invalid username or password. Please try again.');
        showToast(errorMsg, 'error');
      }
      throw err;
    }
  },

  signup: async (signupData) => {
    try {
      const { data } = await authApi.signup(signupData);
      if (data.success) {
        localStorage.setItem('accessToken', data.data.accessToken);
        if (data.data.refreshToken) {
          localStorage.setItem('refreshToken', data.data.refreshToken);
        }
        set({ user: data.data.user, isAuthenticated: true, isLoading: false });
        showToast('Account created successfully! Welcome to SEMS.', 'success');
      } else {
        const errorMsg = data.error || 'Registration failed. Please try again.';
        showToast(errorMsg, 'error');
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      if (!(err instanceof Error && err.message && !(err as any).response)) {
        const errorMsg = extractErrorMessage(err, 'Registration failed. Please try again.');
        showToast(errorMsg, 'error');
      }
      throw err;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Server logout call failed or session already expired:', err);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false, isLoading: false });
    showToast('Logged out successfully', 'info');
  },

  checkAuth: async () => {
    let token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    // If no access token but refresh token exists, attempt refresh first
    if (!token && refreshToken) {
      try {
        const { data } = await authApi.refresh();
        if (data.success && data.data.accessToken) {
          token = data.data.accessToken;
          localStorage.setItem('accessToken', data.data.accessToken);
          if (data.data.refreshToken) {
            localStorage.setItem('refreshToken', data.data.refreshToken);
          }
        }
      } catch {
        // Refresh token invalid/expired
      }
    }

    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const { data } = await authApi.me();
      if (data.success) {
        set({ user: data.data, isAuthenticated: true, isLoading: false });
        return;
      }
    } catch {
      // Access token verification failed — try refreshing if refreshToken exists
      if (refreshToken) {
        try {
          const { data } = await authApi.refresh();
          if (data.success && data.data.accessToken) {
            localStorage.setItem('accessToken', data.data.accessToken);
            if (data.data.refreshToken) {
              localStorage.setItem('refreshToken', data.data.refreshToken);
            }
            const meRes = await authApi.me();
            if (meRes.data.success) {
              set({ user: meRes.data.data, isAuthenticated: true, isLoading: false });
              return;
            }
          }
        } catch {
          // Refresh failed
        }
      }
    }

    // If both access token & refresh token checks failed, clear state
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  updateUser: (user) => set({ user }),
}));
