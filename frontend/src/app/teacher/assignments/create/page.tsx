'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  AcademicCapIcon,
  PaperClipIcon,
  CloudArrowUpIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface Class {
  _id: string;
  title: string;
  subject: string;
  standard?: string;
}

interface StudentGroup {
  _id: string;
  name: string;
  students: string[];
  class: string;
  color: string;
}

interface Student {
  _id: string;
  name: string;
  email: string;
}

interface Assignment {
  title: string;
  description: string;
  classId: string;
  dueDate: string;
  dueTime: string;
  totalMarks: number;
  instructions: string;
  attachments: File[];
  questions: Question[];
  allowLateSubmission: boolean;
  latePenalty?: number;
  visibility: 'enrolled' | 'specific';
  groupId?: string;
  specificStudents?: string[];
}

interface Question {
  id: string;
  question: string;
  type: 'text' | 'multiple-choice' | 'file-upload';
  marks: number;
  options?: string[];
  correctAnswer?: string;
}

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignment, setAssignment] = useState<Assignment>({
    title: '',
    description: '',
    classId: '',
    dueDate: '',
    dueTime: '23:59',
    totalMarks: 100,
    instructions: '',
    attachments: [],
    questions: [],
    allowLateSubmission: false,
    latePenalty: 0,
    visibility: 'enrolled',
    groupId: '',
    specificStudents: []
  });
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: '',
    question: '',
    type: 'text',
    marks: 10,
    options: ['', '', '', '']
  });
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (assignment.classId) {
      fetchGroupsAndStudents(assignment.classId);
    }
  }, [assignment.classId]);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes/teacher');
      setClasses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to fetch classes');
    }
  };

  const fetchGroupsAndStudents = async (classId: string) => {
    try {
      // Fetch groups for this class
      const groupsResponse = await api.get(`/student-groups?classId=${classId}`);
      setGroups(groupsResponse.data.data || []);
      
      // Fetch enrolled students for this class
      const enrollmentsResponse = await api.get(`/enrollments/classes/${classId}/students`);
      const enrolledStudents = enrollmentsResponse.data.data?.map((enrollment: any) => enrollment.student) || [];
      setStudents(enrolledStudents);
    } catch (error: any) {
      console.error('Error fetching groups and students:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAssignment(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newFiles]
      }));
      toast.success(`${newFiles.length} file(s) added`);
    }
  };

  const removeAttachment = (index: number) => {
    setAssignment(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const addQuestion = () => {
    if (!currentQuestion.question || currentQuestion.marks <= 0) {
      toast.error('Please enter a valid question and marks');
      return;
    }

    const newQuestion = {
      ...currentQuestion,
      id: Date.now().toString()
    };

    setAssignment(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    // Reset form
    setCurrentQuestion({
      id: '',
      question: '',
      type: 'text',
      marks: 10,
      options: ['', '', '', '']
    });
    setShowQuestionForm(false);
    toast.success('Question added');
  };

  const removeQuestion = (id: string) => {
    setAssignment(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  };

  const calculateTotalMarks = () => {
    return assignment.questions.reduce((sum, q) => sum + q.marks, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assignment.title || !assignment.classId || !assignment.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (assignment.questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    try {
      setLoading(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', assignment.title);
      formData.append('description', assignment.description);
      formData.append('classId', assignment.classId);
      formData.append('dueDate', `${assignment.dueDate}T${assignment.dueTime}`);
      formData.append('totalMarks', calculateTotalMarks().toString());
      formData.append('instructions', assignment.instructions);
      formData.append('questions', JSON.stringify(assignment.questions));
      formData.append('allowLateSubmission', assignment.allowLateSubmission.toString());
      if (assignment.latePenalty) {
        formData.append('latePenalty', assignment.latePenalty.toString());
      }
      formData.append('visibility', assignment.visibility);
      if (assignment.groupId) {
        formData.append('groupId', assignment.groupId);
      }
      if (assignment.specificStudents && assignment.specificStudents.length > 0) {
        formData.append('specificStudents', JSON.stringify(assignment.specificStudents));
      }

      // Add attachments
      assignment.attachments.forEach(file => {
        formData.append('attachments', file);
      });

      // Create the assignment
      await api.post(`/assignments/class/${assignment.classId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Assignment created successfully!');
      router.push('/teacher/assignments');
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Assignment</h1>
          <p className="mt-2 text-gray-600">
            Create a new assignment for your students
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  value={assignment.title}
                  onChange={(e) => setAssignment(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Chapter 5 Problem Set"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class *
                </label>
                <select
                  value={assignment.classId}
                  onChange={(e) => setAssignment(prev => ({ 
                    ...prev, 
                    classId: e.target.value,
                    groupId: '',
                    specificStudents: []
                  }))}
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
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={assignment.description}
                onChange={(e) => setAssignment(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Brief description of the assignment..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={assignment.dueDate}
                  onChange={(e) => setAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  max={`${new Date().getFullYear()}-12-31`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Time *
                </label>
                <input
                  type="time"
                  value={assignment.dueTime}
                  onChange={(e) => setAssignment(prev => ({ ...prev, dueTime: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Assignment Visibility */}
          {assignment.classId && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment Visibility</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="enrolled"
                      checked={assignment.visibility === 'enrolled'}
                      onChange={(e) => setAssignment(prev => ({ 
                        ...prev, 
                        visibility: 'enrolled',
                        groupId: '',
                        specificStudents: []
                      }))}
                      className="mr-2"
                    />
                    <span>All enrolled students</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="specific"
                      checked={assignment.visibility === 'specific'}
                      onChange={(e) => setAssignment(prev => ({ 
                        ...prev, 
                        visibility: 'specific'
                      }))}
                      className="mr-2"
                    />
                    <span>Specific group or students</span>
                  </label>
                </div>
                
                {assignment.visibility === 'specific' && (
                  <div className="ml-6 space-y-4">
                    {groups.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select a Group</label>
                        <div className="grid gap-2 md:grid-cols-2">
                          {groups.map((group) => (
                            <div
                              key={group._id}
                              onClick={() => setAssignment(prev => ({
                                ...prev,
                                groupId: group._id,
                                specificStudents: []
                              }))}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                assignment.groupId === group._id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: group.color }}
                                />
                                <span className="font-medium">{group.name}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {group.students.length} students
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {!assignment.groupId && students.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Or Select Individual Students</label>
                        <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                          {students.map((student) => (
                            <label
                              key={student._id}
                              className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-50"
                            >
                              <input
                                type="checkbox"
                                checked={assignment.specificStudents?.includes(student._id) || false}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setAssignment(prev => ({
                                      ...prev,
                                      specificStudents: [...(prev.specificStudents || []), student._id]
                                    }));
                                  } else {
                                    setAssignment(prev => ({
                                      ...prev,
                                      specificStudents: (prev.specificStudents || []).filter(id => id !== student._id)
                                    }));
                                  }
                                }}
                                className="rounded"
                              />
                              <span className="text-sm">
                                {student.name} ({student.email})
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h2>
            <textarea
              value={assignment.instructions}
              onChange={(e) => setAssignment(prev => ({ ...prev, instructions: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Provide detailed instructions for completing this assignment..."
            />
          </div>

          {/* Questions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Total Marks: <span className="font-bold" style={{color: '#82993D'}}>
                    {calculateTotalMarks()}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuestionForm(true)}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition flex items-center"
                  style={{background: 'linear-gradient(to right, #82993D, #AC6CA1)'}}
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Question
                </button>
              </div>
            </div>

            {/* Question Form */}
            {showQuestionForm && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 border-2 border-dashed rounded-lg"
                style={{borderColor: '#82993D'}}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Type
                    </label>
                    <select
                      value={currentQuestion.type}
                      onChange={(e) => setCurrentQuestion(prev => ({ 
                        ...prev, 
                        type: e.target.value as Question['type']
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="text">Text Answer</option>
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="file-upload">File Upload</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question
                    </label>
                    <textarea
                      value={currentQuestion.question}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Enter your question..."
                    />
                  </div>

                  {currentQuestion.type === 'multiple-choice' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Options
                      </label>
                      {currentQuestion.options?.map((option, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(currentQuestion.options || [])];
                              newOptions[index] = e.target.value;
                              setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder={`Option ${index + 1}`}
                          />
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={currentQuestion.correctAnswer === index.toString()}
                            onChange={() => setCurrentQuestion(prev => ({ 
                              ...prev, 
                              correctAnswer: index.toString() 
                            }))}
                            className="h-4 w-4"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marks
                    </label>
                    <input
                      type="number"
                      value={currentQuestion.marks}
                      onChange={(e) => setCurrentQuestion(prev => ({ 
                        ...prev, 
                        marks: parseInt(e.target.value) || 0 
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="100"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuestionForm(false);
                        setCurrentQuestion({
                          id: '',
                          question: '',
                          type: 'text',
                          marks: 10,
                          options: ['', '', '', '']
                        });
                      }}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition"
                      style={{backgroundColor: '#82993D'}}
                    >
                      Add Question
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Questions List */}
            {assignment.questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No questions added yet</p>
                <p className="text-sm">Click "Add Question" to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignment.questions.map((q, index) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-500">
                            Q{index + 1}
                          </span>
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {q.type.replace('-', ' ')}
                          </span>
                          <span className="px-2 py-1 text-xs rounded-full"
                            style={{backgroundColor: '#82993D20', color: '#82993D'}}>
                            {q.marks} marks
                          </span>
                        </div>
                        <p className="text-gray-900">{q.question}</p>
                        {q.type === 'multiple-choice' && q.options && (
                          <div className="mt-2 space-y-1">
                            {q.options.filter(opt => opt).map((opt, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                <span className={`h-4 w-4 rounded-full border-2 ${
                                  q.correctAnswer === i.toString() 
                                    ? 'border-green-500 bg-green-500' 
                                    : 'border-gray-300'
                                }`}>
                                  {q.correctAnswer === i.toString() && (
                                    <CheckIcon className="h-3 w-3 text-white" />
                                  )}
                                </span>
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <label className="cursor-pointer">
                <span className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                PDF, DOC, XLS, PPT, Images up to 10MB each
              </p>
            </div>

            {assignment.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {assignment.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <PaperClipIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-700">
                    Allow Late Submission
                  </label>
                  <p className="text-sm text-gray-500">
                    Students can submit after the due date with penalty
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={assignment.allowLateSubmission}
                  onChange={(e) => setAssignment(prev => ({ 
                    ...prev, 
                    allowLateSubmission: e.target.checked 
                  }))}
                  className="h-5 w-5 rounded text-blue-600"
                />
              </div>

              {assignment.allowLateSubmission && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Late Penalty (% per day)
                  </label>
                  <input
                    type="number"
                    value={assignment.latePenalty}
                    onChange={(e) => setAssignment(prev => ({ 
                      ...prev, 
                      latePenalty: parseInt(e.target.value) || 0 
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                    placeholder="e.g., 10"
                  />
                </motion.div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/teacher/assignments')}
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
                  Creating...
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Create Assignment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}