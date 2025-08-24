'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Users,
  Star,
  DollarSign,
  Eye,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Filter
} from 'lucide-react';

interface Class {
  _id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  discountPrice?: number;
  status: string;
  teacher: {
    _id: string;
    name: string;
    email: string;
  };
  enrolledStudents: string[];
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  publishedAt?: string;
}

export default function AdminClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'pending' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [actionModal, setActionModal] = useState<{ show: boolean; action: 'approve' | 'reject' | null }>({ show: false, action: null });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (classId: string) => {
    try {
      await api.put(`/admin/classes/${classId}/approve`, { status: 'published' });
      toast.success('Class approved successfully');
      fetchClasses();
      setActionModal({ show: false, action: null });
      setSelectedClass(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve class');
    }
  };

  const handleReject = async (classId: string) => {
    try {
      await api.put(`/admin/classes/${classId}/approve`, { status: 'rejected' });
      toast.success('Class rejected');
      fetchClasses();
      setActionModal({ show: false, action: null });
      setSelectedClass(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject class');
    }
  };

  const filteredClasses = classes.filter(classItem => {
    const matchesFilter = filter === 'all' || classItem.status === filter;
    const matchesSearch = classItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          classItem.teacher.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    totalClasses: classes.length,
    publishedClasses: classes.filter(c => c.status === 'published').length,
    pendingClasses: classes.filter(c => c.status === 'pending').length,
    totalStudents: classes.reduce((acc, c) => acc + c.enrolledStudents.length, 0),
    totalRevenue: classes.reduce((acc, c) => 
      acc + (c.enrolledStudents.length * (c.discountPrice || c.price)), 0
    )
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Classes</h1>
          <p className="mt-2 text-gray-600">
            Review and manage all classes on the platform
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-gray-900">{stats.publishedClasses}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingClasses}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Classes
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filter === 'published'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending Review
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filter === 'rejected'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejected
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search classes or teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <Filter className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>

        {/* Classes List */}
        {filteredClasses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No classes found
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : `No ${filter === 'all' ? '' : filter} classes found`}
            </p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClasses.map((classItem) => (
                  <tr key={classItem._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {classItem.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {classItem.category} • {classItem.level}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{classItem.teacher.name}</div>
                      <div className="text-sm text-gray-500">{classItem.teacher.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        classItem.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : classItem.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : classItem.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {classItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {classItem.enrolledStudents.length}
                    </td>
                    <td className="px-6 py-4">
                      {classItem.averageRating > 0 ? (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm text-gray-900">
                            {classItem.averageRating}
                          </span>
                          <span className="ml-1 text-xs text-gray-500">
                            ({classItem.totalReviews})
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No ratings</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatCurrency(
                        classItem.enrolledStudents.length * (classItem.discountPrice || classItem.price)
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => router.push(`/classes/${classItem._id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {classItem.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedClass(classItem);
                                setActionModal({ show: true, action: 'approve' });
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedClass(classItem);
                                setActionModal({ show: true, action: 'reject' });
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Action Confirmation Modal */}
        {actionModal.show && selectedClass && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {actionModal.action === 'approve' ? 'Approve Class' : 'Reject Class'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to {actionModal.action} "{selectedClass.title}"?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setActionModal({ show: false, action: null });
                    setSelectedClass(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (actionModal.action === 'approve') {
                      handleApprove(selectedClass._id);
                    } else {
                      handleReject(selectedClass._id);
                    }
                  }}
                  className={`px-4 py-2 text-white rounded-md transition-colors ${
                    actionModal.action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionModal.action === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}