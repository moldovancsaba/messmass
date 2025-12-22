// app/admin/register/page.tsx
// WHAT: User registration page with auto-assignment of 'guest' role
// WHY: Enable self-service user registration, start with minimal permissions
// HOW: Registration form → API endpoint → auto-login → redirect to /admin/help

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ColoredCard from '@/components/ColoredCard'
import Image from 'next/image'

export default function AdminRegister() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)

  // WHAT: Check if already authenticated
  // WHY: Redirect logged-in users away from registration
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // WHAT: Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          password,
        })
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        // WHAT: Use window.location to force full page reload with new session
        // WHY: Ensures cookie is fully set before middleware checks authentication
        window.location.href = '/admin/help'
      } else {
        setError(data.error || 'Registration failed. Please try again.')
      }
    } catch {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return null // Prevent flicker while checking auth
  }

  return (
    <div className="app-container">
      <ColoredCard accentColor="#10b981" hoverable={false} className="login-card">
        {/* Logo/Icon Section */}
        <div className="login-header">
          <div className="login-logo-container">
            <Image src="/messmass-logo.png" alt="MessMass" className="login-logo" width={48} height={48} priority />
          </div>
          <h1 className="title login-title">
            Create Your Account
          </h1>
          <p className="subtitle login-subtitle">
            Register to access MessMass documentation and request elevated permissions
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="login-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input login-input"
              placeholder="Enter your full name"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input login-input"
              placeholder="you@example.com"
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input login-input"
              placeholder="At least 8 characters"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input login-input"
              placeholder="Re-enter your password"
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

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading || !email.trim() || !name.trim() || !password.trim() || !confirmPassword.trim()}
            className="btn btn-primary w-full login-button"
          >
            {loading ? (
              <div className="login-loading">
                <div className="login-spinner"></div>
                Creating account...
              </div>
            ) : (
              <>✨ Create Account</>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="login-back" style={{ marginTop: '1rem', textAlign: 'center' }}>
          <p style={{ marginBottom: '0.5rem', color: 'var(--mm-gray-600)', fontSize: 'var(--mm-font-size-sm)' }}>
            Already have an account?
          </p>
          <button
            type="button"
            onClick={() => router.push('/admin/login')}
            className="btn btn-small btn-secondary"
          >
            Sign in instead
          </button>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p className="login-footer-text">
            After registration, you'll start as a <strong>Guest</strong> with access to documentation.<br />
            Contact a superadmin to request elevated permissions.
          </p>
        </div>
      </ColoredCard>
    </div>
  )
}
