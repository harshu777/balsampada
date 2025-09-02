'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  VideoCameraIcon,
  PlusIcon,
  XMarkIcon,
  LinkIcon,
  UserGroupIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { generateGoogleMeetLink } from '@/utils/meetingHelper';

interface Class {
  _id: string;
  title: string;
  enrolledStudents: string[];
}

interface ExtraClass {
  classId: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingLink: string;
  autoGenerateMeeting: boolean;
}

export default function ScheduleExtraClassPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ExtraClass>({
    classId: '',
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    meetingLink: '',
    autoGenerateMeeting: true
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (formData.autoGenerateMeeting && formData.title) {
      setFormData(prev => ({
        ...prev,
        meetingLink: generateGoogleMeetLink(formData.title)
      }));
    }
  }, [formData.autoGenerateMeeting, formData.title]);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes/teacher');
      setClasses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.classId) {
      toast.error('Please select a class');
      return;
    }

    if (!formData.meetingLink) {
      toast.error('Please provide a meeting link');
      return;
    }

    setSubmitting(true);
    try {
      // Create extra class session
      await api.post(`/classes/${formData.classId}/extra-session`, {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        meetingLink: formData.meetingLink
      });

      // Send notification to enrolled students
      const selectedClass = classes.find(c => c._id === formData.classId);
      if (selectedClass) {
        await api.post('/notifications/send', {
          classId: formData.classId,
          title: 'Extra Class Scheduled',
          message: `An extra class "${formData.title}" has been scheduled for ${new Date(formData.date).toLocaleDateString()} at ${formData.startTime}`,
          type: 'announcement'
        });
      }

      toast.success('Extra class scheduled successfully!');
      router.push('/teacher/classes');
    } catch (error: any) {
      console.error('Error scheduling extra class:', error);
      toast.error(error.response?.data?.message || 'Failed to schedule extra class');
    } finally {
      setSubmitting(false);
    }
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Schedule Extra Class</h1>
          <p className="mt-2 text-gray-600">
            Schedule an additional class or meeting for your students
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Class Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserGroupIcon className="w-5 h-5 mr-2" />
              Select Class
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                name="classId"
                value={formData.classId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a class</option>
                {classes.map(cls => (
                  <option key={cls._id} value={cls._id}>
                    {cls.title} ({cls.enrolledStudents.length} students)
                  </option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* Session Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <InformationCircleIcon className="w-5 h-5 mr-2" />
              Session Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Doubt Clearing Session, Extra Practice Class"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of what will be covered in this session"
                />
              </div>
            </div>
          </motion.div>

          {/* Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Schedule
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  max={`${new Date().getFullYear()}-12-31`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  min={formData.startTime}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </motion.div>

          {/* Meeting Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <VideoCameraIcon className="w-5 h-5 mr-2" />
              Meeting Setup
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="autoGenerateMeeting"
                  name="autoGenerateMeeting"
                  checked={formData.autoGenerateMeeting}
                  onChange={handleInputChange}
                  className="mt-1"
                />
                <label htmlFor="autoGenerateMeeting" className="text-sm">
                  <span className="font-medium text-gray-900">Auto-generate Google Meet link</span>
                  <p className="text-gray-500 text-xs mt-1">
                    We'll create a meeting link for you, or paste your own below
                  </p>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      required
                    />
                  </div>
                  {formData.meetingLink && (
                    <a
                      href={formData.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                      title="Test link"
                    >
                      <LinkIcon className="h-4 w-4 text-gray-600" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <InformationCircleIcon className="h-4 w-4 inline mr-1" />
                Students will receive a notification about this extra class and can join using the meeting link at the scheduled time.
              </p>
            </div>
          </motion.div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 text-white rounded-lg transition hover:opacity-90 disabled:opacity-50 flex items-center"
              style={{background: 'linear-gradient(to right, #82993D, #AC6CA1)'}}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scheduling...
                </>
              ) : (
                <>
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Schedule Extra Class
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}