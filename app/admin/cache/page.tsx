'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

/* WHAT: Cache Management Page
   WHY: Allow admins to clear server and browser caches to force fresh content
   HOW: Provides buttons to clear different cache types */

export default function CacheManagementPage() {
  const { user, loading } = useAdminAuth();
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center" style={{minHeight: '400px'}}>
        <div className="admin-card text-center">
          <div className="text-4xl mb-4">🗑️</div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const clearCache = async (type: 'build' | 'routes' | 'all' | 'browser') => {
    setClearing(true);
    setError(null);
    setResult(null);

    try {
      if (type === 'browser') {
        // Clear browser cache by forcing reload
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        }
        
        setResult({
          success: true,
          message: 'Browser cache cleared! Page will reload in 2 seconds...',
          details: { browserCache: 'Cleared successfully' }
        });

        // Force hard reload after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        // Clear server-side cache
        const response = await fetch('/api/admin/clear-cache', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
          cache: 'no-store'
        });

        const data = await response.json();

        if (data.success) {
          setResult(data);
        } else {
          setError(data.error || 'Failed to clear cache');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to clear cache');
    } finally {
      setClearing(false);
    }
  };

  const clearBrowserCacheManual = () => {
    alert(`To manually clear browser cache:

macOS:
• Chrome/Edge: Cmd + Shift + Delete
• Safari: Cmd + Option + E
• Firefox: Cmd + Shift + Delete

Windows:
• Chrome/Edge: Ctrl + Shift + Delete
• Firefox: Ctrl + Shift + Delete

Then select "Cached images and files" and click Clear.`);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="admin-card mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="section-title">🗑️ Cache Management</h1>
            <p className="section-subtitle">
              Clear server and browser caches to force fresh content
            </p>
          </div>
          <a href="/admin" className="btn btn-secondary">
            ← Back to Admin
          </a>
        </div>

        <div className="flex gap-2">
          <span className="badge badge-primary">System Tools</span>
          <span className="badge badge-secondary">Cache Control</span>
        </div>
      </div>

      {/* Cache Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Server Build Cache */}
        <div className="admin-card">
          <div className="text-4xl mb-4">🏭️</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Server Cache Revalidation
          </h3>
          <p className="text-gray-600 mb-2">
            Revalidates Next.js server cache. Works on both local and production (Vercel).
          </p>
          <p className="text-xs text-gray-500 mb-4">
            💡 Note: Physical cache file deletion only works locally, not on serverless platforms.
          </p>
          <button
            onClick={() => clearCache('build')}
            disabled={clearing}
            className="btn btn-primary btn-full"
          >
            {clearing ? '🔄 Revalidating...' : '♻️ Revalidate Server Cache'}
          </button>
        </div>

        {/* Server Routes Cache */}
        <div className="admin-card">
          <div className="text-4xl mb-4">🔄</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Routes Cache
          </h3>
          <p className="text-gray-600 mb-4">
            Revalidates all routes. Use this when you've updated content and want it to show immediately.
          </p>
          <button
            onClick={() => clearCache('routes')}
            disabled={clearing}
            className="btn btn-primary btn-full"
          >
            {clearing ? '🔄 Revalidating...' : '♻️ Revalidate Routes'}
          </button>
        </div>

        {/* Browser Cache */}
        <div className="admin-card">
          <div className="text-4xl mb-4">🌐</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Browser Cache
          </h3>
          <p className="text-gray-600 mb-4">
            Clears your browser's cache and forces a hard reload. This only affects YOUR browser.
          </p>
          <button
            onClick={() => clearCache('browser')}
            disabled={clearing}
            className="btn btn-secondary btn-full"
          >
            {clearing ? '🔄 Clearing...' : '🌐 Clear Browser Cache'}
          </button>
        </div>

        {/* Clear All */}
        <div className="admin-card" style={{borderLeft: '4px solid var(--mm-color-error-500)'}}>
          <div className="text-4xl mb-4">💥</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Clear Everything
          </h3>
          <p className="text-gray-600 mb-4">
            Nuclear option: Clears all server caches. Use when nothing else works.
          </p>
          <button
            onClick={() => {
              if (confirm('Clear ALL server caches? This will affect all users.')) {
                clearCache('all');
              }
            }}
            disabled={clearing}
            className="btn btn-danger btn-full"
          >
            {clearing ? '🔄 Clearing...' : '💥 Clear All Server Caches'}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="admin-card mb-6" style={{borderLeft: '4px solid var(--mm-color-success-500)'}}>
          <div className="flex items-start gap-4">
            <div className="text-4xl">✅</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
              <p className="text-gray-600 mb-4">{result.message}</p>
              {result.details && (
                <div className="bg-gray-100 p-4 rounded">
                  <pre className="text-sm">{JSON.stringify(result.details, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="admin-card mb-6" style={{borderLeft: '4px solid var(--mm-color-error-500)'}}>
          <div className="flex items-start gap-4">
            <div className="text-4xl">❌</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
              <p className="text-error">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Instructions */}
      <div className="admin-card">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📚 Manual Cache Clearing</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-gray-800 mb-2">Browser Cache (All Users)</h4>
            <p className="text-gray-600 mb-2">
              Users can manually clear their browser cache using keyboard shortcuts:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li><strong>Chrome/Edge (Mac):</strong> Cmd + Shift + Delete</li>
              <li><strong>Chrome/Edge (Windows):</strong> Ctrl + Shift + Delete</li>
              <li><strong>Safari:</strong> Cmd + Option + E</li>
              <li><strong>Firefox:</strong> Cmd/Ctrl + Shift + Delete</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-800 mb-2">Hard Reload (Quick Fix)</h4>
            <p className="text-gray-600 mb-2">
              For a quick refresh without clearing all cache:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li><strong>Mac:</strong> Cmd + Shift + R</li>
              <li><strong>Windows:</strong> Ctrl + Shift + R or Ctrl + F5</li>
            </ul>
          </div>

          <button
            onClick={clearBrowserCacheManual}
            className="btn btn-secondary"
          >
            📋 Show Instructions
          </button>
        </div>
      </div>
    </div>
  );
}
