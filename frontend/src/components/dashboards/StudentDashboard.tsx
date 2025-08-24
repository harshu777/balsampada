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
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';

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
      email: string;
    };
    category: string;
    board?: string;
    standard?: string;
    duration: number;
    schedule?: string;
    price: number;
  };
  enrollmentDate: string;
  progress: {
    lessonsCompleted: number;
    totalLessons: number;
    percentageComplete: number;
    lastAccessed?: string;
  };
  payment: {
    status: string;
    amount: number;
  };
  status: string;
}

interface LiveClass {
  _id: string;
  classId: string;
  title: string;
  teacher: string;
  startTime: string;
  duration: number;
  meetingLink?: string;
  status: 'scheduled' | 'live' | 'completed';
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [joiningClass, setJoiningClass] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    setTimeBasedGreeting();
    // Refresh data every 5 minutes for live class updates (reduced frequency to avoid rate limiting)
    const interval = setInterval(fetchDashboardData, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  const setTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  };

  const fetchDashboardData = async (retryCount = 0) => {
    try {
      // Fetch enrollments
      const enrollmentResponse = await api.get('/enrollments/my-enrollments');
      setEnrollments(enrollmentResponse.data.data || []);
      
      // Generate mock upcoming classes for now
      generateUpcomingClasses(enrollmentResponse.data.data || []);
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
    // Filter out enrollments without class data and generate mock live classes
    const validEnrollments = enrollments.filter(e => e.class && e.class._id);
    
    const mockClasses: LiveClass[] = validEnrollments.slice(0, 3).map((enrollment, index) => {
      const now = new Date();
      const startTime = new Date(now);
      
      // Set different times for each class
      if (index === 0) {
        // First class in 30 minutes
        startTime.setMinutes(startTime.getMinutes() + 30);
      } else if (index === 1) {
        // Second class in 2 hours
        startTime.setHours(startTime.getHours() + 2);
      } else {
        // Third class tomorrow same time
        startTime.setDate(startTime.getDate() + 1);
        startTime.setHours(16, 0, 0, 0);
      }

      // Mark first class as live if within 15 minutes
      const isLive = index === 0 && (startTime.getTime() - now.getTime()) < 15 * 60 * 1000;

      return {
        _id: `live-${enrollment._id}`,
        classId: enrollment.class._id,
        title: enrollment.class.title || 'Untitled Class',
        teacher: enrollment.class.teacher?.name || 'Teacher',
        startTime: startTime.toISOString(),
        duration: 60,
        meetingLink: `https://meet.google.com/abc-defg-hij`,
        status: isLive ? 'live' : 'scheduled'
      };
    });

    setUpcomingClasses(mockClasses);
  };

  const handleJoinClass = async (liveClass: LiveClass) => {
    setJoiningClass(liveClass._id);
    
    try {
      // In a real app, this would validate the session and get the actual meeting link
      toast.success('Joining live class...');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Open meeting link in new tab
      if (liveClass.meetingLink) {
        window.open(liveClass.meetingLink, '_blank');
      }
    } catch (error) {
      toast.error('Failed to join class');
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
    activeClasses: enrollments.filter(e => e.status === 'active').length,
    completedClasses: enrollments.filter(e => e.progress?.percentageComplete === 100).length,
    averageProgress: enrollments.length > 0 
      ? Math.round(enrollments.reduce((acc, e) => acc + (e.progress?.percentageComplete || 0), 0) / enrollments.length)
      : 0,
    totalClasses: enrollments.length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {greeting}, {user?.name || 'Student'}! 👋
            </h1>
            <p className="mt-2 text-gray-600">
              Ready for your live classes today? Let's make it a productive day!
            </p>
          </div>
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <BellIcon className="w-6 h-6 text-gray-600" />
              <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Live Class Alert */}
      {upcomingClasses.find(c => c.status === 'live') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <div>
                <h2 className="text-xl font-bold">Live Class in Progress!</h2>
                <p className="text-red-100">
                  {upcomingClasses.find(c => c.status === 'live')?.title} with {upcomingClasses.find(c => c.status === 'live')?.teacher}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleJoinClass(upcomingClasses.find(c => c.status === 'live')!)}
              disabled={joiningClass !== null}
              className="px-6 py-3 bg-white text-red-600 rounded-xl font-semibold hover:bg-red-50 transition flex items-center gap-2"
            >
              <VideoCameraIcon className="w-5 h-5" />
              {joiningClass === upcomingClasses.find(c => c.status === 'live')?._id ? 'Joining...' : 'Join Now'}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -5 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <BookOpenIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Active Classes</p>
          <p className="text-3xl font-bold text-gray-900">
            <CountUp end={stats.activeClasses} duration={2} />
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -5 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-50">
              <ChartBarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Avg Progress</p>
          <p className="text-3xl font-bold text-gray-900">
            <CountUp end={stats.averageProgress} duration={2} />%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -5 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-yellow-50">
              <TrophyIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Completed</p>
          <p className="text-3xl font-bold text-gray-900">
            <CountUp end={stats.completedClasses} duration={2} />
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -5 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <CalendarDaysIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Classes</p>
          <p className="text-3xl font-bold text-gray-900">
            <CountUp end={stats.totalClasses} duration={2} />
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Live Classes */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <VideoCameraIcon className="w-6 h-6 text-red-600 mr-2" />
              Upcoming Live Classes
            </h3>
            <Link
              href="/schedule"
              className="text-blue-600 hover:text-blue-700 flex items-center font-medium"
            >
              View Schedule
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="space-y-4">
            {upcomingClasses.map((liveClass, index) => (
              <motion.div
                key={liveClass._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`border rounded-xl p-4 ${
                  liveClass.status === 'live' 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-200 hover:border-blue-300'
                } transition-all`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {liveClass.status === 'live' && (
                      <div className="flex items-center">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></span>
                        <span className="text-xs font-medium text-red-600 uppercase">Live Now</span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900">{liveClass.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center">
                          <UserGroupIcon className="w-4 h-4 mr-1" />
                          {liveClass.teacher}
                        </span>
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {new Date(liveClass.startTime).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </span>
                        <span className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {liveClass.status !== 'live' && `In ${formatTimeUntil(liveClass.startTime)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleJoinClass(liveClass)}
                    disabled={joiningClass === liveClass._id || (liveClass.status !== 'live' && formatTimeUntil(liveClass.startTime) !== 'Started')}
                    className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                      liveClass.status === 'live'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {liveClass.status === 'live' ? (
                      <>
                        <PlayIcon className="w-4 h-4" />
                        {joiningClass === liveClass._id ? 'Joining...' : 'Join Class'}
                      </>
                    ) : (
                      <>
                        <CalendarIcon className="w-4 h-4" />
                        Set Reminder
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}

            {upcomingClasses.length === 0 && (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming live classes</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* My Enrolled Classes */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <AcademicCapIcon className="w-5 h-5 text-purple-600 mr-2" />
              My Classes
            </h3>
            <Link
              href="/my-classes"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {enrollments
              .filter(e => e.class && e.class._id)
              .slice(0, 4)
              .map((enrollment, index) => (
              <motion.div
                key={enrollment._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link
                  href={`/classes/${enrollment.class._id}`}
                  className="block p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                        {enrollment.class.title || 'Untitled Class'}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {enrollment.class.teacher?.name || 'Teacher'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-blue-600">
                        {enrollment.progress?.percentageComplete || 0}%
                      </p>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${enrollment.progress?.percentageComplete || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}

            {enrollments.length === 0 && (
              <div className="text-center py-8">
                <AcademicCapIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-3">No enrolled classes</p>
                <Link href="/classes">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Browse Classes
                  </motion.button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>

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
                <p className="text-orange-100 text-sm mt-1">3 pending submissions</p>
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
                <p className="text-blue-100 text-sm mt-1">New materials available</p>
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