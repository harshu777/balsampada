'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';

export default function ClearAuthPage() {
  const router = useRouter();
  const { logout } = useAuthStore();

  useEffect(() => {
    // Clear all authentication data
    logout();
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
    }
    
    // Redirect to login after clearing
    setTimeout(() => {
      router.push('/login');
    }, 1000);
  }, [logout, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Clearing authentication data...</p>
        <p className="mt-2 text-sm text-gray-500">You will be redirected to login page shortly.</p>
      </div>
    </div>
  );
}