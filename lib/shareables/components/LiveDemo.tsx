// lib/shareables/components/LiveDemo.tsx
// Interactive demo wrapper for component showcases

'use client'

import { useState, useRef, useEffect } from 'react'

/**
 * LiveDemo Component Props
 * 
 * Configuration interface for the LiveDemo component.
 */
export interface LiveDemoProps {
  children: React.ReactNode               // Component to demonstrate
  title?: string                         // Demo title/description
  description?: string                   // Demo description
  
  // Layout
  height?: string                        // Demo area height
  width?: string                         // Demo area width
  padding?: string                       // Internal padding
  background?: string                    // Background style
  
  // Behavior
  resizable?: boolean                    // Allow resizing demo area
  interactive?: boolean                  // Enable interaction controls
  resetable?: boolean                   // Show reset button
  fullscreenable?: boolean             // Allow fullscreen mode
  
  // Styling
  theme?: 'dark' | 'light'             // Color theme
  showBorder?: boolean                 // Show demo area border
  className?: string                   // Additional CSS classes
  style?: React.CSSProperties         // Additional inline styles
  
  // Controls
  controls?: React.ReactNode           // Custom control elements
  showControls?: boolean              // Show/hide controls panel
  
  // Callbacks
  onReset?: () => void                // Called when reset button clicked
  onFullscreen?: (fullscreen: boolean) => void // Called on fullscreen toggle
}

/**
 * MessMass LiveDemo Component
 * 
 * An interactive demonstration wrapper for showcasing components.
 * Provides a controlled environment with resizing, reset, and fullscreen capabilities.
 * 
 * Features:
 * - Interactive demo environment
 * - Resizable demo area
 * - Fullscreen mode
 * - Reset functionality
 * - Custom controls panel
 * - Glass-morphism styling
 * - Responsive design
 * - Accessibility support
 * 
 * Usage:
 * ```tsx
 * <LiveDemo
 *   title="Login Form Demo"
 *   description="Interactive login form with validation"
 *   resizable
 *   resetable
 *   fullscreenable
 * >
 *   <LoginForm onLoginSuccess={handleLogin} />
 * </LiveDemo>
 * ```
 */
export default function LiveDemo({
  children,
  title,
  description,
  height = '400px',
  width = '100%',
  padding = '2rem',
  background,
  resizable = false,
  interactive = true,
  resetable = false,
  fullscreenable = false,
  theme = 'light',
  showBorder = true,
  className = '',
  style = {},
  controls,
  showControls = false,
  onReset,
  onFullscreen
}: LiveDemoProps) {
  
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [demoSize, setDemoSize] = useState({ width, height })
  const [resetKey, setResetKey] = useState(0)
  
  const demoRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  /**
   * Handle fullscreen toggle
   */
  const handleFullscreen = () => {
    const newFullscreen = !isFullscreen
    setIsFullscreen(newFullscreen)
    
    if (newFullscreen) {
      // Enter fullscreen
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    
    if (onFullscreen) {
      onFullscreen(newFullscreen)
    }
  }

  /**
   * Handle reset demo
   */
  const handleReset = () => {
    setResetKey(prev => prev + 1)
    
    if (onReset) {
      onReset()
    }
  }

  /**
   * Handle resize start
   */
  const handleResizeStart = (e: React.MouseEvent) => {
    if (!resizable) return
    
    setIsResizing(true)
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = parseInt(demoSize.width, 10)
    const startHeight = parseInt(demoSize.height, 10)

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX)
      const newHeight = startHeight + (e.clientY - startY)
      
      setDemoSize({
        width: `${Math.max(200, newWidth)}px`,
        height: `${Math.max(150, newHeight)}px`
      })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  /**
   * Handle fullscreen change events
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement
      setIsFullscreen(isCurrentlyFullscreen)
      
      if (onFullscreen) {
        onFullscreen(isCurrentlyFullscreen)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [onFullscreen])

  /**
   * Get theme-specific styles
   */
  const getThemeStyles = () => {
    const isDark = theme === 'dark'
    
    return {
      background: background || (isDark 
        ? 'rgba(26, 32, 44, 0.95)' 
        : 'rgba(255, 255, 255, 0.95)'),
      color: isDark ? '#e2e8f0' : '#2d3748',
      border: showBorder ? (isDark 
        ? '1px solid rgba(255, 255, 255, 0.2)' 
        : '1px solid rgba(0, 0, 0, 0.1)') : 'none'
    }
  }

  const themeStyles = getThemeStyles()

  return (
    <div 
      ref={containerRef}
      className={`live-demo-container ${className}`}
      // WHAT: Dynamic container styles based on fullscreen state + theme + props
      // WHY: LiveDemo supports fullscreen mode, light/dark themes, and custom sizing
      // eslint-disable-next-line react/forbid-dom-props
      style={{
        width: isFullscreen ? '100vw' : demoSize.width,
        height: isFullscreen ? '100vh' : 'auto',
        maxWidth: isFullscreen ? 'none' : '100%',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
        borderRadius: isFullscreen ? '0' : '12px',
        overflow: 'hidden',
        ...themeStyles,
        backdropFilter: 'blur(10px)',
        boxShadow: isFullscreen ? 'none' : '0 4px 16px rgba(0, 0, 0, 0.1)',
        ...style
      }}
    >
      {/* Header */}
      {(title || description || showControls || resetable || fullscreenable) && (
        <div 
          // WHAT: Dynamic header background/border based on theme prop
          // WHY: LiveDemo supports light/dark themes - header must match
          // eslint-disable-next-line react/forbid-dom-props
          style={{
            padding: '1rem',
            background: theme === 'dark' 
              ? 'rgba(45, 55, 72, 0.6)' 
              : 'rgba(247, 250, 252, 0.8)',
            borderBottom: theme === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.1)' 
              : '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          {/* Title and Description */}
          <div>
            {title && (
              <h3 
                // WHAT: Dynamic title color based on theme prop
                // WHY: Text must be readable on both light/dark backgrounds
                // eslint-disable-next-line react/forbid-dom-props
                style={{ 
                  margin: 0,
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: theme === 'dark' ? '#e2e8f0' : '#2d3748',
                  marginBottom: description ? '0.25rem' : 0
                }}
              >
                {title}
              </h3>
            )}
            {description && (
              <p 
                // WHAT: Dynamic description color based on theme prop
                // WHY: Muted text must maintain readability across themes
                // eslint-disable-next-line react/forbid-dom-props
                style={{ 
                  margin: 0,
                  fontSize: '0.875rem',
                  color: theme === 'dark' ? '#a0aec0' : '#4a5568',
                  lineHeight: '1.4'
                }}
              >
                {description}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex-controls">
            {/* Custom Controls */}
            {showControls && controls && (
              <div className="flex-controls">
                {controls}
              </div>
            )}

            {/* Reset Button */}
            {resetable && (
              <button
                onClick={handleReset}
                // WHAT: Dynamic hover state using onMouseEnter/Leave
                // WHY: Button needs visual feedback without CSS pseudo-classes
                // eslint-disable-next-line react/forbid-dom-props
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#f59e0b',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'
                }}
                title="Reset demo to initial state"
              >
                🔄 Reset
              </button>
            )}

            {/* Fullscreen Button */}
            {fullscreenable && (
              <button
                onClick={handleFullscreen}
                // WHAT: Dynamic hover state using onMouseEnter/Leave
                // WHY: Button needs visual feedback without CSS pseudo-classes
                // eslint-disable-next-line react/forbid-dom-props
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#3b82f6',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
                }}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? '🗗 Exit' : '🗖 Full'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Demo Area */}
      <div 
        ref={demoRef}
        // WHAT: Dynamic height based on fullscreen state + padding prop
        // WHY: Demo area resizes for fullscreen and uses custom padding
        // eslint-disable-next-line react/forbid-dom-props
        style={{
          position: 'relative',
          height: isFullscreen ? 'calc(100vh - 60px)' : demoSize.height,
          padding: padding,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Demo Content */}
        <div key={resetKey} className="full-size-wrapper">
          {children}
        </div>

        {/* Resize Handle */}
        {resizable && !isFullscreen && (
          <div
            onMouseDown={handleResizeStart}
            // WHAT: Dynamic theme-based colors + hover state
            // WHY: Resize handle must be visible on both themes with hover feedback
            // eslint-disable-next-line react/forbid-dom-props
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '20px',
              height: '20px',
              background: theme === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.1)',
              cursor: 'nw-resize',
              borderTopLeftRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: theme === 'dark' ? '#a0aec0' : '#4a5568',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme === 'dark' 
                ? 'rgba(255, 255, 255, 0.2)' 
                : 'rgba(0, 0, 0, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.1)'
            }}
            title="Drag to resize demo area"
          >
            ⋰
          </div>
        )}
      </div>

      {/* Resize Overlay */}
      {isResizing && <div className="resize-overlay" />}
    </div>
  )
}

/**
 * CodeDemo Component
 * 
 * Specialized LiveDemo for code examples and components.
 * Pre-configured with code-friendly settings.
 */
export function CodeDemo({
  children,
  title = 'Code Example',
  ...props
}: Omit<LiveDemoProps, 'theme' | 'background'> & {
  children: React.ReactNode
  title?: string
}) {
  return (
    <LiveDemo
      {...props}
      title={title}
      theme="dark"
      background="rgba(26, 32, 44, 0.95)"
      padding="1rem"
      height="300px"
      resetable
      resizable
    >
      {children}
    </LiveDemo>
  )
}

/**
 * ComponentShowcase
 * 
 * Specialized LiveDemo for component demonstrations.
 * Pre-configured with showcase-friendly settings.
 */
export function ComponentShowcase({
  children,
  componentName,
  ...props
}: Omit<LiveDemoProps, 'title' | 'fullscreenable' | 'resetable'> & {
  children: React.ReactNode
  componentName: string
}) {
  return (
    <LiveDemo
      {...props}
      title={`${componentName} Demo`}
      description={`Interactive demonstration of the ${componentName} component`}
      fullscreenable
      resetable
      resizable
      showControls
      height="500px"
    >
      {children}
    </LiveDemo>
  )
}

/**
 * MobileDemo Component
 * 
 * Specialized LiveDemo for mobile component testing.
 * Pre-configured with mobile-friendly dimensions.
 */
export function MobileDemo({
  children,
  ...props
}: Omit<LiveDemoProps, 'width' | 'height' | 'resizable'> & {
  children: React.ReactNode
}) {
  return (
    <LiveDemo
      {...props}
      title="Mobile Preview"
      width="375px"
      height="667px"
      padding="0"
      background="white"
      showBorder
      // WHAT: Phone frame styling + spread props.style
      // WHY: MobileDemo simulates iPhone frame with custom overrides
      // eslint-disable-next-line react/forbid-dom-props
      style={{
        boxShadow: '0 0 0 8px #333, 0 0 0 9px #666, 0 4px 20px rgba(0,0,0,0.3)',
        borderRadius: '30px',
        ...props.style
      }}
    >
      <div className="mobile-inner-frame">
        {children}
      </div>
    </LiveDemo>
  )
}
