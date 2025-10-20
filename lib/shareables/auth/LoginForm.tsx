// lib/shareables/auth/LoginForm.tsx
// Reusable login form component with glass-morphism styling

'use client'

import { useState } from 'react'
import { LoginCredentials, LoginResponse, AuthConfig, DEFAULT_AUTH_CONFIG } from './types'
import { authenticateUser } from './passwordAuth'
import { setSessionCookie } from './session'
import styles from './LoginForm.module.css'

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
      className={`${styles.container} login-form-container ${className}`}
    >
      <div className={`${styles.card} login-form-card`}>
        {/* Logo/Header Section */}
        <div className={styles.header}>
          {logoElement || (
            <div className={`${styles.logo} login-form-logo`}>
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
          
          <h1 className={`${styles.title} login-form-title`}>
            {title}
          </h1>
          
          <p className={`${styles.subtitle} login-form-subtitle`}>
            {subtitle}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={`${styles.formGroup} login-form-group`}>
            <label 
              htmlFor="password" 
              className={`${styles.label} login-form-label`}
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
              className={`${styles.input} login-form-input`}
              aria-describedby={error ? "password-error" : undefined}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div 
              id="password-error"
              className={`${styles.error} login-form-error`}
              role="alert"
            >
              <svg 
                width="20" 
                height="20" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                className={styles.errorIcon}
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span className={styles.errorText}>
                {error}
              </span>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className={`${styles.submitBtn} login-form-button`}
          >
            {loading ? loadingText : buttonText}
          </button>
        </form>

        {/* Back Button */}
        {showBackButton && (
          <div className={styles.backBtnContainer}>
            <button
              type="button"
              onClick={handleBackClick}
              className={`${styles.backBtn} login-form-back-button`}
            >
              {backButtonText}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
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
