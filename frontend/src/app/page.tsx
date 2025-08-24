'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import api from '@/lib/api';
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  TrophyIcon,
  SparklesIcon,
  PlayCircleIcon,
  BookOpenIcon,
  ChartBarIcon,
  VideoCameraIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
  StarIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  PuzzlePieceIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import useAuthStore from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [realClasses, setRealClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    checkAuth();
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated]);

  // Fetch real classes from database
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        const response = await api.get('/classes');
        // Get only published classes and limit to 4 for display
        const publishedClasses = response.data.data
          .filter((cls: any) => cls.status === 'published')
          .slice(0, 4);
        setRealClasses(publishedClasses);
      } catch (error) {
        console.error('Error fetching classes:', error);
        // If error or no classes, use default data
        setRealClasses([]);
      } finally {
        setLoadingClasses(false);
      }
    };
    
    fetchClasses();
  }, []);

  const categories = [
    { name: 'Mathematics', icon: '📐', count: 25 },
    { name: 'Science', icon: '🔬', count: 30 },
    { name: 'English', icon: '📚', count: 20 },
    { name: 'Social Studies', icon: '🌍', count: 15 },
    { name: 'Computer Science', icon: '💻', count: 18 },
    { name: 'Languages', icon: '🗣️', count: 22 }
  ];

  const popularClasses = [
    {
      standard: 'Class 4-5',
      boards: ['CBSE', 'ICSE', 'SSC', 'IB'],
      subjects: 'Mathematics, Science, English, Hindi, Social Studies',
      features: ['Foundation Building', 'Activity Based Learning', 'Regular Worksheets'],
      price: '₹2,999/month',
      originalPrice: '₹4,999',
      rating: 4.8,
      students: 234,
      timing: '4:00 PM - 6:00 PM',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=250&fit=crop',
      batchSize: '20 Students Max',
      highlight: 'Foundation Program'
    },
    {
      standard: 'Class 6-8',
      boards: ['CBSE', 'ICSE', 'SSC', 'IGCSE'],
      subjects: 'All Subjects + Olympiad Preparation',
      features: ['Concept Clarity', 'Test Series', 'Doubt Sessions'],
      price: '₹3,499/month',
      originalPrice: '₹5,999',
      rating: 4.9,
      students: 456,
      timing: '5:00 PM - 7:00 PM',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=250&fit=crop',
      batchSize: '18 Students Max',
      highlight: 'Middle School Excellence'
    },
    {
      standard: 'Class 9-10',
      boards: ['CBSE', 'ICSE', 'SSC'],
      subjects: 'Mathematics, Science, English, Social Science + Board Prep',
      features: ['Board Exam Focus', 'Previous Year Papers', 'Mock Tests'],
      price: '₹4,999/month',
      originalPrice: '₹7,999',
      rating: 4.9,
      students: 678,
      timing: '6:00 PM - 8:00 PM',
      image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&h=250&fit=crop',
      batchSize: '15 Students Max',
      highlight: 'Board Preparation'
    },
    {
      standard: 'Class 11-12',
      boards: ['CBSE', 'ISC', 'HSC'],
      subjects: 'PCM/PCB/Commerce - Specialized Streams',
      features: ['JEE/NEET Coaching', 'Career Guidance', 'Intensive Practice'],
      price: '₹5,999/month',
      originalPrice: '₹9,999',
      rating: 4.8,
      students: 345,
      timing: '6:30 PM - 8:30 PM',
      image: 'https://images.unsplash.com/photo-1632571401005-458e9d244591?w=400&h=250&fit=crop',
      batchSize: '12 Students Max',
      highlight: 'Competitive Exam Prep'
    }
  ];

  const features = [
    {
      icon: <VideoCameraIcon className="w-8 h-8" />,
      title: "100% Live Classes",
      description: "All sessions are conducted live with real-time interaction and doubt clearing"
    },
    {
      icon: <BookOpenIcon className="w-8 h-8" />,
      title: "Comprehensive Study Material",
      description: "Access detailed notes, worksheets, and practice papers"
    },
    {
      icon: <UserGroupIcon className="w-8 h-8" />,
      title: "Small Live Batches",
      description: "Maximum 15 students per live session for personalized attention"
    },
    {
      icon: <ChartBarIcon className="w-8 h-8" />,
      title: "Performance Analytics",
      description: "Track your progress with detailed performance reports"
    },
    {
      icon: <TrophyIcon className="w-8 h-8" />,
      title: "Regular Assessments",
      description: "Weekly tests and assignments to evaluate understanding"
    },
    {
      icon: <ChatBubbleBottomCenterTextIcon className="w-8 h-8" />,
      title: "Doubt Clearing Sessions",
      description: "Dedicated sessions for clearing all your doubts"
    }
  ];

  const testimonials = [
    {
      name: "Amit Verma",
      role: "Class 10 Student",
      rating: 5,
      comment: "Balsampada has transformed my learning experience. The teachers are highly knowledgeable and the study material is excellent.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
    },
    {
      name: "Priya Sharma",
      role: "Parent",
      rating: 5,
      comment: "My daughter's grades have improved significantly since joining Balsampada. The personalized attention she receives is remarkable.",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
    },
    {
      name: "Rahul Singh",
      role: "Class 12 Student",
      rating: 5,
      comment: "The live classes are engaging and the doubt clearing sessions are very helpful. Best online tuition platform!",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
    }
  ];

  const stats = [
    { number: 15000, label: "Happy Students", icon: <UserGroupIcon className="w-6 h-6" /> },
    { number: 98, label: "Success Rate", suffix: "%", icon: <TrophyIcon className="w-6 h-6" /> },
    { number: 500, label: "Expert Teachers", icon: <AcademicCapIcon className="w-6 h-6" /> },
    { number: 50, label: "Batches Running", suffix: "+", icon: <StarIcon className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center">
                <Image 
                  src="/balsampada-logo.svg" 
                  alt="Balsampada" 
                  width={150} 
                  height={40} 
                  className="h-10 w-auto"
                />
              </Link>
              
              <div className="hidden md:flex space-x-6">
                <Link href="/courses" className="text-gray-700 hover:text-blue-600 font-medium transition">
                  Courses
                </Link>
                <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium transition">
                  About
                </Link>
                <Link href="/teachers" className="text-gray-700 hover:text-blue-600 font-medium transition">
                  Teachers
                </Link>
                <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium transition">
                  Contact
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="text-gray-700 hover:text-blue-600 font-medium transition"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center px-4 py-2 bg-red-50 border border-red-200 rounded-full mb-6">
                <span className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                <span className="text-red-700 font-medium">Live Online Classes Available</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Learn Live,
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Excel Together</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8">
                Experience interactive online learning with real-time doubt clearing, personalized attention, and expert teachers for Classes 4-12 across all boards.
              </p>

              {/* Search Bar */}
              <div className="bg-white rounded-xl shadow-lg p-2 mb-8">
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="What do you want to learn today?"
                    className="flex-1 px-4 py-3 outline-none text-gray-700"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center">
                    <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                    Search
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center">
                  <CheckBadgeIcon className="w-5 h-5 text-green-500 mr-1" />
                  <span className="text-gray-700">Verified Teachers</span>
                </div>
                <div className="flex items-center">
                  <StarIcon className="w-5 h-5 text-yellow-500 mr-1" />
                  <span className="text-gray-700">4.8/5 Rating</span>
                </div>
                <div className="flex items-center">
                  <UserGroupIcon className="w-5 h-5 text-blue-500 mr-1" />
                  <span className="text-gray-700">15K+ Students</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=500&fit=crop" 
                  alt="Students learning"
                  className="rounded-2xl shadow-2xl"
                />
                
                {/* Floating Cards */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 animate-float">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrophyIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">98%</p>
                      <p className="text-sm text-gray-600">Success Rate</p>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 animate-float animation-delay-2000">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <UserGroupIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">15K+</p>
                      <p className="text-sm text-gray-600">Active Students</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse Categories</h2>
            <p className="text-gray-600">Choose from our wide range of subjects</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl p-6 text-center cursor-pointer hover:shadow-lg transition-all"
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{category.count} Courses</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Courses */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Classes</h2>
              <p className="text-gray-600">Comprehensive tuition for all boards and standards</p>
            </div>
            <Link href="/classes" className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
              View All Classes
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Link>
          </div>
          
          {/* Show loading state */}
          {loadingClasses ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-6 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Show real classes if available, otherwise show default */}
              {(realClasses.length > 0 ? realClasses : popularClasses).map((classItem, index) => (
                <motion.div
                  key={classItem._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all group cursor-pointer"
                  onClick={() => router.push(`/classes/${classItem._id || ''}`)}
                >
                <div className="relative overflow-hidden">
                  <img 
                    src={classItem.image || classItem.thumbnail || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=250&fit=crop'} 
                    alt={classItem.title || classItem.standard}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {/* For real classes from DB */}
                  {classItem._id ? (
                    <>
                      <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {classItem.category || 'Class'}
                      </div>
                      <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                        <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                        LIVE
                      </div>
                    </>
                  ) : (
                    /* For default display data */
                    <>
                      <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {classItem.highlight}
                      </div>
                      <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                        <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                        LIVE
                      </div>
                    </>
                  )}
                </div>
                
                <div className="p-5">
                  {/* For real classes from DB */}
                  {classItem._id ? (
                    <>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{classItem.title}</h3>
                      
                      {/* Teacher Info */}
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <UserIcon className="w-4 h-4 mr-1" />
                        <span>{classItem.teacher?.name || 'Expert Teacher'}</span>
                      </div>
                      
                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{classItem.description}</p>
                      
                      {/* Class Details */}
                      <div className="space-y-1 mb-3">
                        {classItem.board && (
                          <div className="flex items-center text-xs text-gray-500">
                            <CheckIcon className="w-3 h-3 text-green-500 mr-1" />
                            <span>Board: {classItem.board}</span>
                          </div>
                        )}
                        {classItem.standard && (
                          <div className="flex items-center text-xs text-gray-500">
                            <CheckIcon className="w-3 h-3 text-green-500 mr-1" />
                            <span>Standard: {classItem.standard}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm mb-3">
                        <div className="flex items-center">
                          <StarSolid className="w-4 h-4 text-yellow-500" />
                          <span className="ml-1 font-medium">{classItem.rating || 4.5}</span>
                          <span className="ml-1 text-gray-500">({classItem.enrolledStudents || 0})</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          <span className="text-xs">{classItem.duration || 12} weeks</span>
                        </div>
                      </div>
                      
                      {/* Pricing */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <span className="text-lg font-bold text-gray-900">₹{classItem.price}/month</span>
                        </div>
                        <Link 
                          href={`/classes/${classItem._id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </>
                  ) : (
                    /* For default display data */
                    <>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{classItem.standard}</h3>
                      
                      {/* Boards Available */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {classItem.boards.map((board, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {board}
                          </span>
                        ))}
                      </div>
                      
                      {/* Subjects */}
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{classItem.subjects}</p>
                      
                      {/* Features */}
                      <div className="space-y-1 mb-3">
                        {classItem.features.slice(0, 2).map((feature, i) => (
                          <div key={i} className="flex items-center text-xs text-gray-500">
                            <CheckIcon className="w-3 h-3 text-green-500 mr-1" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm mb-3">
                        <div className="flex items-center">
                          <StarSolid className="w-4 h-4 text-yellow-500" />
                          <span className="ml-1 font-medium">{classItem.rating}</span>
                          <span className="ml-1 text-gray-500">({classItem.students})</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <UserGroupIcon className="w-4 h-4 mr-1" />
                          <span className="text-xs">{classItem.batchSize}</span>
                        </div>
                      </div>
                      
                      {/* Pricing */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <span className="text-lg font-bold text-gray-900">{classItem.price}</span>
                          <span className="text-xs text-gray-500 line-through block">{classItem.originalPrice}</span>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                          Enroll Now
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Balsampada?</h2>
            <p className="text-blue-100">Experience the best in online education</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 hover:bg-white/20 transition"
              >
                <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-blue-100">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8" ref={ref}>
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {inView && (
                    <CountUp 
                      end={stat.number} 
                      duration={2.5} 
                      suffix={stat.suffix || '+'} 
                      decimals={stat.label === "Average Rating" ? 1 : 0}
                    />
                  )}
                </div>
                <p className="text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Students Say</h2>
            <p className="text-gray-600">Real experiences from real students</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarSolid key={i} className="w-5 h-5 text-yellow-500" />
                  ))}
                </div>
                
                <p className="text-gray-600 mb-6 italic">"{testimonial.comment}"</p>
                
                <div className="flex items-center">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4">
              Start Your Learning Journey Today
            </h2>
            <p className="text-xl mb-8 text-orange-100">
              Join thousands of students achieving their academic goals
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register" 
                className="px-8 py-4 bg-white text-orange-500 rounded-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105"
              >
                Get Started Free
              </Link>
              <Link 
                href="/courses" 
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition"
              >
                Browse Courses
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Image 
                src="/balsampada-logo.svg" 
                alt="Balsampada" 
                width={150} 
                height={40} 
                className="h-10 w-auto mb-4 brightness-0 invert"
              />
              <p className="text-gray-400 mb-4">
                Empowering students through quality education for a brighter future.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/courses" className="hover:text-white transition">All Courses</Link></li>
                <li><Link href="/teachers" className="hover:text-white transition">Our Teachers</Link></li>
                <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition">Help Center</Link></li>
                <li><Link href="/faq" className="hover:text-white transition">FAQs</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Contact Info</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start">
                  <MapPinIcon className="w-5 h-5 mr-2 mt-0.5 text-orange-500" />
                  <span>123 Education Street, Mumbai, Maharashtra 400001</span>
                </li>
                <li className="flex items-center">
                  <PhoneIcon className="w-5 h-5 mr-2 text-orange-500" />
                  <span>+91 98765 43210</span>
                </li>
                <li className="flex items-center">
                  <EnvelopeIcon className="w-5 h-5 mr-2 text-orange-500" />
                  <span>info@balsampada.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 Balsampada LMS. All rights reserved. | Designed with ❤️ for Education</p>
          </div>
        </div>
      </footer>
    </div>
  );
}