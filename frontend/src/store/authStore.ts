import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  checkAuth: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { token, user } = response.data;
          
          Cookies.set('token', token, { expires: 7 });
          Cookies.set('user', JSON.stringify(user), { expires: 7 });
          
          set({ 
            user, 
            token, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: any) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/register', data);
          const { token, user } = response.data;
          
          Cookies.set('token', token, { expires: 7 });
          Cookies.set('user', JSON.stringify(user), { expires: 7 });
          
          set({ 
            user, 
            token, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        Cookies.remove('token');
        Cookies.remove('user');
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        });
      },

      updateUser: (user: User) => {
        Cookies.set('user', JSON.stringify(user), { expires: 7 });
        set({ user });
      },

      checkAuth: async () => {
        const token = Cookies.get('token');
        const userCookie = Cookies.get('user');
        
        if (token && userCookie) {
          try {
            const user = JSON.parse(userCookie);
            set({ 
              user, 
              token, 
              isAuthenticated: true 
            });
            
            // Only validate token if not on auth pages
            const currentPath = window.location.pathname;
            const authPaths = ['/login', '/register', '/register-student', '/register-teacher'];
            
            if (!authPaths.some(path => currentPath.includes(path))) {
              const response = await api.get('/auth/me');
              set({ user: response.data.data });
            }
          } catch (error) {
            console.error('Auth check failed:', error);
            Cookies.remove('token');
            Cookies.remove('user');
            set({ 
              user: null, 
              token: null, 
              isAuthenticated: false 
            });
          }
        } else {
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false 
          });
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