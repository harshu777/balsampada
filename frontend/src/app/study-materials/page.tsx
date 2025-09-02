'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  DocumentIcon,
  FolderIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BookOpenIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PresentationChartLineIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  ClockIcon,
  TagIcon
} from '@heroicons/react/24/outline';

interface StudyMaterial {
  _id: string;
  title: string;
  description: string;
  type: 'pdf' | 'video' | 'document' | 'presentation' | 'link';
  fileUrl?: string;
  fileSize?: number;
  uploadedBy: {
    name: string;
    role: string;
  };
  class: {
    _id: string;
    title: string;
    subject: string;
  };
  module?: string;
  tags: string[];
  downloads: number;
  uploadedAt: string;
  lastModified: string;
}

export default function StudyMaterialsPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [categories, setCategories] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchEnrolledClasses();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (enrolledClasses.length > 0) {
      fetchMaterials();
    }
  }, [filterType, filterClass, filterCategory, enrolledClasses]);

  const fetchEnrolledClasses = async () => {
    try {
      const response = await api.get('/enrollments/my-enrollments');
      setEnrolledClasses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching enrolled classes:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/study-materials/categories');
      setCategories(response.data.data || {});
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      
      // If no enrolled classes, show empty state
      if (enrolledClasses.length === 0) {
        setMaterials([]);
        setLoading(false);
        return;
      }
      
      // Fetch materials for all enrolled classes
      const validEnrollments = enrolledClasses.filter(e => e.class && e.class._id);
      
      if (validEnrollments.length === 0) {
        setMaterials([]);
        setLoading(false);
        return;
      }
      
      const materialsPromises = validEnrollments.map(enrollment => 
        api.get(`/study-materials/class/${enrollment.class._id}`).catch(() => ({ data: { data: [] } }))
      );
      
      const responses = await Promise.all(materialsPromises);
      const allMaterials = responses.flatMap(res => res.data.data || []);
      
      // Apply filters
      let filtered = allMaterials;
      
      if (filterType !== 'all') {
        filtered = filtered.filter(m => m.type === filterType);
      }
      
      if (filterClass !== 'all') {
        filtered = filtered.filter(m => m.class._id === filterClass);
      }

      if (filterCategory !== 'all') {
        filtered = filtered.filter(m => m.category === filterCategory);
      }
      
      setMaterials(filtered);
    } catch (error) {
      console.error('Error fetching study materials:', error);
      toast.error('Failed to load study materials');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (material: StudyMaterial) => {
    try {
      // For links, open in new tab
      if (material.type === 'link' && material.fileUrl) {
        window.open(material.fileUrl, '_blank');
        toast.success('Opening link...');
      } else {
        // For files, download from backend
        const response = await api.get(`/study-materials/${material._id}/download`, {
          responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', material.title);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        toast.success(`Downloading ${material.title}...`);
      }
      
      // Update download count locally
      setMaterials(prev => prev.map(m => 
        m._id === material._id 
          ? { ...m, downloads: (m.downloads || 0) + 1 }
          : m
      ));
    } catch (error) {
      toast.error('Failed to download material');
    }
  };

  const handleView = (material: StudyMaterial) => {
    // In a real app, this would open a viewer or redirect to view page
    if (material.type === 'video' || material.type === 'link') {
      window.open(material.fileUrl, '_blank');
    } else {
      toast.info('Opening viewer...');
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return DocumentTextIcon;
      case 'video':
        return VideoCameraIcon;
      case 'presentation':
        return PresentationChartLineIcon;
      case 'document':
        return DocumentIcon;
      default:
        return FolderIcon;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredMaterials = materials.filter(material =>
    material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Study Materials</h1>
          <p className="mt-2 text-gray-600">
            Access all your course materials, notes, and resources
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDFs</option>
              <option value="video">Videos</option>
              <option value="document">Documents</option>
              <option value="presentation">Presentations</option>
            </select>

            {/* Class Filter */}
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Classes</option>
              {enrolledClasses.map((enrollment, index) => 
                enrollment.class && enrollment.class._id ? (
                  <option key={enrollment.class._id} value={enrollment.class._id}>
                    {enrollment.class.title}
                  </option>
                ) : null
              )}
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {Object.entries(categories).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Materials Grid */}
        {enrolledClasses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Enrolled Classes
            </h3>
            <p className="text-gray-600 mb-4">
              You need to enroll in classes to access study materials
            </p>
            <Link
              href="/classes"
              className="inline-flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 transition"
              style={{backgroundColor: '#82993D'}}
            >
              Browse Classes
            </Link>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No materials found
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Try adjusting your search or filters'
                : materials.length === 0
                ? 'No study materials have been uploaded yet. Check back later!'
                : 'No materials match your current filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material, index) => {
              const Icon = getFileIcon(material.type);
              
              return (
                <motion.div
                  key={material._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    {/* Icon and Type */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg" style={{backgroundColor: '#82993D20'}}>
                        <Icon className="h-8 w-8" style={{color: '#82993D'}} />
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        material.type === 'video' 
                          ? 'bg-purple-100 text-purple-800'
                          : material.type === 'pdf'
                          ? 'bg-red-100 text-red-800'
                          : material.type === 'presentation'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {material.type.toUpperCase()}
                      </span>
                    </div>

                    {/* Title and Description */}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {material.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {material.description}
                    </p>

                    {/* Metadata */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-xs text-gray-500">
                        <BookOpenIcon className="h-4 w-4 mr-1" />
                        {material.class.title}
                      </div>
                      {material.module && (
                        <div className="flex items-center text-xs text-gray-500">
                          <FolderIcon className="h-4 w-4 mr-1" />
                          {material.module}
                        </div>
                      )}
                      <div className="flex items-center text-xs text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {formatDate(material.uploadedAt)}
                      </div>
                      {material.fileSize && (
                        <div className="flex items-center text-xs text-gray-500">
                          <DocumentIcon className="h-4 w-4 mr-1" />
                          {formatFileSize(material.fileSize)}
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {material.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {material.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(material)}
                        className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center justify-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(material)}
                        className="flex-1 px-3 py-2 text-sm font-medium text-white rounded-lg transition hover:opacity-90 flex items-center justify-center"
                        style={{background: 'linear-gradient(to right, #82993D, #AC6CA1)'}}
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    </div>

                    {/* Download Count */}
                    <p className="text-xs text-gray-500 text-center mt-3">
                      {material.downloads} downloads
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}