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
import PageLayout from '@/components/layout/PageLayout';

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
        // Fetch without authentication for public access
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/classes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        const data = await response.json();
        // Get only published classes and limit to 4 for display
        const publishedClasses = (data.data || [])
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
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 relative overflow-hidden">
        
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary-200/20 to-secondary-200/20 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-accent-200/20 to-primary-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-secondary-200/10 to-accent-200/10 rounded-full blur-2xl animate-pulse-slow" />
        </div>

        {/* Hero Section */}
        <section className="relative py-20 lg:py-32">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="relative z-10"
              >
                <motion.div 
                  className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm rounded-4xl mb-8 shadow-soft-lg border border-white/40"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="relative mr-3">
                    <span className="w-3 h-3 rounded-full animate-pulse bg-accent-500"></span>
                    <span className="absolute inset-0 w-3 h-3 bg-accent-500 rounded-full animate-ping opacity-75"></span>
                  </div>
                  <span className="font-semibold text-neutral-700">🔴 Live Online Classes Available</span>
                </motion.div>
                
                <h1 className="text-5xl lg:text-7xl font-display font-bold mb-8 leading-tight">
                  <span className="text-neutral-900">Learn Live,</span>
                  <br />
                  <span className="bg-gradient-to-r from-primary-600 via-secondary-500 to-accent-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
                    Excel Together
                  </span>
                </h1>
                
                <p className="text-xl lg:text-2xl text-neutral-600 mb-10 leading-relaxed font-medium">
                  Experience interactive online learning with real-time doubt clearing, personalized attention, 
                  and expert teachers for Classes 4-12 across all boards.
                </p>

                {/* Search Bar */}
                <motion.div 
                  className="bg-white/80 backdrop-blur-lg rounded-4xl shadow-soft-2xl p-3 mb-10 border border-white/40"
                  whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center">
                    <input
                      type="text"
                      placeholder="What do you want to learn today? 🚀"
                      className="flex-1 px-6 py-4 bg-transparent outline-none text-neutral-700 placeholder:text-neutral-400 text-lg"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <motion.button 
                      className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-3xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-300 flex items-center shadow-soft-lg hover:shadow-soft-xl"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <MagnifyingGlassIcon className="w-6 h-6 mr-2" />
                      Search
                    </motion.button>
                  </div>
                </motion.div>

                {/* Quick Stats */}
                <div className="flex flex-wrap items-center gap-8">
                  <motion.div 
                    className="flex items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="p-2 rounded-2xl bg-gradient-to-br from-accent-100 to-accent-200 mr-3">
                      <CheckBadgeIcon className="w-5 h-5 text-accent-600" />
                    </div>
                    <span className="font-medium text-neutral-700">Verified Teachers</span>
                  </motion.div>
                  <motion.div 
                    className="flex items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <div className="p-2 rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-200 mr-3">
                      <StarIcon className="w-5 h-5 text-yellow-600" />
                    </div>
                    <span className="font-medium text-neutral-700">4.8/5 Rating</span>
                  </motion.div>
                  <motion.div 
                    className="flex items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <div className="p-2 rounded-2xl bg-gradient-to-br from-secondary-100 to-secondary-200 mr-3">
                      <UserGroupIcon className="w-5 h-5 text-secondary-600" />
                    </div>
                    <span className="font-medium text-neutral-700">15K+ Students</span>
                  </motion.div>
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
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{backgroundColor: '#82993D20'}}>
                      <TrophyIcon className="w-6 h-6" style={{color: '#82993D'}} />
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
      <section className="py-16" style={{backgroundColor: '#E18DB710'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{color: '#6C4225'}}>Browse Categories</h2>
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
                className="bg-white rounded-xl p-6 text-center cursor-pointer transition-all"
                style={{border: '1px solid #AC6CA130', boxShadow: '0 4px 6px rgba(172, 108, 161, 0.1)'}}
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="font-semibold" style={{color: '#6C4225'}}>{category.name}</h3>
                <p className="text-sm mt-1" style={{color: '#82993D'}}>{category.count} Courses</p>
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
            <Link href="/classes" className="font-medium flex items-center hover:opacity-80 transition" style={{color: '#DA528C'}}>
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
                            <CheckIcon className="w-3 h-3 mr-1" style={{color: '#82993D'}} />
                            <span>Board: {classItem.board}</span>
                          </div>
                        )}
                        {classItem.standard && (
                          <div className="flex items-center text-xs text-gray-500">
                            <CheckIcon className="w-3 h-3 mr-1" style={{color: '#82993D'}} />
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
                          className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition text-sm" style={{backgroundColor: '#82993D'}}
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
                        {classItem.boards.map((board: string, i: number) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {board}
                          </span>
                        ))}
                      </div>
                      
                      {/* Subjects */}
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{classItem.subjects}</p>
                      
                      {/* Features */}
                      <div className="space-y-1 mb-3">
                        {classItem.features.slice(0, 2).map((feature: string, i: number) => (
                          <div key={i} className="flex items-center text-xs text-gray-500">
                            <CheckIcon className="w-3 h-3 mr-1" style={{color: '#82993D'}} />
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
                        <button className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition text-sm" style={{backgroundColor: '#82993D'}}>
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
      <section className="py-16 text-white" style={{background: 'linear-gradient(135deg, #DA528C, #AC6CA1)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Balsampada?</h2>
            <p className="text-white/80">Experience the best in online education</p>
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
                <p className="text-white/80">{feature.description}</p>
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
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#82993D20', color: '#6C4225'}}>
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
      <section className="py-16" style={{backgroundColor: '#AC6CA110'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{color: '#6C4225'}}>What Our Students Say</h2>
            <p className="text-gray-600">Real experiences from real students</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6"
                style={{boxShadow: '0 10px 25px rgba(108, 66, 37, 0.1)'}}
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarSolid key={i} className="w-5 h-5" style={{color: '#DA528C'}} />
                  ))}
                </div>
                
                <p className="text-gray-600 mb-6 italic">"{testimonial.comment}"</p>
                
                <div className="flex items-center">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                    style={{border: '2px solid #82993D'}}
                  />
                  <div>
                    <h4 className="font-semibold" style={{color: '#6C4225'}}>{testimonial.name}</h4>
                    <p className="text-sm" style={{color: '#82993D'}}>{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-white" style={{background: 'linear-gradient(135deg, #AC6CA1, #DA528C)'}}>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4">
              Start Your Learning Journey Today
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Join thousands of students achieving their academic goals
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register" 
                className="px-8 py-4 bg-white rounded-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105" style={{color: '#AC6CA1'}}
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
    </div>
    </PageLayout>
  );
}