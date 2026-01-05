// app/admin/clear-session/page.tsx
// WHAT: Page to clear stale admin cookies from browser
// WHY: Help users recover from stuck login issues

'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ColoredCard from '@/components/ColoredCard'
import { apiPost } from '@/lib/apiClient'

export default function ClearSession() {
  const router = useRouter()
  const [cleared, setCleared] = useState(false)
  const [loading, setLoading] = useState(false)

  const clearCookies = async () => {
    setLoading(true)
    try {
      // WHAT: Use apiPost() for automatic CSRF token handling
      // WHY: Production middleware requires X-CSRF-Token header for POST requests
      await apiPost('/api/admin/clear-cookies', {})
      
      // Also clear any client-accessible cookies (shouldn't be any since httpOnly, but just in case)
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
      
      setCleared(true)
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/admin/login')
      }, 2000)
    } catch (error) {
      console.error('Error clearing cookies:', error)
      alert('Error clearing cookies. Please clear cookies manually in your browser.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="max-w-md mx-auto">
      <ColoredCard accentColor="#6366f1" hoverable={false} className="text-center">
        <div className="text-6xl mb-6">
          {cleared ? '✅' : '🔧'}
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {cleared ? 'Session Cleared!' : 'Clear Session'}
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          {cleared 
            ? 'Your session has been cleared. Redirecting to login...'
            : 'Having trouble logging in? Click below to clear your session and try again.'
          }
        </p>

        {!cleared && (
          <>
            <button
              onClick={clearCookies}
              disabled={loading}
              className={`btn btn-primary btn-full mb-4 ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {loading ? '🔄 Clearing...' : '🗑️ Clear Session & Retry Login'}
            </button>

            <button
              onClick={() => router.push('/admin/login')}
              className="btn btn-secondary btn-full"
            >
              ← Back to Login
            </button>
          </>
        )}
      </ColoredCard>
      </div>
    </div>
  )
}
