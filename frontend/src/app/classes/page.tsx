'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  AcademicCapIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  UserGroupIcon,
  StarIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import PageLayout from '@/components/layout/PageLayout';

interface Class {
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
  };
  enrolledStudents: any[];
  averageRating?: number;
  rating?: number;
  status: string;
}

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBoard, setSelectedBoard] = useState('all');
  const [selectedStandard, setSelectedStandard] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const categories = ['all', 'Mathematics', 'Science', 'English', 'Social Studies', 'Languages', 'Computer Science', 'Other'];
  const boards = ['all', 'CBSE', 'ICSE', 'SSC', 'ISC', 'HSC', 'IB', 'IGCSE'];
  const standards = ['all', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    filterAndSortClasses();
  }, [classes, searchQuery, selectedCategory, selectedBoard, selectedStandard, sortBy]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      // Create axios instance without interceptors for public access
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/classes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      console.log('Classes API response:', data);
      const allClasses = data.data || [];
      const publishedClasses = allClasses.filter((cls: Class) => cls.status === 'published');
      console.log('Published classes:', publishedClasses.length, 'out of', allClasses.length);
      setClasses(publishedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortClasses = () => {
    let filtered = [...classes];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(cls =>
        cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(cls => {
        // Map subject to category if category field is missing or 'Other'
        const classCategory = cls.category === 'Other' || !cls.category ? cls.subject : cls.category;
        return classCategory === selectedCategory || cls.subject === selectedCategory;
      });
    }

    // Board filter
    if (selectedBoard !== 'all') {
      filtered = filtered.filter(cls => cls.board === selectedBoard);
    }

    // Standard filter
    if (selectedStandard !== 'all') {
      filtered = filtered.filter(cls => cls.standard === selectedStandard);
    }

    // Sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        filtered.sort((a, b) => b.enrolledStudents.length - a.enrolledStudents.length);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.averageRating || b.rating || 0) - (a.averageRating || a.rating || 0));
        break;
      case 'newest':
      default:
        // Already sorted by newest from API
        break;
    }

    setFilteredClasses(filtered);
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white py-12" style={{background: 'linear-gradient(135deg, #DA528C, #AC6CA1)'}}>
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Live Online Classes</h1>
          <p className="text-xl text-white/80">Interactive learning with expert teachers in real-time</p>
          <div className="flex items-center gap-2 mt-4">
            <div className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
              <span className="mr-2">🔴</span> All Classes are Live
            </div>
            <div className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
              Small Batch Size
            </div>
            <div className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
              Interactive Sessions
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search classes, teachers, or subjects..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2" style={{borderColor: '#AC6CA150', focusBorderColor: '#AC6CA1'}}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" style={{borderColor: '#AC6CA150', focusBorderColor: '#AC6CA1'}}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.slice(1).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" style={{borderColor: '#AC6CA150', focusBorderColor: '#AC6CA1'}}
                value={selectedBoard}
                onChange={(e) => setSelectedBoard(e.target.value)}
              >
                <option value="all">All Boards</option>
                {boards.slice(1).map(board => (
                  <option key={board} value={board}>{board}</option>
                ))}
              </select>

              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" style={{borderColor: '#AC6CA150', focusBorderColor: '#AC6CA1'}}
                value={selectedStandard}
                onChange={(e) => setSelectedStandard(e.target.value)}
              >
                <option value="all">All Classes</option>
                {standards.slice(1).map(std => (
                  <option key={std} value={std}>Class {std}</option>
                ))}
              </select>

              <select
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2" style={{borderColor: '#AC6CA150', focusBorderColor: '#AC6CA1'}}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-5 space-y-3">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredClasses.length > 0 ? (
          <>
            <div className="mb-4 text-gray-600">
              Found {filteredClasses.length} {filteredClasses.length === 1 ? 'class' : 'classes'}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredClasses.map((classItem, index) => (
                <motion.div
                  key={classItem._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-lg overflow-hidden transition-all cursor-pointer group" style={{boxShadow: '0 4px 15px rgba(108, 66, 37, 0.1)', border: '1px solid #AC6CA120'}}
                  onClick={() => router.push(`/classes/${classItem._id}`)}
                >
                  <div className="relative overflow-hidden h-48">
                    <img
                      src={classItem.thumbnail || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=250&fit=crop'}
                      alt={classItem.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {classItem.category && (
                      <div className="absolute top-4 left-4 text-white px-3 py-1 rounded-full text-sm font-medium" style={{backgroundColor: '#DA528C'}}>
                        {classItem.category}
                      </div>
                    )}
                    <div className="absolute top-4 right-4 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center" style={{backgroundColor: '#82993D'}}>
                      <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                      LIVE
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {classItem.title}
                    </h3>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {classItem.description}
                    </p>

                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <UserGroupIcon className="w-4 h-4 mr-1" />
                      <span>{classItem.teacher.name}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {classItem.board && (
                        <span className="text-xs px-2 py-1 rounded" style={{backgroundColor: '#E18DB720', color: '#6C4225'}}>
                          {classItem.board}
                        </span>
                      )}
                      {classItem.standard && (
                        <span className="text-xs px-2 py-1 rounded" style={{backgroundColor: '#82993D20', color: '#82993D'}}>
                          Class {classItem.standard}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm mb-3">
                      <div className="flex items-center">
                        {(classItem.averageRating || classItem.rating || 0) > 0 ? (
                          <>
                            <StarSolid className="w-4 h-4 text-yellow-500" />
                            <span className="ml-1 font-medium">{(classItem.averageRating || classItem.rating || 0).toFixed(1)}</span>
                          </>
                        ) : (
                          <span className="text-gray-400">No ratings yet</span>
                        )}
                      </div>
                      <div className="flex items-center text-gray-500">
                        <UserGroupIcon className="w-4 h-4 mr-1" />
                        <span>{classItem.enrolledStudents.length} students</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div>
                        {classItem.discountPrice && classItem.discountPrice < classItem.price ? (
                          <>
                            <span className="text-xl font-bold" style={{color: '#6C4225'}}>₹{classItem.discountPrice}</span>
                            <span className="text-sm text-gray-500 line-through ml-2">₹{classItem.price}</span>
                            <span className="text-sm text-gray-500">/month</span>
                          </>
                        ) : (
                          <>
                            <span className="text-xl font-bold" style={{color: '#6C4225'}}>₹{classItem.price}</span>
                            <span className="text-sm text-gray-500">/month</span>
                          </>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {classItem.duration} weeks
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </div>
    </PageLayout>
  );
}