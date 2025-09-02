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
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  PresentationChartLineIcon,
  LinkIcon,
  TagIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface StudyMaterial {
  _id: string;
  title: string;
  description: string;
  type: 'pdf' | 'video' | 'document' | 'presentation' | 'link';
  fileUrl?: string;
  fileSize?: number;
  class: {
    _id: string;
    title: string;
    subject: string;
  };
  module?: string;
  tags: string[];
  downloads: number;
  views: number;
  visibility: 'public' | 'enrolled' | 'private';
  uploadedAt: string;
  lastModified: string;
}

export default function TeacherStudyMaterialsPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);

  useEffect(() => {
    fetchMaterials();
    fetchClasses();
  }, [filterType, filterClass]);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes/teacher');
      setClasses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      // Use mock data
      setClasses([
        { _id: '1', title: 'Mathematics Grade 10', subject: 'Mathematics' },
        { _id: '2', title: 'Physics Grade 11', subject: 'Physics' },
        { _id: '3', title: 'Chemistry Grade 12', subject: 'Chemistry' }
      ]);
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from API
      const response = await api.get('/study-materials/teacher');
      const materials = response.data.data || [];
      
      // Apply filters
      let filtered = materials;
      
      if (filterType !== 'all') {
        filtered = filtered.filter(m => m.type === filterType);
      }
      
      if (filterClass !== 'all') {
        filtered = filtered.filter(m => m.class._id === filterClass);
      }
      
      setMaterials(filtered);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load study materials');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this study material?')) return;
    
    try {
      await api.delete(`/study-materials/${id}`);
      setMaterials(prev => prev.filter(m => m._id !== id));
      toast.success('Study material deleted successfully');
    } catch (error) {
      toast.error('Failed to delete study material');
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return DocumentTextIcon;
      case 'video': return VideoCameraIcon;
      case 'presentation': return PresentationChartLineIcon;
      case 'link': return LinkIcon;
      default: return DocumentIcon;
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'pdf': return '#EF4444';
      case 'video': return '#8B5CF6';
      case 'presentation': return '#3B82F6';
      case 'link': return '#10B981';
      default: return '#6B7280';
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

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'bg-green-100 text-green-800';
      case 'enrolled':
        return 'bg-blue-100 text-blue-800';
      case 'private':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMaterials = materials.filter(material =>
    material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: materials.length,
    totalDownloads: materials.reduce((sum, m) => sum + m.downloads, 0),
    totalViews: materials.reduce((sum, m) => sum + m.views, 0),
    avgDownloads: materials.length > 0 
      ? Math.round(materials.reduce((sum, m) => sum + m.downloads, 0) / materials.length)
      : 0
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Study Materials</h1>
              <p className="mt-2 text-gray-600">
                Manage educational resources for your students
              </p>
            </div>
            <Link
              href="/teacher/study-materials/upload"
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition flex items-center"
              style={{background: 'linear-gradient(to right, #82993D, #AC6CA1)'}}
            >
              <CloudArrowUpIcon className="h-5 w-5 mr-2" />
              Upload Material
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Materials</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FolderIcon className="h-8 w-8" style={{color: '#82993D'}} />
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
                <p className="text-sm text-gray-600">Total Downloads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDownloads}</p>
              </div>
              <ArrowDownTrayIcon className="h-8 w-8" style={{color: '#AC6CA1'}} />
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
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
              </div>
              <EyeIcon className="h-8 w-8" style={{color: '#DA528C'}} />
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
                <p className="text-sm text-gray-600">Avg Downloads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgDownloads}</p>
              </div>
              <ChartBarIcon className="h-8 w-8" style={{color: '#E18DB7'}} />
            </div>
          </motion.div>
        </div>

        {/* Filters */}
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              <option value="link">Links</option>
            </select>

            {/* Class Filter */}
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Materials Grid */}
        {filteredMaterials.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No materials found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search or filters'
                : 'Upload your first study material to get started'}
            </p>
            <Link
              href="/teacher/study-materials/upload"
              className="inline-flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 transition"
              style={{backgroundColor: '#82993D'}}
            >
              <CloudArrowUpIcon className="h-5 w-5 mr-2" />
              Upload Material
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material, index) => {
              const Icon = getFileIcon(material.type);
              const color = getFileTypeColor(material.type);
              
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
                      <div 
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor: `${color}20`,
                          color: color
                        }}
                      >
                        <Icon className="h-8 w-8" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVisibilityBadge(material.visibility)}`}>
                          {material.visibility}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {material.type.toUpperCase()}
                        </span>
                      </div>
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
                        <FolderIcon className="h-4 w-4 mr-1" />
                        {material.class.title}
                      </div>
                      {material.module && (
                        <div className="flex items-center text-xs text-gray-500">
                          <DocumentIcon className="h-4 w-4 mr-1" />
                          {material.module}
                        </div>
                      )}
                      <div className="flex items-center text-xs text-gray-500">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Uploaded {formatDate(material.uploadedAt)}
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
                        {material.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            +{material.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
                      <div className="flex items-center text-xs text-gray-600">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        {material.views} views
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        {material.downloads} downloads
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedMaterial(material)}
                        className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center justify-center"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/teacher/study-materials/${material._id}/edit`)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(material._id)}
                        className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* View Material Modal */}
        {selectedMaterial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedMaterial(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedMaterial.title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedMaterial.class.title} {selectedMaterial.module && `• ${selectedMaterial.module}`}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMaterial(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedMaterial.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Type</h3>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = getFileIcon(selectedMaterial.type);
                        const color = getFileTypeColor(selectedMaterial.type);
                        return (
                          <>
                            <Icon className="h-5 w-5" style={{ color }} />
                            <span className="text-gray-600 capitalize">{selectedMaterial.type}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Visibility</h3>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getVisibilityBadge(selectedMaterial.visibility)}`}>
                      {selectedMaterial.visibility}
                    </span>
                  </div>

                  {selectedMaterial.fileSize && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2">File Size</h3>
                      <p className="text-gray-600">{formatFileSize(selectedMaterial.fileSize)}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Uploaded</h3>
                    <p className="text-gray-600">{formatDate(selectedMaterial.uploadedAt)}</p>
                  </div>
                </div>

                {selectedMaterial.tags.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMaterial.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-1"
                        >
                          <TagIcon className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <EyeIcon className="h-5 w-5" />
                      <span className="font-medium">Total Views</span>
                    </div>
                    <p className="text-2xl font-bold" style={{color: '#82993D'}}>
                      {selectedMaterial.views}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      <span className="font-medium">Total Downloads</span>
                    </div>
                    <p className="text-2xl font-bold" style={{color: '#AC6CA1'}}>
                      {selectedMaterial.downloads}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  {selectedMaterial.type === 'link' ? (
                    <a
                      href={selectedMaterial.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition text-center"
                      style={{background: 'linear-gradient(to right, #82993D, #AC6CA1)'}}
                    >
                      Open Link
                    </a>
                  ) : (
                    <button
                      className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition flex items-center justify-center"
                      style={{background: 'linear-gradient(to right, #82993D, #AC6CA1)'}}
                    >
                      <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                      Download
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedMaterial(null);
                      router.push(`/teacher/study-materials/${selectedMaterial._id}/edit`);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}