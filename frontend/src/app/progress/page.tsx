'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  BookOpenIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface ClassProgress {
  classId: string;
  className: string;
  subject: string;
  teacher: string;
  totalLessons: number;
  completedLessons: number;
  totalAssignments: number;
  submittedAssignments: number;
  averageGrade: number;
  attendance: number;
  lastActivity: string;
  nextDeadline?: {
    title: string;
    dueDate: string;
  };
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedDate?: string;
  progress?: number;
}

export default function ProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classProgress, setClassProgress] = useState<ClassProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalClasses: 0,
    averageProgress: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    averageGrade: 0,
    attendanceRate: 0
  });

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from API
      const [overallResponse, enrollmentsResponse] = await Promise.all([
        api.get('/progress/overall'),
        api.get('/enrollments/my-enrollments')
      ]);

      const overallData = overallResponse.data.data;
      const enrollmentsData = enrollmentsResponse.data.data || [];

      // Get progress for each enrolled class
      const progressPromises = enrollmentsData
        .filter((e: any) => e.class && e.class._id)
        .map(async (enrollment: any) => {
          try {
            const progressResponse = await api.get(`/progress/class/${enrollment.class._id}`);
            const progressData = progressResponse.data.data;
            
            return {
              classId: enrollment.class._id,
              className: enrollment.class.title,
              subject: enrollment.class.subject || 'General',
              teacher: enrollment.class.teacher?.name || 'Teacher',
              totalLessons: progressData.progress.totalMaterials || 0,
              completedLessons: progressData.progress.completedLessons || 0,
              totalAssignments: progressData.grades.assignments.total || 0,
              submittedAssignments: progressData.grades.assignments.completed || 0,
              averageGrade: progressData.grades.assignments.averageScore || 0,
              attendance: progressData.attendance.percentage || 0,
              lastActivity: progressData.progress.lastAccessedAt || new Date().toISOString()
            };
          } catch (error) {
            console.error(`Error fetching progress for class ${enrollment.class._id}:`, error);
            return {
              classId: enrollment.class._id,
              className: enrollment.class.title,
              subject: enrollment.class.subject || 'General', 
              teacher: enrollment.class.teacher?.name || 'Teacher',
              totalLessons: 0,
              completedLessons: 0,
              totalAssignments: 0,
              submittedAssignments: 0,
              averageGrade: 0,
              attendance: 0,
              lastActivity: new Date().toISOString()
            };
          }
        });

      const progressResults = await Promise.all(progressPromises);

      // Set the real data
      setClassProgress(progressResults);
      setOverallStats({
        totalClasses: overallData.totalClasses || 0,
        averageProgress: overallData.averageProgress || 0,
        totalHoursStudied: Math.floor(overallData.totalTimeSpent / 60) || 0,
        completedCourses: overallData.completedClasses || 0,
        currentStreak: 0, // This could be calculated based on daily activity
        averageGrade: overallData.averageGrade || 0
      });

      // Generate dynamic achievements based on real progress data
      const achievements: Achievement[] = [
        {
          id: '1',
          title: 'First Steps',
          description: 'Enrolled in your first class',
          icon: 'star',
          earnedDate: progressResults.length > 0 ? new Date().toISOString() : undefined,
          progress: progressResults.length > 0 ? 100 : 0
        },
        {
          id: '2',
          title: 'Assignment Starter',
          description: 'Submit your first assignment',
          icon: 'document',
          earnedDate: progressResults.some(p => p.submittedAssignments > 0) ? new Date().toISOString() : undefined,
          progress: progressResults.some(p => p.submittedAssignments > 0) ? 100 : 0
        },
        {
          id: '3',
          title: 'High Achiever',
          description: 'Maintain 80%+ average grade',
          icon: 'trophy',
          earnedDate: overallData.averageGrade >= 80 ? new Date().toISOString() : undefined,
          progress: Math.min((overallData.averageGrade / 80) * 100, 100)
        },
        {
          id: '4',
          title: 'Dedicated Student',
          description: 'Complete 10 lessons across all classes',
          icon: 'book',
          earnedDate: progressResults.reduce((sum, p) => sum + p.completedLessons, 0) >= 10 ? new Date().toISOString() : undefined,
          progress: Math.min((progressResults.reduce((sum, p) => sum + p.completedLessons, 0) / 10) * 100, 100)
        }
      ];

      setAchievements(achievements);

    } catch (error) {
      console.error('Error fetching progress data:', error);
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return '#82993D';
    if (percentage >= 60) return '#AC6CA1';
    if (percentage >= 40) return '#DA528C';
    return '#E18DB7';
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return past.toLocaleDateString();
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

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Progress</h1>
          <p className="mt-2 text-gray-600">
            Track your learning journey and achievements
          </p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.totalClasses}</p>
              </div>
              <AcademicCapIcon className="h-8 w-8" style={{color: '#82993D'}} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(overallStats.averageProgress)}%
                </p>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8" style={{color: '#AC6CA1'}} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assignments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overallStats.completedAssignments}/{overallStats.totalAssignments}
                </p>
              </div>
              <DocumentTextIcon className="h-8 w-8" style={{color: '#DA528C'}} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Grade</p>
                <p className={`text-2xl font-bold ${getGradeColor(overallStats.averageGrade)}`}>
                  {Math.round(overallStats.averageGrade)}%
                </p>
              </div>
              <StarIcon className="h-8 w-8" style={{color: '#E18DB7'}} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(overallStats.attendanceRate)}%
                </p>
              </div>
              <CalendarIcon className="h-8 w-8" style={{color: '#6C4225'}} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-sm p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Achievements</p>
                <p className="text-2xl font-bold">
                  {achievements.filter(a => a.earnedDate).length}
                </p>
              </div>
              <TrophyIcon className="h-8 w-8" />
            </div>
          </motion.div>
        </div>

        {/* Class Progress Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {classProgress.map((progress, index) => {
            const progressPercentage = (progress.completedLessons / progress.totalLessons) * 100;
            const assignmentPercentage = (progress.submittedAssignments / progress.totalAssignments) * 100;
            
            return (
              <motion.div
                key={progress.classId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{progress.className}</h3>
                    <p className="text-sm text-gray-600">{progress.teacher}</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: '#82993D20',
                      color: '#82993D'
                    }}>
                    {progress.subject}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Lessons Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Lessons</span>
                      <span className="font-medium">
                        {progress.completedLessons}/{progress.totalLessons}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${progressPercentage}%`,
                          backgroundColor: getProgressColor(progressPercentage)
                        }}
                      />
                    </div>
                  </div>

                  {/* Assignments Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Assignments</span>
                      <span className="font-medium">
                        {progress.submittedAssignments}/{progress.totalAssignments}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${assignmentPercentage}%`,
                          backgroundColor: getProgressColor(assignmentPercentage)
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Grade</p>
                    <p className={`text-xl font-bold ${getGradeColor(progress.averageGrade)}`}>
                      {progress.averageGrade}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Attendance</p>
                    <p className="text-xl font-bold text-gray-900">{progress.attendance}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Progress</p>
                    <p className="text-xl font-bold" style={{color: getProgressColor(progressPercentage)}}>
                      {Math.round(progressPercentage)}%
                    </p>
                  </div>
                </div>

                {progress.nextDeadline && (
                  <div className="p-3 bg-yellow-50 rounded-lg mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="text-sm text-gray-700">
                          {progress.nextDeadline.title}
                        </span>
                      </div>
                      <span className="text-xs text-yellow-600 font-medium">
                        Due {new Date(progress.nextDeadline.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-xs text-gray-500">
                    Last activity: {formatTimeAgo(progress.lastActivity)}
                  </span>
                  <button
                    onClick={() => router.push(`/classes/${progress.classId}`)}
                    className="text-sm font-medium hover:underline"
                    style={{color: '#82993D'}}
                  >
                    View Details →
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Achievements Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Achievements</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-xl border-2 ${
                  achievement.earnedDate 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center mb-3">
                  {achievement.earnedDate ? (
                    <TrophyIcon className="h-12 w-12 text-yellow-500" />
                  ) : (
                    <div className="relative h-12 w-12">
                      <CircularProgressbar
                        value={achievement.progress || 0}
                        styles={buildStyles({
                          pathColor: '#82993D',
                          textColor: '#82993D',
                          trailColor: '#e5e7eb'
                        })}
                      />
                    </div>
                  )}
                </div>
                
                <h3 className="font-medium text-gray-900 text-center mb-1">
                  {achievement.title}
                </h3>
                <p className="text-xs text-gray-600 text-center mb-2">
                  {achievement.description}
                </p>
                
                {achievement.earnedDate ? (
                  <p className="text-xs text-green-600 text-center font-medium">
                    Earned {new Date(achievement.earnedDate).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 text-center">
                    {achievement.progress}% Complete
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}