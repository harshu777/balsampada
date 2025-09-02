'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, Users, ArrowRight, BookOpen, School } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';

export default function RegisterPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);

  const handleRoleSelection = (role: 'student' | 'teacher') => {
    setSelectedRole(role);
    // Navigate to role-specific registration
    if (role === 'student') {
      router.push('/register-student');
    } else {
      router.push('/register-teacher');
    }
  };

  return (
    <PageLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <GraduationCap className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="mt-6 text-4xl font-extrabold text-gray-900">
            Join Balsampada Tuition Classes
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Excellence in Education for Grades 4-10 | All Boards
          </p>
          <div className="mt-4 flex justify-center space-x-2">
            {['IB', 'IGCSE', 'ICSE', 'CBSE', 'SSC'].map((board) => (
              <span key={board} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {board}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Select Your Role to Continue
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Registration Card */}
            <div 
              onClick={() => handleRoleSelection('student')}
              className="group relative bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all cursor-pointer hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-blue-600 rounded-full group-hover:bg-blue-700 transition-colors">
                  <School className="h-12 w-12 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900">
                  Register as Student
                </h3>
                
                <p className="text-gray-600">
                  Join our tuition classes for comprehensive learning
                </p>
                
                <ul className="text-sm text-gray-600 space-y-2 text-left">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    All boards (IB, IGCSE, ICSE, CBSE, SSC)
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    Grades 4th to 10th
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    Live tuitions & doubt clearing
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    Progress tracking & reports
                  </li>
                </ul>
                
                <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center group-hover:bg-blue-700">
                  <span>Continue as Student</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Teacher Registration Card */}
            <div 
              onClick={() => handleRoleSelection('teacher')}
              className="group relative bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border-2 border-purple-200 hover:border-purple-400 transition-all cursor-pointer hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-purple-600 rounded-full group-hover:bg-purple-700 transition-colors">
                  <Users className="h-12 w-12 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900">
                  Register as Teacher
                </h3>
                
                <p className="text-gray-600">
                  Join our team of expert educators
                </p>
                
                <ul className="text-sm text-gray-600 space-y-2 text-left">
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">✓</span>
                    Teach multiple boards & subjects
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">✓</span>
                    Flexible batch timings
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">✓</span>
                    Create & manage study materials
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-600 mr-2">✓</span>
                    Track student performance
                  </li>
                </ul>
                
                <button className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center group-hover:bg-purple-700">
                  <span>Continue as Teacher</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">1000+</p>
                <p className="text-sm text-gray-600">Students Enrolled</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">50+</p>
                <p className="text-sm text-gray-600">Expert Teachers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">95%</p>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
            </div>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">

            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </span>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white py-6 px-4 shadow-xl rounded-lg sm:px-10">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Why Choose Balsampada?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">All Subjects</p>
              <p className="text-xs text-gray-600">Complete curriculum coverage</p>
            </div>
            <div className="text-center">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Small Batches</p>
              <p className="text-xs text-gray-600">Personalized attention</p>
            </div>
            <div className="text-center">
              <GraduationCap className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Board Focus</p>
              <p className="text-xs text-gray-600">Exam-oriented preparation</p>
            </div>
            <div className="text-center">
              <School className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Regular Tests</p>
              <p className="text-xs text-gray-600">Continuous assessment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageLayout>
  );
}