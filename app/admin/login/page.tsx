// app/admin/login/page.tsx - Email + password login UI with existing MessMass styling
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ColoredCard from '@/components/ColoredCard'

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
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password })
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        // WHAT: Use window.location instead of router.push to force full page reload
        // WHY: Ensures cookie is fully set in browser before middleware checks authentication
        window.location.href = '/admin'
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
      <ColoredCard accentColor="#6366f1" hoverable={false} className="login-card">
        {/* Logo/Icon Section */}
        <div className="login-header">
          <div className="admin-avatar login-icon">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="title login-title">
            MessMass Admin
          </h1>
          <p className="subtitle login-subtitle">
            Sign in with email and password to access the dashboard
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              name="email"
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input login-input"
              placeholder="admin or admin@messmass.com"
              disabled={loading}
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
              className="form-input login-input"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="login-error">
              <div className="login-error-content">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" className="login-error-icon">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="login-error-text">
                  {error}
                </span>
              </div>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="btn btn-primary w-full login-button"
          >
            {loading ? (
              <div className="login-loading">
                <div className="login-spinner"></div>
                Signing in...
              </div>
            ) : (
              <>🔐 Sign in to Admin</>
            )}
          </button>
        </form>

        {/* Back to Main App */}
        <div className="login-back">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="btn btn-small btn-secondary"
          >
            ← Back to MessMass
          </button>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p className="login-footer-text">
            MessMass Admin Panel<br />
            Secure Access Required
          </p>
        </div>
      </ColoredCard>
    </div>
  )
}
