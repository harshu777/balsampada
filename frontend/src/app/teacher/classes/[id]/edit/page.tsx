'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { BOARDS, STANDARDS, SUBJECTS, BATCHES, MEDIUMS, CLASS_TYPES, getSubjectsByStandard } from '@/constants/education';

interface FormData {
  title: string;
  description: string;
  board: string;
  standard: string;
  subject: string;
  batch: string;
  academicYear: string;
  medium: string;
  classType: string;
  price: number;
  discountPrice: number;
  duration: number;
  maxStudents: number;
  prerequisites: string;
  learningOutcomes: string;
  syllabus: string;
  thumbnail?: string;
}

export default function EditClassPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    board: '',
    standard: '',
    subject: '',
    batch: 'A',
    academicYear: '',
    medium: 'English',
    classType: 'Regular',
    price: 0,
    discountPrice: 0,
    duration: 0,
    maxStudents: 0,
    prerequisites: '',
    learningOutcomes: '',
    syllabus: '',
    thumbnail: ''
  });

  useEffect(() => {
    fetchClassData();
  }, [params.id]);

  const fetchClassData = async () => {
    try {
      const response = await api.get(`/classes/${params.id}`);
      const classData = response.data.data;
      
      // Map the data to form fields
      setFormData({
        title: classData.title || '',
        description: classData.description || '',
        board: classData.board || '',
        standard: classData.standard || '',
        subject: classData.subject || '',
        batch: classData.batch || 'A',
        academicYear: classData.academicYear || '',
        medium: classData.medium || 'English',
        classType: classData.classType || 'Regular',
        price: classData.price || 0,
        discountPrice: classData.discountPrice || 0,
        duration: classData.duration || 0,
        maxStudents: classData.maxStudents || 0,
        prerequisites: classData.prerequisites?.join(', ') || '',
        learningOutcomes: classData.learningObjectives?.join(', ') || '',
        syllabus: classData.syllabusDescription || '',
        thumbnail: classData.thumbnail || ''
      });
    } catch (error) {
      console.error('Error fetching class:', error);
      toast.error('Failed to load class data');
      router.push('/teacher/classes');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Prepare data for API
      const apiData = {
        ...formData,
        // Convert string fields to arrays for backend
        prerequisites: formData.prerequisites ? formData.prerequisites.split(',').map((p: string) => p.trim()).filter(Boolean) : [],
        learningObjectives: formData.learningOutcomes ? formData.learningOutcomes.split(',').map((l: string) => l.trim()).filter(Boolean) : [],
        syllabusDescription: formData.syllabus,
        syllabus: [], // Keep empty array for now
        // Map to match backend model
        category: 'Other',
        level: 'Beginner',
        currency: 'INR'
      };

      await api.put(`/classes/${params.id}`, apiData);
      toast.success('Class updated successfully!');
      router.push('/teacher/classes');
    } catch (error: any) {
      console.error('Error updating class:', error);
      toast.error(error.response?.data?.message || 'Failed to update class');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Class</h1>
          <p className="mt-2 text-gray-600">
            Update your class information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mathematics for Class 10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what students will learn in this class..."
                />
              </div>
            </div>
          </div>

          {/* Education Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Education Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Board *
                </label>
                <select
                  name="board"
                  value={formData.board}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Board</option>
                  {BOARDS.map(board => (
                    <option key={board.value} value={board.value}>{board.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Standard/Class *
                </label>
                <select
                  name="standard"
                  value={formData.standard}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Standard</option>
                  {STANDARDS.map(std => (
                    <option key={std.value} value={std.value}>{std.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Subject</option>
                  {getSubjectsByStandard(formData.standard).map(subject => (
                    <option key={subject.value} value={subject.value}>{subject.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch *
                </label>
                <select
                  name="batch"
                  value={formData.batch}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {BATCHES.map(batch => (
                    <option key={batch.value} value={batch.value}>{batch.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year *
                </label>
                <input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2024-2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medium *
                </label>
                <select
                  name="medium"
                  value={formData.medium}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MEDIUMS.map(medium => (
                    <option key={medium.value} value={medium.value}>{medium.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Type *
                </label>
                <select
                  name="classType"
                  value={formData.classType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CLASS_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing & Duration */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Pricing & Duration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Price (₹)
                </label>
                <input
                  type="number"
                  name="discountPrice"
                  value={formData.discountPrice}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (hours) *
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Students
                </label>
                <input
                  type="number"
                  name="maxStudents"
                  value={formData.maxStudents}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave 0 for unlimited"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prerequisites
                </label>
                <input
                  type="text"
                  name="prerequisites"
                  value={formData.prerequisites}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Comma-separated list (e.g., Basic algebra, Geometry concepts)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learning Outcomes
                </label>
                <input
                  type="text"
                  name="learningOutcomes"
                  value={formData.learningOutcomes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Comma-separated list of what students will learn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Syllabus Overview
                </label>
                <textarea
                  name="syllabus"
                  value={formData.syllabus}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief overview of topics covered in this class"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/teacher/classes')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {submitting ? 'Updating...' : 'Update Class'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}