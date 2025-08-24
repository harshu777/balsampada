'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  DollarSign,
  FileText,
  TrendingUp,
  PlusCircle,
  ChevronRight,
  Clock
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface DashboardData {
  classes: any[];
  totalStudents: number;
  recentSubmissions: any[];
  upcomingClasses: any[];
  earnings: {
    total: number;
    thisMonth: number;
    totalTransactions: number;
  };
}

export default function TeacherDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/users/teacher/dashboard');
      setData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your classes and track student progress
          </p>
        </div>
        <Link
          href="/teacher/classes/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Create Class
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Classes
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {data?.classes.length || 0}
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
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Students
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {data?.totalStudents || 0}
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
                    Total Earnings
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(data?.earnings.total || 0)}
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
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    This Month
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(data?.earnings.thisMonth || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">My Classes</h3>
              <Link
                href="/teacher/classes"
                className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
              >
                View all
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {data?.classes.slice(0, 4).map((classItem: any) => (
                <Link
                  key={classItem._id}
                  href={`/teacher/classes/${classItem._id}`}
                  className="block hover:bg-gray-50 p-3 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {classItem.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {classItem.enrolledStudents?.length || 0} students enrolled
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        classItem.status === 'published' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {classItem.status}
                      </span>
                      {classItem.averageRating > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          ⭐ {classItem.averageRating}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              {(!data?.classes || data.classes.length === 0) && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No classes created yet</p>
                  <Link
                    href="/teacher/classes/create"
                    className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                  >
                    Create your first class
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Submissions</h3>
              <Link
                href="/teacher/assignments"
                className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
              >
                View all
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {data?.recentSubmissions.slice(0, 5).map((submission: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                >
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {submission.assignmentTitle}
                    </h4>
                    <p className="text-sm text-gray-500">
                      by {submission.studentName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {formatDateTime(submission.submittedAt)}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending Review
                    </span>
                  </div>
                </div>
              ))}
              {(!data?.recentSubmissions || data.recentSubmissions.length === 0) && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No recent submissions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Classes</h3>
          <div className="space-y-4">
            {data?.upcomingClasses.map((classItem: any) => (
              <div key={classItem._id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{classItem.title}</p>
                  <p className="text-sm text-gray-500">
                    Starts on {formatDateTime(classItem.startDate)}
                  </p>
                </div>
              </div>
            ))}
            {(!data?.upcomingClasses || data.upcomingClasses.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">
                No upcoming classes scheduled
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}