// lib/shareables/components/CodeViewer.tsx
// Syntax-highlighted code viewer for component documentation

'use client'

import { useState, useRef } from 'react'
import styles from './CodeViewer.module.css'

/**
 * CodeViewer Component Props
 * 
 * Configuration interface for the CodeViewer component.
 */
export interface CodeViewerProps {
  code: string                 // Source code to display
  language: string            // Programming language for syntax highlighting
  filename?: string           // Optional filename to display
  title?: string              // Optional title/description
  showLineNumbers?: boolean   // Whether to show line numbers
  maxHeight?: string          // Maximum height (CSS value)
  theme?: 'dark' | 'light'   // Color theme
  className?: string          // Additional CSS classes
  
  // Features
  copyable?: boolean          // Enable copy button
  collapsible?: boolean       // Enable collapse/expand
  expandable?: boolean        // Start collapsed, allow expansion
  highlightLines?: number[]   // Line numbers to highlight
  
  // Callbacks
  onCopy?: (code: string) => void
  onToggle?: (expanded: boolean) => void
}

/**
 * Simple Syntax Highlighter
 * 
 * Basic syntax highlighting without external dependencies.
 * Supports common languages used in web development.
 * For production use, consider integrating Prism.js or highlight.js.
 */
function highlightSyntax(code: string, language: string): string {
  const patterns: Record<string, { pattern: RegExp; className: string }[]> = {
    javascript: [
      { pattern: /\/\/.*$/gm, className: 'comment' },
      { pattern: /\/\*[\s\S]*?\*\//gm, className: 'comment' },
      { pattern: /'[^']*'/g, className: 'string' },
      { pattern: /"[^"]*"/g, className: 'string' },
      { pattern: /`[^`]*`/g, className: 'string' },
      { pattern: /\b(function|const|let|var|if|else|for|while|return|import|export|from|as|default|class|extends|interface|type)\b/g, className: 'keyword' },
      { pattern: /\b(true|false|null|undefined)\b/g, className: 'literal' },
      { pattern: /\b\d+\b/g, className: 'number' }
    ],
    typescript: [
      { pattern: /\/\/.*$/gm, className: 'comment' },
      { pattern: /\/\*[\s\S]*?\*\//gm, className: 'comment' },
      { pattern: /'[^']*'/g, className: 'string' },
      { pattern: /"[^"]*"/g, className: 'string' },
      { pattern: /`[^`]*`/g, className: 'string' },
      { pattern: /\b(function|const|let|var|if|else|for|while|return|import|export|from|as|default|class|extends|interface|type|enum|namespace|public|private|protected|readonly)\b/g, className: 'keyword' },
      { pattern: /\b(true|false|null|undefined|string|number|boolean|object|any|void)\b/g, className: 'literal' },
      { pattern: /\b\d+\b/g, className: 'number' }
    ],
    tsx: [
      { pattern: /\/\/.*$/gm, className: 'comment' },
      { pattern: /\/\*[\s\S]*?\*\//gm, className: 'comment' },
      { pattern: /'[^']*'/g, className: 'string' },
      { pattern: /"[^"]*"/g, className: 'string' },
      { pattern: /`[^`]*`/g, className: 'string' },
      { pattern: /<\/?[a-zA-Z][^>]*>/g, className: 'tag' },
      { pattern: /\b(function|const|let|var|if|else|for|while|return|import|export|from|as|default|class|extends|interface|type|React|useState|useEffect|useContext)\b/g, className: 'keyword' },
      { pattern: /\b(true|false|null|undefined|string|number|boolean|object|any|void)\b/g, className: 'literal' },
      { pattern: /\b\d+\b/g, className: 'number' }
    ],
    css: [
      { pattern: /\/\*[\s\S]*?\*\//gm, className: 'comment' },
      { pattern: /'[^']*'/g, className: 'string' },
      { pattern: /"[^"]*"/g, className: 'string' },
      { pattern: /\.[a-zA-Z][a-zA-Z0-9-_]*\b/g, className: 'selector' },
      { pattern: /#[a-zA-Z][a-zA-Z0-9-_]*\b/g, className: 'selector' },
      { pattern: /[a-zA-Z-]+(?=:)/g, className: 'property' },
      { pattern: /#[0-9a-fA-F]{3,6}\b/g, className: 'value' }
    ],
    json: [
      { pattern: /"[^"]*"(?=:)/g, className: 'key' },
      { pattern: /"[^"]*"(?!:)/g, className: 'string' },
      { pattern: /\b(true|false|null)\b/g, className: 'literal' },
      { pattern: /\b\d+(\.\d+)?\b/g, className: 'number' }
    ]
  }

  const languagePatterns = patterns[language.toLowerCase()] || patterns.javascript
  let highlightedCode = code

  // Escape HTML first
  highlightedCode = highlightedCode
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Apply syntax highlighting
  languagePatterns.forEach(({ pattern, className }) => {
    highlightedCode = highlightedCode.replace(pattern, (match) => {
      return `<span class="code-${className}">${match}</span>`
    })
  })

  return highlightedCode
}

/**
 * MessMass CodeViewer Component
 * 
 * A beautiful code viewer with syntax highlighting and interactive features.
 * Designed for component documentation and code examples.
 * 
 * Features:
 * - Syntax highlighting for multiple languages
 * - Copy to clipboard functionality
 * - Collapsible/expandable code blocks
 * - Line number display
 * - Light and dark themes
 * - Line highlighting
 * - Glass-morphism styling
 * 
 * Usage:
 * ```tsx
 * <CodeViewer
 *   code={sourceCode}
 *   language="typescript"
 *   filename="LoginForm.tsx"
 *   copyable
 *   showLineNumbers
 *   theme="dark"
 * />
 * ```
 */
export default function CodeViewer({
  code,
  language,
  filename,
  title,
  showLineNumbers = true,
  maxHeight = '400px',
  theme = 'dark',
  className = '',
  copyable = true,
  collapsible = false,
  expandable = false,
  highlightLines = [],
  onCopy,
  onToggle
}: CodeViewerProps) {
  
  const [isExpanded, setIsExpanded] = useState(!expandable)
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLPreElement>(null)

  /**
   * Handle copy to clipboard
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      
      if (onCopy) {
        onCopy(code)
      }
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  /**
   * Handle expand/collapse toggle
   */
  const handleToggle = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    
    if (onToggle) {
      onToggle(newExpanded)
    }
  }

  /**
   * Get theme-specific CSS variables
   */
  const getThemeVars = () => {
    return {
      ['--viewer-bg' as string]: theme === 'dark' ? 'rgba(26, 32, 44, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      ['--viewer-text' as string]: theme === 'dark' ? '#e2e8f0' : '#2d3748',
      ['--viewer-border' as string]: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
      ['--viewer-header-bg' as string]: theme === 'dark' ? 'rgba(45, 55, 72, 0.6)' : 'rgba(247, 250, 252, 0.8)',
      ['--viewer-header-border' as string]: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
      ['--viewer-filename-color' as string]: theme === 'dark' ? '#a0aec0' : '#4a5568',
      ['--viewer-title-color' as string]: theme === 'dark' ? '#cbd5e0' : '#2d3748',
      ['--viewer-btn-color' as string]: theme === 'dark' ? '#a0aec0' : '#4a5568',
      ['--viewer-btn-hover-bg' as string]: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      ['--viewer-collapsed-bg' as string]: theme === 'dark' ? 'rgba(45, 55, 72, 0.3)' : 'rgba(247, 250, 252, 0.5)',
      ['--viewer-collapsed-border' as string]: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
      ['--viewer-collapsed-color' as string]: theme === 'dark' ? '#a0aec0' : '#4a5568',
      ['--viewer-collapsed-hover-bg' as string]: theme === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(247, 250, 252, 0.8)',
      ['--viewer-line-number-color' as string]: theme === 'dark' ? '#4a5568' : '#a0aec0',
      ['--viewer-max-height' as string]: maxHeight,
      ['--syntax-comment' as string]: theme === 'dark' ? '#68d391' : '#38a169',
      ['--syntax-string' as string]: theme === 'dark' ? '#fbb6ce' : '#d53f8c',
      ['--syntax-keyword' as string]: theme === 'dark' ? '#90cdf4' : '#3182ce',
      ['--syntax-literal' as string]: theme === 'dark' ? '#f6ad55' : '#dd6b20',
      ['--syntax-number' as string]: theme === 'dark' ? '#f6ad55' : '#dd6b20',
      ['--syntax-tag' as string]: theme === 'dark' ? '#68d391' : '#38a169',
      ['--syntax-selector' as string]: theme === 'dark' ? '#90cdf4' : '#3182ce',
      ['--syntax-property' as string]: theme === 'dark' ? '#fbb6ce' : '#d53f8c',
      ['--syntax-value' as string]: theme === 'dark' ? '#f6ad55' : '#dd6b20',
      ['--syntax-key' as string]: theme === 'dark' ? '#90cdf4' : '#3182ce'
    } as React.CSSProperties
  }

  // Prepare highlighted code
  const highlightedCode = highlightSyntax(code, language)
  const codeLines = code.split('\n')
  const shouldShowExpanded = collapsible || expandable

  return (
    <div 
      className={`${styles.container} code-viewer ${className}`}
      style={getThemeVars()}
    >
      {/* Header */}
      {(filename || title || copyable || shouldShowExpanded) && (
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {filename && (
              <span className={styles.filename}>
                {filename}
              </span>
            )}
            {title && (
              <span className={styles.title}>
                {title}
              </span>
            )}
            <span className={styles.language}>
              {language}
            </span>
          </div>

          <div className={styles.headerRight}>
            {shouldShowExpanded && (
              <button
                onClick={handleToggle}
                className={styles.btn}
              >
                {isExpanded ? '▼' : '▶'} {isExpanded ? 'Collapse' : 'Expand'}
              </button>
            )}

            {copyable && (
              <button
                onClick={handleCopy}
                className={`${styles.btn} ${styles.copyBtn} ${copied ? styles.copied : ''}`}
              >
                {copied ? (
                  <>
                    <span>✓</span> Copied!
                  </>
                ) : (
                  <>
                    <span>📋</span> Copy
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Code Content */}
      <div className={`${styles.codeWrapper} ${!isExpanded ? styles.codeWrapperHidden : ''}`}>
        <pre ref={codeRef} className={styles.pre}>
          {showLineNumbers ? (
            <div className={styles.codeContent}>
              {/* Line Numbers */}
              <div className={styles.lineNumbers}>
                {codeLines.map((_, index) => {
                  const isHighlighted = highlightLines.includes(index + 1);
                  return (
                    <div 
                      key={index}
                      className={styles.lineNumber}
                      style={{
                        ['--line-bg' as string]: isHighlighted 
                          ? (theme === 'dark' ? 'rgba(66, 153, 225, 0.2)' : 'rgba(66, 153, 225, 0.1)')
                          : 'transparent',
                        ['--line-padding' as string]: isHighlighted ? '0.25rem' : '0'
                      } as React.CSSProperties}
                    >
                      {index + 1}
                    </div>
                  );
                })}
              </div>

              {/* Code */}
              <div 
                dangerouslySetInnerHTML={{
                  __html: highlightedCode
                }}
              />
            </div>
          ) : (
            <div 
              dangerouslySetInnerHTML={{
                __html: highlightedCode
              }}
            />
          )}
        </pre>
      </div>

      {/* Collapsed Preview */}
      {!isExpanded && (collapsible || expandable) && (
        <div onClick={handleToggle} className={styles.collapsedPreview}>
          Click to expand {codeLines.length} lines of {language} code ▼
        </div>
      )}

      {/* WHAT: Syntax highlighting now handled via CSS variables in module
           WHY: Removed jsx style tag, colors applied through CSS module */}
    </div>
  )
}

/**
 * CodeViewer with Custom Theme
 * 
 * Pre-configured CodeViewer with MessMass branding.
 */
export function MessMassCodeViewer(props: Omit<CodeViewerProps, 'theme'>) {
  // WHAT: MessMass branded version with dark theme
  // WHY: Provides consistent branding for documentation
  return (
    <CodeViewer
      {...props}
      theme="dark"
    />
  )
}
