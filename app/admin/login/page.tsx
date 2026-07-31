// app/admin/login/page.tsx - SSO-only login (DoneIsBetter). Local email/password
// login was removed -- see SSO_EMAIL_UNIFICATION_PLAN.md Phase 4 follow-up.
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ColoredCard from '@/components/ColoredCard'
import Image from 'next/image'
import styles from './page.module.css'

export default function AdminLogin() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [ssoConfigured, setSsoConfigured] = useState(false)

  // Check if already authenticated and whether SSO is configured
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [authRes, ssoRes] = await Promise.all([
          fetch('/api/admin/auth'),
          fetch('/api/auth/sso/config'),
        ])
        const authData = await authRes.json()
        if (authRes.ok && authData.user) {
          router.push('/admin')
          return
        }
        const ssoData = await ssoRes.json().catch(() => ({}))
        setSsoConfigured(Boolean(ssoData?.ssoEnabled))
      } catch {
        // ignore
      }
      setCheckingAuth(false)
    }
    checkAuth()
  }, [router])

  // Read URL params for SSO redirect reasons and errors
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const reason = params.get('reason')
    const err = params.get('error')
    if (reason === 'sso_required') {
      setError('Please sign in with DoneIsBetter to access the dashboard.')
    } else if (err === 'no_access') {
      setError('Your account does not have access to {messmass} yet. Contact an admin to request access.')
    } else if (err === 'no_account') {
      setError('No {messmass} account for this identity yet. Contact an admin to request access.')
    } else if (err === 'invalid_sso' || err === 'session_expired' || err === 'auth_failed') {
      setError('Sign-in session expired or invalid. Please try again.')
    } else if (err === 'missing_token' || err === 'missing_code') {
      setError('SSO did not return a token. Please try again.')
    } else if (err === 'sso_not_configured') {
      setError('SSO is not configured. Contact an administrator.')
    } else if (err === 'permission_check_failed') {
      setError('Could not verify your access with SSO. Please try again.')
    } else if (err) {
      setError('Sign-in failed. Please try again.')
    }
  }, [])

  return (
    <div className="app-container">
      <ColoredCard accentColor="#6366f1" hoverable={false} className="login-card">
        {/* Logo/Icon Section */}
        <div className="login-header">
          <div className="login-logo-container">
            <Image src="/messmass-logo.png" alt="{messmass}" className="login-logo" width={48} height={48} priority />
          </div>
          <h1 className="title login-title">
            {'{messmass}'} Admin
          </h1>
          <p className="subtitle login-subtitle">
            Sign in with your DoneIsBetter account to access the dashboard
          </p>
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

        {!checkingAuth && (
          ssoConfigured ? (
            <div className={`form-group ${styles.ssoBlock}`}>
              <a
                href="/api/auth/sso/login"
                className={`btn btn-primary w-full ${styles.ssoButton}`}
              >
                Sign in with DoneIsBetter
              </a>
            </div>
          ) : (
            <div className="login-error">
              <div className="login-error-content">
                <span className="login-error-text">
                  SSO is not configured for this environment. Contact an administrator.
                </span>
              </div>
            </div>
          )
        )}

        {/* Back to Main App */}
        <div className="login-back">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="btn btn-small btn-secondary"
          >
            ← Back to {'{messmass}'}
          </button>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p className="login-footer-text">
            {'{messmass}'} Admin Panel<br />
            Secure Access Required
          </p>
        </div>
      </ColoredCard>
    </div>
  )
}
