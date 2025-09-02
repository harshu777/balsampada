'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CalendarIcon,
  AcademicCapIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface Enrollment {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  class: {
    _id: string;
    title: string;
    subject: string;
    teacher: {
      name: string;
    };
    price: number;
    startDate: string;
    endDate?: string;
    schedule?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  enrolledAt: string;
  approvedAt?: string;
  approvedBy?: {
    name: string;
    role: string;
  };
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentAmount?: number;
  paymentDate?: string;
  notes?: string;
}

interface EnrollmentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  todayEnrollments: number;
  weekEnrollments: number;
  revenue: number;
}

export default function AdminEnrollmentsPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EnrollmentStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    todayEnrollments: 0,
    weekEnrollments: 0,
    revenue: 0
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedEnrollments, setSelectedEnrollments] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState<Enrollment | null>(null);
  const [showNotesModal, setShowNotesModal] = useState<Enrollment | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchEnrollments();
    fetchStats();
  }, [statusFilter, paymentFilter, dateFilter]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with API call
      const mockEnrollments: Enrollment[] = [
        {
          _id: '1',
          student: {
            _id: 's1',
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890'
          },
          class: {
            _id: 'c1',
            title: 'Mathematics Grade 10',
            subject: 'Mathematics',
            teacher: { name: 'Dr. Smith' },
            price: 5000,
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            schedule: 'Mon, Wed, Fri - 4:00 PM to 5:30 PM'
          },
          status: 'pending',
          enrolledAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          paymentStatus: 'pending',
          paymentAmount: 5000
        },
        {
          _id: '2',
          student: {
            _id: 's2',
            name: 'Jane Smith',
            email: 'jane.smith@example.com'
          },
          class: {
            _id: 'c2',
            title: 'Physics Grade 11',
            subject: 'Physics',
            teacher: { name: 'Prof. Johnson' },
            price: 5500,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString()
          },
          status: 'approved',
          enrolledAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          approvedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
          approvedBy: { name: 'Admin User', role: 'admin' },
          paymentStatus: 'paid',
          paymentAmount: 5500,
          paymentDate: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '3',
          student: {
            _id: 's3',
            name: 'Mike Johnson',
            email: 'mike.j@example.com',
            phone: '+1987654321'
          },
          class: {
            _id: 'c3',
            title: 'Chemistry Grade 12',
            subject: 'Chemistry',
            teacher: { name: 'Dr. Wilson' },
            price: 6000,
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          status: 'rejected',
          enrolledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          paymentStatus: 'failed',
          notes: 'Payment verification failed'
        },
        {
          _id: '4',
          student: {
            _id: 's4',
            name: 'Sarah Williams',
            email: 'sarah.w@example.com'
          },
          class: {
            _id: 'c1',
            title: 'Mathematics Grade 10',
            subject: 'Mathematics',
            teacher: { name: 'Dr. Smith' },
            price: 5000,
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          status: 'pending',
          enrolledAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          paymentStatus: 'paid',
          paymentAmount: 5000,
          paymentDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ];

      // Apply filters
      let filtered = mockEnrollments;
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(e => e.status === statusFilter);
      }
      
      if (paymentFilter !== 'all') {
        filtered = filtered.filter(e => e.paymentStatus === paymentFilter);
      }
      
      if (dateFilter !== 'all') {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        filtered = filtered.filter(e => {
          const enrolledDate = new Date(e.enrolledAt);
          switch (dateFilter) {
            case 'today':
              return enrolledDate >= startOfDay;
            case 'week':
              return enrolledDate >= startOfWeek;
            case 'month':
              return enrolledDate >= startOfMonth;
            default:
              return true;
          }
        });
      }
      
      setEnrollments(filtered);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock stats - replace with API call
      const mockStats: EnrollmentStats = {
        total: 156,
        pending: 12,
        approved: 138,
        rejected: 6,
        todayEnrollments: 4,
        weekEnrollments: 23,
        revenue: 785000
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (enrollmentId: string) => {
    try {
      // API call to approve enrollment
      await api.post(`/enrollments/${enrollmentId}/approve`);
      
      setEnrollments(prev => prev.map(e => 
        e._id === enrollmentId 
          ? { ...e, status: 'approved', approvedAt: new Date().toISOString() }
          : e
      ));
      
      toast.success('Enrollment approved successfully');
    } catch (error) {
      toast.error('Failed to approve enrollment');
    }
  };

  const handleReject = async (enrollmentId: string, reason?: string) => {
    try {
      // API call to reject enrollment
      await api.post(`/enrollments/${enrollmentId}/reject`, { reason });
      
      setEnrollments(prev => prev.map(e => 
        e._id === enrollmentId 
          ? { ...e, status: 'rejected', notes: reason }
          : e
      ));
      
      toast.success('Enrollment rejected');
    } catch (error) {
      toast.error('Failed to reject enrollment');
    }
  };

  const handleBulkApprove = async () => {
    try {
      // API call to bulk approve
      const selected = Array.from(selectedEnrollments);
      
      for (const id of selected) {
        await handleApprove(id);
      }
      
      setSelectedEnrollments(new Set());
      setShowBulkActions(false);
    } catch (error) {
      toast.error('Failed to approve selected enrollments');
    }
  };

  const exportEnrollments = () => {
    // Export to CSV
    const csv = [
      ['Student Name', 'Email', 'Class', 'Status', 'Payment Status', 'Amount', 'Enrolled Date'],
      ...enrollments.map(e => [
        e.student.name,
        e.student.email,
        e.class.title,
        e.status,
        e.paymentStatus,
        e.paymentAmount || '',
        new Date(e.enrolledAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrollments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('Enrollments exported successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEnrollments = enrollments.filter(enrollment =>
    enrollment.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.class.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{borderColor: '#82993D'}}></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enrollment Management</h1>
              <p className="mt-2 text-gray-600">
                Manage student enrollments and approvals
              </p>
            </div>
            <button
              onClick={exportEnrollments}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-gray-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-yellow-50 rounded-xl shadow-sm p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-green-50 rounded-xl shadow-sm p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600">Approved</p>
                <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-red-50 rounded-xl shadow-sm p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600">Rejected</p>
                <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
              </div>
              <XCircleIcon className="h-8 w-8 text-red-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-50 rounded-xl shadow-sm p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600">Today</p>
                <p className="text-2xl font-bold text-blue-700">{stats.todayEnrollments}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-purple-50 rounded-xl shadow-sm p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600">This Week</p>
                <p className="text-2xl font-bold text-purple-700">{stats.weekEnrollments}</p>
              </div>
              <ArrowUpTrayIcon className="h-8 w-8 text-purple-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl shadow-sm p-4 text-white"
          >
            <div>
              <p className="text-xs opacity-90">Revenue</p>
              <p className="text-xl font-bold">₹{stats.revenue.toLocaleString()}</p>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student name, email, or class..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Payment Pending</option>
              <option value="failed">Failed</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedEnrollments.size > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-sm text-gray-600">
                {selectedEnrollments.size} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkApprove}
                  className="px-3 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
                >
                  Approve Selected
                </button>
                <button
                  onClick={() => setSelectedEnrollments(new Set())}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Enrollments Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEnrollments(new Set(filteredEnrollments.map(e => e._id)));
                        } else {
                          setSelectedEnrollments(new Set());
                        }
                      }}
                      className="rounded text-blue-600"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrolled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEnrollments.map((enrollment) => (
                  <tr key={enrollment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedEnrollments.has(enrollment._id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedEnrollments);
                          if (e.target.checked) {
                            newSelected.add(enrollment._id);
                          } else {
                            newSelected.delete(enrollment._id);
                          }
                          setSelectedEnrollments(newSelected);
                        }}
                        className="rounded text-blue-600"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {enrollment.student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {enrollment.student.email}
                        </div>
                        {enrollment.student.phone && (
                          <div className="text-xs text-gray-400">
                            {enrollment.student.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {enrollment.class.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {enrollment.class.teacher.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          ₹{enrollment.class.price}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(enrollment.status)}`}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(enrollment.paymentStatus)}`}>
                          {enrollment.paymentStatus}
                        </span>
                        {enrollment.paymentAmount && (
                          <div className="text-xs text-gray-500 mt-1">
                            ₹{enrollment.paymentAmount}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(enrollment.enrolledAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {enrollment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(enrollment._id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Approve"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setShowNotesModal(enrollment);
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Reject"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setShowDetailsModal(enrollment)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Modal */}
        <AnimatePresence>
          {showDetailsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowDetailsModal(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Enrollment Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Student Information</h4>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                      <p className="text-sm"><span className="font-medium">Name:</span> {showDetailsModal.student.name}</p>
                      <p className="text-sm"><span className="font-medium">Email:</span> {showDetailsModal.student.email}</p>
                      {showDetailsModal.student.phone && (
                        <p className="text-sm"><span className="font-medium">Phone:</span> {showDetailsModal.student.phone}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Class Information</h4>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                      <p className="text-sm"><span className="font-medium">Class:</span> {showDetailsModal.class.title}</p>
                      <p className="text-sm"><span className="font-medium">Subject:</span> {showDetailsModal.class.subject}</p>
                      <p className="text-sm"><span className="font-medium">Teacher:</span> {showDetailsModal.class.teacher.name}</p>
                      <p className="text-sm"><span className="font-medium">Price:</span> ₹{showDetailsModal.class.price}</p>
                      {showDetailsModal.class.schedule && (
                        <p className="text-sm"><span className="font-medium">Schedule:</span> {showDetailsModal.class.schedule}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Enrollment Status</h4>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Status:</span>{' '}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(showDetailsModal.status)}`}>
                          {showDetailsModal.status}
                        </span>
                      </p>
                      <p className="text-sm"><span className="font-medium">Enrolled:</span> {new Date(showDetailsModal.enrolledAt).toLocaleString()}</p>
                      {showDetailsModal.approvedAt && (
                        <p className="text-sm"><span className="font-medium">Approved:</span> {new Date(showDetailsModal.approvedAt).toLocaleString()}</p>
                      )}
                      {showDetailsModal.approvedBy && (
                        <p className="text-sm"><span className="font-medium">Approved By:</span> {showDetailsModal.approvedBy.name}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Payment Information</h4>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Payment Status:</span>{' '}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(showDetailsModal.paymentStatus)}`}>
                          {showDetailsModal.paymentStatus}
                        </span>
                      </p>
                      {showDetailsModal.paymentAmount && (
                        <p className="text-sm"><span className="font-medium">Amount:</span> ₹{showDetailsModal.paymentAmount}</p>
                      )}
                      {showDetailsModal.paymentDate && (
                        <p className="text-sm"><span className="font-medium">Payment Date:</span> {new Date(showDetailsModal.paymentDate).toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  {showDetailsModal.notes && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Notes</h4>
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{showDetailsModal.notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowDetailsModal(null)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reject Modal */}
        <AnimatePresence>
          {showNotesModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowNotesModal(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Reject Enrollment
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to reject this enrollment? Please provide a reason.
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter rejection reason..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-4"
                  rows={3}
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowNotesModal(null);
                      setNotes('');
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleReject(showNotesModal._id, notes);
                      setShowNotesModal(null);
                      setNotes('');
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}