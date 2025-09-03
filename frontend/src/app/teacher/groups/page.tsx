'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Users, Plus, Edit, Trash2, UserPlus, UserMinus } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Student {
  _id: string;
  name: string;
  email: string;
}

interface Class {
  _id: string;
  title: string;
}

interface StudentGroup {
  _id: string;
  name: string;
  description: string;
  class: Class;
  students: Student[];
  type: 'performance' | 'project' | 'study' | 'custom';
  color: string;
  isActive: boolean;
  metadata?: {
    assignmentsCount: number;
    averagePerformance: number;
  };
}

export default function TeacherGroupsPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isManageStudentsDialogOpen, setIsManageStudentsDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudentGroup | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    classId: '',
    type: 'custom' as 'performance' | 'project' | 'study' | 'custom',
    color: '#3B82F6',
    students: [] as string[]
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated && user === null) {
      router.push('/login');
    } else if (user?.role === 'teacher') {
      fetchData();
    }
  }, [isAuthenticated, user, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const classesResponse = await api.get('/classes/teacher');
      setClasses(classesResponse.data.data || []);
      
      const groupsResponse = await api.get('/student-groups');
      setGroups(groupsResponse.data.data || []);
      
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStudents = async (classId: string) => {
    try {
      const response = await api.get(`/student-groups/class/${classId}/available-students`);
      setAvailableStudents(response.data.data.available || []);
    } catch (error: any) {
      console.error('Error fetching available students:', error);
      toast.error('Failed to fetch students');
    }
  };

  const handleCreateGroup = async () => {
    try {
      const response = await api.post('/student-groups', formData);
      setGroups([response.data.data, ...groups]);
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Group created successfully');
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast.error(error.response?.data?.message || 'Failed to create group');
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;
    
    try {
      const response = await api.put(`/student-groups/${selectedGroup._id}`, {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        color: formData.color
      });
      
      setGroups(groups.map(g => g._id === selectedGroup._id ? response.data.data : g));
      setIsEditDialogOpen(false);
      resetForm();
      toast.success('Group updated successfully');
    } catch (error: any) {
      console.error('Error updating group:', error);
      toast.error(error.response?.data?.message || 'Failed to update group');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    
    try {
      await api.delete(`/student-groups/${groupId}`);
      setGroups(groups.filter(g => g._id !== groupId));
      toast.success('Group deleted successfully');
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast.error(error.response?.data?.message || 'Failed to delete group');
    }
  };

  const handleAddStudents = async (studentIds: string[]) => {
    if (!selectedGroup) return;
    
    try {
      const response = await api.post(`/student-groups/${selectedGroup._id}/students/add`, {
        studentIds
      });
      
      setGroups(groups.map(g => g._id === selectedGroup._id ? response.data.data : g));
      setSelectedGroup(response.data.data);
      toast.success('Students added successfully');
    } catch (error: any) {
      console.error('Error adding students:', error);
      toast.error(error.response?.data?.message || 'Failed to add students');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedGroup) return;
    
    try {
      const response = await api.post(`/student-groups/${selectedGroup._id}/students/remove`, {
        studentIds: [studentId]
      });
      
      setGroups(groups.map(g => g._id === selectedGroup._id ? response.data.data : g));
      setSelectedGroup(response.data.data);
      toast.success('Student removed successfully');
    } catch (error: any) {
      console.error('Error removing student:', error);
      toast.error(error.response?.data?.message || 'Failed to remove student');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      classId: '',
      type: 'custom',
      color: '#3B82F6',
      students: []
    });
    setSelectedGroup(null);
  };

  const openEditDialog = (group: StudentGroup) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      classId: group.class._id,
      type: group.type,
      color: group.color,
      students: []
    });
    setIsEditDialogOpen(true);
  };

  const openManageStudentsDialog = async (group: StudentGroup) => {
    setSelectedGroup(group);
    await fetchAvailableStudents(group.class._id);
    setIsManageStudentsDialogOpen(true);
  };

  if (!user || user.role !== 'teacher') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Groups</h1>
            <p className="text-gray-600 mt-2">Manage and organize your students into groups</p>
          </div>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No groups yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first group to organize students
            </p>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="inline-block mr-2 h-4 w-4" />
              Create Your First Group
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div key={group._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{group.class.title}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      group.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {group.type}
                    </span>
                  </div>
                  
                  {group.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {group.description}
                    </p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Students</span>
                      <span className="font-medium">{group.students.length}</span>
                    </div>
                    
                    {group.metadata && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Assignments</span>
                          <span className="font-medium">{group.metadata.assignmentsCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Avg Performance</span>
                          <span className="font-medium">
                            {group.metadata.averagePerformance.toFixed(1)}%
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => openManageStudentsDialog(group)}
                      className="flex-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      <Users className="inline-block mr-1 h-3 w-3" />
                      Manage
                    </button>
                    <button
                      onClick={() => openEditDialog(group)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group._id)}
                      className="px-3 py-1 text-sm bg-gray-100 text-red-600 rounded hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Group Modal */}
        {isCreateDialogOpen && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Group</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <select
                      value={formData.classId}
                      onChange={(e) => {
                        setFormData({ ...formData, classId: e.target.value, students: [] });
                        fetchAvailableStudents(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a class</option>
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Advanced Math Group"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the purpose of this group..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="performance">Performance-based</option>
                      <option value="project">Project Group</option>
                      <option value="study">Study Group</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Color</label>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  
                  {formData.classId && availableStudents.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Students</label>
                      <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                        {availableStudents.map((student) => (
                          <label key={student._id} className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={formData.students.includes(student._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, students: [...formData.students, student._id] });
                                } else {
                                  setFormData({ ...formData, students: formData.students.filter(id => id !== student._id) });
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{student.name} ({student.email})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    disabled={!formData.name || !formData.classId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Group
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Group Modal */}
        {isEditDialogOpen && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Group</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="performance">Performance-based</option>
                      <option value="project">Project Group</option>
                      <option value="study">Study Group</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Color</label>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setIsEditDialogOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateGroup}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manage Students Modal */}
        {isManageStudentsDialogOpen && selectedGroup && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Manage Students - {selectedGroup.name}
                </h2>
                <p className="text-gray-600 mb-6">Add or remove students from this group</p>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">
                      Current Students ({selectedGroup.students.length})
                    </h3>
                    <div className="border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto">
                      {selectedGroup.students.length === 0 ? (
                        <p className="text-sm text-gray-500">No students in this group</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedGroup.students.map((student) => (
                            <div key={student._id} className="flex items-center justify-between py-1">
                              <span className="text-sm">
                                {student.name} ({student.email})
                              </span>
                              <button
                                onClick={() => handleRemoveStudent(student._id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <UserMinus className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Available Students</h3>
                    <div className="border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto">
                      {availableStudents.length === 0 ? (
                        <p className="text-sm text-gray-500">No available students</p>
                      ) : (
                        <div className="space-y-2">
                          {availableStudents.map((student) => (
                            <div key={student._id} className="flex items-center justify-between py-1">
                              <span className="text-sm">
                                {student.name} ({student.email})
                              </span>
                              <button
                                onClick={() => handleAddStudents([student._id])}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                              >
                                <UserPlus className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setIsManageStudentsDialogOpen(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}