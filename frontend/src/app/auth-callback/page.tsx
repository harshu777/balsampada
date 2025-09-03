'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Authentication failed');
      router.push('/login');
      return;
    }

    if (token) {
      // Store the token temporarily and decode user info
      try {
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(atob(base64Payload));
        
        // Store token in cookies
        Cookies.set('token', token, { expires: 7 });
        
        // Fetch user details
        fetchUserDetails(token);
      } catch (error) {
        console.error('Token decode error:', error);
        toast.error('Invalid authentication token');
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [searchParams, router]);

  const fetchUserDetails = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        Cookies.set('user', JSON.stringify(result.user), { expires: 7 });
        updateUser(result.user);
        
        // Check if profile is incomplete
        if (result.user.profileIncomplete) {
          router.push('/complete-profile');
        } else {
          router.push('/dashboard');
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Fetch user error:', error);
      toast.error('Failed to authenticate user');
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Authenticating...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}