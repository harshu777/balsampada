'use client';

import { motion } from 'framer-motion';
import AnimatedCard from '@/components/ui/AnimatedCard';
import AnimatedButton from '@/components/ui/AnimatedButton';
import AnimatedProgress from '@/components/ui/AnimatedProgress';
import AnimatedBadge from '@/components/ui/AnimatedBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ThemeToggle, { ThemeToggleCompact } from '@/components/ui/ThemeToggle';
import {
  StudyingIllustration,
  NoDataIllustration,
  SuccessIllustration,
  LearningIllustration,
  TrophyIllustration
} from '@/components/ui/Illustrations';
import {
  SparklesIcon,
  BookOpenIcon,
  AcademicCapIcon,
  StarIcon,
  HeartIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Component Showcase
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Modern UI components with animations and dark mode support
            </p>
          </motion.div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggleCompact />
            <ThemeToggle />
          </div>
        </div>

        {/* Animated Cards Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Animated Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedCard delay={0} gradient={true} gradientColors="from-blue-400 to-purple-600">
              <div className="p-6">
                <BookOpenIcon className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Interactive Learning</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Engaging lessons with real-time feedback and progress tracking.
                </p>
              </div>
            </AnimatedCard>

            <AnimatedCard delay={0.1} gradient={true} gradientColors="from-green-400 to-blue-600">
              <div className="p-6">
                <AcademicCapIcon className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Expert Teachers</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Learn from qualified instructors with years of experience.
                </p>
              </div>
            </AnimatedCard>

            <AnimatedCard delay={0.2} gradient={true} gradientColors="from-purple-400 to-pink-600">
              <div className="p-6">
                <StarIcon className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Achievements</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Earn badges and certificates as you complete courses.
                </p>
              </div>
            </AnimatedCard>
          </div>
        </section>

        {/* Animated Buttons Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Animated Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <AnimatedButton variant="primary" icon={<SparklesIcon className="w-5 h-5" />}>
              Primary Button
            </AnimatedButton>
            
            <AnimatedButton variant="gradient" icon={<HeartIcon className="w-5 h-5" />}>
              Gradient Button
            </AnimatedButton>
            
            <AnimatedButton variant="secondary">
              Secondary Button
            </AnimatedButton>
            
            <AnimatedButton variant="outline" size="lg">
              Outline Large
            </AnimatedButton>
            
            <AnimatedButton variant="ghost" size="sm">
              Ghost Small
            </AnimatedButton>
            
            <AnimatedButton variant="primary" loading={true}>
              Loading State
            </AnimatedButton>
          </div>
        </section>

        {/* Progress Bars Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Animated Progress</h2>
          <div className="space-y-6 max-w-2xl">
            <AnimatedProgress value={75} label="Course Progress" color="blue" />
            <AnimatedProgress value={60} label="Assignment Completion" color="green" />
            <AnimatedProgress value={90} label="Attendance" color="purple" />
            <AnimatedProgress value={45} label="Quiz Score" color="gradient" size="lg" />
          </div>
        </section>

        {/* Badges Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Animated Badges</h2>
          <div className="flex flex-wrap gap-3">
            <AnimatedBadge variant="primary" icon={<BookOpenIcon className="w-4 h-4" />}>
              5 New Lessons
            </AnimatedBadge>
            
            <AnimatedBadge variant="success" icon={<CheckCircleIcon className="w-4 h-4" />}>
              Completed
            </AnimatedBadge>
            
            <AnimatedBadge variant="warning" pulse={true}>
              Due Tomorrow
            </AnimatedBadge>
            
            <AnimatedBadge variant="danger" size="lg">
              3 Missed Classes
            </AnimatedBadge>
            
            <AnimatedBadge variant="info" rounded={false}>
              Beta Feature
            </AnimatedBadge>
            
            <AnimatedBadge variant="gradient">
              Premium
            </AnimatedBadge>
          </div>
        </section>

        {/* Loading Spinners Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Loading Spinners</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
              <LoadingSpinner variant="spinner" size="md" />
              <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">Spinner</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
              <LoadingSpinner variant="dots" size="md" />
              <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">Dots</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
              <LoadingSpinner variant="pulse" size="md" />
              <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">Pulse</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
              <LoadingSpinner variant="book" size="md" />
              <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">Book</p>
            </div>
          </div>
        </section>

        {/* Illustrations Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">SVG Illustrations</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg flex flex-col items-center">
              <StudyingIllustration className="w-32 h-32" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">Studying</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg flex flex-col items-center">
              <NoDataIllustration className="w-32 h-32" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">No Data</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg flex flex-col items-center">
              <SuccessIllustration className="w-32 h-32" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">Success</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg flex flex-col items-center">
              <TrophyIllustration className="w-32 h-32" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">Trophy</p>
            </div>
          </div>
          
          <div className="mt-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <LearningIllustration className="w-full h-64" />
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">Learning Illustration</p>
          </div>
        </section>

        {/* Dark Mode Demo Card */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Dark Mode Support</h2>
          <AnimatedCard>
            <div className="p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Automatic Dark Mode
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                All components automatically adapt to dark mode. Toggle the theme using the button in the top right corner to see the smooth transitions.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Light Mode</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Clean and bright interface</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Easy on the eyes at night</p>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </section>
      </div>
    </div>
  );
}