// lib/shareables/auth/LoginForm.tsx
// Reusable login form component with glass-morphism styling

'use client'

import { useState } from 'react'
import { LoginCredentials, LoginResponse, AuthConfig, DEFAULT_AUTH_CONFIG } from './types'
import { authenticateUser } from './passwordAuth'
import { setSessionCookie } from './session'

/**
 * Login Form Component Props
 * 
 * Configuration interface for the LoginForm component.
 * Allows customization of behavior, styling, and callbacks.
 */
export interface LoginFormProps {
  // Callback Functions
  onLoginSuccess?: (response: LoginResponse) => void | Promise<void>
  onLoginError?: (error: string) => void
  onRedirect?: (url: string) => void
  
  // Configuration
  config?: Partial<AuthConfig>
  adminPassword?: string
  
  // Styling & Content
  title?: string
  subtitle?: string
  logoElement?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  
  // Behavior
  autoRedirect?: boolean
  redirectUrl?: string
  showBackButton?: boolean
  backButtonText?: string
  backButtonUrl?: string
  
  // Form Options
  placeholder?: string
  buttonText?: string
  loadingText?: string
}

/**
 * MessMass LoginForm Component
 * 
 * A beautiful, reusable login form with glass-morphism styling.
 * Extracted from MessMass admin login for use in other projects.
 * 
 * Features:
 * - Glass-morphism design with backdrop blur
 * - Responsive layout for all screen sizes
 * - Built-in error handling and loading states
 * - Configurable styling and behavior
 * - TypeScript support with full type safety
 * - Accessibility features (ARIA labels, keyboard navigation)
 * - Session management integration
 * 
 * Usage:
 * ```tsx
 * <LoginForm 
 *   onLoginSuccess={(response) => console.log('Logged in!', response.user)}
 *   onLoginError={(error) => console.error('Login failed:', error)}
 *   title="My App Login"
 *   adminPassword="mySecretPassword"
 * />
 * ```
 */
export default function LoginForm({
  onLoginSuccess,
  onLoginError,
  onRedirect,
  config = {},
  adminPassword,
  title = "Admin Login",
  subtitle = "Enter admin password to access the dashboard",
  logoElement,
  className = "",
  style = {},
  autoRedirect = true,
  redirectUrl = "/admin",
  showBackButton = true,
  backButtonText = "← Back to Main",
  backButtonUrl = "/",
  placeholder = "Enter your admin password",
  buttonText = "🔐 Sign In",
  loadingText = "Signing in..."
}: LoginFormProps) {
  
  // Component state
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /**
   * Handle form submission
   * 
   * Processes login form submission with validation and error handling.
   * Includes automatic session management and optional redirection.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setError('')
    setLoading(true)

    try {
      // Create login credentials
      const credentials: LoginCredentials = { password }
      
      // Attempt authentication
      const response = await authenticateUser(credentials, {
        adminPassword,
        enableBruteForceProtection: config.enableBruteForceProtection,
        bruteForceDelayMs: 1000
      })

      if (response.success && response.token) {
        // Set session cookie
        setSessionCookie(response.token, config)
        
        // Call success callback
        if (onLoginSuccess) {
          await onLoginSuccess(response)
        }
        
        // Handle redirect
        if (autoRedirect) {
          const targetUrl = redirectUrl || config.redirectAfterLogin || DEFAULT_AUTH_CONFIG.redirectAfterLogin
          
          if (onRedirect) {
            onRedirect(targetUrl)
          } else if (typeof window !== 'undefined') {
            window.location.href = targetUrl
          }
        }
        
      } else {
        // Handle authentication failure
        const errorMessage = response.error || response.message || 'Authentication failed'
        setError(errorMessage)
        
        if (onLoginError) {
          onLoginError(errorMessage)
        }
      }
      
    } catch (err) {
      // Handle unexpected errors
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      
      if (onLoginError) {
        onLoginError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle back button click
   * 
   * Navigates back to the specified URL or calls custom redirect handler.
   */
  const handleBackClick = () => {
    if (onRedirect) {
      onRedirect(backButtonUrl)
    } else if (typeof window !== 'undefined') {
      window.location.href = backButtonUrl
    }
  }

  return (
    <div 
      className={`login-form-container ${className}`}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        ...style
      }}
    >
      <div 
        className="login-form-card"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          padding: '2rem',
          width: '100%',
          maxWidth: '400px',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Logo/Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {logoElement || (
            <div 
              className="login-form-logo"
              style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                color: 'white'
              }}
            >
              <svg 
                width="32" 
                height="32" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
            </div>
          )}
          
          <h1 
            className="login-form-title"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '2.5rem',
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: '0.5rem',
              lineHeight: '1.2'
            }}
          >
            {title}
          </h1>
          
          <p 
            className="login-form-subtitle"
            style={{
              color: '#6b7280',
              textAlign: 'center',
              fontSize: '1rem',
              marginBottom: '2rem',
              lineHeight: '1.5'
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <div className="login-form-group" style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="password" 
              className="login-form-label"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#374151',
                fontWeight: '500',
                fontSize: '0.875rem'
              }}
            >
              Admin Password
            </label>
            
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={placeholder}
              disabled={loading}
              className="login-form-input"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                background: 'white',
                textAlign: 'center',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea'
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.boxShadow = 'none'
              }}
              aria-describedby={error ? "password-error" : undefined}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div 
              id="password-error"
              className="login-form-error"
              role="alert"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <svg 
                width="20" 
                height="20" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                style={{ color: '#ef4444', flexShrink: 0 }}
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span 
                style={{ 
                  color: '#ef4444', 
                  fontWeight: '500', 
                  fontSize: '0.875rem' 
                }}
              >
                {error}
              </span>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="login-form-button"
            style={{
              width: '100%',
              padding: '1rem 2rem',
              background: loading || !password.trim() 
                ? '#9ca3af' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              fontSize: '1.1rem',
              fontWeight: '500',
              cursor: loading || !password.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}
            onMouseEnter={(e) => {
              if (!loading && password.trim()) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {loading ? loadingText : buttonText}
          </button>
        </form>

        {/* Back Button */}
        {showBackButton && (
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <button
              type="button"
              onClick={handleBackClick}
              className="login-form-back-button"
              style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(240, 147, 251, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {backButtonText}
            </button>
          </div>
        )}

        {/* Footer */}
        <div 
          style={{ 
            textAlign: 'center', 
            paddingTop: '1.5rem', 
            borderTop: '1px solid rgba(107, 114, 128, 0.2)' 
          }}
        >
          <p 
            style={{ 
              color: '#6b7280', 
              fontSize: '0.75rem', 
              lineHeight: '1.5' 
            }}
          >
            Secure Authentication System<br />
            Powered by MessMass Auth
          </p>
        </div>
      </div>

    </div>
  )
}

/**
 * LoginForm with Custom Styling Hook
 * 
 * A version of LoginForm that accepts custom CSS classes for advanced styling.
 * Useful when you want to override the default glass-morphism design.
 */
export function LoginFormCustom({
  containerClassName = "",
  cardClassName = "",
  ...props
}: LoginFormProps & {
  containerClassName?: string
  cardClassName?: string
}) {
  return (
    <LoginForm
      {...props}
      className={`${props.className || ""} ${containerClassName}`.trim()}
      style={{
        ...props.style,
        // Remove default styling when custom classes are provided
        ...(containerClassName ? {} : props.style)
      }}
    />
  )
}

/**
 * Default Export Aliases
 * 
 * Provides convenient imports for common use cases.
 */
export { LoginForm }
