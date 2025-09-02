'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';

export default function MyClassesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Redirect based on user role
    if (user?.role === 'teacher') {
      router.push('/teacher/classes');
    } else if (user?.role === 'student') {
      router.push('/classes/enrolled');
    } else if (user?.role === 'admin') {
      router.push('/admin/classes');
    } else {
      // Default fallback
      router.push('/dashboard');
    }
  }, [user, isAuthenticated, router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to your classes...</p>
      </div>
    </div>
  );
}