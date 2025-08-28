// app/admin/login/page.tsx - Updated to use existing CSS classes
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Set admin session cookie
        document.cookie = `admin-session=${data.token}; path=/; secure; samesite=lax; max-age=${60 * 60 * 24 * 7}` // 7 days
        router.push('/admin')
      } else {
        setError(data.error || 'Invalid password')
      }
    } catch (_err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <div className="glass-card" style={{width: '100%', maxWidth: '400px', padding: '2rem'}}>
        {/* Logo/Icon Section */}
        <div style={{textAlign: 'center', marginBottom: '2rem'}}>
          <div className="admin-avatar" style={{margin: '0 auto 1.5rem', width: '64px', height: '64px'}}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="title" style={{fontSize: '2.5rem', marginBottom: '0.5rem'}}>
            MessMass Admin
          </h1>
          <p className="subtitle" style={{marginBottom: '2rem'}}>
            Enter admin password to access the dashboard
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{marginBottom: '2rem'}}>
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Admin Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter your admin password"
              disabled={loading}
              style={{textAlign: 'center', fontSize: '1.1rem'}}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="glass-card" style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '1rem',
              marginBottom: '1.5rem',
              borderRadius: '12px'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" style={{color: '#ef4444'}}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span style={{color: '#ef4444', fontWeight: '500', fontSize: '0.875rem'}}>
                  {error}
                </span>
              </div>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className={`btn btn-primary ${loading ? 'btn-large' : 'btn-large'}`}
            style={{width: '100%', marginBottom: '1rem'}}
          >
            {loading ? (
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Signing in...
              </div>
            ) : (
              <>
                🔐 Sign in to Admin
              </>
            )}
          </button>
        </form>

        {/* Back to Main App */}
        <div style={{textAlign: 'center', marginBottom: '2rem'}}>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="btn btn-secondary btn-small"
            style={{fontSize: '0.875rem'}}
          >
            ← Back to MessMass
          </button>
        </div>

        {/* Footer */}
        <div style={{textAlign: 'center', paddingTop: '1.5rem', borderTop: '1px solid rgba(107, 114, 128, 0.2)'}}>
          <p style={{color: 'var(--color-gray-500)', fontSize: '0.75rem', lineHeight: 1.5}}>
            MessMass Admin Panel<br />
            Secure Access Required
          </p>
        </div>
      </div>

      {/* Add spinning animation */}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}