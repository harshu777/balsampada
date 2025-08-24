'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function TestDarkMode() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Dark Mode Test Page</h1>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Theme Information</h2>
          <p>Current theme: <span className="font-mono">{theme}</span></p>
          <p>Resolved theme: <span className="font-mono">{resolvedTheme}</span></p>
          <p>HTML class: <span className="font-mono">{typeof document !== 'undefined' ? document.documentElement.className : 'N/A'}</span></p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setTheme('light')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
          >
            Light Mode
          </button>
          <button
            onClick={() => setTheme('dark')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
          >
            Dark Mode
          </button>
          <button
            onClick={() => setTheme('system')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
          >
            System Mode
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded border border-gray-300 dark:border-gray-600">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Light Mode Colors</h3>
            <p className="text-gray-600 dark:text-gray-400">This should be dark text on light background in light mode</p>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Dark Mode Colors</h3>
            <p className="text-gray-600 dark:text-gray-400">This should be light text on dark background in dark mode</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
            <p className="text-blue-900 dark:text-blue-100">Blue themed element</p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded">
            <p className="text-purple-900 dark:text-purple-100">Purple themed element</p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded">
            <p className="text-green-900 dark:text-green-100">Green themed element</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8 rounded-lg">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Gradient Background Test</h3>
          <p className="text-gray-600 dark:text-gray-400">This should have a light gradient in light mode and dark gradient in dark mode</p>
        </div>
      </div>
    </div>
  );
}