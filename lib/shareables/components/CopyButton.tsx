// lib/shareables/components/CopyButton.tsx
// One-click copy button for code snippets and text content

'use client'

import { useState } from 'react'

/**
 * CopyButton Component Props
 * 
 * Configuration interface for the CopyButton component.
 */
export interface CopyButtonProps {
  // Content
  text: string                         // Text to copy to clipboard
  children?: React.ReactNode          // Button content (overrides default)
  
  // Styling
  size?: 'small' | 'medium' | 'large' // Button size
  variant?: 'primary' | 'secondary' | 'ghost' // Button style variant
  theme?: 'dark' | 'light'           // Color theme
  className?: string                  // Additional CSS classes
  style?: React.CSSProperties        // Additional inline styles
  
  // Behavior
  showFeedback?: boolean             // Show success feedback
  feedbackDuration?: number          // Feedback duration in milliseconds
  disabled?: boolean                 // Disable button
  
  // Callbacks
  onCopy?: (text: string) => void    // Called after successful copy
  onError?: (error: Error) => void   // Called on copy failure
}

/**
 * MessMass CopyButton Component
 * 
 * A beautiful, accessible copy button with visual feedback.
 * Integrates clipboard API with fallback support and error handling.
 * 
 * Features:
 * - Clipboard API integration with fallback
 * - Visual success/error feedback
 * - Multiple size and style variants
 * - Accessibility support (ARIA labels, keyboard navigation)
 * - Glass-morphism styling
 * - Customizable appearance
 * - Error handling and reporting
 * 
 * Usage:
 * ```tsx
 * <CopyButton
 *   text="npm install messmass-auth"
 *   size="medium"
 *   variant="primary"
 *   onCopy={(text) => console.log('Copied:', text)}
 * />
 * ```
 */
export default function CopyButton({
  text,
  children,
  size = 'medium',
  variant = 'ghost',
  theme = 'light',
  className = '',
  style = {},
  showFeedback = true,
  feedbackDuration = 2000,
  disabled = false,
  onCopy,
  onError
}: CopyButtonProps) {
  
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'success' | 'error'>('idle')

  /**
   * Handle copy to clipboard
   * 
   * Uses modern Clipboard API with fallback to legacy method.
   * Includes error handling and user feedback.
   */
  const handleCopy = async () => {
    if (disabled) return
    
    setCopyState('copying')

    try {
      // Modern Clipboard API (preferred method)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for older browsers or non-HTTPS contexts
        await copyTextFallback(text)
      }

      // Success feedback
      setCopyState('success')
      
      if (onCopy) {
        onCopy(text)
      }

      // Reset state after feedback duration
      if (showFeedback) {
        setTimeout(() => {
          setCopyState('idle')
        }, feedbackDuration)
      } else {
        setCopyState('idle')
      }

    } catch (error) {
      // Error feedback
      setCopyState('error')
      
      if (onError) {
        onError(error as Error)
      }

      // Reset state after feedback duration
      setTimeout(() => {
        setCopyState('idle')
      }, feedbackDuration)
    }
  }

  /**
   * Fallback copy method for older browsers
   * 
   * Uses the legacy document.execCommand method.
   * Creates a temporary textarea element for the copy operation.
   */
  const copyTextFallback = async (textToCopy: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Create temporary textarea
      const textArea = document.createElement('textarea')
      textArea.value = textToCopy
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      
      try {
        textArea.focus()
        textArea.select()
        
        // Execute copy command
        const successful = document.execCommand('copy')
        
        if (successful) {
          resolve()
        } else {
          reject(new Error('Copy command failed'))
        }
      } catch (error) {
        reject(error)
      } finally {
        // Cleanup
        document.body.removeChild(textArea)
      }
    })
  }

  /**
   * Get size-specific styles
   */
  const getSizeStyles = () => {
    const sizes = {
      small: {
        padding: '0.25rem 0.5rem',
        fontSize: '0.75rem',
        borderRadius: '4px',
        gap: '0.25rem'
      },
      medium: {
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        borderRadius: '6px',
        gap: '0.375rem'
      },
      large: {
        padding: '0.75rem 1rem',
        fontSize: '1rem',
        borderRadius: '8px',
        gap: '0.5rem'
      }
    }
    
    return sizes[size]
  }

  /**
   * Get variant-specific styles
   */
  const getVariantStyles = () => {
    const isDark = theme === 'dark'
    
    const variants = {
      primary: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        hover: {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
        }
      },
      secondary: {
        background: isDark 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'rgba(0, 0, 0, 0.05)',
        color: isDark ? '#e2e8f0' : '#2d3748',
        border: isDark 
          ? '1px solid rgba(255, 255, 255, 0.2)' 
          : '1px solid rgba(0, 0, 0, 0.1)',
        hover: {
          background: isDark 
            ? 'rgba(255, 255, 255, 0.15)' 
            : 'rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-1px)'
        }
      },
      ghost: {
        background: 'transparent',
        color: isDark ? '#a0aec0' : '#4a5568',
        border: 'none',
        hover: {
          background: isDark 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.05)',
          color: isDark ? '#e2e8f0' : '#2d3748'
        }
      }
    }
    
    return variants[variant]
  }

  /**
   * Get state-specific styles and content
   */
  const getStateContent = () => {
    switch (copyState) {
      case 'copying':
        return {
          icon: '⏳',
          text: 'Copying...',
          color: theme === 'dark' ? '#fbb6ce' : '#d53f8c'
        }
      case 'success':
        return {
          icon: '✅',
          text: 'Copied!',
          color: '#48bb78'
        }
      case 'error':
        return {
          icon: '❌',
          text: 'Failed',
          color: '#f56565'
        }
      default:
        return {
          icon: '📋',
          text: 'Copy',
          color: undefined
        }
    }
  }

  // Get computed styles
  const sizeStyles = getSizeStyles()
  const variantStyles = getVariantStyles()
  const stateContent = getStateContent()

  return (
    <button
      onClick={handleCopy}
      disabled={disabled || copyState === 'copying'}
      className={`copy-button ${className}`}
      style={{
        // Base styles
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'inherit',
        fontWeight: '500',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        outline: 'none',
        userSelect: 'none',
        
        // Size styles
        ...sizeStyles,
        
        // Variant styles
        background: variantStyles.background,
        color: stateContent.color || variantStyles.color,
        border: variantStyles.border,
        
        // Disabled styles
        opacity: disabled ? 0.6 : 1,
        
        // Override styles
        ...style
      }}
      onMouseEnter={(e) => {
        if (!disabled && copyState === 'idle' && variantStyles.hover) {
          Object.assign(e.currentTarget.style, variantStyles.hover)
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'none'
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.background = variantStyles.background
          if (variantStyles.hover && 'color' in variantStyles.hover) {
            e.currentTarget.style.color = stateContent.color || variantStyles.color
          }
        }
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = `2px solid ${theme === 'dark' ? '#90cdf4' : '#3182ce'}`
        e.currentTarget.style.outlineOffset = '2px'
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none'
      }}
      aria-label={`Copy "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" to clipboard`}
      title={`Copy to clipboard: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`}
    >
      {children || (
        <>
          <span 
            style={{ 
              fontSize: size === 'small' ? '0.875em' : '1em',
              transition: 'transform 0.15s ease',
              transform: copyState === 'success' ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            {stateContent.icon}
          </span>
          <span>{stateContent.text}</span>
        </>
      )}
    </button>
  )
}

/**
 * CodeCopyButton
 * 
 * Specialized copy button for code snippets.
 * Pre-configured with code-friendly styling.
 */
export function CodeCopyButton({
  code,
  filename,
  ...props
}: Omit<CopyButtonProps, 'text'> & {
  code: string
  filename?: string
}) {
  return (
    <CopyButton
      {...props}
      text={code}
      variant="ghost"
      size="small"
      aria-label={`Copy ${filename || 'code'} to clipboard`}
    >
      <span>📋</span>
      <span>Copy {filename ? filename : 'Code'}</span>
    </CopyButton>
  )
}

/**
 * CommandCopyButton
 * 
 * Specialized copy button for terminal commands.
 * Pre-configured with command-friendly styling.
 */
export function CommandCopyButton({
  command,
  ...props
}: Omit<CopyButtonProps, 'text' | 'children'> & {
  command: string
}) {
  return (
    <CopyButton
      {...props}
      text={command}
      variant="secondary"
      size="small"
      theme="dark"
      style={{
        fontFamily: 'Monaco, Consolas, "Ubuntu Mono", monospace',
        ...props.style
      }}
    >
      <span>💻</span>
      <span>Copy Command</span>
    </CopyButton>
  )
}

/**
 * LinkCopyButton
 * 
 * Specialized copy button for URLs and links.
 * Pre-configured with link-friendly styling.
 */
export function LinkCopyButton({
  url,
  label = 'Copy Link',
  ...props
}: Omit<CopyButtonProps, 'text' | 'children'> & {
  url: string
  label?: string
}) {
  return (
    <CopyButton
      {...props}
      text={url}
      variant="ghost"
      size="small"
      aria-label={`Copy link: ${url}`}
    >
      <span>🔗</span>
      <span>{label}</span>
    </CopyButton>
  )
}

/**
 * Copy Utilities
 * 
 * Standalone utility functions for copying text.
 */
export const copyUtils = {
  /**
   * Copy text to clipboard
   * 
   * Standalone function for copying text without a button component.
   */
  copyText: async (text: string): Promise<void> => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      // Fallback method
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      
      try {
        textArea.focus()
        textArea.select()
        const successful = document.execCommand('copy')
        
        if (!successful) {
          throw new Error('Copy command failed')
        }
      } finally {
        document.body.removeChild(textArea)
      }
    }
  },

  /**
   * Check if clipboard API is available
   */
  isClipboardSupported: (): boolean => {
    return !!(navigator.clipboard && window.isSecureContext)
  },

  /**
   * Copy with automatic success toast (if available)
   */
  copyWithToast: async (text: string, message = 'Copied to clipboard!'): Promise<void> => {
    await copyUtils.copyText(text)
    
    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(message, {
        icon: '/favicon.ico',
        tag: 'copy-notification'
      })
    }
  }
}
