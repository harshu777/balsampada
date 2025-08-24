'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  FileText,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Download,
  Eye
} from 'lucide-react';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  course: {
    _id: string;
    title: string;
    teacher: {
      name: string;
    };
  };
  dueDate: string;
  totalMarks: number;
  instructions: string;
  attachments?: string[];
  submissions?: {
    _id: string;
    submittedAt: string;
    status: string;
    grade?: number;
    feedback?: string;
    submissionFile?: string;
  }[];
}

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/assignments/student');
      setAssignments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (assignmentId: string) => {
    if (!submissionFile && !submissionText) {
      toast.error('Please provide a submission');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (submissionFile) {
        formData.append('file', submissionFile);
      }
      if (submissionText) {
        formData.append('submissionText', submissionText);
      }

      await api.post(`/assignments/${assignmentId}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Assignment submitted successfully');
      setSelectedAssignment(null);
      setSubmissionFile(null);
      setSubmissionText('');
      fetchAssignments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatus = (assignment: Assignment) => {
    if (!assignment.submissions || assignment.submissions.length === 0) {
      return 'pending';
    }
    const submission = assignment.submissions[0];
    return submission.status;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case 'submitted':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex items-center">
            <Upload className="h-3 w-3 mr-1" />
            Submitted
          </span>
        );
      case 'graded':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Graded
          </span>
        );
      case 'late':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center">
            <XCircle className="h-3 w-3 mr-1" />
            Late
          </span>
        );
      default:
        return null;
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const status = getStatus(assignment);
    if (filter === 'all') return true;
    return status === filter;
  });

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
          <p className="mt-2 text-gray-600">
            View and submit your course assignments
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({assignments.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({assignments.filter(a => getStatus(a) === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === 'submitted'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Submitted ({assignments.filter(a => getStatus(a) === 'submitted').length})
          </button>
          <button
            onClick={() => setFilter('graded')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              filter === 'graded'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Graded ({assignments.filter(a => getStatus(a) === 'graded').length})
          </button>
        </div>

        {/* Assignments List */}
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No assignments found
            </h3>
            <p className="text-gray-600">
              {filter === 'all'
                ? "You don't have any assignments yet"
                : `No ${filter} assignments found`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => {
              const status = getStatus(assignment);
              const daysUntilDue = getDaysUntilDue(assignment.dueDate);
              const submission = assignment.submissions?.[0];

              return (
                <div
                  key={assignment._id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {assignment.title}
                        </h3>
                        {getStatusBadge(status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {assignment.course.title} • {assignment.course.teacher.name}
                      </p>
                      <p className="text-gray-700 mb-3">
                        {assignment.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Due: {formatDate(assignment.dueDate)}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {daysUntilDue > 0 ? `${daysUntilDue} days left` : 'Overdue'}
                        </span>
                        <span className="flex items-center">
                          Total Marks: {assignment.totalMarks}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submission Info */}
                  {submission && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">
                            Submitted: {formatDate(submission.submittedAt)}
                          </p>
                          {submission.grade !== undefined && (
                            <p className="text-lg font-semibold text-gray-900 mt-1">
                              Grade: {submission.grade}/{assignment.totalMarks}
                            </p>
                          )}
                          {submission.feedback && (
                            <p className="text-sm text-gray-700 mt-2">
                              Feedback: {submission.feedback}
                            </p>
                          )}
                        </div>
                        {submission.submissionFile && (
                          <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                            <Download className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => setSelectedAssignment(assignment)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                    {status === 'pending' && daysUntilDue > 0 && (
                      <button
                        onClick={() => setSelectedAssignment(assignment)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors flex items-center"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Submit Assignment
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Assignment Submission Modal */}
        {selectedAssignment && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedAssignment.title}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedAssignment.instructions || selectedAssignment.description}
                    </p>
                  </div>

                  {!selectedAssignment.submissions?.length && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Your Submission</h3>
                      <textarea
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        placeholder="Enter your answer here..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={6}
                      />
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Or upload a file
                        </label>
                        <input
                          type="file"
                          onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setSelectedAssignment(null);
                        setSubmissionFile(null);
                        setSubmissionText('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Close
                    </button>
                    {!selectedAssignment.submissions?.length && (
                      <button
                        onClick={() => handleSubmit(selectedAssignment._id)}
                        disabled={submitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {submitting ? 'Submitting...' : 'Submit Assignment'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}