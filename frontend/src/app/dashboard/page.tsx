'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import StudentDashboard from '@/components/dashboards/StudentDashboard';
import TeacherDashboard from '@/components/dashboards/TeacherDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import OwnerDashboard from '@/components/dashboards/OwnerDashboard';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [selectedView, setSelectedView] = useState<string>('owner');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated && user === null) {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    // Set default view based on role
    if (user) {
      setSelectedView(user.role);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Master account can switch between all views
  const isMasterAccount = user.email === 'hbaviskar777@gmail.com';

  return (
    <DashboardLayout>
      {isMasterAccount && (
        <div className="mb-4 p-4 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Dashboard View:</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedView('owner')}
                className={`px-3 py-1 rounded ${selectedView === 'owner' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Owner
              </button>
              <button
                onClick={() => setSelectedView('admin')}
                className={`px-3 py-1 rounded ${selectedView === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Admin
              </button>
              <button
                onClick={() => setSelectedView('teacher')}
                className={`px-3 py-1 rounded ${selectedView === 'teacher' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Teacher
              </button>
              <button
                onClick={() => setSelectedView('student')}
                className={`px-3 py-1 rounded ${selectedView === 'student' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Student
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Show selected dashboard based on view or role */}
      {(selectedView === 'student' || (!isMasterAccount && user.role === 'student')) && <StudentDashboard />}
      {(selectedView === 'teacher' || (!isMasterAccount && user.role === 'teacher')) && <TeacherDashboard />}
      {(selectedView === 'admin' || (!isMasterAccount && user.role === 'admin')) && <AdminDashboard />}
      {selectedView === 'owner' && <OwnerDashboard />}
    </DashboardLayout>
  );
}