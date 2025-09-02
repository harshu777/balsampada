'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  DocumentIcon,
  CloudArrowUpIcon,
  FolderIcon,
  TagIcon,
  AcademicCapIcon,
  InformationCircleIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  PresentationChartLineIcon,
  LinkIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface Class {
  _id: string;
  title: string;
  subject: string;
  standard?: string;
}

interface StudyMaterial {
  title: string;
  description: string;
  type: 'pdf' | 'video' | 'document' | 'presentation' | 'link';
  classId: string;
  module: string;
  category: string;
  tags: string[];
  file?: File;
  fileUrl?: string;
  visibility: 'public' | 'enrolled' | 'private';
}

export default function UploadStudyMaterialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [material, setMaterial] = useState<StudyMaterial>({
    title: '',
    description: '',
    type: 'pdf',
    classId: '',
    module: '',
    category: 'general',
    tags: [],
    visibility: 'enrolled'
  });
  const [tagInput, setTagInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [categories, setCategories] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchClasses();
    fetchCategories();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes/teacher');
      setClasses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      // Use mock data for now
      setClasses([
        { _id: '1', title: 'Mathematics Grade 10', subject: 'Mathematics', standard: '10' },
        { _id: '2', title: 'Physics Grade 11', subject: 'Physics', standard: '11' },
        { _id: '3', title: 'Chemistry Grade 12', subject: 'Chemistry', standard: '12' }
      ]);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/study-materials/categories');
      setCategories(response.data.data || {});
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback categories
      setCategories({
        general: 'General',
        lectures: 'Lectures',
        assignments: 'Assignments',
        notes: 'Study Notes',
        references: 'Reference Materials',
        exams: 'Exams & Tests',
        projects: 'Projects',
        labs: 'Lab Materials',
        resources: 'Additional Resources'
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    // Auto-detect file type based on extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    let detectedType: StudyMaterial['type'] = 'document';
    
    if (extension === 'pdf') detectedType = 'pdf';
    else if (['mp4', 'webm', 'mov', 'avi'].includes(extension || '')) detectedType = 'video';
    else if (['ppt', 'pptx', 'odp'].includes(extension || '')) detectedType = 'presentation';
    else if (['doc', 'docx', 'txt', 'rtf'].includes(extension || '')) detectedType = 'document';

    setMaterial(prev => ({
      ...prev,
      type: detectedType,
      file: file
    }));

    toast.success(`File "${file.name}" selected`);
  };

  const removeFile = () => {
    setMaterial(prev => ({
      ...prev,
      file: undefined
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !material.tags.includes(tagInput.trim())) {
      setMaterial(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setMaterial(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!material.title || !material.classId) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (material.type === 'link' && !material.fileUrl) {
      toast.error('Please provide a URL for the link');
      return;
    }

    if (material.type !== 'link' && !material.file) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', material.title);
      formData.append('description', material.description);
      formData.append('type', material.type);
      formData.append('classId', material.classId);
      formData.append('module', material.module);
      formData.append('category', material.category);
      formData.append('tags', JSON.stringify(material.tags));
      formData.append('visibility', material.visibility);

      if (material.type === 'link') {
        formData.append('fileUrl', material.fileUrl || '');
      } else if (material.file) {
        formData.append('file', material.file);
      }

      // Upload to backend
      const response = await api.post('/study-materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (response.data.success) {
        toast.success('Study material uploaded successfully!');
        router.push('/teacher/study-materials');
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }

    } catch (error) {
      console.error('Error uploading material:', error);
      toast.error('Failed to upload study material');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload Study Material</h1>
          <p className="mt-2 text-gray-600">
            Share educational resources with your students
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material Title *
                </label>
                <input
                  type="text"
                  value={material.title}
                  onChange={(e) => setMaterial(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Chapter 1: Introduction to Algebra"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={material.description}
                  onChange={(e) => setMaterial(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Brief description of the study material..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class *
                  </label>
                  <select
                    value={material.classId}
                    onChange={(e) => setMaterial(prev => ({ ...prev, classId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a class</option>
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={material.category}
                    onChange={(e) => setMaterial(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(categories).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Module/Chapter
                  </label>
                  <input
                    type="text"
                    value={material.module}
                    onChange={(e) => setMaterial(prev => ({ ...prev, module: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Module 1, Chapter 3"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* File Type Selection */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Material Type</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {(['pdf', 'video', 'document', 'presentation', 'link'] as const).map((type) => {
                const Icon = getFileIcon(type);
                const isSelected = material.type === type;
                
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMaterial(prev => ({ ...prev, type }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? 'border-opacity-100 bg-opacity-10' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{
                      borderColor: isSelected ? getFileTypeColor(type) : undefined,
                      backgroundColor: isSelected ? `${getFileTypeColor(type)}10` : undefined
                    }}
                  >
                    <Icon 
                      className="h-6 w-6 mx-auto mb-1" 
                      style={{ color: isSelected ? getFileTypeColor(type) : '#6B7280' }}
                    />
                    <span className={`text-xs capitalize ${
                      isSelected ? 'font-medium' : 'text-gray-600'
                    }`} style={{ color: isSelected ? getFileTypeColor(type) : undefined }}>
                      {type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Upload / URL Input */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {material.type === 'link' ? 'Resource URL' : 'File Upload'}
            </h2>
            
            {material.type === 'link' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  value={material.fileUrl || ''}
                  onChange={(e) => setMaterial(prev => ({ ...prev, fileUrl: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/resource"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the full URL including https://
                </p>
              </div>
            ) : (
              <>
                {!material.file ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <label className="cursor-pointer">
                      <span className="text-sm text-gray-600">
                        Drag and drop your file here, or{' '}
                        <span className="text-blue-600 font-medium">browse</span>
                      </span>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept={
                          material.type === 'pdf' ? '.pdf' :
                          material.type === 'video' ? 'video/*' :
                          material.type === 'presentation' ? '.ppt,.pptx,.odp' :
                          '*'
                        }
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Maximum file size: 50MB
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const Icon = getFileIcon(material.type);
                          return (
                            <div 
                              className="p-2 rounded-lg"
                              style={{
                                backgroundColor: `${getFileTypeColor(material.type)}20`,
                                color: getFileTypeColor(material.type)
                              }}
                            >
                              <Icon className="h-6 w-6" />
                            </div>
                          );
                        })()}
                        <div>
                          <p className="font-medium text-gray-900">{material.file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(material.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Upload Progress */}
                    {loading && uploadProgress > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${uploadProgress}%`,
                              backgroundColor: '#82993D'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Add tags (e.g., algebra, basics, chapter1)"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition"
                style={{backgroundColor: '#82993D'}}
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>

            {material.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {material.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-1"
                  >
                    <TagIcon className="h-3 w-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Visibility Settings */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Visibility</h2>
            
            <div className="space-y-3">
              {[
                { value: 'enrolled', label: 'Enrolled Students Only', description: 'Only students enrolled in this class can access' },
                { value: 'public', label: 'Public', description: 'Anyone with the link can access' },
                { value: 'private', label: 'Private', description: 'Only you can access this material' }
              ].map(option => (
                <label
                  key={option.value}
                  className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    material.visibility === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={material.visibility === option.value}
                    onChange={(e) => setMaterial(prev => ({ 
                      ...prev, 
                      visibility: e.target.value as StudyMaterial['visibility']
                    }))}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/teacher/study-materials')}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center"
              style={{background: 'linear-gradient(to right, #82993D, #AC6CA1)'}}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                  Upload Material
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}