'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  DocumentIcon,
  CloudArrowUpIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  instructions: string;
  dueDate: string;
  maxScore: number;
  maxAttempts: number;
  allowLateSubmission: boolean;
  class: {
    _id: string;
    title: string;
  };
  submissions: Array<{
    student: string;
    submittedAt: string;
    attempt: number;
    content: string;
    status: string;
    grade?: {
      score: number;
      feedback: string;
    };
  }>;
}

export default function SubmitAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  
  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  const fetchAssignment = async () => {
    try {
      const response = await api.get(`/assignments/${assignmentId}`);
      setAssignment(response.data.data);
    } catch (error) {
      console.error('Error fetching assignment:', error);
      toast.error('Failed to load assignment');
      router.push('/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && files.length === 0) {
      toast.error('Please add content or attach files');
      return;
    }

    setSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('content', content);
      
      // Handle file uploads
      const fileData = [];
      for (const file of files) {
        fileData.push({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          // In a real implementation, you'd upload the file and get the URL
          fileUrl: URL.createObjectURL(file)
        });
      }
      
      formData.append('files', JSON.stringify(fileData));
      
      await api.post(`/assignments/${assignmentId}/submit`, {
        content,
        files: fileData
      });
      
      toast.success('Assignment submitted successfully!');
      router.push('/assignments');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit assignment');
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

  if (!assignment) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-600">Assignment not found</h2>
        </div>
      </DashboardLayout>
    );
  }

  const dueDate = new Date(assignment.dueDate);
  const isOverdue = dueDate < new Date();
  const currentSubmission = assignment.submissions?.find(s => s.student === 'current-user-id'); // You'd get actual user ID
  const canSubmit = currentSubmission ? currentSubmission.attempt < assignment.maxAttempts : true;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Assignments
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
          <p className="text-gray-600 mt-1">{assignment.class.title}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assignment Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assignment Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment Details</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">Description</h3>
                  <p className="text-gray-600 mt-1">{assignment.description}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900">Instructions</h3>
                  <p className="text-gray-600 mt-1 whitespace-pre-wrap">{assignment.instructions}</p>
                </div>
              </div>
            </motion.div>

            {/* Submission Form */}
            {canSubmit && (!isOverdue || assignment.allowLateSubmission) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit Assignment</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Answer/Content
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={6}
                      placeholder="Write your answer or solution here..."
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attach Files (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <div>
                        <label className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-500">Choose files</span>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.txt,.jpg,.png,.zip"
                          />
                        </label>
                        <p className="text-gray-500">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        PDF, DOC, TXT, Images up to 10MB each
                      </p>
                    </div>

                    {/* Selected Files */}
                    {files.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <DocumentIcon className="h-5 w-5 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">{file.name}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 text-white rounded-lg transition hover:opacity-90 disabled:opacity-50"
                      style={{background: 'linear-gradient(to right, #82993D, #AC6CA1)'}}
                    >
                      {submitting ? 'Submitting...' : 'Submit Assignment'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Previous Submission */}
            {currentSubmission && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Submission</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      currentSubmission.status === 'graded' 
                        ? 'bg-green-100 text-green-800'
                        : currentSubmission.status === 'submitted'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {currentSubmission.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-600">Submitted:</span>
                    <span className="text-sm text-gray-900 ml-2">
                      {new Date(currentSubmission.submittedAt).toLocaleString()}
                    </span>
                  </div>
                  
                  {currentSubmission.grade && (
                    <div>
                      <span className="text-sm text-gray-600">Grade:</span>
                      <span className="text-sm text-gray-900 ml-2 font-medium">
                        {currentSubmission.grade.score}/{assignment.maxScore}
                      </span>
                    </div>
                  )}
                  
                  {currentSubmission.grade?.feedback && (
                    <div>
                      <span className="text-sm text-gray-600">Feedback:</span>
                      <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded">
                        {currentSubmission.grade.feedback}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Due Date */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center mb-4">
                <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="font-medium text-gray-900">Due Date</h3>
              </div>
              
              <p className={`text-sm ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                {dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString()}
              </p>
              
              {isOverdue && (
                <div className="flex items-center mt-2 text-red-600">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  <span className="text-xs">Past due date</span>
                </div>
              )}
            </motion.div>

            {/* Assignment Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="font-medium text-gray-900 mb-4">Assignment Info</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Score:</span>
                  <span className="text-gray-900 font-medium">{assignment.maxScore} pts</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Attempts:</span>
                  <span className="text-gray-900 font-medium">{assignment.maxAttempts}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Late Submission:</span>
                  <span className="text-gray-900 font-medium">
                    {assignment.allowLateSubmission ? 'Allowed' : 'Not Allowed'}
                  </span>
                </div>
                
                {currentSubmission && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Attempts:</span>
                    <span className="text-gray-900 font-medium">
                      {currentSubmission.attempt}/{assignment.maxAttempts}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Status Alerts */}
            {!canSubmit && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-orange-50 border border-orange-200 rounded-xl p-4"
              >
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-2" />
                  <span className="text-sm text-orange-800">
                    Maximum attempts reached
                  </span>
                </div>
              </motion.div>
            )}

            {currentSubmission?.status === 'graded' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-green-50 border border-green-200 rounded-xl p-4"
              >
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm text-green-800">
                    Assignment graded
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}