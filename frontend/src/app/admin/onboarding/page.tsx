'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  UserX, 
  GraduationCap, 
  BookOpen,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Filter
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/layouts/DashboardLayout';

interface PendingUser {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
  academicProfile: {
    board?: string;
    standard?: string;
    school?: string;
    canTeachBoards?: string[];
    canTeachStandards?: string[];
    canTeachSubjects?: Array<{
      subject: string;
      isPrimary: boolean;
      specialization?: string;
    }>;
  };
  onboardingStatus: string;
  createdAt: string;
}

interface OnboardingStats {
  students: {
    pending: number;
    completed: number;
    rejected: number;
    total: number;
  };
  teachers: {
    pending: number;
    completed: number;
    rejected: number;
    total: number;
  };
  totalPending: number;
}

export default function OnboardingManagementPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [stats, setStats] = useState<OnboardingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'teacher'>('all');
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [processingBulk, setProcessingBulk] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterRole]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingResponse, statsResponse] = await Promise.all([
        api.get('/onboarding/pending', { 
          params: filterRole !== 'all' ? { role: filterRole } : {} 
        }),
        api.get('/onboarding/stats')
      ]);

      setPendingUsers(pendingResponse.data.data.users);
      setStats(statsResponse.data.data);
    } catch (error) {
      toast.error('Error fetching onboarding data');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users to process');
      return;
    }

    setProcessingBulk(true);
    try {
      const response = await api.post('/onboarding/bulk', {
        userIds: selectedUsers,
        action
      });

      const { success, failed } = response.data.data;
      
      toast.success(`${action === 'approve' ? 'Approved' : 'Rejected'} ${success.length} users successfully`);
      
      if (failed.length > 0) {
        toast.error(`Failed to process ${failed.length} users`);
      }

      setSelectedUsers([]);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Error ${action}ing users`);
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleIndividualAction = async (userId: string, action: 'approve' | 'reject') => {
    try {
      const user = pendingUsers.find(u => u._id === userId);
      if (!user) return;

      if (action === 'approve') {
        await api.post(`/onboarding/${user.role}/${userId}`);
      } else {
        await api.post('/onboarding/bulk', {
          userIds: [userId],
          action: 'reject'
        });
      }

      toast.success(`User ${action}d successfully`);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Error ${action}ing user`);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(
      selectedUsers.length === pendingUsers.length 
        ? [] 
        : pendingUsers.map(u => u._id)
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Onboarding Management</h1>
          <p className="text-gray-600">Review and approve student and teacher registrations</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Total Pending</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalPending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              delay={0.1}
              className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Pending Students</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.students.pending}</p>
                  <p className="text-xs text-gray-500">Total: {stats.students.total}</p>
                </div>
                <GraduationCap className="w-8 h-8 text-blue-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              delay={0.2}
              className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Pending Teachers</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.teachers.pending}</p>
                  <p className="text-xs text-gray-500">Total: {stats.teachers.total}</p>
                </div>
                <BookOpen className="w-8 h-8 text-green-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              delay={0.3}
              className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.students.completed + stats.teachers.completed}
                  </p>
                  <p className="text-xs text-gray-500">This month</p>
                </div>
                <UserCheck className="w-8 h-8 text-purple-500" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Users</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === pendingUsers.length && pendingUsers.length > 0}
                  onChange={selectAllUsers}
                  className="rounded"
                />
                Select All ({selectedUsers.length} selected)
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleBulkAction('approve')}
                disabled={selectedUsers.length === 0 || processingBulk}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                {processingBulk ? 'Processing...' : `Approve (${selectedUsers.length})`}
              </button>

              <button
                onClick={() => handleBulkAction('reject')}
                disabled={selectedUsers.length === 0 || processingBulk}
                className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <XCircle className="w-4 h-4" />
                {processingBulk ? 'Processing...' : `Reject (${selectedUsers.length})`}
              </button>
            </div>
          </div>
        </div>

        {/* Pending Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Registrations ({pendingUsers.length})
            </h2>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No pending registrations</h3>
              <p className="text-gray-600">All users have been processed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === pendingUsers.length}
                        onChange={selectAllUsers}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role & Preferences
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => toggleUserSelection(user._id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            {user.role === 'student' ? (
                              <GraduationCap className="w-4 h-4 text-blue-500" />
                            ) : (
                              <BookOpen className="w-4 h-4 text-green-500" />
                            )}
                            <span className="font-medium capitalize">{user.role}</span>
                          </div>
                          
                          {user.role === 'student' && user.academicProfile.board && (
                            <div className="text-xs text-gray-600">
                              {user.academicProfile.standard} - {user.academicProfile.board}
                              {user.academicProfile.school && (
                                <div>{user.academicProfile.school}</div>
                              )}
                            </div>
                          )}
                          
                          {user.role === 'teacher' && user.academicProfile.canTeachSubjects && (
                            <div className="text-xs text-gray-600">
                              <div>Boards: {user.academicProfile.canTeachBoards?.join(', ')}</div>
                              <div>Standards: {user.academicProfile.canTeachStandards?.join(', ')}</div>
                              <div>Subjects: {user.academicProfile.canTeachSubjects.map(s => s.subject).join(', ')}</div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleIndividualAction(user._id, 'approve')}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleIndividualAction(user._id, 'reject')}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedUser.name}</h2>
                    <p className="text-gray-600">{selectedUser.email}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                      {selectedUser.role}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Academic Profile</h3>
                    
                    {selectedUser.role === 'student' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Board</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedUser.academicProfile.board}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Standard</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedUser.academicProfile.standard}</p>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">School</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedUser.academicProfile.school}</p>
                        </div>
                      </div>
                    )}

                    {selectedUser.role === 'teacher' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Can Teach Boards</label>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {selectedUser.academicProfile.canTeachBoards?.map((board) => (
                              <span key={board} className="inline-flex px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                {board}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Can Teach Standards</label>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {selectedUser.academicProfile.canTeachStandards?.map((standard) => (
                              <span key={standard} className="inline-flex px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                {standard}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Subjects</label>
                          <div className="mt-1 space-y-2">
                            {selectedUser.academicProfile.canTeachSubjects?.map((subject, index) => (
                              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{subject.subject}</span>
                                  {subject.isPrimary && (
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                      Primary
                                    </span>
                                  )}
                                </div>
                                {subject.specialization && (
                                  <p className="text-sm text-gray-600 mt-1">{subject.specialization}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => {
                        handleIndividualAction(selectedUser._id, 'approve');
                        setSelectedUser(null);
                      }}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve Registration
                    </button>
                    <button
                      onClick={() => {
                        handleIndividualAction(selectedUser._id, 'reject');
                        setSelectedUser(null);
                      }}
                      className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject Registration
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}