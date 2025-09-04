import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Token refresh state
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Helper to add subscribers
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Helper to notify all subscribers
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Helper to get access token
const getAccessToken = (): string | null => {
  // Try to get from cookie first (if httpOnly is false)
  const cookieToken = Cookies.get('accessToken');
  if (cookieToken) return cookieToken;
  
  // Fallback to localStorage if needed
  if (typeof window !== 'undefined') {
    const storageToken = localStorage.getItem('accessToken');
    if (storageToken) return storageToken;
  }
  
  // Fallback to old token cookie for backward compatibility
  const oldToken = Cookies.get('token');
  if (oldToken) return oldToken;
  
  return null;
};

// Helper to get refresh token
const getRefreshToken = (): string | null => {
  // Try cookie first
  const cookieToken = Cookies.get('refreshToken');
  if (cookieToken) return cookieToken;
  
  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const storageToken = localStorage.getItem('refreshToken');
    if (storageToken) return storageToken;
  }
  
  return null;
};

// Helper to save tokens
const saveTokens = (accessToken: string, refreshToken?: string) => {
  // Save to cookies if possible
  Cookies.set('accessToken', accessToken, { 
    expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    sameSite: 'strict'
  });
  
  if (refreshToken) {
    Cookies.set('refreshToken', refreshToken, { 
      expires: 7, // 7 days
      sameSite: 'strict'
    });
  }
  
  // Also save to localStorage as backup
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }
};

// Helper to clear all tokens
const clearTokens = () => {
  // Clear cookies
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  Cookies.remove('token'); // Old token cookie
  Cookies.remove('user');
  
  // Clear localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('auth-storage');
  }
};

// Request interceptor - add token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 401 errors
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      
      // Check if it's a token expiry error
      if (errorCode === 'TOKEN_EXPIRED' && !originalRequest._retry) {
        originalRequest._retry = true;

        if (!isRefreshing) {
          isRefreshing = true;
          
          try {
            const refreshToken = getRefreshToken();
            
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            // Call refresh endpoint
            const response = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken
            }, {
              withCredentials: true
            });

            const { accessToken } = response.data;
            
            // Save new access token
            saveTokens(accessToken);
            
            // Notify all subscribers
            onTokenRefreshed(accessToken);
            
            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            
            return api(originalRequest);
          } catch (refreshError: any) {
            // Refresh failed - redirect to login
            clearTokens();
            
            // Only redirect if not already on auth pages
            const currentPath = window.location.pathname;
            const authPaths = ['/login', '/register', '/register-student', '/register-teacher', '/clear-auth'];
            
            if (!authPaths.some(path => currentPath.includes(path))) {
              if (refreshError?.response?.data?.code === 'SECURITY_ALERT') {
                toast.error('Security alert: ' + refreshError.response.data.message);
              } else {
                toast.error('Session expired. Please login again.');
              }
              window.location.href = '/login';
            }
            
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }
      
      // Handle other 401 errors (not token expiry)
      if (errorCode === 'TOKEN_REVOKED' || errorCode === 'INVALID_TOKEN' || errorCode === 'NO_TOKEN') {
        clearTokens();
        
        const currentPath = window.location.pathname;
        const authPaths = ['/login', '/register', '/register-student', '/register-teacher', '/clear-auth'];
        
        if (!authPaths.some(path => currentPath.includes(path))) {
          toast.error(error.response?.data?.message || 'Authentication failed. Please login again.');
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Type for the enhanced API
interface EnhancedAPI extends AxiosInstance {
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  getSessions: () => Promise<any>;
  revokeSession: (sessionId: string) => Promise<any>;
  refreshAccessToken: () => Promise<any>;
  isAuthenticated: () => boolean;
  clearAuth: () => void;
}

// Enhanced API methods with better error handling
const enhancedApi: EnhancedAPI = Object.assign(api, {
  // Login method that handles the new token structure
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.tokens) {
        const { access, refresh } = response.data.tokens;
        saveTokens(access.token, refresh.token);
        
        // Save user data
        if (response.data.user) {
          Cookies.set('user', JSON.stringify(response.data.user), { expires: 7 });
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Logout method
  logout: async () => {
    try {
      const refreshToken = getRefreshToken();
      await api.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      window.location.href = '/login';
    }
  },
  
  // Logout from all devices
  logoutAll: async () => {
    try {
      await api.post('/auth/logout-all');
      clearTokens();
      toast.success('Logged out from all devices');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout all error:', error);
      clearTokens();
      window.location.href = '/login';
    }
  },
  
  // Get active sessions
  getSessions: async () => {
    return api.get('/auth/sessions');
  },
  
  // Revoke specific session
  revokeSession: async (sessionId: string) => {
    return api.delete(`/auth/sessions/${sessionId}`);
  },
  
  // Manually refresh token
  refreshAccessToken: async () => {
    const refreshToken = getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await api.post('/auth/refresh', { refreshToken });
    
    if (response.data.accessToken) {
      saveTokens(response.data.accessToken);
    }
    
    return response;
  },
  
  // Check if authenticated
  isAuthenticated: () => {
    return !!getAccessToken();
  },
  
  // Clear all auth data
  clearAuth: () => {
    clearTokens();
  }
});

export default enhancedApi;
export { getAccessToken, getRefreshToken, saveTokens, clearTokens };