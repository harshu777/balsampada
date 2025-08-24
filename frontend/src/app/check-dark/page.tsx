'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export default function CheckDarkPage() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [htmlClass, setHtmlClass] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const interval = setInterval(() => {
        setHtmlClass(document.documentElement.className);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [mounted]);

  if (!mounted) {
    return <div className="p-8">Loading theme...</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Dark Mode Debug</h1>
        
        <div className="p-4 border rounded-lg space-y-2">
          <p><strong>Current Theme:</strong> {theme}</p>
          <p><strong>Resolved Theme:</strong> {resolvedTheme}</p>
          <p><strong>System Theme:</strong> {systemTheme}</p>
          <p><strong>HTML Class:</strong> <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{htmlClass || '(none)'}</code></p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setTheme('light')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Set Light
          </button>
          <button 
            onClick={() => setTheme('dark')}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Set Dark
          </button>
          <button 
            onClick={() => setTheme('system')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Set System
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-white text-black">
            <h3 className="font-bold">Always Light</h3>
            <p>This box is always light (no dark: classes)</p>
          </div>
          
          <div className="p-4 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-white">
            <h3 className="font-bold">Responsive</h3>
            <p>This box changes with theme</p>
            <p className="text-sm mt-2">
              Light: white bg, black text<br/>
              Dark: gray-800 bg, white text
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded">
            Gray: Should be light gray in light mode, very dark in dark mode
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded">
            Blue: Should be light blue in light mode, dark blue in dark mode
          </div>
          <div className="p-3 bg-green-100 dark:bg-green-900 rounded">
            Green: Should be light green in light mode, dark green in dark mode
          </div>
        </div>

        <div className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded">
          <p className="text-gray-900 dark:text-gray-100">
            This text should be dark in light mode and light in dark mode.
          </p>
        </div>
      </div>
    </div>
  );
}