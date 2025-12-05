import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { User, LoginCredentials, SignupCredentials, AuthResponse } from '@/types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  signup: (credentials: SignupCredentials) => Promise<AuthResponse>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        set({ isLoading: true });
        try {
          const response = await api.post<AuthResponse>('/auth/login', credentials);
          const { data } = response;

          if (data.success && data.data) {
            const { user, token } = data.data;
            localStorage.setItem('token', token);
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          }

          return data;
        } catch (error: unknown) {
          set({ isLoading: false });
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { data?: AuthResponse } };
            return axiosError.response?.data || {
              success: false,
              message: 'Login failed. Please try again.',
            };
          }
          return {
            success: false,
            message: 'Network error. Please check your connection.',
          };
        }
      },

      signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
        set({ isLoading: true });
        try {
          const response = await api.post<AuthResponse>('/auth/register', credentials);
          const { data } = response;

          if (data.success && data.data) {
            const { user, token } = data.data;
            localStorage.setItem('token', token);
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          }

          return data;
        } catch (error: unknown) {
          set({ isLoading: false });
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { data?: AuthResponse } };
            return axiosError.response?.data || {
              success: false,
              message: 'Signup failed. Please try again.',
            };
          }
          return {
            success: false,
            message: 'Network error. Please check your connection.',
          };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        const token = get().token || localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const response = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
          if (response.data.success) {
            set({
              user: response.data.data.user,
              token,
              isAuthenticated: true,
            });
          }
        } catch {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          localStorage.removeItem('token');
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
