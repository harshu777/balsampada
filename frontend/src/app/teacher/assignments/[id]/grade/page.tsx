'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  UserIcon,
  ClockIcon,
  DocumentIcon,
  StarIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

interface Submission {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  submittedAt: string;
  attempt: number;
  content: string;
  files: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  status: string;
  isLate: boolean;
  grade?: {
    score: number;
    feedback: string;
    gradedBy: string;
    gradedAt: string;
  };
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  maxScore: number;
  dueDate: string;
  class: {
    _id: string;
    title: string;
  };
  submissions: Submission[];
}

export default function GradeAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [grading, setGrading] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  const fetchAssignment = async () => {
    try {
      const response = await api.get(`/assignments/${assignmentId}`);
      setAssignment(response.data.data);
      
      // Auto-select first ungraded submission
      const ungraded = response.data.data.submissions?.find((s: Submission) => !s.grade);
      if (ungraded) {
        setSelectedSubmission(ungraded);
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
      toast.error('Failed to load assignment');
      router.push('/teacher/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return;
    
    if (score < 0 || score > assignment!.maxScore) {
      toast.error(`Score must be between 0 and ${assignment!.maxScore}`);
      return;
    }

    setGrading(true);
    
    try {
      await api.post(`/assignments/${assignmentId}/grade`, {
        studentId: selectedSubmission.student._id,
        score,
        feedback
      });
      
      toast.success('Assignment graded successfully!');
      
      // Update local state
      setAssignment(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          submissions: prev.submissions.map(s => 
            s._id === selectedSubmission._id 
              ? { 
                  ...s, 
                  grade: { 
                    score, 
                    feedback, 
                    gradedBy: 'current-teacher-id',
                    gradedAt: new Date().toISOString()
                  },
                  status: 'graded'
                }
              : s
          )
        };
      });
      
      // Move to next ungraded submission
      const nextUngraded = assignment!.submissions.find(s => 
        s._id !== selectedSubmission._id && !s.grade
      );
      if (nextUngraded) {
        setSelectedSubmission(nextUngraded);
        setScore(0);
        setFeedback('');
      } else {
        setSelectedSubmission(null);
      }
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to grade assignment');
    } finally {
      setGrading(false);
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

  const gradedCount = assignment.submissions?.filter(s => s.grade).length || 0;
  const totalSubmissions = assignment.submissions?.length || 0;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Assignments
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
              <p className="text-gray-600 mt-1">{assignment.class.title}</p>
            </div>
            
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
              <div className="text-sm text-gray-600">Progress</div>
              <div className="text-lg font-semibold">
                {gradedCount}/{totalSubmissions} graded
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Submissions List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Submissions ({totalSubmissions})</h2>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {assignment.submissions?.map((submission) => (
                <div
                  key={submission._id}
                  onClick={() => setSelectedSubmission(submission)}
                  className={`p-3 rounded-lg cursor-pointer transition ${
                    selectedSubmission?._id === submission._id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                        {submission.student.avatar ? (
                          <img 
                            src={submission.student.avatar} 
                            alt="" 
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <UserIcon className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {submission.student.name}
                      </span>
                    </div>
                    
                    {submission.grade ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <ClockIcon className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </div>
                  
                  {submission.grade && (
                    <div className="text-xs text-gray-600 mt-1">
                      Score: {submission.grade.score}/{assignment.maxScore}
                    </div>
                  )}
                  
                  {submission.isLate && (
                    <div className="text-xs text-red-600 mt-1">Late</div>
                  )}
                </div>
              ))}
              
              {totalSubmissions === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <DocumentIcon className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No submissions yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Submission Details & Grading */}
          <div className="lg:col-span-3 space-y-6">
            {selectedSubmission ? (
              <>
                {/* Submission Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedSubmission.student.name}'s Submission
                    </h2>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {new Date(selectedSubmission.submittedAt).toLocaleString()}
                      </div>
                      <div>Attempt {selectedSubmission.attempt}</div>
                      {selectedSubmission.isLate && (
                        <span className="text-red-600 font-medium">Late</span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Answer</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedSubmission.content || 'No written answer provided.'}
                        </p>
                      </div>
                    </div>

                    {/* Files */}
                    {selectedSubmission.files.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Attachments</h3>
                        <div className="space-y-2">
                          {selectedSubmission.files.map((file, index) => (
                            <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                              <DocumentIcon className="h-5 w-5 text-gray-400 mr-3" />
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-900">{file.fileName}</span>
                                <p className="text-xs text-gray-500">
                                  {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <button className="text-blue-600 hover:text-blue-800 text-sm">
                                Download
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Grading Panel */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {selectedSubmission.grade ? 'Edit Grade' : 'Grade Submission'}
                  </h2>

                  <div className="space-y-4">
                    {/* Score */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Score (out of {assignment.maxScore})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={assignment.maxScore}
                        value={selectedSubmission.grade?.score || score}
                        onChange={(e) => setScore(Number(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>

                    {/* Feedback */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Feedback
                      </label>
                      <textarea
                        value={selectedSubmission.grade?.feedback || feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="Provide feedback to the student..."
                      />
                    </div>

                    {/* Submit Grade */}
                    {!selectedSubmission.grade && (
                      <div className="flex justify-end">
                        <button
                          onClick={handleGradeSubmission}
                          disabled={grading}
                          className="px-6 py-2 text-white rounded-lg transition hover:opacity-90 disabled:opacity-50"
                          style={{background: 'linear-gradient(to right, #82993D, #AC6CA1)'}}
                        >
                          {grading ? 'Grading...' : 'Submit Grade'}
                        </button>
                      </div>
                    )}

                    {/* Existing Grade Info */}
                    {selectedSubmission.grade && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                          <span className="font-medium text-green-800">Graded</span>
                        </div>
                        <div className="text-sm text-green-700">
                          <p>Score: {selectedSubmission.grade.score}/{assignment.maxScore}</p>
                          <p>Graded on: {new Date(selectedSubmission.grade.gradedAt).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a submission to grade
                </h3>
                <p className="text-gray-600">
                  Choose a submission from the list to view and grade it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}