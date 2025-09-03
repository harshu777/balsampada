import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import api from '@/lib/api.enhanced';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
}

interface Session {
  id: string;
  createdAt: string;
  lastUsed: string;
  userAgent: string;
  ipAddress: string;
  current: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessions: Session[];
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateUser: (user: User) => void;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessions: [],

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.login(email, password);
          const { user, tokens } = response.data;
          
          // Store user in state
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
          
          // Store user in cookie for SSR
          Cookies.set('user', JSON.stringify(user), { expires: 7 });
          
          // The tokens are already handled by the api client
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: any) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/register', data);
          const { user, tokens } = response.data;
          
          // Store user in state
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
          
          // Store user in cookie
          Cookies.set('user', JSON.stringify(user), { expires: 7 });
          
          // Handle tokens if needed
          if (tokens) {
            const { access, refresh } = tokens;
            // These are handled by the API client
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear state
          set({ 
            user: null, 
            isAuthenticated: false,
            sessions: []
          });
          
          // Clear cookies
          Cookies.remove('user');
        }
      },

      logoutAll: async () => {
        try {
          await api.logoutAll();
        } catch (error) {
          console.error('Logout all error:', error);
        } finally {
          set({ 
            user: null, 
            isAuthenticated: false,
            sessions: []
          });
          
          Cookies.remove('user');
        }
      },

      updateUser: (user: User) => {
        Cookies.set('user', JSON.stringify(user), { expires: 7 });
        set({ user });
      },

      checkAuth: async () => {
        // First check cookies/localStorage
        const userCookie = Cookies.get('user');
        
        if (userCookie) {
          try {
            const user = JSON.parse(userCookie);
            set({ 
              user, 
              isAuthenticated: true 
            });
            
            // Validate with server
            try {
              const response = await api.get('/auth/me');
              set({ 
                user: response.data.data,
                isAuthenticated: true
              });
            } catch (error: any) {
              // If validation fails, try to refresh token
              if (error?.response?.status === 401) {
                try {
                  await api.refreshAccessToken();
                  // Retry getting user
                  const response = await api.get('/auth/me');
                  set({ 
                    user: response.data.data,
                    isAuthenticated: true
                  });
                } catch (refreshError) {
                  // Refresh failed, clear auth
                  Cookies.remove('user');
                  api.clearAuth();
                  set({ 
                    user: null, 
                    isAuthenticated: false 
                  });
                }
              }
            }
          } catch (error) {
            console.error('Auth check error:', error);
            set({ 
              user: null, 
              isAuthenticated: false 
            });
          }
        } else {
          set({ 
            user: null, 
            isAuthenticated: false 
          });
        }
      },

      refreshToken: async () => {
        try {
          await api.refreshAccessToken();
        } catch (error) {
          console.error('Token refresh error:', error);
          throw error;
        }
      },

      getSessions: async () => {
        try {
          const response = await api.getSessions();
          const sessions = response.data.sessions || [];
          set({ sessions });
          return sessions;
        } catch (error) {
          console.error('Get sessions error:', error);
          set({ sessions: [] });
          throw error;
        }
      },

      revokeSession: async (sessionId: string) => {
        try {
          await api.revokeSession(sessionId);
          
          // Update sessions list
          const { sessions } = get();
          set({ 
            sessions: sessions.filter(s => s.id !== sessionId) 
          });
        } catch (error) {
          console.error('Revoke session error:', error);
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export default useAuthStore;