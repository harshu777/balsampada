'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  BookOpenIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  PlayCircleIcon,
  ChartBarIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface ClassData {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  category: string;
  teacher: {
    _id: string;
    name: string;
    email: string;
  };
  startDate?: string;
  endDate?: string;
  schedule?: string;
  price: number;
  duration: number;
  meetingLink?: string;
  totalLessons?: number;
  completedLessons?: number;
}

interface Enrollment {
  _id: string;
  class: ClassData;
  status: string;
  enrolledAt: string;
  progress: {
    completedLessons: number;
    percentageComplete: number;
    lastAccessed?: string;
  };
}

export default function EnrolledClassesPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await api.get('/enrollments/my-enrollments');
      const data = response.data.data || [];
      // Filter out enrollments with invalid class data
      const validEnrollments = data.filter((e: Enrollment) => e.class && e.class._id);
      setEnrollments(validEnrollments);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to load your classes');
    } finally {
      setLoading(false);
    }
  };

  const isClassLive = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return false;
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    if (filter === 'all') return true;
    if (filter === 'active') return enrollment.status === 'active' && enrollment.progress.percentageComplete < 100;
    if (filter === 'completed') return enrollment.progress.percentageComplete >= 100;
    return true;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
          <p className="mt-2 text-gray-600">
            Continue your learning journey with your enrolled classes
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
              </div>
              <BookOpenIcon className="w-8 h-8" style={{color: '#82993D'}} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Classes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {enrollments.filter(e => e.status === 'active' && e.progress.percentageComplete < 100).length}
                </p>
              </div>
              <PlayCircleIcon className="w-8 h-8" style={{color: '#AC6CA1'}} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {enrollments.filter(e => e.progress.percentageComplete >= 100).length}
                </p>
              </div>
              <CheckCircleIcon className="w-8 h-8" style={{color: '#DA528C'}} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {enrollments.length > 0
                    ? Math.round(
                        enrollments.reduce((acc, e) => acc + (e.progress?.percentageComplete || 0), 0) / enrollments.length
                      )
                    : 0}%
                </p>
              </div>
              <ChartBarIcon className="w-8 h-8" style={{color: '#E18DB7'}} />
            </div>
          </motion.div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === 'all'
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: filter === 'all' ? '#82993D' : undefined
            }}
          >
            All Classes ({enrollments.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === 'active'
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: filter === 'active' ? '#AC6CA1' : undefined
            }}
          >
            Active ({enrollments.filter(e => e.status === 'active' && e.progress.percentageComplete < 100).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === 'completed'
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: filter === 'completed' ? '#DA528C' : undefined
            }}
          >
            Completed ({enrollments.filter(e => e.progress.percentageComplete >= 100).length})
          </button>
        </div>

        {/* Classes Grid */}
        {filteredEnrollments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No classes found
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all'
                ? "You haven't enrolled in any classes yet"
                : `No ${filter} classes found`}
            </p>
            <Link
              href="/classes"
              className="inline-flex items-center px-4 py-2 text-white rounded-lg transition hover:opacity-90"
              style={{background: 'linear-gradient(to right, #82993D, #AC6CA1)'}}
            >
              Browse Classes
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEnrollments.map((enrollment, index) => (
              <motion.div
                key={enrollment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Class Thumbnail */}
                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                  {enrollment.class.thumbnail ? (
                    <img
                      src={enrollment.class.thumbnail}
                      alt={enrollment.class.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpenIcon className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                  
                  {/* Live Badge */}
                  {isClassLive(enrollment.class.startDate, enrollment.class.endDate) && enrollment.class.meetingLink && (
                    <div className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
                      LIVE
                    </div>
                  )}

                  {/* Progress Badge */}
                  {enrollment.progress.percentageComplete >= 100 && (
                    <div className="absolute top-3 left-3 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                      COMPLETED
                    </div>
                  )}
                </div>

                {/* Class Details */}
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {enrollment.class.title}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <UserIcon className="w-4 h-4 mr-2" />
                      {enrollment.class.teacher?.name}
                    </div>
                    
                    {enrollment.class.schedule && (
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {enrollment.class.schedule}
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="w-4 h-4 mr-2" />
                      Enrolled {formatDate(enrollment.enrolledAt)}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">
                        {enrollment.progress.percentageComplete}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getProgressColor(enrollment.progress.percentageComplete)}`}
                        style={{ width: `${enrollment.progress.percentageComplete}%` }}
                      ></div>
                    </div>
                    {enrollment.progress.completedLessons !== undefined && (
                      <p className="text-xs text-gray-500 mt-1">
                        {enrollment.progress.completedLessons} lessons completed
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {isClassLive(enrollment.class.startDate, enrollment.class.endDate) && enrollment.class.meetingLink ? (
                      <a
                        href={enrollment.class.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg transition hover:opacity-90 flex items-center justify-center"
                        style={{background: 'linear-gradient(to right, #DA528C, #E18DB7)'}}
                      >
                        <VideoCameraIcon className="w-4 h-4 mr-2" />
                        Join Live Class
                      </a>
                    ) : (
                      <Link
                        href={`/classes/${enrollment.class._id}`}
                        className="flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg transition hover:opacity-90 flex items-center justify-center"
                        style={{background: 'linear-gradient(to right, #82993D, #AC6CA1)'}}
                      >
                        <PlayCircleIcon className="w-4 h-4 mr-2" />
                        Continue Learning
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}