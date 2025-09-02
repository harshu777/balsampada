'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  Mail,
  Phone,
  BookOpen,
  Award,
  TrendingUp,
  Calendar,
  Eye
} from 'lucide-react';

interface Student {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    lastLogin?: string;
  };
  enrollmentDate: string;
  enrolledClasses?: Array<{
    _id: string;
    title: string;
    progress: number;
  }>;
  progress: {
    percentageComplete: number;
    completedLessons: number;
    totalLessons: number;
  };
  assignments: {
    submitted: number;
    graded: number;
    averageGrade: number;
  };
  lastActivity?: string;
}

interface Class {
  _id: string;
  title: string;
  enrolledStudents: any[];
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedClass]);

  const fetchData = async () => {
    try {
      // Fetch teacher's classes
      const classesResponse = await api.get('/classes/teacher');
      setClasses(classesResponse.data.data || []);

      // Fetch real students from the API
      let studentsData: Student[] = [];
      if (selectedClass === 'all') {
        // Get all students from all teacher's classes
        const studentsResponse = await api.get('/enrollments/teacher/students');
        studentsData = studentsResponse.data.data || [];
      } else {
        // Get students from specific class
        const studentsResponse = await api.get(`/enrollments/classes/${selectedClass}/students`);
        studentsData = studentsResponse.data.data || [];
      }
      
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 70) return 'text-yellow-600';
    return 'text-red-600';
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
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage your students' progress
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => {
                    const lastActivity = new Date(s.lastActivity || 0);
                    const today = new Date();
                    return lastActivity.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.length > 0 
                    ? Math.round(students.reduce((acc, s) => acc + s.progress.percentageComplete, 0) / students.length)
                    : 0}%
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Grade</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.length > 0
                    ? Math.round(students.reduce((acc, s) => acc + s.assignments.averageGrade, 0) / students.length)
                    : 0}%
                </p>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.title}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedClass('all');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Students Table */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No students found
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedClass !== 'all'
                ? "Try adjusting your filters"
                : "No students enrolled in your classes yet"}
            </p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className={getProgressColor(student.progress.percentageComplete)}>
                              {student.progress.percentageComplete}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                student.progress.percentageComplete >= 80
                                  ? 'bg-green-600'
                                  : student.progress.percentageComplete >= 50
                                  ? 'bg-yellow-600'
                                  : 'bg-red-600'
                              }`}
                              style={{ width: `${student.progress.percentageComplete}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {student.progress.completedLessons}/{student.progress.totalLessons} lessons
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {student.assignments.submitted} submitted
                      <br />
                      <span className="text-xs text-gray-500">
                        {student.assignments.graded} graded
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-lg font-semibold ${getGradeColor(student.assignments.averageGrade)}`}>
                        {student.assignments.averageGrade}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {student.lastActivity ? formatDate(student.lastActivity) : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Student Details Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedStudent.user.name}
                    </h2>
                    <p className="text-gray-600">{selectedStudent.user.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-700">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {selectedStudent.user.email}
                      </div>
                      {selectedStudent.user.phone && (
                        <div className="flex items-center text-gray-700">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedStudent.user.phone}
                        </div>
                      )}
                      <div className="flex items-center text-gray-700">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        Enrolled {formatDate(selectedStudent.enrollmentDate)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Academic Performance</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Class Progress:</span>
                        <span className={`ml-2 font-semibold ${getProgressColor(selectedStudent.progress.percentageComplete)}`}>
                          {selectedStudent.progress.percentageComplete}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Assignments Submitted:</span>
                        <span className="ml-2 font-semibold">
                          {selectedStudent.assignments.submitted}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Average Grade:</span>
                        <span className={`ml-2 font-semibold ${getGradeColor(selectedStudent.assignments.averageGrade)}`}>
                          {selectedStudent.assignments.averageGrade}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}