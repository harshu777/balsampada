'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  BookOpen, Users, Star, DollarSign, Calendar, Clock, 
  Globe, Tag, ChevronRight, Edit, Eye, Trash2, Plus
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface ClassDetails {
  _id: string;
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
  discountPrice?: number;
  duration: number;
  totalLectures: number;
  status: string;
  enrolledStudents: any[];
  averageRating: number;
  totalReviews: number;
  teacher: {
    name: string;
    email: string;
  };
  modules: any[];
  prerequisites: string[];
  learningObjectives: string[];
  syllabusDescription?: string;
  createdAt: string;
  publishedAt?: string;
}

export default function TeacherClassView() {
  const params = useParams();
  const router = useRouter();
  const [classData, setClassData] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'students'>('overview');

  useEffect(() => {
    fetchClassDetails();
  }, [params.id]);

  const fetchClassDetails = async () => {
    try {
      const response = await api.get(`/classes/${params.id}`);
      setClassData(response.data.data);
    } catch (error) {
      console.error('Error fetching class:', error);
      toast.error('Failed to load class details');
      router.push('/teacher/classes');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      await api.put(`/classes/${params.id}/publish`);
      toast.success('Class published successfully');
      fetchClassDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to publish class');
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

  if (!classData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Class not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{classData.title}</h1>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  classData.status === 'published' 
                    ? 'bg-green-100 text-green-800'
                    : classData.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {classData.status}
                </span>
                <span>{classData.board} • {classData.standard} • {classData.subject}</span>
                <span>{classData.batch} Batch • {classData.academicYear}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/teacher/classes/${params.id}/edit`)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => router.push(`/teacher/classes/${params.id}/modules`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Manage Modules
              </button>
              {classData.status === 'draft' && (
                <button
                  onClick={handlePublish}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Publish
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Enrolled Students</p>
                <p className="text-2xl font-bold">{classData.enrolledStudents.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(classData.enrolledStudents.length * (classData.discountPrice || classData.price))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold">
                  {classData.averageRating > 0 ? classData.averageRating : 'N/A'}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Modules</p>
                <p className="text-2xl font-bold">{classData.modules.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('modules')}
                className={`py-2 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'modules'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Modules & Content
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`py-2 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'students'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Students
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-600">{classData.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Class Details</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Board:</dt>
                        <dd className="font-medium">{classData.board}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Standard:</dt>
                        <dd className="font-medium">{classData.standard}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Subject:</dt>
                        <dd className="font-medium">{classData.subject}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Medium:</dt>
                        <dd className="font-medium">{classData.medium}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Class Type:</dt>
                        <dd className="font-medium">{classData.classType}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Duration:</dt>
                        <dd className="font-medium">{classData.duration} hours</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Pricing</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Regular Price:</dt>
                        <dd className="font-medium">{formatCurrency(classData.price)}</dd>
                      </div>
                      {classData.discountPrice && (
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Discount Price:</dt>
                          <dd className="font-medium text-green-600">
                            {formatCurrency(classData.discountPrice)}
                          </dd>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Created:</dt>
                        <dd className="font-medium">{formatDate(classData.createdAt)}</dd>
                      </div>
                      {classData.publishedAt && (
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Published:</dt>
                          <dd className="font-medium">{formatDate(classData.publishedAt)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {classData.syllabusDescription && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Syllabus</h3>
                    <p className="text-gray-600">{classData.syllabusDescription}</p>
                  </div>
                )}

                {classData.prerequisites.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Prerequisites</h3>
                    <ul className="list-disc list-inside text-gray-600">
                      {classData.prerequisites.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {classData.learningObjectives.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Learning Objectives</h3>
                    <ul className="list-disc list-inside text-gray-600">
                      {classData.learningObjectives.map((obj, index) => (
                        <li key={index}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'modules' && (
              <div>
                {classData.modules.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No modules added yet</p>
                    <button
                      onClick={() => router.push(`/teacher/classes/${params.id}/edit`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add Modules
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {classData.modules.map((module, index) => (
                      <div key={module._id || index} className="border rounded-lg p-4">
                        <h4 className="font-semibold text-lg mb-2">
                          Module {index + 1}: {module.title}
                        </h4>
                        {module.description && (
                          <p className="text-gray-600 mb-3">{module.description}</p>
                        )}
                        {module.lessons && module.lessons.length > 0 && (
                          <div className="ml-4 space-y-2">
                            {module.lessons.map((lesson: any, lessonIndex: number) => (
                              <div key={lesson._id || lessonIndex} className="flex items-center gap-2 text-sm">
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                <span>{lesson.title}</span>
                                <span className="text-gray-500">({lesson.type})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'students' && (
              <div>
                {classData.enrolledStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No students enrolled yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Enrolled Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Progress
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {classData.enrolledStudents.map((student: any) => (
                          <tr key={student._id}>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  {student.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {formatDate(student.enrolledAt || classData.createdAt)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              In Progress
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}