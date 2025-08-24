'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Activity,
  Award,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Line } from 'recharts';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  overview: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    totalEnrollments: number;
    totalRevenue: number;
    activeStudents: number;
    pendingClasses: number;
    completionRate: number;
  };
  recentEnrollments: any[];
  topClasses: any[];
  monthlyRevenue: any[];
  growthRate: {
    students: number;
    classes: number;
    revenue: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Platform overview and management
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Students
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats?.overview.totalStudents || 0}
                    </div>
                    {stats?.growthRate.students !== 0 && (
                      <span className={`ml-2 text-sm font-semibold ${
                        stats.growthRate.students > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stats.growthRate.students > 0 ? '+' : ''}{stats.growthRate.students}%
                      </span>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Classes
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats?.overview.totalClasses || 0}
                    </div>
                    {stats?.growthRate.classes !== 0 && (
                      <span className={`ml-2 text-sm font-semibold ${
                        stats.growthRate.classes > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stats.growthRate.classes > 0 ? '+' : ''}{stats.growthRate.classes}%
                      </span>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Revenue
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(stats?.overview.totalRevenue || 0)}
                    </div>
                    {stats?.growthRate.revenue !== 0 && (
                      <span className={`ml-2 text-sm font-semibold ${
                        stats.growthRate.revenue > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stats.growthRate.revenue > 0 ? '+' : ''}{stats.growthRate.revenue}%
                      </span>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Students
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {stats?.overview.activeStudents || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {stats?.overview.pendingClasses > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You have <span className="font-medium">{stats.overview.pendingClasses} classes</span> pending approval.
                <Link href="/admin/classes" className="ml-2 font-medium underline text-yellow-700 hover:text-yellow-600">
                  Review now
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Top Classes</h3>
              <Link
                href="/admin/classes"
                className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
              >
                View all
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {stats?.topClasses?.map((classItem: any) => (
                <div
                  key={classItem._id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                >
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {classItem.title}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {classItem.enrollmentCount} students • {formatCurrency(classItem.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    {classItem.averageRating > 0 && (
                      <p className="text-sm font-medium text-gray-900">
                        ⭐ {classItem.averageRating}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      Revenue: {formatCurrency(classItem.enrollmentCount * classItem.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Enrollments</h3>
              <Link
                href="/admin/enrollments"
                className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
              >
                View all
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {stats?.recentEnrollments.slice(0, 5).map((enrollment: any) => (
                <div
                  key={enrollment._id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                >
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {enrollment.student?.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {enrollment.class?.title}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    New
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Statistics</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium text-gray-500">Total Teachers</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {stats?.overview.totalTeachers || 0}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium text-gray-500">Total Enrollments</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {stats?.overview.totalEnrollments || 0}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {stats?.overview.completionRate || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}