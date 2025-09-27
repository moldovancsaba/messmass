// app/admin/login/page.tsx - Email + password login UI with existing MessMass styling
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/auth')
        const data = await response.json()
        if (response.ok && data.user) {
          router.push('/admin')
          return
        }
      } catch {
        // ignore
      }
      setCheckingAuth(false)
    }
    checkAuth()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        router.push('/admin')
      } else {
        setError(data.error || 'Invalid credentials')
      }
    } catch {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <div className="glass-card" style={{width: '100%', maxWidth: '420px', padding: '2rem'}}>
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
            Sign in with email and password to access the dashboard
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{marginBottom: '2rem'}}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              name="email"
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="admin or admin@messmass.com"
              disabled={loading}
              style={{ textAlign: 'center', fontSize: '1.05rem' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter your password"
              disabled={loading}
              style={{textAlign: 'center', fontSize: '1.05rem'}}
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
            disabled={loading || !email.trim() || !password.trim()}
            className="btn btn-primary w-full"
            style={{ marginBottom: '1rem' }}
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
              <>🔐 Sign in to Admin</>
            )}
          </button>
        </form>

        {/* Back to Main App */}
        <div style={{textAlign: 'center', marginBottom: '2rem'}}>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="btn btn-sm btn-secondary"
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
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
