'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import PageLayout from '@/components/layout/PageLayout';
import {
  ClockIcon,
  UserIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  BookOpenIcon,
  PlayCircleIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  CheckIcon,
  StarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  UsersIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  GlobeAltIcon,
  TrophyIcon,
  ChartBarIcon,
  LockClosedIcon,
  LockOpenIcon,
  PlayIcon,
  DocumentIcon,
  UserGroupIcon,
  SignalIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import useAuthStore from '@/store/authStore';

interface Module {
  _id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

interface Lesson {
  _id: string;
  title: string;
  type: string;
  duration: number;
  content?: string;
  schedule?: string;
  meetingLink?: string;
}

interface ClassDetails {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  category: string;
  board?: string;
  standard?: string;
  subject?: string;
  price: number;
  discountPrice?: number;
  duration: number;
  teacher: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
  };
  modules: Module[];
  enrolledStudents: Array<{ _id: string; name: string; avatar?: string }> | number;
  rating: number;
  totalRatings: number;
  status: string;
  startDate?: string;
  schedule?: string;
  maxStudents?: number;
  language?: string;
  prerequisites?: string[];
  learningOutcomes?: string[];
  createdAt: string;
}

export default function ClassDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (params.id) {
      fetchClassDetails();
      checkEnrollment();
    }
  }, [params.id]);

  const fetchClassDetails = async (retryCount = 0) => {
    try {
      setLoading(true);
      const response = await api.get(`/classes/${params.id}`);
      setClassDetails(response.data.data);
    } catch (error: any) {
      console.error('Error fetching class details:', error);
      
      // Handle rate limiting with retry
      if (error.response?.status === 429 && retryCount < 2) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '3', 10);
        toast.error(`Too many requests. Retrying in ${retryAfter} seconds...`);
        setTimeout(() => fetchClassDetails(retryCount + 1), retryAfter * 1000);
        return;
      }
      
      // Handle other errors
      if (error.response?.status === 429) {
        toast.error('Server is busy. Please try again later.');
      } else if (error.response?.status === 404) {
        toast.error('Class not found');
      } else {
        toast.error('Failed to load class details');
      }
      
      router.push('/classes');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const response = await api.get('/enrollments/my-enrollments');
      
      const enrolled = response.data.data.some((enrollment: any) => {
        // Check both class and classId fields as the API might use either
        const classId = enrollment.class?._id || enrollment.class || enrollment.classId?._id || enrollment.classId;
        return classId === params.id;
      });
      
      setIsEnrolled(enrolled);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const handleEnrollment = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to enroll in this class');
      router.push('/login');
      return;
    }

    if (user?.role !== 'student') {
      toast.error('Only students can enroll in classes');
      return;
    }

    try {
      setEnrolling(true);
      const response = await api.post(`/enrollments/classes/${params.id}/enroll`);
      toast.success('Successfully enrolled in the class!');
      setIsEnrolled(true);
      
      // Refresh enrollment data
      await checkEnrollment();
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Enrollment error:', error);
      
      // Show specific error message from backend
      const errorMessage = error.response?.data?.message || 'Failed to enroll in class';
      toast.error(errorMessage);
      
      // If class is not published, show additional help
      if (errorMessage.includes('not yet published')) {
        toast('Classes must be published by the teacher before enrollment.', {
          duration: 5000,
          icon: 'ℹ️'
        });
      }
    } finally {
      setEnrolling(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded-lg mb-8"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
      </PageLayout>
    );
  }

  if (!classDetails) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Class not found</h2>
          <Link href="/classes" className="text-blue-600 hover:text-blue-700">
            Browse all classes
          </Link>
        </div>
      </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50">

      {/* Hero Section with Breadcrumb */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative">
          {/* Breadcrumb */}
          <div className="border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center space-x-2 text-sm">
                <Link href="/" className="hover:text-white/80">Home</Link>
                <ChevronRightIcon className="w-4 h-4" />
                <Link href="/classes" className="hover:text-white/80">Classes</Link>
                <ChevronRightIcon className="w-4 h-4" />
                <span className="text-white/60">{classDetails.title}</span>
              </div>
            </div>
          </div>

          {/* Hero Content */}
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="max-w-3xl">
              {/* Category Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {classDetails.status !== 'published' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-500 text-white uppercase">
                    {classDetails.status}
                  </span>
                )}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-500 text-gray-900">
                  {classDetails.category}
                </span>
                {classDetails.board && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur">
                    {classDetails.board}
                  </span>
                )}
                {classDetails.standard && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur">
                    Class {classDetails.standard}
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">{classDetails.title}</h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">{classDetails.description}</p>
              
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Instructor</p>
                    <p className="font-medium">{classDetails.teacher.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <SignalIcon className="w-5 h-5 text-white/60" />
                  <div>
                    <p className="text-xs text-white/60">Mode</p>
                    <p className="font-medium">Live Online</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-white/60" />
                  <div>
                    <p className="text-xs text-white/60">Duration</p>
                    <p className="font-medium">{classDetails.duration} weeks</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5 text-white/60" />
                  <div>
                    <p className="text-xs text-white/60">Enrolled</p>
                    <p className="font-medium">
                      {Array.isArray(classDetails.enrolledStudents) 
                        ? classDetails.enrolledStudents.length 
                        : classDetails.enrolledStudents || 0} students
                    </p>
                  </div>
                </div>
              </div>

              {/* Rating */}
              {classDetails.rating > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold">{classDetails.rating.toFixed(1)}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        i < Math.floor(classDetails.rating) ? 
                          <StarSolid key={i} className="w-5 h-5 text-yellow-400" /> :
                          <StarIcon key={i} className="w-5 h-5 text-white/30" />
                      ))}
                    </div>
                  </div>
                  <span className="text-white/60">({classDetails.totalRatings} reviews)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Course Content */}
          <div className="lg:col-span-2">
            {/* Tabs Navigation */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="border-b">
                <div className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                      activeTab === 'overview'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('curriculum')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                      activeTab === 'curriculum'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Curriculum
                  </button>
                  <button
                    onClick={() => setActiveTab('instructor')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                      activeTab === 'instructor'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Instructor
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                      activeTab === 'reviews'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Reviews
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* What you'll learn */}
                  {classDetails.learningOutcomes && classDetails.learningOutcomes.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">What you'll learn</h2>
                      <div className="grid md:grid-cols-2 gap-4">
                        {classDetails.learningOutcomes.map((outcome, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <CheckIcon className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-gray-700">{outcome}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Class Description */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">About this Live Class</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">{classDetails.description}</p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <InformationCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-yellow-900 mb-1">Live Online Classes</p>
                          <p className="text-sm text-yellow-800">All sessions are conducted live via video conferencing. Students can interact directly with the teacher and ask questions in real-time.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prerequisites */}
                  {classDetails.prerequisites && classDetails.prerequisites.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Prerequisites</h2>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <ul className="space-y-2">
                          {classDetails.prerequisites.map((prereq, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{prereq}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Key Features of Live Classes */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Features</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <VideoCameraIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Live Interactive Classes</p>
                          <p className="text-sm text-gray-600">Real-time interaction with teacher</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <UserGroupIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Small Batch Size</p>
                          <p className="text-sm text-gray-600">Max {classDetails.maxStudents || 20} students per batch</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <ClockIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Doubt Clearing Sessions</p>
                          <p className="text-sm text-gray-600">Dedicated time for Q&A</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <ChartBarIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Regular Assessments</p>
                          <p className="text-sm text-gray-600">Weekly tests and assignments</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <DocumentIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Study Materials</p>
                          <p className="text-sm text-gray-600">Notes, worksheets, and practice papers</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CalendarIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Flexible Schedule</p>
                          <p className="text-sm text-gray-600">Multiple batch timings available</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Curriculum Tab */}
              {activeTab === 'curriculum' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Live Class Schedule & Topics</h2>
                  
                  {classDetails.modules && classDetails.modules.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                        <span>{classDetails.modules?.length || 0} Modules</span>
                        <span>
                          {classDetails.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0} Live Sessions
                        </span>
                      </div>
                      
                      {classDetails.modules
                        .sort((a, b) => a.order - b.order)
                        .map((module, moduleIndex) => (
                        <div 
                          key={module._id}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => toggleModule(module._id)}
                            className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                                {moduleIndex + 1}
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                                  {module.title}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {module.lessons.length} live sessions • 
                                  {module.lessons.reduce((acc, lesson) => acc + lesson.duration, 0)} min each
                                </p>
                              </div>
                            </div>
                            <ChevronDownIcon 
                              className={`w-5 h-5 text-gray-400 transition-transform ${
                                expandedModules.includes(module._id) ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          
                          {expandedModules.includes(module._id) && (
                            <div className="px-6 py-4 bg-white border-t">
                              {module.description && (
                                <p className="text-gray-600 mb-4">{module.description}</p>
                              )}
                              <div className="space-y-3">
                                {module.lessons.map((lesson, lessonIndex) => (
                                  <div key={lesson._id} className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-lg transition group">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <VideoCameraIcon className="w-4 h-4 text-blue-600" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-900 group-hover:text-blue-600 transition">
                                          {lesson.title}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          Live Session • {lesson.duration} min
                                        </p>
                                      </div>
                                    </div>
                                    {isEnrolled ? (
                                      <LockOpenIcon className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <LockClosedIcon className="w-5 h-5 text-gray-400" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Live class schedule will be added soon.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Instructor Tab */}
              {activeTab === 'instructor' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">About the Instructor</h2>
                  <div className="flex items-start gap-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                      {classDetails.teacher.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{classDetails.teacher.name}</h3>
                      <p className="text-gray-600 mb-4">{classDetails.teacher.email}</p>
                      {classDetails.teacher.bio ? (
                        <p className="text-gray-700 leading-relaxed">{classDetails.teacher.bio}</p>
                      ) : (
                        <p className="text-gray-700 leading-relaxed">
                          Experienced instructor passionate about teaching and helping students achieve their academic goals.
                        </p>
                      )}
                      
                      <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">5+</p>
                          <p className="text-sm text-gray-600">Years Experience</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">100+</p>
                          <p className="text-sm text-gray-600">Students Taught</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">4.8</p>
                          <p className="text-sm text-gray-600">Average Rating</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Student Reviews</h2>
                  {classDetails.rating > 0 ? (
                    <div>
                      <div className="flex items-center gap-6 mb-8">
                        <div className="text-center">
                          <p className="text-5xl font-bold text-gray-900">{classDetails.rating.toFixed(1)}</p>
                          <div className="flex justify-center mt-2">
                            {[...Array(5)].map((_, i) => (
                              i < Math.floor(classDetails.rating) ? 
                                <StarSolid key={i} className="w-6 h-6 text-yellow-400" /> :
                                <StarIcon key={i} className="w-6 h-6 text-gray-300" />
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{classDetails.totalRatings} reviews</p>
                        </div>
                        
                        <div className="flex-1">
                          <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((stars) => (
                              <div key={stars} className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 w-12">{stars} star</span>
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-yellow-400" 
                                    style={{ width: stars === 5 ? '70%' : stars === 4 ? '20%' : '10%' }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-600 w-12 text-right">
                                  {stars === 5 ? '70%' : stars === 4 ? '20%' : '10%'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-6">
                        <p className="text-gray-500 text-center">Reviews will be displayed here once students provide feedback.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <StarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No reviews yet. Be the first to review this class!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Enrollment Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Price Card */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Live Class Banner */}
                <div className="relative h-48 bg-gradient-to-br from-blue-600 to-purple-600">
                  {classDetails.thumbnail ? (
                    <img 
                      src={classDetails.thumbnail} 
                      alt={classDetails.title}
                      className="w-full h-full object-cover opacity-30"
                    />
                  ) : null}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mb-3">
                      <VideoCameraIcon className="w-8 h-8" />
                    </div>
                    <p className="text-lg font-semibold">Live Online Classes</p>
                    <p className="text-sm text-white/80">Interactive Sessions</p>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Price or Enrollment Status */}
                  {isEnrolled ? (
                    <div className="mb-6">
                      <div className="flex items-center justify-center text-green-600 mb-2">
                        <CheckCircleIcon className="w-8 h-8 mr-2" />
                        <span className="text-xl font-semibold">You are enrolled!</span>
                      </div>
                      <p className="text-sm text-gray-600 text-center">
                        Access your classes from the dashboard
                      </p>
                    </div>
                  ) : (
                    <div>
                      {classDetails.discountPrice && classDetails.discountPrice < classDetails.price && (
                        <div className="flex justify-center mb-2">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            {Math.round(((classDetails.price - classDetails.discountPrice) / classDetails.price) * 100)}% OFF
                          </span>
                        </div>
                      )}
                      <div className="flex items-baseline justify-center mb-6">
                        {classDetails.discountPrice && classDetails.discountPrice < classDetails.price ? (
                          <>
                            <span className="text-4xl font-bold text-gray-900">₹{classDetails.discountPrice}</span>
                            <span className="text-xl text-gray-500 line-through ml-3">₹{classDetails.price}</span>
                            <span className="text-gray-500 ml-2">/month</span>
                          </>
                        ) : (
                          <>
                            <span className="text-4xl font-bold text-gray-900">₹{classDetails.price}</span>
                            <span className="text-gray-500 ml-2">/month</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enroll Button */}
                  {classDetails.status !== 'published' ? (
                    <div className="space-y-2">
                      <button
                        disabled
                        className="w-full py-3 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed shadow-lg"
                      >
                        Class Not Available
                      </button>
                      <p className="text-xs text-center text-gray-600">
                        This class is currently {classDetails.status}. Contact the teacher for more information.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={isEnrolled ? undefined : handleEnrollment}
                      disabled={enrolling || isEnrolled}
                      className={`w-full py-3 text-white rounded-lg font-semibold transition shadow-lg ${
                        isEnrolled 
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {isEnrolled ? 'Already Enrolled' : enrolling ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  )}

                  {!isAuthenticated && (
                    <p className="text-sm text-gray-500 text-center mt-3">
                      Please <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">login</Link> to enroll
                    </p>
                  )}

                  {/* Class Schedule Info */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-900 font-medium">
                        {classDetails.schedule || 'Schedule: Mon, Wed, Fri - 4:00 PM'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Info Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">This class includes:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <VideoCameraIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Live Online Sessions</p>
                      <p className="text-xs text-gray-500">{classDetails.duration} weeks of real-time interactive classes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <UserGroupIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Small Batch Size</p>
                      <p className="text-xs text-gray-500">Personalized attention in live sessions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ClockIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Flexible Timings</p>
                      <p className="text-xs text-gray-500">Doubt clearing sessions available</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ChartBarIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Progress Tracking</p>
                      <p className="text-xs text-gray-500">Regular assessments and feedback</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DocumentIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Study Materials</p>
                      <p className="text-xs text-gray-500">Comprehensive notes and assignments</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrophyIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Completion Certificate</p>
                      <p className="text-xs text-gray-500">After attending all sessions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Share this class</h3>
                <div className="flex gap-3">
                  <button className="flex-1 py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700">
                    Facebook
                  </button>
                  <button className="flex-1 py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700">
                    Twitter
                  </button>
                  <button className="flex-1 py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700">
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageLayout>
  );
}