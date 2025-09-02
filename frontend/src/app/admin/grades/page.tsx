'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  BookOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  Users,
  UserPlus,
  Settings
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/layouts/DashboardLayout';

interface Grade {
  _id: string;
  name: string;
  board: string;
  academicYear: string;
  medium: string;
  description?: string;
  enrollmentPrice: number;
  discountPrice?: number;
  maxStudents: number;
  enrolledCount: number;
  displayName: string;
  subjects: Subject[];
  isActive: boolean;
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  teachers: {
    teacher: {
      _id: string;
      name: string;
      email: string;
    };
    isPrimary: boolean;
    specialization?: string;
  }[];
  isActive: boolean;
}

export default function AdminGradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);

  const [gradeFormData, setGradeFormData] = useState({
    name: '',
    board: '',
    medium: 'English',
    description: '',
    enrollmentPrice: 0,
    discountPrice: 0,
    maxStudents: 100
  });

  const [subjectFormData, setSubjectFormData] = useState({
    name: '',
    code: '',
    description: '',
    gradeId: ''
  });

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const response = await api.get('/grades');
      setGrades(response.data.data);
    } catch (error) {
      toast.error('Error fetching grades');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await api.post('/grades', gradeFormData);
      toast.success('Grade created successfully!');
      setGrades([...grades, response.data.data]);
      setShowGradeModal(false);
      resetGradeForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error creating grade');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await api.post('/subjects', subjectFormData);
      toast.success('Subject created successfully!');
      
      // Update the grade's subjects
      setGrades(grades.map(grade => 
        grade._id === subjectFormData.gradeId 
          ? { ...grade, subjects: [...grade.subjects, response.data.data] }
          : grade
      ));
      
      setShowSubjectModal(false);
      resetSubjectForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error creating subject');
    }
  };

  const resetGradeForm = () => {
    setGradeFormData({
      name: '',
      board: '',
      medium: 'English',
      description: '',
      enrollmentPrice: 0,
      discountPrice: 0,
      maxStudents: 100
    });
    setEditingGrade(null);
  };

  const resetSubjectForm = () => {
    setSubjectFormData({
      name: '',
      code: '',
      description: '',
      gradeId: ''
    });
  };

  const openSubjectModal = (grade: Grade) => {
    setSubjectFormData({ ...subjectFormData, gradeId: grade._id });
    setSelectedGrade(grade);
    setShowSubjectModal(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Grades & Subjects Management</h1>
            <p className="text-gray-600">Manage school structure with grades, subjects, and teacher assignments</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowGradeModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Grade
          </motion.button>
        </div>

        {/* Grades Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {grades.map((grade) => (
            <motion.div
              key={grade._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{grade.name}</h3>
                    <p className="text-sm text-gray-600">{grade.board} • {grade.medium}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  grade.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {grade.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Academic Year:</span>
                  <span className="font-medium">{grade.academicYear}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Enrolled Students:</span>
                  <span className="font-medium">{grade.enrolledCount} / {grade.maxStudents}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Subjects:</span>
                  <span className="font-medium">{grade.subjects?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Fee:</span>
                  <span className="font-medium">₹{grade.enrollmentPrice}</span>
                </div>
              </div>

              {/* Subjects List */}
              {grade.subjects && grade.subjects.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Subjects:</h4>
                  <div className="space-y-1">
                    {grade.subjects.slice(0, 3).map((subject) => (
                      <div key={subject._id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{subject.name}</span>
                        <span className="text-xs text-gray-500">
                          {subject.teachers.length} teacher{subject.teachers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                    {grade.subjects.length > 3 && (
                      <p className="text-xs text-gray-500">+{grade.subjects.length - 3} more subjects</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => openSubjectModal(grade)}
                  className="flex-1 bg-green-100 text-green-700 py-2 px-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-200 transition-colors text-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  Add Subject
                </button>
                <button className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors text-sm">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {grades.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No grades found</h3>
            <p className="text-gray-600 mb-6">Create your first grade to get started</p>
            <button
              onClick={() => setShowGradeModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Grade
            </button>
          </div>
        )}

        {/* Create Grade Modal */}
        {showGradeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg max-w-md w-full"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Grade</h2>
                
                <form onSubmit={handleCreateGrade} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Grade *</label>
                      <select
                        required
                        value={gradeFormData.name}
                        onChange={(e) => setGradeFormData({ ...gradeFormData, name: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Grade</option>
                        {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(grade => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Board *</label>
                      <select
                        required
                        value={gradeFormData.board}
                        onChange={(e) => setGradeFormData({ ...gradeFormData, board: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Board</option>
                        {['CBSE', 'ICSE', 'State Board', 'IB', 'Cambridge', 'NIOS', 'Other'].map(board => (
                          <option key={board} value={board}>{board}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Medium</label>
                    <select
                      value={gradeFormData.medium}
                      onChange={(e) => setGradeFormData({ ...gradeFormData, medium: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Regional">Regional</option>
                      <option value="Bilingual">Bilingual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={gradeFormData.description}
                      onChange={(e) => setGradeFormData({ ...gradeFormData, description: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter grade description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment Fee</label>
                      <input
                        type="number"
                        min="0"
                        value={gradeFormData.enrollmentPrice}
                        onChange={(e) => setGradeFormData({ ...gradeFormData, enrollmentPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Students</label>
                      <input
                        type="number"
                        min="1"
                        value={gradeFormData.maxStudents}
                        onChange={(e) => setGradeFormData({ ...gradeFormData, maxStudents: parseInt(e.target.value) || 100 })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Grade
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowGradeModal(false);
                        resetGradeForm();
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Create Subject Modal */}
        {showSubjectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg max-w-md w-full"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Add Subject to {selectedGrade?.displayName}
                </h2>
                
                <form onSubmit={handleCreateSubject} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                    <select
                      required
                      value={subjectFormData.name}
                      onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Subject</option>
                      {[
                        'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Environmental Studies',
                        'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Geography', 'Civics',
                        'Economics', 'Accountancy', 'Business Studies', 'Sanskrit', 'French', 'German',
                        'General Knowledge', 'Reasoning', 'Physical Education', 'Arts', 'Music', 'Other'
                      ].map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject Code *</label>
                    <input
                      type="text"
                      required
                      value={subjectFormData.code}
                      onChange={(e) => setSubjectFormData({ ...subjectFormData, code: e.target.value.toUpperCase() })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., MATH9, PHY10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={subjectFormData.description}
                      onChange={(e) => setSubjectFormData({ ...subjectFormData, description: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter subject description"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Subject
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSubjectModal(false);
                        resetSubjectForm();
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}