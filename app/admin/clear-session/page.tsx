// app/admin/clear-session/page.tsx
// WHAT: Page to clear stale admin cookies from browser
// WHY: Help users recover from stuck login issues

'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ClearSession() {
  const router = useRouter()
  const [cleared, setCleared] = useState(false)
  const [loading, setLoading] = useState(false)

  const clearCookies = async () => {
    setLoading(true)
    try {
      // Call API to clear server-side cookie
      await fetch('/api/admin/clear-cookies', { method: 'POST' })
      
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '3rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>
          {cleared ? '✅' : '🔧'}
        </div>
        
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '1rem'
        }}>
          {cleared ? 'Session Cleared!' : 'Clear Session'}
        </h1>
        
        <p style={{
          color: '#6b7280',
          fontSize: '1.1rem',
          lineHeight: '1.6',
          marginBottom: '2rem'
        }}>
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
              style={{
                width: '100%',
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                marginBottom: '1rem'
              }}
            >
              {loading ? '🔄 Clearing...' : '🗑️ Clear Session & Retry Login'}
            </button>

            <button
              onClick={() => router.push('/admin/login')}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '12px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              ← Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  )
}
