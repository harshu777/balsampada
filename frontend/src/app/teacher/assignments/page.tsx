'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
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
  };
  dueDate: string;
  totalMarks: number;
  submissions: Array<{
    _id: string;
    student: {
      name: string;
      email: string;
    };
    submittedAt: string;
    status: string;
    grade?: number;
  }>;
  createdAt: string;
}

export default function TeacherAssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<any>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/assignments/teacher');
      setAssignments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await api.delete(`/assignments/${assignmentId}`);
      toast.success('Assignment deleted successfully');
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to delete assignment');
    }
  };

  const handleGradeSubmit = async () => {
    if (!gradingSubmission || !grade) {
      toast.error('Please enter a grade');
      return;
    }

    try {
      await api.put(`/assignments/${selectedAssignment?._id}/submissions/${gradingSubmission._id}/grade`, {
        grade: parseFloat(grade),
        feedback
      });
      toast.success('Grade submitted successfully');
      setGradingSubmission(null);
      setGrade('');
      setFeedback('');
      fetchAssignments();
    } catch (error) {
      toast.error('Failed to submit grade');
    }
  };

  const getSubmissionStats = (assignment: Assignment) => {
    const total = assignment.submissions.length;
    const graded = assignment.submissions.filter(s => s.status === 'graded').length;
    const pending = assignment.submissions.filter(s => s.status === 'submitted').length;
    
    return { total, graded, pending };
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
            <p className="mt-2 text-gray-600">
              Manage and grade course assignments
            </p>
          </div>
          <button
            onClick={() => router.push('/teacher/assignments/create')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Assignment
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No assignments yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first assignment to get started
            </p>
            <button
              onClick={() => router.push('/teacher/assignments/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Assignment
            </button>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment) => {
                  const stats = getSubmissionStats(assignment);
                  return (
                    <tr key={assignment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.totalMarks} marks
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {assignment.course.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(assignment.dueDate)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {stats.total} submitted
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          {stats.graded > 0 && (
                            <span className="inline-flex items-center text-xs">
                              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                              {stats.graded} graded
                            </span>
                          )}
                          {stats.pending > 0 && (
                            <span className="inline-flex items-center text-xs">
                              <Clock className="h-3 w-3 text-yellow-500 mr-1" />
                              {stats.pending} pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedAssignment(assignment)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => router.push(`/teacher/assignments/${assignment._id}/edit`)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(assignment._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Assignment Details Modal */}
        {selectedAssignment && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedAssignment.title}
                    </h2>
                    <p className="text-gray-600">{selectedAssignment.course.title}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAssignment(null);
                      setGradingSubmission(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{selectedAssignment.description}</p>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Submissions</h3>
                  {selectedAssignment.submissions.length === 0 ? (
                    <p className="text-gray-600">No submissions yet</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedAssignment.submissions.map((submission) => (
                        <div key={submission._id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">
                                {submission.student.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {submission.student.email}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Submitted: {formatDate(submission.submittedAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              {submission.grade !== undefined ? (
                                <div>
                                  <p className="text-lg font-semibold text-gray-900">
                                    {submission.grade}/{selectedAssignment.totalMarks}
                                  </p>
                                  <span className="text-xs text-green-600">Graded</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setGradingSubmission(submission)}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                  Grade
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grading Form */}
                {gradingSubmission && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Grade Submission - {gradingSubmission.student.name}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Grade (out of {selectedAssignment.totalMarks})
                        </label>
                        <input
                          type="number"
                          value={grade}
                          onChange={(e) => setGrade(e.target.value)}
                          max={selectedAssignment.totalMarks}
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Feedback (optional)
                        </label>
                        <textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleGradeSubmit}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Submit Grade
                        </button>
                        <button
                          onClick={() => {
                            setGradingSubmission(null);
                            setGrade('');
                            setFeedback('');
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}