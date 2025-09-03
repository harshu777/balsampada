'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import PageLayout from '@/components/layout/PageLayout';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  BookOpen,
  Award,
  Briefcase,
  Clock,
  Calendar,
  MapPin,
  FileText
} from 'lucide-react';
import { BOARDS, BOARD_FEATURES, CLASS_TIMINGS } from '@/config/boards';

const schema = yup.object({
  // Personal Information
  name: yup.string().required('Full name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  phone: yup.string()
    .matches(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number')
    .required('Phone number is required'),
  
  // Professional Information
  qualification: yup.string().required('Qualification is required'),
  specialization: yup.string().required('Specialization is required'),
  experience: yup.string().required('Teaching experience is required'),
  currentOccupation: yup.string().required('Current occupation is required'),
  
  // Teaching Preferences
  boards: yup.array().min(1, 'Select at least one board').required('Board selection is required'),
  subjects: yup.array().min(1, 'Select at least one subject').required('Subject selection is required'),
  grades: yup.array().min(1, 'Select at least one grade').required('Grade selection is required'),
  
  // Availability
  preferredTimings: yup.array().min(1, 'Select at least one timing slot').required('Timing preference is required'),
  availability: yup.string().required('Availability is required'),
  
  // Additional Information
  bio: yup.string().max(500, 'Bio should not exceed 500 characters'),
  address: yup.string().required('Address is required'),
  teachingMode: yup.array().min(1, 'Select at least one teaching mode').required('Teaching mode is required'),
  
  // Documents
  resume: yup.mixed(),
  certificates: yup.mixed()
});

export default function RegisterTeacherPage() {
  const router = useRouter();
  const { register: registerUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    resolver: yupResolver(schema)
  });

  const watchBoards = watch('boards');

  const handleBoardSelection = (boardCode: string) => {
    const newBoards = selectedBoards.includes(boardCode)
      ? selectedBoards.filter(b => b !== boardCode)
      : [...selectedBoards, boardCode];
    
    setSelectedBoards(newBoards);
    setValue('boards', newBoards);
    
    // Update available subjects based on selected boards
    const subjects = new Set<any>();
    newBoards.forEach(board => {
      BOARDS[board as keyof typeof BOARDS]?.subjects?.forEach(subject => {
        subjects.add(JSON.stringify({ code: subject.code, name: subject.name, board }));
      });
    });
    setAvailableSubjects(Array.from(subjects).map(s => JSON.parse(s)));
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Prepare teacher-specific data
      const teacherData = {
        ...data,
        role: 'teacher',
        teachingInfo: {
          boards: data.boards,
          subjects: data.subjects,
          grades: data.grades,
          experience: data.experience,
          qualification: data.qualification,
          specialization: data.specialization,
          preferredTimings: data.preferredTimings,
          availability: data.availability,
          teachingMode: data.teachingMode
        }
      };

      await registerUser(teacherData);
      
      // Redirect to teacher dashboard after successful registration
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      alert(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const qualifications = [
    'B.Ed (Bachelor of Education)',
    'M.Ed (Master of Education)',
    'B.A. (Bachelor of Arts)',
    'M.A. (Master of Arts)',
    'B.Sc (Bachelor of Science)',
    'M.Sc (Master of Science)',
    'B.Tech/B.E.',
    'M.Tech/M.E.',
    'MBA',
    'PhD',
    'Other Professional Degree'
  ];

  const experienceOptions = [
    'Fresher (0-1 years)',
    '1-3 years',
    '3-5 years',
    '5-10 years',
    '10-15 years',
    '15+ years'
  ];

  const grades = ['4', '5', '6', '7', '8', '9', '10'];

  return (
    <PageLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <GraduationCap className="h-16 w-16 text-purple-600" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
            Teacher Registration
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Join our team of expert educators at Balsampada
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-purple-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="teacher@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="9876543210"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current Occupation *
                </label>
                <input
                  type="text"
                  {...register('currentOccupation')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., School Teacher, Private Tutor"
                />
                {errors.currentOccupation && (
                  <p className="mt-1 text-sm text-red-600">{errors.currentOccupation.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <input
                  type="password"
                  {...register('password')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Minimum 6 characters"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  {...register('confirmPassword')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Re-enter password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-purple-600" />
              Professional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Highest Qualification *
                </label>
                <select
                  {...register('qualification')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select Qualification</option>
                  {qualifications.map(qual => (
                    <option key={qual} value={qual}>{qual}</option>
                  ))}
                </select>
                {errors.qualification && (
                  <p className="mt-1 text-sm text-red-600">{errors.qualification.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Specialization *
                </label>
                <input
                  type="text"
                  {...register('specialization')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., Mathematics, Physics, English"
                />
                {errors.specialization && (
                  <p className="mt-1 text-sm text-red-600">{errors.specialization.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Teaching Experience *
                </label>
                <select
                  {...register('experience')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select Experience</option>
                  {experienceOptions.map(exp => (
                    <option key={exp} value={exp}>{exp}</option>
                  ))}
                </select>
                {errors.experience && (
                  <p className="mt-1 text-sm text-red-600">{errors.experience.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Availability *
                </label>
                <select
                  {...register('availability')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select Availability</option>
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="weekends">Weekends Only</option>
                  <option value="evenings">Evenings Only</option>
                  <option value="flexible">Flexible</option>
                </select>
                {errors.availability && (
                  <p className="mt-1 text-sm text-red-600">{errors.availability.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Teaching Preferences */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
              Teaching Preferences
            </h3>
            
            {/* Board Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Boards You Can Teach *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(BOARDS).map(([code, board]) => (
                  <label key={code} className="relative">
                    <input
                      type="checkbox"
                      value={code}
                      checked={selectedBoards.includes(code)}
                      onChange={() => handleBoardSelection(code)}
                      className="sr-only"
                    />
                    <div className={`
                      border-2 rounded-lg p-3 text-center cursor-pointer transition-all
                      ${selectedBoards.includes(code)
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-300 hover:border-purple-400'
                      }
                    `}>
                      <span className="font-medium">{code}</span>
                    </div>
                  </label>
                ))}
              </div>
              {errors.boards && (
                <p className="mt-1 text-sm text-red-600">{errors.boards.message}</p>
              )}
            </div>

            {/* Subject Selection */}
            {availableSubjects.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Subjects You Can Teach *
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {availableSubjects.map((subject, index) => (
                      <label key={index} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          value={subject.code}
                          {...register('subjects')}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm">
                          {subject.name} 
                          <span className="text-gray-500 ml-1">({subject.board})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                {errors.subjects && (
                  <p className="mt-1 text-sm text-red-600">{errors.subjects.message}</p>
                )}
              </div>
            )}

            {/* Grade Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Grades You Can Teach *
              </label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                {grades.map(grade => (
                  <label key={grade} className="relative">
                    <input
                      type="checkbox"
                      value={grade}
                      {...register('grades')}
                      className="sr-only"
                    />
                    <div className="border-2 rounded-lg p-2 text-center cursor-pointer hover:border-purple-400 transition-all">
                      <span className="font-medium">{grade}th</span>
                    </div>
                  </label>
                ))}
              </div>
              {errors.grades && (
                <p className="mt-1 text-sm text-red-600">{errors.grades.message}</p>
              )}
            </div>

            {/* Teaching Mode */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teaching Mode *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {['Online', 'Offline', 'Hybrid'].map(mode => (
                  <label key={mode} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={mode.toLowerCase()}
                      {...register('teachingMode')}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm">{mode}</span>
                  </label>
                ))}
              </div>
              {errors.teachingMode && (
                <p className="mt-1 text-sm text-red-600">{errors.teachingMode.message}</p>
              )}
            </div>

            {/* Preferred Timings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Teaching Timings *
              </label>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-2">Weekdays</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {CLASS_TIMINGS.weekday.morning.concat(CLASS_TIMINGS.weekday.evening).map(timing => (
                      <label key={timing} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          value={`weekday-${timing}`}
                          {...register('preferredTimings')}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm">{timing}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-2">Weekends</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {CLASS_TIMINGS.weekend.morning.concat(CLASS_TIMINGS.weekend.afternoon).map(timing => (
                      <label key={timing} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          value={`weekend-${timing}`}
                          {...register('preferredTimings')}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm">{timing}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              {errors.preferredTimings && (
                <p className="mt-1 text-sm text-red-600">{errors.preferredTimings.message}</p>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-purple-600" />
              Additional Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address *
                </label>
                <textarea
                  {...register('address')}
                  rows={2}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter your complete address"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Brief Bio / Teaching Philosophy
                </label>
                <textarea
                  {...register('bio')}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Tell us about your teaching approach and experience (max 500 characters)"
                  maxLength={500}
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Upload Resume (Optional)
                  </label>
                  <input
                    type="file"
                    {...register('resume')}
                    accept=".pdf,.doc,.docx"
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">PDF, DOC, DOCX (max 5MB)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Upload Certificates (Optional)
                  </label>
                  <input
                    type="file"
                    {...register('certificates')}
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">PDF, JPG, PNG (max 10MB total)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-purple-600 hover:text-purple-500">
                Sign in
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
    </PageLayout>
  );
}