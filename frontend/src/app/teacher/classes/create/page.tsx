'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Save,
  ArrowLeft,
  Info,
  Calendar,
  Clock,
  DollarSign,
  Users,
  FileText,
  Image,
  Video,
  Link as LinkIcon,
  Copy,
  ExternalLink
} from 'lucide-react';
import {
  BOARDS,
  STANDARDS,
  SUBJECTS,
  BATCHES,
  MEDIUMS,
  CLASS_TYPES,
  getSubjectsByStandard,
  generateClassTitle,
  getCurrentAcademicYear,
  getScheduleSuggestions
} from '@/constants/education';
import { generateGoogleMeetLink, isValidGoogleMeetLink } from '@/utils/meetingHelper';

interface ClassFormData {
  // Basic Information
  board: string;
  standard: string;
  subject: string;
  batch: string;
  medium: string;
  classType: string;
  academicYear: string;
  
  // Class Details
  title: string;
  description: string;
  
  // Schedule & Duration
  duration: number; // Total course duration in weeks
  classesPerWeek: number;
  classDuration: number; // Duration per class in minutes
  startDate: string;
  endDate: string;
  schedule: string; // e.g., "Mon, Wed, Fri - 4:00 PM to 5:30 PM"
  
  // Meeting Details
  meetingLink: string;
  autoGenerateMeeting: boolean;
  
  // Pricing
  price: number;
  discountPrice?: number;
  
  // Capacity
  maxStudents: number;
  minStudents: number;
  
  // Additional
  prerequisites: string;
  learningOutcomes: string;
  syllabus: string;
  thumbnail?: string;
}

// Helper function to format date nicely
const formatDateDisplay = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export default function CreateClassPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState(SUBJECTS.primary);
  const [autoTitle, setAutoTitle] = useState(true);
  const [formData, setFormData] = useState<ClassFormData>({
    board: 'CBSE',
    standard: '10',
    subject: '',
    batch: 'A',
    medium: 'English',
    classType: 'Regular',
    academicYear: getCurrentAcademicYear(),
    title: '',
    description: '',
    duration: 12,
    classesPerWeek: 3,
    classDuration: 90,
    startDate: '',
    endDate: '',
    schedule: '',
    meetingLink: '',
    autoGenerateMeeting: true,
    price: 0,
    discountPrice: undefined,
    maxStudents: 30,
    minStudents: 5,
    prerequisites: '',
    learningOutcomes: '',
    syllabus: '',
    thumbnail: ''
  });

  // Update available subjects when standard changes
  useEffect(() => {
    const subjects = getSubjectsByStandard(formData.standard);
    setAvailableSubjects(subjects);
    
    // Reset subject if not available in new standard
    if (!subjects.find(s => s.value === formData.subject)) {
      setFormData(prev => ({ ...prev, subject: '' }));
    }
  }, [formData.standard]);

  // Auto-generate title when relevant fields change
  useEffect(() => {
    if (autoTitle && formData.board && formData.standard && formData.subject) {
      const title = generateClassTitle(
        formData.board,
        formData.standard,
        formData.subject,
        formData.batch,
        formData.classType
      );
      setFormData(prev => ({ ...prev, title }));
    }
  }, [autoTitle, formData.board, formData.standard, formData.subject, formData.batch, formData.classType]);

  // Calculate end date based on start date and duration
  useEffect(() => {
    if (formData.startDate && formData.duration) {
      const start = new Date(formData.startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + (formData.duration * 7) - 1); // duration is in weeks, -1 for inclusive
      setFormData(prev => ({ ...prev, endDate: end.toISOString().split('T')[0] }));
    }
  }, [formData.startDate, formData.duration]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'title') {
      setAutoTitle(false); // Disable auto-title if user manually edits
    }
    
    // Handle duration as number even though it comes from select
    if (name === 'duration') {
      setFormData(prev => ({
        ...prev,
        [name]: Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      }));
    }
  };

  const handleScheduleSuggestion = (suggestion: any) => {
    setFormData(prev => ({
      ...prev,
      schedule: `${suggestion.days} - ${suggestion.time}`,
      classDuration: suggestion.duration
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data for API
      const apiData = {
        ...formData,
        // Convert string fields to arrays for backend
        prerequisites: formData.prerequisites ? formData.prerequisites.split(',').map((p: string) => p.trim()).filter(Boolean) : [],
        learningObjectives: formData.learningOutcomes ? formData.learningOutcomes.split(',').map((l: string) => l.trim()).filter(Boolean) : [],
        // Rename syllabus to syllabusDescription for backend
        syllabusDescription: formData.syllabus,
        syllabus: [], // Send empty array instead of undefined
        // Map to match backend model
        category: 'Other', // Deprecated field, but might be required
        level: 'Beginner', // Deprecated field
        currency: 'INR'
      };

      const response = await api.post('/classes', apiData);
      toast.success('Class created successfully!');
      router.push('/teacher/classes');
    } catch (error: any) {
      console.error('Error creating class:', error);
      toast.error(error.response?.data?.message || 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  const scheduleSuggestions = getScheduleSuggestions(formData.standard, formData.classType);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Class</h1>
              <p className="text-sm text-gray-600 mt-1">
                Set up a new class for your students
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Board & Standard Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Academic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Board <span className="text-red-500">*</span>
                </label>
                <select
                  name="board"
                  value={formData.board}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {BOARDS.map(board => (
                    <option key={board.value} value={board.value}>
                      {board.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Standard/Class <span className="text-red-500">*</span>
                </label>
                <select
                  name="standard"
                  value={formData.standard}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <optgroup label="Primary">
                    {STANDARDS.filter(s => s.group === 'Primary').map(std => (
                      <option key={std.value} value={std.value}>{std.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Middle">
                    {STANDARDS.filter(s => s.group === 'Middle').map(std => (
                      <option key={std.value} value={std.value}>{std.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Secondary">
                    {STANDARDS.filter(s => s.group === 'Secondary').map(std => (
                      <option key={std.value} value={std.value}>{std.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Senior Secondary">
                    {STANDARDS.filter(s => s.group === 'Senior Secondary').map(std => (
                      <option key={std.value} value={std.value}>{std.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Higher Education">
                    {STANDARDS.filter(s => s.group === 'Higher Education').map(std => (
                      <option key={std.value} value={std.value}>{std.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Subject</option>
                  {availableSubjects.map(subject => (
                    <option key={subject.value} value={subject.value}>
                      {subject.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch
                </label>
                <select
                  name="batch"
                  value={formData.batch}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {BATCHES.map(batch => (
                    <option key={batch.value} value={batch.value}>
                      {batch.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medium of Instruction
                </label>
                <select
                  name="medium"
                  value={formData.medium}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {MEDIUMS.map(medium => (
                    <option key={medium.value} value={medium.value}>
                      {medium.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Type
                </label>
                <select
                  name="classType"
                  value={formData.classType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {CLASS_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {CLASS_TYPES.find(t => t.value === formData.classType)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Class Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Class Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="e.g., Class 10 Mathematics - CBSE"
                />
                {autoTitle && (
                  <p className="text-xs text-blue-600 mt-1">
                    <Info className="h-3 w-3 inline mr-1" />
                    Title is auto-generated based on your selections
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Describe what students will learn in this class..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prerequisites
                </label>
                <textarea
                  name="prerequisites"
                  value={formData.prerequisites}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What should students know before joining this class?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Learning Outcomes
                </label>
                <textarea
                  name="learningOutcomes"
                  value={formData.learningOutcomes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What will students achieve after completing this class?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Syllabus/Topics Covered
                </label>
                <textarea
                  name="syllabus"
                  value={formData.syllabus}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="List the topics that will be covered..."
                />
              </div>
            </div>
          </div>

          {/* Schedule & Duration */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Schedule & Duration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Duration (weeks) <span className="text-red-500">*</span>
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="4">4 weeks (1 month)</option>
                  <option value="8">8 weeks (2 months)</option>
                  <option value="12">12 weeks (3 months)</option>
                  <option value="16">16 weeks (4 months)</option>
                  <option value="20">20 weeks (5 months)</option>
                  <option value="24">24 weeks (6 months)</option>
                  <option value="36">36 weeks (9 months)</option>
                  <option value="48">48 weeks (12 months)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select how long your course will run
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  max={`${new Date().getFullYear() + 1}-12-31`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  When will the first class begin?
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span className="text-sm font-normal text-gray-500">(Automatically calculated)</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    max={`${new Date().getFullYear() + 1}-12-31`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                    readOnly
                  />
                  {formData.startDate && formData.duration && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        Auto-calculated: {formData.duration} weeks from start
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  <Info className="h-3 w-3 inline mr-1" />
                  End date is automatically set based on your selected duration. The course will run for {formData.duration} weeks from the start date.
                  {formData.startDate && formData.endDate && (
                    <span className="block mt-1 text-gray-600">
                      Course period: {formatDateDisplay(formData.startDate)} to {formatDateDisplay(formData.endDate)}
                    </span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classes Per Week
                </label>
                <input
                  type="number"
                  name="classesPerWeek"
                  value={formData.classesPerWeek}
                  onChange={handleInputChange}
                  min="1"
                  max="7"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Duration (minutes)
                </label>
                <input
                  type="number"
                  name="classDuration"
                  value={formData.classDuration}
                  onChange={handleInputChange}
                  min="30"
                  max="180"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Mon, Wed, Fri - 4:00 PM to 5:30 PM"
                  required
                />
                
                {scheduleSuggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">Quick suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                      {scheduleSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleScheduleSuggestion(suggestion)}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                          {suggestion.days} - {suggestion.time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Google Meet Integration */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Video className="h-5 w-5 mr-2" />
              Online Meeting Setup
            </h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="autoGenerateMeeting"
                  checked={formData.autoGenerateMeeting}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData(prev => ({
                      ...prev,
                      autoGenerateMeeting: checked,
                      meetingLink: checked ? generateGoogleMeetLink(formData.title) : prev.meetingLink
                    }));
                  }}
                  className="mt-1"
                />
                <label htmlFor="autoGenerateMeeting" className="text-sm">
                  <span className="font-medium text-gray-900">Auto-generate Google Meet link</span>
                  <p className="text-gray-500 text-xs mt-1">
                    We'll create a meeting link for you. You can also create your own in Google Meet and paste it below.
                  </p>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Meet Link <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      name="meetingLink"
                      value={formData.meetingLink}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      required
                    />
                  </div>
                  {formData.meetingLink && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(formData.meetingLink);
                        toast.success('Meeting link copied!');
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                      title="Copy link"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                  {formData.meetingLink && (
                    <a
                      href={formData.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 hover:text-blue-600 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                      title="Test link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                {formData.meetingLink && !isValidGoogleMeetLink(formData.meetingLink) && (
                  <p className="text-xs text-yellow-600 mt-1">
                    <Info className="h-3 w-3 inline mr-1" />
                    Make sure this is a valid Google Meet link
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">How to use Google Meet:</h4>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Share the meeting link with your students after enrollment</li>
                  <li>Students can join the class by clicking the link at scheduled time</li>
                  <li>No software installation required - works in browser</li>
                  <li>Free for up to 60 minutes per session with 100 participants</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Pricing & Capacity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Pricing & Capacity
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discounted Price (₹)
                </label>
                <input
                  type="number"
                  name="discountPrice"
                  value={formData.discountPrice || ''}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Students
                </label>
                <input
                  type="number"
                  name="maxStudents"
                  value={formData.maxStudents}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Students
                </label>
                <input
                  type="number"
                  name="minStudents"
                  value={formData.minStudents}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Thumbnail */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Image className="h-5 w-5 mr-2" />
              Class Thumbnail
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail URL
              </label>
              <input
                type="url"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Add an image URL to make your class more appealing
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Class
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}