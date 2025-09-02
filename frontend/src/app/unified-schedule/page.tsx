'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  Plus, 
  Edit2, 
  Trash2, 
  Play, 
  Eye,
  BookOpen,
  GraduationCap,
  User,
  Filter
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import DashboardLayout from '@/components/layouts/DashboardLayout';

interface Grade {
  _id: string;
  name: string;
  board: string;
  displayName: string;
  subjects: Subject[];
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  grade: {
    _id: string;
    name: string;
    board: string;
  };
  teachers: {
    teacher: {
      _id: string;
      name: string;
      email: string;
    };
    isPrimary: boolean;
    specialization?: string;
  }[];
}

interface ScheduleEvent {
  _id: string;
  title: string;
  description: string;
  type: 'live_class' | 'regular_class' | 'meeting' | 'event';
  
  // Old structure
  class?: {
    _id: string;
    title: string;
  };
  
  // New structure
  grade?: {
    _id: string;
    name: string;
    board: string;
  };
  subject?: {
    _id: string;
    name: string;
  };
  
  teacher: {
    _id: string;
    name: string;
  };
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  
  // Live class specific
  meetingUrl?: string;
  meetingId?: string;
  maxAttendees?: number;
  attendees?: any[];
  isRecurring?: boolean;
  recurringPattern?: string;
}

export default function UnifiedSchedulePage() {
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendar' | 'live' | 'regular'>('calendar');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'live_class' | 'regular_class'>('live_class');
  const [editingClass, setEditingClass] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'single' | 'multiple'>('single');
  const [classToDelete, setClassToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'live_class' as 'live_class' | 'regular_class',
    // Old structure
    classId: '',
    // New structure
    gradeId: '',
    subjectId: '',
    scheduledAt: '',
    duration: 60,
    maxAttendees: 100,
    meetingUrl: '',
    isRecurring: false,
    recurringPattern: ''
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated && user === null) {
      router.push('/login');
      return;
    }
    
    fetchData();
    
    // Set active tab from URL parameter
    const tabParam = searchParams.get('tab');
    if (tabParam && ['calendar', 'live', 'regular'].includes(tabParam)) {
      setActiveTab(tabParam as 'calendar' | 'live' | 'regular');
    }
  }, [searchParams, isAuthenticated, user, router]);

  useEffect(() => {
    if (selectedGrade) {
      fetchSubjectsByGrade(selectedGrade);
    }
  }, [selectedGrade]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch live classes (existing API)
      const liveClassesResponse = await api.get('/live-classes');
      
      // Fetch grades (new API)
      const gradesResponse = await api.get('/grades');
      
      // Fetch teacher's classes if teacher
      if (user?.role === 'teacher') {
        const classesResponse = await api.get('/classes/teacher');
        setClasses(classesResponse.data.data || []);
      }
      
      // Transform live classes to unified format
      const liveClasses = liveClassesResponse.data.data.map((lc: any) => ({
        ...lc,
        type: 'live_class'
      }));

      setEvents(liveClasses);
      setGrades(gradesResponse.data.data);
    } catch (error) {
      toast.error('Error fetching schedule data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectsByGrade = async (gradeId: string) => {
    try {
      const response = await api.get(`/subjects/grade/${gradeId}/subjects`);
      setSubjects(response.data.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    }
  };

  const getFilteredEvents = () => {
    let filtered = events;

    if (activeTab === 'live') {
      filtered = filtered.filter(event => event.type === 'live_class');
    } else if (activeTab === 'regular') {
      filtered = filtered.filter(event => event.type === 'regular_class');
    }

    if (selectedGrade) {
      filtered = filtered.filter(event => 
        event.grade?._id === selectedGrade || 
        (event.class && event.class.title.includes(grades.find(g => g._id === selectedGrade)?.name || ''))
      );
    }

    if (selectedSubject) {
      filtered = filtered.filter(event => event.subject?._id === selectedSubject);
    }

    return filtered;
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.classId) {
        toast.error('Please select a class');
        return;
      }
      
      if (!formData.title) {
        toast.error('Please enter a title');
        return;
      }
      
      if (!formData.scheduledAt) {
        toast.error('Please select a date and time');
        return;
      }
      
      let endpoint = '';
      let payload: any = { ...formData };

      if (formData.type === 'live_class') {
        endpoint = '/live-classes';
        
        // Convert datetime-local to ISO8601 format
        const scheduledDate = new Date(formData.scheduledAt);
        
        // Ensure classId is included in payload
        payload = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          classId: formData.classId,
          scheduledAt: scheduledDate.toISOString(),
          duration: formData.duration || 60,
          maxAttendees: formData.maxAttendees || 100,
          meetingUrl: formData.meetingUrl?.trim() || '' // Include meeting URL
        };
        
        // Only add recurring fields if actually recurring
        if (formData.isRecurring && formData.recurringPattern) {
          payload.isRecurring = true;
          payload.recurringPattern = formData.recurringPattern;
        }
        
        // Remove any undefined/unnecessary fields
        delete payload.type;
        delete payload.gradeId;
        delete payload.subjectId;
      }

      console.log('Creating live class with payload:', payload);
      console.log('Current user:', user);
      const response = await api.post(endpoint, payload);
      toast.success('Live class scheduled successfully!');
      
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error creating event:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(error.response?.data?.message || 'Error creating event');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'live_class',
      classId: '',
      gradeId: '',
      subjectId: '',
      scheduledAt: '',
      duration: 60,
      maxAttendees: 100,
      meetingUrl: '',
      isRecurring: false,
      recurringPattern: ''
    });
  };

  const handleEditClass = (event: any) => {
    setEditingClass(event);
    const scheduledDate = new Date(event.scheduledAt);
    const localDateTime = new Date(scheduledDate.getTime() - scheduledDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    
    setFormData({
      title: event.title || '',
      description: event.description || '',
      type: event.type || 'live_class',
      classId: event.class?._id || '',
      gradeId: '',
      subjectId: '',
      scheduledAt: localDateTime,
      duration: event.duration || 60,
      maxAttendees: event.maxAttendees || 100,
      meetingUrl: event.meetingUrl || '',
      isRecurring: false,
      recurringPattern: ''
    });
    setShowEditModal(true);
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const scheduledDate = new Date(formData.scheduledAt);
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        scheduledAt: scheduledDate.toISOString(),
        duration: formData.duration || 60,
        maxAttendees: formData.maxAttendees || 100,
        meetingUrl: formData.meetingUrl?.trim() || ''
      };
      
      await api.put(`/live-classes/${editingClass._id}`, payload);
      toast.success('Live class updated successfully!');
      
      setShowEditModal(false);
      setEditingClass(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error updating live class:', error);
      toast.error(error.response?.data?.message || 'Error updating live class');
    }
  };

  const handleDeleteClass = async (classId: string) => {
    setClassToDelete(classId);
    setDeleteType('single');
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteType === 'single' && classToDelete) {
        await api.delete(`/live-classes/${classToDelete}`);
        toast.success('Live class deleted successfully!');
      } else if (deleteType === 'multiple' && selectedClasses.size > 0) {
        const response = await api.post('/live-classes/delete-selected', {
          classIds: Array.from(selectedClasses)
        });
        toast.success(response.data.message || 'Selected classes deleted successfully!');
        setSelectedClasses(new Set());
        setIsSelectionMode(false);
      }
      
      setShowDeleteConfirm(false);
      setClassToDelete(null);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting class(es):', error);
      toast.error(error.response?.data?.message || 'Error deleting class(es)');
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedClasses.size === 0) {
      toast.error('Please select classes to delete');
      return;
    }
    
    setDeleteType('multiple');
    setShowDeleteConfirm(true);
  };

  const toggleClassSelection = (classId: string) => {
    const newSelection = new Set(selectedClasses);
    if (newSelection.has(classId)) {
      newSelection.delete(classId);
    } else {
      newSelection.add(classId);
    }
    setSelectedClasses(newSelection);
  };

  const selectAllClasses = () => {
    const userId = user?.id || user?._id;
    const teacherScheduledClasses = events.filter(e => {
      if (e.type !== 'live_class' || e.status !== 'scheduled') return false;
      const teacherId = e.teacher?._id || e.teacher?.id || e.teacher;
      return String(teacherId) === String(userId);
    }).map(e => e._id);
    
    console.log('Select All - Found classes:', teacherScheduledClasses.length);
    setSelectedClasses(new Set(teacherScheduledClasses));
  };

  const clearSelection = () => {
    setSelectedClasses(new Set());
    setIsSelectionMode(false);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'live': return 'bg-green-100 text-green-800 animate-pulse';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'live_class': return <Video className="w-5 h-5" />;
      case 'regular_class': return <BookOpen className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Unified Schedule</h1>
          <p className="text-gray-600">Manage all your classes, meetings, and events</p>
        </div>
        
        {user?.role === 'teacher' && (
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setCreateType('live_class');
                setShowCreateModal(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <Video className="w-4 h-4" />
              Schedule Live Class
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setCreateType('regular_class');
                setShowCreateModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <BookOpen className="w-4 h-4" />
              Schedule Regular Class
            </motion.button>
            
            {!isSelectionMode ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  console.log('Activating selection mode...');
                  setIsSelectionMode(true);
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
              >
                <Edit2 className="w-4 h-4" />
                Select Classes
              </motion.button>
            ) : (
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={selectAllClasses}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
                >
                  Select All
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearSelection}
                  className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteSelected}
                  disabled={selectedClasses.size === 0}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    selectedClasses.size > 0 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedClasses.size})
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'calendar', label: 'All Events', icon: Calendar },
            { key: 'live', label: 'Live Classes', icon: Video },
            { key: 'regular', label: 'Regular Classes', icon: BookOpen }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <select
            value={selectedGrade}
            onChange={(e) => {
              setSelectedGrade(e.target.value);
              setSelectedSubject(''); // Reset subject when grade changes
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Grades</option>
            {grades.map((grade) => (
              <option key={grade._id} value={grade._id}>
                {grade.displayName}
              </option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            disabled={!selectedGrade}
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selection Mode Indicator */}
      {isSelectionMode && (
        <div className="mb-4 p-3 bg-purple-50 border border-purple-300 rounded-lg">
          <p className="text-purple-700 font-medium">
            📌 Selection Mode Active - Checkboxes will appear on YOUR scheduled classes only
          </p>
          <p className="text-purple-600 text-sm mt-1">
            Only classes you created can be selected and deleted
          </p>
        </div>
      )}

      {/* Events Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {getFilteredEvents().map((event) => {
          // Debug: Log the comparison for edit button visibility
          if (user?.role === 'teacher') {
            console.log('Edit button check:', {
              eventTeacherId: event.teacher._id || event.teacher,
              userId: user.id,
              userIdAlt: user._id,
              eventStatus: event.status,
              isOwner: String(event.teacher._id || event.teacher) === String(user.id),
              canEdit: (String(event.teacher._id || event.teacher) === String(user.id)) && event.status === 'scheduled'
            });
          }
          
          const canSelect = isSelectionMode && 
            user?.role === 'teacher' && 
            event.type === 'live_class' && 
            event.status === 'scheduled' && 
            String(event.teacher._id || event.teacher) === String(user?.id);

          // Debug logging for selection
          if (isSelectionMode) {
            const teacherIdStr = String(event.teacher._id || event.teacher);
            const userIdStr = String(user?.id);
            const isOwnerMatch = teacherIdStr === userIdStr;
            const showCheckbox = user?.role === 'teacher' && 
              event.type === 'live_class' && 
              event.status === 'scheduled' &&
              isOwnerMatch;
            
            console.log('=== Checkbox Debug for:', event.title, '===');
            console.log('Teacher info:', event.teacher);
            console.log('Teacher ID (raw):', event.teacher._id || event.teacher);
            console.log('Teacher ID (string):', teacherIdStr);
            console.log('User info:', user);
            console.log('User ID (raw):', user?.id);
            console.log('User ID (string):', userIdStr);
            console.log('IDs match?:', isOwnerMatch);
            console.log('Show checkbox?:', showCheckbox);
            console.log('All checks:', {
              isTeacher: user?.role === 'teacher',
              isLiveClass: event.type === 'live_class', 
              isScheduled: event.status === 'scheduled',
              isOwner: isOwnerMatch
            });
            console.log('='.repeat(50));
          }

          return (
          <motion.div
            key={event._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-lg shadow-md p-6 border ${
              canSelect && selectedClasses.has(event._id) 
                ? 'border-purple-500 ring-2 ring-purple-300' 
                : 'border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start gap-3 flex-1">
                {(() => {
                  if (!isSelectionMode || user?.role !== 'teacher' || event.type !== 'live_class' || event.status !== 'scheduled') {
                    return null;
                  }
                  
                  // Try multiple ways to match the teacher ID
                  const teacherId = event.teacher?._id || event.teacher?.id || event.teacher;
                  const userId = user?.id || user?._id;
                  const isOwner = String(teacherId) === String(userId);
                  
                  console.log(`Checkbox for ${event.title}:`, {
                    teacherId: String(teacherId),
                    userId: String(userId),
                    isOwner
                  });
                  
                  if (!isOwner) return null;
                  
                  return (
                    <div className="flex items-center" title="Select this class">
                      <input
                        type="checkbox"
                        checked={selectedClasses.has(event._id)}
                        onChange={() => {
                          console.log('Selecting class:', event.title, event._id);
                          toggleClassSelection(event._id);
                        }}
                        className="w-5 h-5 text-purple-600 border-2 border-purple-400 rounded cursor-pointer focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  );
                })()}
                {getEventIcon(event.type)}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h3>
                  
                  {/* Display class info based on structure */}
                  {event.class && (
                    <p className="text-sm text-blue-600 mb-2">{event.class.title}</p>
                  )}
                  
                  {event.grade && event.subject && (
                    <div className="text-sm text-blue-600 mb-2">
                      <p>{event.grade.name} - {event.grade.board}</p>
                      <p>{event.subject.name}</p>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-600 mb-3">by {event.teacher.name}</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                  {event.status.toUpperCase()}
                </span>
                {event.isRecurring && (
                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {event.recurringPattern}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                {formatDateTime(event.scheduledAt)}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                {event.duration} minutes
              </div>
              {event.attendees && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  {event.attendees.length} / {event.maxAttendees || 'Unlimited'} attendees
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {event.type === 'live_class' && event.status === 'live' && (
                <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors">
                  <Video className="w-4 h-4" />
                  Join Now
                </button>
              )}
              
              {/* Edit/Delete buttons for teachers */}
              {user?.role === 'teacher' && (
                String(event.teacher._id || event.teacher) === String(user.id) || 
                event.teacher._id === user._id ||
                event.teacher === user.id
              ) && event.status === 'scheduled' && (
                <>
                  <button 
                    onClick={() => handleEditClass(event)}
                    className="bg-blue-100 text-blue-700 py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-200 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteClass(event._id)}
                    className="bg-red-100 text-red-700 py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              
              {/* View button for non-owners */}
              {!(user?.role === 'teacher' && (
                String(event.teacher._id || event.teacher) === String(user.id) || 
                event.teacher._id === user._id ||
                event.teacher === user.id
              ) && event.status === 'scheduled') && (
                <button className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors">
                  <Eye className="w-4 h-4" />
                  View
                </button>
              )}
            </div>
          </motion.div>
          );
        })}
      </div>

      {getFilteredEvents().length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600">No events match your current filters</p>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Schedule {createType === 'live_class' ? 'Live Class' : 'Regular Class'}
              </h2>
              
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter description"
                  />
                </div>

                {/* Structure Selection */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Select Class</h3>
                  
                  <div className="space-y-3">
                    {/* Class Selection (Required) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                      <select
                        required
                        value={formData.classId}
                        onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Class</option>
                        {classes.map((cls) => (
                          <option key={cls._id} value={cls._id}>
                            {cls.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Optional Grade/Subject Selection 
                    <div className="text-sm text-gray-500 my-2">OR (Optional)</div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                      <select
                        value={formData.gradeId}
                        onChange={(e) => {
                          setFormData({ ...formData, gradeId: e.target.value, subjectId: '' });
                          if (e.target.value) fetchSubjectsByGrade(e.target.value);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Grade</option>
                        {grades.map((grade) => (
                          <option key={grade._id} value={grade._id}>
                            {grade.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                      <select
                        value={formData.subjectId}
                        onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled={!formData.gradeId}
                      >
                        <option value="">Select Subject</option>
                        {subjects.map((subject) => (
                          <option key={subject._id} value={subject._id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    */}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (min)</label>
                    <input
                      type="number"
                      min="15"
                      max="480"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {createType === 'live_class' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Attendees</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.maxAttendees}
                        onChange={(e) => setFormData({ ...formData, maxAttendees: parseInt(e.target.value) })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>

                {createType === 'live_class' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meeting URL (Optional)</label>
                      <input
                        type="url"
                        placeholder="e.g., https://meet.google.com/abc-defg-hij"
                        value={formData.meetingUrl}
                        onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Add your Google Meet, Zoom, or other meeting link. If not provided, a default URL will be generated.
                      </p>
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.isRecurring}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            isRecurring: e.target.checked,
                            recurringPattern: e.target.checked ? 'weekly' : ''
                          })}
                          className="rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Recurring Class</span>
                      </label>
                    </div>

                    {formData.isRecurring && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pattern</label>
                        <select
                          value={formData.recurringPattern}
                          onChange={(e) => setFormData({ ...formData, recurringPattern: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Event
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Edit Live Class
              </h2>
              
              <form onSubmit={handleUpdateClass} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                  <input
                    type="text"
                    value={editingClass.class?.title || ''}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (min)</label>
                    <input
                      type="number"
                      min="15"
                      max="480"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Attendees</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxAttendees}
                      onChange={(e) => setFormData({ ...formData, maxAttendees: parseInt(e.target.value) })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meeting URL</label>
                  <input
                    type="url"
                    placeholder="e.g., https://meet.google.com/abc-defg-hij"
                    value={formData.meetingUrl}
                    onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Update your meeting link if needed
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Class
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingClass(null);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-6"
          >
            <div className="mb-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Confirm Deletion
              </h3>
              <p className="text-gray-600 text-center">
                {deleteType === 'single' 
                  ? 'Are you sure you want to delete this live class? This action cannot be undone.'
                  : `Are you sure you want to delete ${selectedClasses.size} selected live class${selectedClasses.size > 1 ? 'es' : ''}? This action cannot be undone.`}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setClassToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete {deleteType === 'multiple' ? `(${selectedClasses.size})` : ''}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}