import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if not already on login or register pages
      const currentPath = window.location.pathname;
      const authPaths = ['/login', '/register', '/register-student', '/register-teacher', '/clear-auth'];
      
      if (!authPaths.some(path => currentPath.includes(path))) {
        Cookies.remove('token');
        Cookies.remove('user');
        // Clear local storage auth data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
        }
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      }
    }
    // Don't show toast here, let the component handle it
    return Promise.reject(error);
  }
);

export default api;