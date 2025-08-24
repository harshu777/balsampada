'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Video,
  Calendar,
  Clock,
  Users,
  PlayCircle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Link as LinkIcon,
  Copy,
  ExternalLink
} from 'lucide-react';

interface LiveClass {
  _id: string;
  title: string;
  description: string;
  course: {
    _id: string;
    title: string;
  };
  teacher: {
    _id: string;
    name: string;
    email: string;
  };
  scheduledAt: string;
  duration: number;
  meetingUrl: string;
  meetingId: string;
  password?: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  attendees: any[];
  maxAttendees: number;
  isRecurring: boolean;
  recurringPattern?: string;
}

export default function LiveClassesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'completed'>('upcoming');
  const [selectedClass, setSelectedClass] = useState<LiveClass | null>(null);
  const [joiningClass, setJoiningClass] = useState<string | null>(null);

  useEffect(() => {
    fetchLiveClasses();
  }, [filter]);

  const fetchLiveClasses = async () => {
    try {
      const params = new URLSearchParams();
      if (filter === 'upcoming') {
        params.append('upcoming', 'true');
      } else if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await api.get(`/live-classes?${params}`);
      setLiveClasses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching live classes:', error);
      toast.error('Failed to load live classes');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (classId: string) => {
    setJoiningClass(classId);
    try {
      const response = await api.post(`/live-classes/${classId}/join`);
      const { meetingUrl, meetingId, password } = response.data.data;
      
      // Store meeting info
      setSelectedClass(liveClasses.find(c => c._id === classId) || null);
      
      // Open meeting URL in new tab
      window.open(meetingUrl, '_blank');
      
      toast.success('Joining live class...');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to join class');
    } finally {
      setJoiningClass(null);
    }
  };

  const getTimeUntilClass = (scheduledAt: string) => {
    const now = new Date();
    const classTime = new Date(scheduledAt);
    const diff = classTime.getTime() - now.getTime();
    
    if (diff < 0) return 'Started';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusBadge = (status: string, scheduledAt: string) => {
    const now = new Date();
    const classTime = new Date(scheduledAt);
    const timeDiff = (classTime.getTime() - now.getTime()) / (1000 * 60);
    
    if (status === 'live') {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center animate-pulse">
          <div className="w-2 h-2 bg-red-600 rounded-full mr-1"></div>
          LIVE
        </span>
      );
    } else if (status === 'scheduled' && timeDiff <= 15 && timeDiff > 0) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          Starting Soon
        </span>
      );
    } else if (status === 'scheduled') {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Scheduled
        </span>
      );
    } else if (status === 'completed') {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </span>
      );
    } else if (status === 'cancelled') {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full flex items-center">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </span>
      );
    }
    return null;
  };

  const canJoinClass = (liveClass: LiveClass) => {
    const now = new Date();
    const classTime = new Date(liveClass.scheduledAt);
    const timeDiff = (classTime.getTime() - now.getTime()) / (1000 * 60);
    
    return (liveClass.status === 'live') || 
           (liveClass.status === 'scheduled' && timeDiff <= 15 && timeDiff > -60);
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
          <h1 className="text-3xl font-bold text-gray-900">Live Classes</h1>
          <p className="mt-2 text-gray-600">
            Join live interactive sessions with your instructors
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('live')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === 'live'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Live Now
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Past Classes
          </button>
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
        </div>

        {/* Live Classes Grid */}
        {liveClasses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No live classes found
            </h3>
            <p className="text-gray-600">
              {filter === 'upcoming'
                ? "There are no upcoming live classes scheduled"
                : filter === 'live'
                ? "There are no live classes in session right now"
                : filter === 'completed'
                ? "You haven't attended any live classes yet"
                : "No live classes available"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveClasses.map((liveClass) => (
              <div
                key={liveClass._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {liveClass.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {liveClass.course.title}
                      </p>
                    </div>
                    {getStatusBadge(liveClass.status, liveClass.scheduledAt)}
                  </div>

                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                    {liveClass.description}
                  </p>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Instructor: {liveClass.teacher.name}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(liveClass.scheduledAt)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Duration: {liveClass.duration} minutes
                    </div>
                    {liveClass.status === 'scheduled' && (
                      <div className="flex items-center text-blue-600 font-medium">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Starts in {getTimeUntilClass(liveClass.scheduledAt)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {liveClass.attendees.length}/{liveClass.maxAttendees} attendees
                    </span>
                    {liveClass.isRecurring && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {liveClass.recurringPattern}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    {canJoinClass(liveClass) ? (
                      <button
                        onClick={() => handleJoinClass(liveClass._id)}
                        disabled={joiningClass === liveClass._id}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        {joiningClass === liveClass._id ? (
                          'Joining...'
                        ) : (
                          <>
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Join Class
                          </>
                        )}
                      </button>
                    ) : liveClass.status === 'scheduled' ? (
                      <button
                        disabled
                        className="w-full px-4 py-2 bg-gray-200 text-gray-500 rounded-md cursor-not-allowed"
                      >
                        Available 15 min before class
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedClass(liveClass)}
                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Meeting Info Modal */}
        {selectedClass && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Class Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Title</p>
                  <p className="font-medium">{selectedClass.title}</p>
                </div>
                
                {selectedClass.meetingId && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Meeting ID</p>
                    <div className="flex items-center">
                      <p className="font-mono text-sm flex-1">{selectedClass.meetingId}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedClass.meetingId);
                          toast.success('Meeting ID copied');
                        }}
                        className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
                
                {selectedClass.password && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Password</p>
                    <div className="flex items-center">
                      <p className="font-mono text-sm flex-1">{selectedClass.password}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedClass.password!);
                          toast.success('Password copied');
                        }}
                        className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Meeting URL</p>
                  <div className="flex items-center">
                    <p className="text-sm text-blue-600 flex-1 truncate">
                      {selectedClass.meetingUrl}
                    </p>
                    <button
                      onClick={() => window.open(selectedClass.meetingUrl, '_blank')}
                      className="ml-2 p-1 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedClass(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}