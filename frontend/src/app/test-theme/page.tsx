'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function TestThemePage() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Theme Test Page
          </h1>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Theme Info */}
          <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Theme Information
            </h2>
            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">Current Theme:</span> {theme}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">Resolved Theme:</span> {resolvedTheme}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">System Theme:</span> {systemTheme}
              </p>
            </div>
          </div>

          {/* Theme Switcher Buttons */}
          <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Manual Theme Switch
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => setTheme('light')}
                className={`w-full px-4 py-2 rounded-lg transition-colors ${
                  theme === 'light'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Light Mode
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`w-full px-4 py-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Dark Mode
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`w-full px-4 py-2 rounded-lg transition-colors ${
                  theme === 'system'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                System Mode
              </button>
            </div>
          </div>
        </div>

        {/* Color Samples */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Color Samples
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Background</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">bg-white / dark:bg-gray-950</p>
            </div>

            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Card</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">bg-gray-100 / dark:bg-gray-800</p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Accent</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">bg-blue-50 / dark:bg-blue-900/20</p>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">
              <p className="text-sm font-medium">Gradient</p>
              <p className="text-xs">Always colorful</p>
            </div>
          </div>

          {/* Text Samples */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Text Colors
            </h3>
            <p className="text-gray-900 dark:text-gray-100">
              Primary Text: text-gray-900 / dark:text-gray-100
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Secondary Text: text-gray-700 / dark:text-gray-300
            </p>
            <p className="text-gray-500 dark:text-gray-500">
              Muted Text: text-gray-500 / dark:text-gray-500
            </p>
            <p className="text-blue-600 dark:text-blue-400">
              Link Text: text-blue-600 / dark:text-blue-400
            </p>
          </div>

          {/* Interactive Elements */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Interactive Elements
            </h3>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Primary Button
              </button>
              <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                Secondary Button
              </button>
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                Outline Button
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Card Title</h4>
              <p className="text-gray-600 dark:text-gray-400">
                This is a card with proper dark mode styling.
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-lg">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Gradient Card</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Card with gradient background.
              </p>
            </div>

            <div className="p-6 bg-gray-100 dark:bg-gray-900 rounded-lg shadow-inner">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Inset Card</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Card with inner shadow effect.
              </p>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Debug: HTML class attribute
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 font-mono">
            {typeof document !== 'undefined' ? document.documentElement.className : 'SSR'}
          </p>
        </div>
      </div>
    </div>
  );
}