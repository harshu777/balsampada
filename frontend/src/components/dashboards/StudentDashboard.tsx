'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import toast from 'react-hot-toast';
import {
  BookOpenIcon,
  ClockIcon,
  TrophyIcon,
  AcademicCapIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  UserGroupIcon,
  SparklesIcon,
  ChartBarIcon,
  VideoCameraIcon,
  FireIcon,
  StarIcon,
  BellIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PlayIcon,
  UsersIcon,
  PencilSquareIcon,
  CalendarDaysIcon,
  DocumentIcon,
  PresentationChartLineIcon,
  LinkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import useNotificationStore from '@/store/notificationStore';

interface Enrollment {
  _id: string;
  class: {
    _id: string;
    title: string;
    description: string;
    thumbnail?: string;
    teacher: {
      _id: string;
      name: string;
      email?: string;
    };
    category: string;
    board?: string;
    standard?: string;
    subject?: string;
    duration: number;
    schedule?: string;
    price: number;
    discountPrice?: number;
    meetingLink?: string;
    startDate?: string;
    endDate?: string;
    modules?: any[];
  };
  enrollmentDate: string;
  progress: {
    completedLessons?: any[];
    percentageComplete: number;
    lastAccessedAt?: string;
  };
  payment: {
    status: string;
    amount: number;
    paidAmount?: number;
  };
  status: string;
}

interface LiveClass {
  _id: string;
  class: {
    _id: string;
    title: string;
  };
  title: string;
  description?: string;
  teacher: {
    _id: string;
    name: string;
  };
  scheduledAt: string;
  duration: number;
  meetingUrl?: string;
  meetingId?: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

interface StudyMaterial {
  _id: string;
  title: string;
  description: string;
  type: 'pdf' | 'video' | 'document' | 'presentation' | 'link';
  class: {
    _id: string;
    title: string;
  };
  uploadedBy: {
    name: string;
  };
  uploadedAt: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { loadNotifications, fetchLiveNotifications } = useNotificationStore();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<LiveClass[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [joiningClass, setJoiningClass] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState({
    pendingAssignmentsCount: 0,
    newMaterialsCount: 0,
    unreadNotificationsCount: 0
  });

  useEffect(() => {
    fetchDashboardData();
    setTimeBasedGreeting();
    // Refresh notifications when dashboard loads
    if (user?.role === 'student') {
      loadNotifications('student');
    }
    // Refresh data every 5 minutes for live class updates (reduced frequency to avoid rate limiting)
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchLiveNotifications();
    }, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  const setTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  };

  const isClassLive = (startDate?: string, endDate?: string, schedule?: string) => {
    if (!startDate) return false;
    const now = new Date();
    const courseStart = new Date(startDate);
    const courseEnd = endDate ? new Date(endDate) : new Date(courseStart.getTime() + 90 * 24 * 60 * 60000); // 90 days default
    
    // Check if we're within the course duration
    if (now < courseStart || now > courseEnd) return false;
    
    // Parse schedule to get days and times
    const scheduleDays = parseScheduleDays(schedule);
    const scheduleTime = parseScheduleTime(schedule);
    
    // Check if today is a scheduled day
    const todayDayOfWeek = now.getDay();
    if (!scheduleDays.includes(todayDayOfWeek)) return false;
    
    // Check if current time is within class hours
    const classStartTime = new Date(now);
    classStartTime.setHours(scheduleTime.startHour, scheduleTime.startMinute, 0, 0);
    
    const classEndTime = new Date(now);
    classEndTime.setHours(scheduleTime.endHour, scheduleTime.endMinute, 0, 0);
    
    return now >= classStartTime && now <= classEndTime;
  };

  // Helper to parse schedule days
  const parseScheduleDays = (schedule?: string): number[] => {
    if (!schedule) return [1, 2, 3, 4, 5]; // Default Mon-Fri
    
    const dayMap: { [key: string]: number } = {
      'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3,
      'thu': 4, 'fri': 5, 'sat': 6
    };
    
    const days: number[] = [];
    const scheduleLower = schedule.toLowerCase();
    
    Object.keys(dayMap).forEach(day => {
      if (scheduleLower.includes(day)) {
        days.push(dayMap[day]);
      }
    });
    
    return days.length > 0 ? [...new Set(days)].sort() : [1, 2, 3, 4, 5];
  };

  // Helper to parse schedule time
  const parseScheduleTime = (schedule?: string): { startHour: number; startMinute: number; endHour: number; endMinute: number } => {
    if (!schedule) {
      return { startHour: 16, startMinute: 0, endHour: 17, endMinute: 30 }; // Default 4:00 PM - 5:30 PM
    }
    
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
    
    return { startHour: 16, startMinute: 0, endHour: 17, endMinute: 30 };
  };

  const fetchDashboardData = async (retryCount = 0) => {
    try {
      // Fetch enrollments, dashboard stats, and live classes in parallel
      const [enrollmentResponse, dashboardResponse, liveClassesResponse] = await Promise.all([
        api.get('/enrollments/my-enrollments'),
        api.get('/users/student/dashboard').catch(() => null),
        api.get('/live-classes').catch(() => ({ data: { data: [] } }))
      ]);
      
      // Handle both direct enrollments and dashboard response format
      let enrollmentsData = [];
      if (enrollmentResponse.data.data) {
        enrollmentsData = Array.isArray(enrollmentResponse.data.data) 
          ? enrollmentResponse.data.data 
          : enrollmentResponse.data.data.enrollments || [];
      }
      setEnrollments(enrollmentsData);
      
      // The backend already filters live classes for students based on their enrollments
      // So we don't need to filter again on the frontend
      const allLiveClasses = liveClassesResponse.data.data || [];
      
      console.log('Live classes from API (already filtered by backend):', allLiveClasses.length);
      if (allLiveClasses.length > 0) {
        console.log('Sample live classes:', allLiveClasses.slice(0, 3).map((lc: any) => ({
          title: lc.title,
          class: lc.class?.title,
          status: lc.status,
          scheduledAt: lc.scheduledAt
        })));
      }
      
      // Sort by scheduled time and filter upcoming/live classes
      const now = new Date();
      const upcomingLiveClasses = allLiveClasses
        .filter((lc: any) => lc.status === 'scheduled' || lc.status === 'live')
        .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, 5); // Show next 5 classes
      
      console.log('Final upcoming live classes:', upcomingLiveClasses.length);
      if (upcomingLiveClasses.length > 0) {
        console.log('Upcoming classes to display:', upcomingLiveClasses.map((lc: any) => lc.title));
      }
      
      setUpcomingClasses(upcomingLiveClasses);
      
      // Set dashboard stats if available
      if (dashboardResponse?.data?.data) {
        const { 
          pendingAssignmentsCount = 0, 
          newMaterialsCount = 0, 
          unreadNotificationsCount = 0 
        } = dashboardResponse.data.data;
        setDashboardStats({
          pendingAssignmentsCount: pendingAssignmentsCount || 0,
          newMaterialsCount: newMaterialsCount || 0,
          unreadNotificationsCount: unreadNotificationsCount || 0
        });
      }
      
      // Fetch study materials for enrolled classes
      if (enrollmentsData.length > 0) {
        const materialsPromises = enrollmentsData
          .filter((e: any) => e.class && e.class._id)
          .map((enrollment: any) => 
            api.get(`/study-materials/class/${enrollment.class._id}`)
              .catch(() => ({ data: { data: [] } }))
          );
        
        const materialsResponses = await Promise.all(materialsPromises);
        const allMaterials = materialsResponses.flatMap(res => res.data.data || []);
        
        // Get latest 5 materials
        const sortedMaterials = allMaterials
          .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
          .slice(0, 5);
        
        setStudyMaterials(sortedMaterials);
      }
      
      // Upcoming classes are now fetched from the API above
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      
      // Handle rate limiting with retry
      if (error.response?.status === 429 && retryCount < 2) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '5', 10);
        toast.error(`Too many requests. Retrying in ${retryAfter} seconds...`);
        setTimeout(() => fetchDashboardData(retryCount + 1), retryAfter * 1000);
        return;
      }
      
      // Handle other errors
      if (error.response?.status === 429) {
        toast.error('Server is busy. Please refresh the page later.');
      } else {
        toast.error('Failed to load dashboard data');
      }
      
      // Set empty data on error
      setEnrollments([]);
      setUpcomingClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const generateUpcomingClasses = (enrollments: Enrollment[]) => {
    // Filter out enrollments without class data
    const validEnrollments = enrollments.filter(e => e.class && e.class._id);
    
    const now = new Date();
    const todayDayOfWeek = now.getDay();
    const liveClasses: LiveClass[] = [];
    
    // Generate today's and upcoming classes based on schedule
    validEnrollments.forEach((enrollment) => {
      if (!enrollment.class.meetingLink || !enrollment.class.startDate) return;
      
      const courseStart = new Date(enrollment.class.startDate);
      const courseEnd = enrollment.class.endDate ? new Date(enrollment.class.endDate) : new Date(courseStart.getTime() + 90 * 24 * 60 * 60000);
      
      // Check if we're within course duration
      if (now < courseStart || now > courseEnd) return;
      
      const scheduleDays = parseScheduleDays(enrollment.class.schedule);
      const scheduleTime = parseScheduleTime(enrollment.class.schedule);
      
      // Check today's class
      if (scheduleDays.includes(todayDayOfWeek)) {
        const classStartTime = new Date(now);
        classStartTime.setHours(scheduleTime.startHour, scheduleTime.startMinute, 0, 0);
        
        const classEndTime = new Date(now);
        classEndTime.setHours(scheduleTime.endHour, scheduleTime.endMinute, 0, 0);
        
        // Only add if class hasn't ended yet
        if (now <= classEndTime) {
          liveClasses.push({
            _id: `live-${enrollment._id}-today`,
            class: enrollment.class,
            title: enrollment.class.title || 'Untitled Class',
            teacher: enrollment.class.teacher || { _id: 'unknown', name: 'Teacher' },
            scheduledAt: classStartTime.toISOString(),
            duration: enrollment.class.duration || 60,
            meetingId: enrollment.class.meetingLink,
            status: now >= classStartTime && now <= classEndTime ? 'live' : 'scheduled'
          });
        }
      }
      
      // Also check tomorrow's class
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDayOfWeek = tomorrow.getDay();
      
      if (scheduleDays.includes(tomorrowDayOfWeek) && liveClasses.length < 3) {
        const classStartTime = new Date(tomorrow);
        classStartTime.setHours(scheduleTime.startHour, scheduleTime.startMinute, 0, 0);
        
        liveClasses.push({
          _id: `live-${enrollment._id}-tomorrow`,
          class: enrollment.class,
          title: enrollment.class.title || 'Untitled Class',
          teacher: enrollment.class.teacher || { _id: 'unknown', name: 'Teacher' },
          scheduledAt: classStartTime.toISOString(),
          duration: enrollment.class.duration || 60,
          meetingId: enrollment.class.meetingLink,
          status: 'scheduled'
        });
      }
    });
    
    // Sort by start time and limit to 3
    liveClasses.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    setUpcomingClasses(liveClasses.slice(0, 3));
  };

  const handleJoinClass = async (liveClass: LiveClass) => {
    setJoiningClass(liveClass._id);
    
    try {
      // Check if meeting URL exists
      if (!liveClass.meetingUrl) {
        toast.error('Meeting link not available. Please contact your teacher.');
        setJoiningClass(null);
        return;
      }
      
      // Call API to join the live class (for tracking purposes)
      try {
        await api.post(`/live-classes/${liveClass._id}/join`);
      } catch (error) {
        console.log('Failed to record join, but proceeding to meeting');
      }
      
      toast.success('Opening meeting...');
      
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Open meeting link in new tab
      window.open(liveClass.meetingUrl, '_blank');
      
      // Optional: Track class attendance
      // await api.post(`/classes/${liveClass.classId}/join`);
    } catch (error) {
      toast.error('Failed to join class. Please try again.');
    } finally {
      setJoiningClass(null);
    }
  };

  const formatTimeUntil = (startTime: string) => {
    const now = new Date();
    const classTime = new Date(startTime);
    const diff = classTime.getTime() - now.getTime();
    
    if (diff < 0) return 'Started';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} min`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} hours`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))} days`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"
        />
      </div>
    );
  }

  const stats = {
    activeClasses: enrollments.filter(e => {
      // Check if enrollment exists and has valid class data
      if (!e || !e.class || !e.class._id) return false;
      // Check if status is active (default is 'active' if not specified)
      return !e.status || e.status === 'active';
    }).length,
    completedClasses: enrollments.filter(e => {
      // Check for completed status or 100% progress
      return e && (e.status === 'completed' || (e.progress && e.progress.percentageComplete >= 100));
    }).length,
    averageProgress: enrollments.length > 0 
      ? Math.round(
          enrollments.reduce((sum, e) => {
            // Use percentageComplete if available, otherwise default to 0
            if (e.progress?.percentageComplete !== undefined) {
              return sum + e.progress.percentageComplete;
            } else if (e.progress?.completedLessons?.length && (e.progress as any)?.totalLessons > 0) {
              // Calculate percentage from lessons if available
              return sum + (e.progress.completedLessons.length / (e.progress as any).totalLessons) * 100;
            }
            return sum;
          }, 0) / enrollments.length
        )
      : 0,
    totalClasses: enrollments.filter(e => e && e.class && e.class._id).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-6 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary-200/30 to-secondary-200/30 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-accent-200/30 to-primary-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 relative z-10"
      >
        <div className="flex justify-between items-start">
          <div className="bg-white/60 backdrop-blur-sm rounded-4xl p-6 shadow-soft-lg border border-white/30">
            <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-neutral-800 to-neutral-600 bg-clip-text text-transparent">
              {greeting}, {user?.name || 'Student'}! 👋
            </h1>
            <p className="mt-3 text-lg text-neutral-600">
              Ready for your live classes today? Let's make it a productive day!
            </p>
          </div>
          {dashboardStats.unreadNotificationsCount > 0 && (
            <Link href="/notifications">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-4 bg-white/80 backdrop-blur-lg rounded-3xl shadow-soft-lg border border-white/40 cursor-pointer hover:shadow-soft-xl transition-all duration-300"
              >
                <BellIcon className="w-6 h-6 text-neutral-600" />
                <motion.span 
                  className="absolute -top-2 -right-2 h-6 w-6 bg-gradient-to-r from-red-400 to-pink-500 text-white text-xs rounded-full flex items-center justify-center shadow-soft-md"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {dashboardStats.unreadNotificationsCount}
                </motion.span>
              </motion.div>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Live Class Alert - Check if any enrolled class has a meeting link and is within class time */}
      {enrollments.some(e => e.class && e.class.meetingLink && isClassLive(e.class.startDate, e.class.endDate, e.class.schedule)) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 relative z-10"
        >
          {enrollments
            .filter(e => e.class && e.class.meetingLink && isClassLive(e.class.startDate, e.class.endDate, e.class.schedule))
            .map((enrollment) => (
              <div key={enrollment._id} className="bg-gradient-to-r from-red-400 via-pink-500 to-purple-500 rounded-4xl p-8 shadow-soft-2xl border border-red-200/30 backdrop-blur-sm mb-4 last:mb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-4 h-4 bg-white rounded-full animate-ping opacity-75"></div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                        🔴 Live Class Available!
                      </h2>
                      <p className="text-white/90 text-lg mt-1">
                        {enrollment.class.title} with {enrollment.class.teacher?.name}
                      </p>
                    </div>
                  </div>
                  <motion.a
                    href={enrollment.class.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-white/95 backdrop-blur-sm text-red-600 rounded-3xl font-semibold hover:bg-white transition-all duration-300 flex items-center gap-3 shadow-soft-lg hover:shadow-soft-xl"
                  >
                    <VideoCameraIcon className="w-6 h-6" />
                    Join Live Class
                  </motion.a>
                </div>
              </div>
            ))}
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="group"
        >
          <div className="bg-white/70 backdrop-blur-lg rounded-4xl shadow-soft-xl p-8 border border-white/30 hover:shadow-soft-2xl transition-all duration-500 hover:border-primary-200/50">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 rounded-3xl bg-gradient-to-br from-primary-100 to-primary-200 group-hover:from-primary-200 group-hover:to-primary-300 transition-all duration-300">
                <BookOpenIcon className="w-8 h-8 text-primary-600" />
              </div>
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-sm font-medium text-neutral-500 mb-2 uppercase tracking-wider">Active Classes</p>
            <p className="text-4xl font-display font-bold text-neutral-800">
              <CountUp end={stats.activeClasses} duration={2} />
            </p>
            <div className="absolute inset-0 bg-gradient-to-br from-primary-400/5 to-transparent rounded-4xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="group"
        >
          <div className="bg-white/70 backdrop-blur-lg rounded-4xl shadow-soft-xl p-8 border border-white/30 hover:shadow-soft-2xl transition-all duration-500 hover:border-accent-200/50">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 rounded-3xl bg-gradient-to-br from-accent-100 to-accent-200 group-hover:from-accent-200 group-hover:to-accent-300 transition-all duration-300">
                <ChartBarIcon className="w-8 h-8 text-accent-600" />
              </div>
              <div className="w-2 h-2 bg-accent-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
            <p className="text-sm font-medium text-neutral-500 mb-2 uppercase tracking-wider">Avg Progress</p>
            <p className="text-4xl font-display font-bold text-neutral-800">
              <CountUp end={stats.averageProgress} duration={2} />%
            </p>
            <div className="absolute inset-0 bg-gradient-to-br from-accent-400/5 to-transparent rounded-4xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="group"
        >
          <div className="bg-white/70 backdrop-blur-lg rounded-4xl shadow-soft-xl p-8 border border-white/30 hover:shadow-soft-2xl transition-all duration-500 hover:border-yellow-200/50">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 rounded-3xl bg-gradient-to-br from-yellow-100 to-orange-200 group-hover:from-yellow-200 group-hover:to-orange-300 transition-all duration-300">
                <TrophyIcon className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
            <p className="text-sm font-medium text-neutral-500 mb-2 uppercase tracking-wider">Completed</p>
            <p className="text-4xl font-display font-bold text-neutral-800">
              <CountUp end={stats.completedClasses} duration={2} />
            </p>
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent rounded-4xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="group"
        >
          <div className="bg-white/70 backdrop-blur-lg rounded-4xl shadow-soft-xl p-8 border border-white/30 hover:shadow-soft-2xl transition-all duration-500 hover:border-secondary-200/50">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 rounded-3xl bg-gradient-to-br from-secondary-100 to-secondary-200 group-hover:from-secondary-200 group-hover:to-secondary-300 transition-all duration-300">
                <CalendarDaysIcon className="w-8 h-8 text-secondary-600" />
              </div>
              <div className="w-2 h-2 bg-secondary-400 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            </div>
            <p className="text-sm font-medium text-neutral-500 mb-2 uppercase tracking-wider">Total Classes</p>
            <p className="text-4xl font-display font-bold text-neutral-800">
              <CountUp end={stats.totalClasses} duration={2} />
            </p>
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-400/5 to-transparent rounded-4xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Upcoming Live Classes */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <div className="bg-white/70 backdrop-blur-xl rounded-4xl shadow-soft-2xl p-8 border border-white/40 hover:shadow-soft-2xl transition-all duration-500">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-display font-bold text-neutral-800 flex items-center">
                <div className="p-3 rounded-3xl bg-gradient-to-br from-red-100 to-pink-200 mr-4">
                  <VideoCameraIcon className="w-7 h-7 text-red-600" />
                </div>
                Upcoming Live Classes
              </h3>
              <Link
                href="/schedule"
                className="group flex items-center font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200"
              >
                <span className="mr-2">View Schedule</span>
                <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </div>

            <div className="space-y-6">
              {upcomingClasses.map((liveClass, index) => (
                <motion.div
                  key={liveClass._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 ${
                    liveClass.status === 'live' 
                      ? 'border-red-200 bg-gradient-to-r from-red-50 to-pink-50 shadow-soft-lg' 
                      : 'border-white/40 bg-white/50 hover:border-primary-200 hover:shadow-soft-lg hover:bg-white/70'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        {liveClass.status === 'live' && (
                          <div className="flex items-center">
                            <div className="relative">
                              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></span>
                              <span className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></span>
                            </div>
                            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider px-3 py-1 bg-red-100 rounded-full">
                              Live Now
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg text-neutral-800 mb-1">{liveClass.title}</h4>
                          <p className="text-sm text-neutral-500 mb-3">{liveClass.class?.title}</p>
                          <div className="flex items-center gap-6 text-sm text-neutral-600">
                            <span className="flex items-center">
                              <div className="p-1.5 rounded-lg bg-primary-100 mr-2">
                                <UserGroupIcon className="w-4 h-4 text-primary-600" />
                              </div>
                              {liveClass.teacher?.name || 'Teacher'}
                            </span>
                            <span className="flex items-center">
                              <div className="p-1.5 rounded-lg bg-accent-100 mr-2">
                                <ClockIcon className="w-4 h-4 text-accent-600" />
                              </div>
                              {new Date(liveClass.scheduledAt).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </span>
                            {liveClass.status !== 'live' && (
                              <span className="flex items-center">
                                <div className="p-1.5 rounded-lg bg-secondary-100 mr-2">
                                  <CalendarIcon className="w-4 h-4 text-secondary-600" />
                                </div>
                                In {formatTimeUntil(liveClass.scheduledAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleJoinClass(liveClass)}
                        disabled={joiningClass === liveClass._id || !liveClass.meetingUrl}
                        className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 shadow-soft-md hover:shadow-soft-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                          liveClass.status === 'live' || formatTimeUntil(liveClass.scheduledAt) === 'Started'
                            ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700'
                            : 'bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700'
                        }`}
                      >
                        {joiningClass === liveClass._id ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Joining...
                          </>
                        ) : liveClass.meetingUrl ? (
                          <>
                            <PlayIcon className="w-5 h-5" />
                            Join Class
                          </>
                        ) : (
                          <>
                            <CalendarIcon className="w-5 h-5" />
                            No Meeting Link
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              ))}

              {upcomingClasses.length === 0 && (
                <div className="text-center py-12">
                  <div className="p-6 rounded-4xl bg-gradient-to-br from-neutral-50 to-neutral-100 inline-block mb-4">
                    <CalendarIcon className="w-16 h-16 text-neutral-300 mx-auto" />
                  </div>
                  <p className="text-neutral-500 text-lg font-medium">No upcoming live classes</p>
                  <p className="text-neutral-400 text-sm mt-2">Check back later for new class schedules</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* My Enrolled Classes */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/70 backdrop-blur-xl rounded-4xl shadow-soft-2xl p-8 border border-white/40 hover:shadow-soft-2xl transition-all duration-500"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-display font-bold text-neutral-800 flex items-center">
              <div className="p-3 rounded-3xl bg-gradient-to-br from-secondary-100 to-secondary-200 mr-4">
                <AcademicCapIcon className="w-6 h-6 text-secondary-600" />
              </div>
              My Classes
            </h3>
            <Link
              href="/classes/enrolled"
              className="group text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200 flex items-center"
            >
              <span>View all</span>
              <ChevronRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>
          </div>

          <div className="space-y-4">
            {enrollments
              .filter(e => e.class && e.class._id)
              .slice(0, 4)
              .map((enrollment, index) => (
              <motion.div
                key={enrollment._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <Link
                  href={`/classes/${enrollment.class._id}`}
                  className="group block p-5 bg-white/60 backdrop-blur-sm rounded-3xl border border-white/40 hover:bg-white/80 hover:shadow-soft-lg hover:border-primary-200/50 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-neutral-800 text-base mb-1 line-clamp-1 group-hover:text-primary-700 transition-colors">
                        {enrollment.class.title || 'Untitled Class'}
                      </h4>
                      <div className="flex items-center gap-3 mb-3">
                        <p className="text-sm text-neutral-500 flex items-center">
                          <div className="w-2 h-2 bg-primary-400 rounded-full mr-2"></div>
                          {enrollment.class.teacher?.name || 'Teacher'}
                        </p>
                        {enrollment.payment && (
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            enrollment.payment.status === 'paid' 
                              ? 'bg-gradient-to-r from-accent-100 to-green-100 text-accent-700 border border-accent-200'
                              : enrollment.payment.status === 'pending'
                              ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border border-yellow-200'
                              : 'bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-600 border border-neutral-200'
                          }`}>
                            {enrollment.payment.status === 'paid' ? '✓ Paid' : 
                             enrollment.payment.status === 'pending' ? '⏳ Payment Pending' : 
                             enrollment.payment.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-center justify-end mb-2">
                        <p className="text-sm font-semibold text-primary-600 mr-2">
                          {enrollment.progress?.percentageComplete || 0}%
                        </p>
                        <div className="w-3 h-3 rounded-full bg-primary-400 animate-pulse"></div>
                      </div>
                      <div className="w-20 bg-neutral-200 rounded-full h-2 shadow-inner-soft">
                        <motion.div 
                          className="bg-gradient-to-r from-primary-400 to-primary-600 h-full rounded-full shadow-soft-sm"
                          initial={{ width: 0 }}
                          animate={{ width: `${enrollment.progress?.percentageComplete || 0}%` }}
                          transition={{ duration: 1.5, delay: 0.5 + index * 0.1 }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}

            {enrollments.length === 0 && (
              <div className="text-center py-12">
                <div className="p-6 rounded-4xl bg-gradient-to-br from-neutral-50 to-neutral-100 inline-block mb-4">
                  <AcademicCapIcon className="w-16 h-16 text-neutral-300 mx-auto" />
                </div>
                <p className="text-lg font-medium text-neutral-500 mb-2">No enrolled classes</p>
                <p className="text-sm text-neutral-400 mb-6">Discover amazing classes to start your learning journey</p>
                <Link href="/classes">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-soft-lg hover:shadow-soft-xl"
                  >
                    Browse Classes
                  </motion.button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Study Materials Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <DocumentTextIcon className="w-6 h-6 mr-2" style={{color: '#82993D'}} />
            Recent Study Materials
          </h3>
          <Link
            href="/study-materials"
            className="text-blue-600 hover:text-blue-700 flex items-center font-medium"
          >
            View All
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {studyMaterials.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No study materials available yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Materials uploaded by your teachers will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studyMaterials.map((material, index) => (
              <motion.div
                key={material._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => router.push('/study-materials')}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    {material.type === 'pdf' && (
                      <DocumentTextIcon className="w-5 h-5 text-red-500 mr-2" />
                    )}
                    {material.type === 'video' && (
                      <VideoCameraIcon className="w-5 h-5 text-purple-500 mr-2" />
                    )}
                    {material.type === 'document' && (
                      <DocumentIcon className="w-5 h-5 text-blue-500 mr-2" />
                    )}
                    {material.type === 'presentation' && (
                      <PresentationChartLineIcon className="w-5 h-5 text-green-500 mr-2" />
                    )}
                    {material.type === 'link' && (
                      <LinkIcon className="w-5 h-5 text-indigo-500 mr-2" />
                    )}
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {material.type}
                    </span>
                  </div>
                </div>
                
                <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                  {material.title}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {material.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{material.class?.title}</span>
                  <span>{new Date(material.uploadedAt).toLocaleDateString()}</span>
                </div>
                
                {material.uploadedBy && (
                  <p className="text-xs text-gray-500 mt-2">
                    By {material.uploadedBy.name}
                  </p>
                )}
              </motion.div>
            ))}
            
            {studyMaterials.length > 0 && (
              <Link
                href="/study-materials"
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center hover:border-blue-400 transition-colors"
              >
                <PlusIcon className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">View All Materials</span>
              </Link>
            )}
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Link href="/assignments">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <PencilSquareIcon className="w-8 h-8 mb-2" />
                <h3 className="text-lg font-bold">Assignments</h3>
                <p className="text-orange-100 text-sm mt-1">
                  {dashboardStats.pendingAssignmentsCount > 0 
                    ? `${dashboardStats.pendingAssignmentsCount} pending submission${dashboardStats.pendingAssignmentsCount > 1 ? 's' : ''}`
                    : 'All assignments complete'}
                </p>
              </div>
              <ArrowRightIcon className="w-6 h-6" />
            </div>
          </motion.div>
        </Link>

        <Link href="/study-materials">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white shadow-lg cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <DocumentTextIcon className="w-8 h-8 mb-2" />
                <h3 className="text-lg font-bold">Study Materials</h3>
                <p className="text-blue-100 text-sm mt-1">
                  {dashboardStats.newMaterialsCount > 0 
                    ? `${dashboardStats.newMaterialsCount} new material${dashboardStats.newMaterialsCount > 1 ? 's' : ''} available`
                    : 'Check for updates'}
                </p>
              </div>
              <ArrowRightIcon className="w-6 h-6" />
            </div>
          </motion.div>
        </Link>

        <Link href="/progress">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <ChartBarIcon className="w-8 h-8 mb-2" />
                <h3 className="text-lg font-bold">Progress Report</h3>
                <p className="text-green-100 text-sm mt-1">View your performance</p>
              </div>
              <ArrowRightIcon className="w-6 h-6" />
            </div>
          </motion.div>
        </Link>
      </motion.div>
    </div>
  );
}