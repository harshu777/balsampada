'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  VideoCameraIcon,
  UserGroupIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface ScheduleItem {
  _id: string;
  title: string;
  teacher?: string;
  studentCount?: number;
  startTime: Date;
  endTime: Date;
  meetingLink?: string;
  location?: string;
  type: 'class' | 'meeting' | 'event';
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  description?: string;
  classId?: string;
}

// Helper function to parse schedule days (e.g., "Mon, Wed, Fri" -> [1, 3, 5])
const parseScheduleDays = (schedule?: string): number[] => {
  if (!schedule) return [];
  
  const dayMap: { [key: string]: number } = {
    'sun': 0, 'sunday': 0,
    'mon': 1, 'monday': 1,
    'tue': 2, 'tuesday': 2,
    'wed': 3, 'wednesday': 3,
    'thu': 4, 'thursday': 4,
    'fri': 5, 'friday': 5,
    'sat': 6, 'saturday': 6
  };
  
  const days: number[] = [];
  const scheduleLower = schedule.toLowerCase();
  
  Object.keys(dayMap).forEach(day => {
    if (scheduleLower.includes(day)) {
      days.push(dayMap[day]);
    }
  });
  
  // If no specific days found, assume Mon-Fri
  if (days.length === 0) {
    return [1, 2, 3, 4, 5];
  }
  
  return [...new Set(days)].sort();
};

// Helper function to parse schedule time (e.g., "4:00 PM to 5:30 PM")
const parseScheduleTime = (schedule?: string): { startHour: number; startMinute: number; endHour: number; endMinute: number } => {
  if (!schedule) {
    return { startHour: 16, startMinute: 0, endHour: 17, endMinute: 30 }; // Default 4:00 PM - 5:30 PM
  }
  
  // Extract time pattern (e.g., "4:00 PM to 5:30 PM")
  const timePattern = /(\d{1,2}):?(\d{2})?\s*(AM|PM)?\s*(?:to|-)\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i;
  const match = schedule.match(timePattern);
  
  if (match) {
    let startHour = parseInt(match[1]);
    const startMinute = parseInt(match[2] || '0');
    const startPeriod = match[3];
    
    let endHour = parseInt(match[4]);
    const endMinute = parseInt(match[5] || '0');
    const endPeriod = match[6];
    
    // Convert to 24-hour format
    if (startPeriod?.toUpperCase() === 'PM' && startHour !== 12) startHour += 12;
    if (startPeriod?.toUpperCase() === 'AM' && startHour === 12) startHour = 0;
    
    if (endPeriod?.toUpperCase() === 'PM' && endHour !== 12) endHour += 12;
    if (endPeriod?.toUpperCase() === 'AM' && endHour === 12) endHour = 0;
    
    return { startHour, startMinute, endHour, endMinute };
  }
  
  // Default time if parsing fails
  return { startHour: 16, startMinute: 0, endHour: 17, endMinute: 30 };
};

export default function SchedulePage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated && user === null) {
      router.push('/login');
    } else if (user) {
      fetchSchedule();
    }
  }, [isAuthenticated, user, currentDate, viewMode, router]);

  const fetchSchedule = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let data: ScheduleItem[] = [];

      if (user.role === 'student') {
        // Fetch enrolled classes schedule
        const enrollmentResponse = await api.get('/enrollments/my-enrollments');
        const enrollments = enrollmentResponse.data.data || [];
        
        // Generate daily schedule items for recurring classes
        enrollments.forEach((enrollment: any) => {
          if (!enrollment.class || !enrollment.class.startDate) return;
          
          const classData = enrollment.class;
          const startDate = new Date(classData.startDate);
          const endDate = classData.endDate ? new Date(classData.endDate) : new Date(startDate.getTime() + 90 * 24 * 60 * 60000); // 90 days default
          
          // Parse schedule (e.g., "Mon, Wed, Fri - 4:00 PM to 5:30 PM")
          const scheduleDays = parseScheduleDays(classData.schedule);
          const scheduleTime = parseScheduleTime(classData.schedule);
          
          // Generate schedule items for each day in the date range
          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            
            // Check if this day is in the schedule
            if (scheduleDays.includes(dayOfWeek)) {
              const classStartTime = new Date(currentDate);
              classStartTime.setHours(scheduleTime.startHour, scheduleTime.startMinute, 0, 0);
              
              const classEndTime = new Date(currentDate);
              classEndTime.setHours(scheduleTime.endHour, scheduleTime.endMinute, 0, 0);
              
              data.push({
                _id: `${enrollment._id}-${currentDate.toISOString()}`,
                title: classData.title,
                teacher: classData.teacher?.name,
                startTime: classStartTime,
                endTime: classEndTime,
                meetingLink: classData.meetingLink,
                type: 'class',
                status: getClassStatus(classStartTime.toISOString(), classEndTime.toISOString()),
                description: classData.description,
                classId: classData._id
              });
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
          }
        });
      } else if (user.role === 'teacher') {
        // Fetch teacher's classes schedule
        const classesResponse = await api.get('/classes/teacher');
        const classes = classesResponse.data.data || [];
        
        // Generate daily schedule items for teacher's classes
        classes.forEach((cls: any) => {
          if (!cls.startDate) return;
          
          const startDate = new Date(cls.startDate);
          const endDate = cls.endDate ? new Date(cls.endDate) : new Date(startDate.getTime() + 90 * 24 * 60 * 60000);
          
          const scheduleDays = parseScheduleDays(cls.schedule);
          const scheduleTime = parseScheduleTime(cls.schedule);
          
          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            
            if (scheduleDays.includes(dayOfWeek)) {
              const classStartTime = new Date(currentDate);
              classStartTime.setHours(scheduleTime.startHour, scheduleTime.startMinute, 0, 0);
              
              const classEndTime = new Date(currentDate);
              classEndTime.setHours(scheduleTime.endHour, scheduleTime.endMinute, 0, 0);
              
              data.push({
                _id: `${cls._id}-${currentDate.toISOString()}`,
                title: cls.title,
                studentCount: cls.enrolledStudents?.length || 0,
                startTime: classStartTime,
                endTime: classEndTime,
                meetingLink: cls.meetingLink,
                type: 'class',
                status: getClassStatus(classStartTime.toISOString(), classEndTime.toISOString()),
                description: cls.description,
                classId: cls._id
              });
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
          }
        });
      } else if (user.role === 'admin') {
        // Fetch all classes for admin
        const classesResponse = await api.get('/classes');
        const classes = classesResponse.data.data || [];
        
        // Generate daily schedule items for all classes
        classes.forEach((cls: any) => {
          if (!cls.startDate) return;
          
          const startDate = new Date(cls.startDate);
          const endDate = cls.endDate ? new Date(cls.endDate) : new Date(startDate.getTime() + 90 * 24 * 60 * 60000);
          
          const scheduleDays = parseScheduleDays(cls.schedule);
          const scheduleTime = parseScheduleTime(cls.schedule);
          
          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            
            if (scheduleDays.includes(dayOfWeek)) {
              const classStartTime = new Date(currentDate);
              classStartTime.setHours(scheduleTime.startHour, scheduleTime.startMinute, 0, 0);
              
              const classEndTime = new Date(currentDate);
              classEndTime.setHours(scheduleTime.endHour, scheduleTime.endMinute, 0, 0);
              
              data.push({
                _id: `${cls._id}-${currentDate.toISOString()}`,
                title: cls.title,
                teacher: cls.teacher?.name,
                studentCount: cls.enrolledStudents?.length || 0,
                startTime: classStartTime,
                endTime: classEndTime,
                meetingLink: cls.meetingLink,
                type: 'class',
                status: getClassStatus(classStartTime.toISOString(), classEndTime.toISOString()),
                description: cls.description,
                classId: cls._id
              });
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
          }
        });
      }

      setScheduleItems(data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const getClassStatus = (startDate: string, endDate?: string): 'upcoming' | 'live' | 'completed' | 'cancelled' => {
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 90 * 60000);

    if (now < start) return 'upcoming';
    if (now > end) return 'completed';
    return 'live';
  };

  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty days for alignment
    const startingDayOfWeek = firstDay.getDay();
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const filteredScheduleItems = scheduleItems.filter(item => {
    if (viewMode === 'day') {
      return item.startTime.toDateString() === selectedDate.toDateString();
    } else if (viewMode === 'week') {
      const weekDays = getWeekDays();
      return item.startTime >= weekDays[0] && item.startTime <= weekDays[6];
    } else {
      return item.startTime.getMonth() === currentDate.getMonth() &&
             item.startTime.getFullYear() === currentDate.getFullYear();
    }
  });

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
      setSelectedDate(newDate);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleJoinClass = (item: ScheduleItem) => {
    if (item.meetingLink) {
      window.open(item.meetingLink, '_blank');
    } else {
      toast.error('Meeting link not available');
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
          <p className="mt-2 text-gray-600">
            {user?.role === 'student' 
              ? 'View your upcoming classes and events'
              : user?.role === 'teacher'
              ? 'Manage your teaching schedule'
              : 'Overview of all scheduled classes'}
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* View Mode Selector */}
            <div className="flex gap-2">
              {['day', 'week', 'month'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as 'day' | 'week' | 'month')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                    viewMode === mode
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: viewMode === mode ? '#82993D' : undefined
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigatePeriod('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              
              <div className="text-center min-w-[200px]">
                <h2 className="text-lg font-semibold text-gray-900">
                  {viewMode === 'day' && selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  {viewMode === 'week' && `Week of ${getWeekDays()[0].toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}`}
                  {viewMode === 'month' && currentDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </h2>
              </div>

              <button
                onClick={() => navigatePeriod('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDate(new Date());
                }}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition hover:opacity-90"
                style={{background: 'linear-gradient(to right, #82993D, #AC6CA1)'}}
              >
                Today
              </button>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'month' ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
                  {day}
                </div>
              ))}
              {getMonthDays().map((day, index) => (
                <div
                  key={index}
                  className={`bg-white p-2 min-h-[100px] ${
                    day && day.toDateString() === new Date().toDateString() 
                      ? 'bg-blue-50' 
                      : ''
                  }`}
                >
                  {day && (
                    <>
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {filteredScheduleItems
                          .filter(item => item.startTime.toDateString() === day.toDateString())
                          .slice(0, 2)
                          .map(item => (
                            <div
                              key={item._id}
                              className={`text-xs p-1 rounded truncate ${getStatusColor(item.status)}`}
                            >
                              {item.title}
                            </div>
                          ))}
                        {filteredScheduleItems.filter(item => 
                          item.startTime.toDateString() === day.toDateString()
                        ).length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{filteredScheduleItems.filter(item => 
                              item.startTime.toDateString() === day.toDateString()
                            ).length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* List View for Day and Week */
          <div className="space-y-4">
            {filteredScheduleItems.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No scheduled classes
                </h3>
                <p className="text-gray-600 mb-4">
                  {viewMode === 'day' 
                    ? 'No classes scheduled for this day'
                    : 'No classes scheduled for this period'}
                </p>
                {user?.role === 'student' && (
                  <button
                    onClick={() => router.push('/classes')}
                    className="inline-flex items-center px-4 py-2 text-white rounded-lg transition hover:opacity-90"
                    style={{background: 'linear-gradient(to right, #82993D, #AC6CA1)'}}
                  >
                    Browse Classes
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </button>
                )}
              </div>
            ) : (
              viewMode === 'week' ? (
                /* Week View */
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="grid grid-cols-8 border-b">
                    <div className="p-4 text-sm font-medium text-gray-700 border-r">
                      Time
                    </div>
                    {getWeekDays().map(day => (
                      <div
                        key={day.toISOString()}
                        className={`p-4 text-center border-r last:border-r-0 ${
                          day.toDateString() === new Date().toDateString()
                            ? 'bg-blue-50'
                            : ''
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-lg font-semibold">
                          {day.getDate()}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="divide-y">
                    {/* Time slots from 8 AM to 8 PM */}
                    {Array.from({ length: 13 }, (_, i) => i + 8).map(hour => (
                      <div key={hour} className="grid grid-cols-8">
                        <div className="p-4 text-sm text-gray-600 border-r">
                          {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                        </div>
                        {getWeekDays().map(day => {
                          const dayItems = filteredScheduleItems.filter(item => {
                            return item.startTime.toDateString() === day.toDateString() &&
                                   item.startTime.getHours() === hour;
                          });
                          
                          return (
                            <div key={day.toISOString()} className="p-2 border-r last:border-r-0 min-h-[60px]">
                              {dayItems.map(item => (
                                <motion.div
                                  key={item._id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className={`p-2 rounded-lg mb-1 cursor-pointer ${getStatusColor(item.status)}`}
                                  onClick={() => item.classId && router.push(`/classes/${item.classId}`)}
                                >
                                  <div className="text-xs font-medium truncate">
                                    {item.title}
                                  </div>
                                  <div className="text-xs opacity-75">
                                    {item.startTime.toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Day View - Detailed List */
                filteredScheduleItems.map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {item.title}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status === 'live' && (
                              <>
                                <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></span>
                                LIVE
                              </>
                            )}
                            {item.status === 'upcoming' && 'UPCOMING'}
                            {item.status === 'completed' && 'COMPLETED'}
                            {item.status === 'cancelled' && 'CANCELLED'}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              {item.startTime.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                              })} - {item.endTime.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                            
                            <span className="flex items-center">
                              <CalendarIcon className="w-4 h-4 mr-1" />
                              {item.startTime.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>

                            {item.teacher && (
                              <span className="flex items-center">
                                <UserGroupIcon className="w-4 h-4 mr-1" />
                                {item.teacher}
                              </span>
                            )}

                            {item.studentCount !== undefined && (
                              <span className="flex items-center">
                                <AcademicCapIcon className="w-4 h-4 mr-1" />
                                {item.studentCount} students
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p className="text-gray-700 mt-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        {item.status === 'live' && item.meetingLink && (
                          <button
                            onClick={() => handleJoinClass(item)}
                            className="px-4 py-2 text-white text-sm font-medium rounded-lg transition hover:opacity-90 flex items-center"
                            style={{background: 'linear-gradient(to right, #DA528C, #E18DB7)'}}
                          >
                            <VideoCameraIcon className="w-4 h-4 mr-2" />
                            Join Now
                          </button>
                        )}
                        
                        {item.classId && (
                          <button
                            onClick={() => router.push(`/classes/${item.classId}`)}
                            className="px-4 py-2 text-sm font-medium rounded-lg transition flex items-center"
                            style={{
                              background: 'linear-gradient(to right, #82993D, #AC6CA1)',
                              color: 'white'
                            }}
                          >
                            <BookOpenIcon className="w-4 h-4 mr-2" />
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )
            )}
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-600">Live Now</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="text-sm text-gray-600">Upcoming</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
              <span className="text-sm text-gray-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span className="text-sm text-gray-600">Cancelled</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}