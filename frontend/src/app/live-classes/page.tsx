'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LiveClassesRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to unified schedule with live classes tab
    router.replace('/unified-schedule?tab=live');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to unified schedule...</p>
      </div>
    </div>
  );
}