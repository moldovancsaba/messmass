// WHAT: Redirect from old /admin/projects to new /admin/events
// WHY: Prevent 404s from bookmarks, external links, or old references
// HOW: Client-side redirect on mount

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectsRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Immediately redirect to new events page
    router.replace('/admin/events');
  }, [router]);
  
  // Show loading message during redirect
  return (
    <div className="loading-container">
      <div className="loading-card">
        <div className="text-4xl mb-4">📅</div>
        <div className="text-gray-600">Redirecting to Events...</div>
      </div>
    </div>
  );
}
