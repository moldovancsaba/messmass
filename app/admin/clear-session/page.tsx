// app/admin/clear-session/page.tsx
// WHAT: Page to clear stale admin cookies from browser
// WHY: Help users recover from stuck login issues

'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ColoredCard from '@/components/ColoredCard'
import { apiPost } from '@/lib/apiClient'
import styles from './page.module.css'

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
      <div className={styles.wrapper}>
        <ColoredCard
          accentColor="var(--mm-chart-indigo)"
          hoverable={false}
          className={styles.card}
        >
          <div className={styles.icon}>
            {cleared ? '✅' : '🔧'}
          </div>

          <h1 className={styles.title}>
            {cleared ? 'Session Cleared!' : 'Clear Session'}
          </h1>

          <p className={styles.description}>
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
                className={`btn btn-primary btn-full ${styles.primaryAction} ${loading ? styles.buttonDisabled : styles.buttonEnabled}`}
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
