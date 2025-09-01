// lib/shareables/components/CodeViewer.tsx
// Syntax-highlighted code viewer for component documentation

'use client'

import { useState, useRef } from 'react'

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
  style?: React.CSSProperties // Additional inline styles
  
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
  style = {},
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
   * Get theme-specific styles
   */
  const getThemeStyles = () => {
    const baseStyles = {
      background: theme === 'dark' 
        ? 'rgba(26, 32, 44, 0.95)' 
        : 'rgba(255, 255, 255, 0.95)',
      color: theme === 'dark' ? '#e2e8f0' : '#2d3748',
      border: theme === 'dark' 
        ? '1px solid rgba(255, 255, 255, 0.1)' 
        : '1px solid rgba(0, 0, 0, 0.1)'
    }

    return baseStyles
  }

  // Prepare highlighted code
  const highlightedCode = highlightSyntax(code, language)
  const codeLines = code.split('\n')
  const shouldShowExpanded = collapsible || expandable

  return (
    <div 
      className={`code-viewer ${className}`}
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        ...getThemeStyles(),
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        ...style
      }}
    >
      {/* Header */}
      {(filename || title || copyable || shouldShowExpanded) && (
        <div 
          style={{
            padding: '0.75rem 1rem',
            background: theme === 'dark' 
              ? 'rgba(45, 55, 72, 0.6)' 
              : 'rgba(247, 250, 252, 0.8)',
            borderBottom: theme === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.1)' 
              : '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {filename && (
              <span style={{ 
                color: theme === 'dark' ? '#a0aec0' : '#4a5568',
                fontFamily: 'Monaco, Consolas, "Ubuntu Mono", monospace'
              }}>
                {filename}
              </span>
            )}
            {title && (
              <span style={{ color: theme === 'dark' ? '#cbd5e0' : '#2d3748' }}>
                {title}
              </span>
            )}
            <span 
              style={{ 
                color: theme === 'dark' ? '#718096' : '#718096',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {language}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {shouldShowExpanded && (
              <button
                onClick={handleToggle}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme === 'dark' ? '#a0aec0' : '#4a5568',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none'
                }}
              >
                {isExpanded ? '▼' : '▶'} {isExpanded ? 'Collapse' : 'Expand'}
              </button>
            )}

            {copyable && (
              <button
                onClick={handleCopy}
                style={{
                  background: copied 
                    ? 'rgba(72, 187, 120, 0.2)' 
                    : 'none',
                  border: 'none',
                  color: copied 
                    ? '#48bb78' 
                    : (theme === 'dark' ? '#a0aec0' : '#4a5568'),
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                onMouseEnter={(e) => {
                  if (!copied) {
                    e.currentTarget.style.background = theme === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!copied) {
                    e.currentTarget.style.background = 'none'
                  }
                }}
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
      <div 
        style={{
          display: isExpanded ? 'block' : 'none',
          maxHeight: isExpanded ? maxHeight : '80px',
          overflow: 'auto',
          transition: 'max-height 0.3s ease'
        }}
      >
        <pre
          ref={codeRef}
          style={{
            margin: 0,
            padding: '1rem',
            fontFamily: 'Monaco, Consolas, "Ubuntu Mono", monospace',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            overflow: 'auto',
            background: 'transparent'
          }}
        >
          {showLineNumbers ? (
            <div style={{ display: 'flex' }}>
              {/* Line Numbers */}
              <div 
                style={{
                  color: theme === 'dark' ? '#4a5568' : '#a0aec0',
                  marginRight: '1rem',
                  textAlign: 'right',
                  userSelect: 'none',
                  minWidth: '2.5rem'
                }}
              >
                {codeLines.map((_, index) => (
                  <div 
                    key={index}
                    style={{
                      background: highlightLines.includes(index + 1) 
                        ? (theme === 'dark' ? 'rgba(66, 153, 225, 0.2)' : 'rgba(66, 153, 225, 0.1)')
                        : 'transparent',
                      paddingLeft: highlightLines.includes(index + 1) ? '0.25rem' : '0'
                    }}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>

              {/* Code */}
              <div 
                style={{ flex: 1 }}
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
        <div 
          onClick={handleToggle}
          style={{
            padding: '1rem',
            cursor: 'pointer',
            background: theme === 'dark' 
              ? 'rgba(45, 55, 72, 0.3)' 
              : 'rgba(247, 250, 252, 0.5)',
            borderTop: theme === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.1)' 
              : '1px solid rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: theme === 'dark' ? '#a0aec0' : '#4a5568',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme === 'dark' 
              ? 'rgba(45, 55, 72, 0.5)' 
              : 'rgba(247, 250, 252, 0.8)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme === 'dark' 
              ? 'rgba(45, 55, 72, 0.3)' 
              : 'rgba(247, 250, 252, 0.5)'
          }}
        >
          Click to expand {codeLines.length} lines of {language} code ▼
        </div>
      )}

      {/* Syntax Highlighting Styles */}
      <style jsx>{`
        .code-comment { color: ${theme === 'dark' ? '#68d391' : '#38a169'}; font-style: italic; }
        .code-string { color: ${theme === 'dark' ? '#fbb6ce' : '#d53f8c'}; }
        .code-keyword { color: ${theme === 'dark' ? '#90cdf4' : '#3182ce'}; font-weight: 600; }
        .code-literal { color: ${theme === 'dark' ? '#f6ad55' : '#dd6b20'}; }
        .code-number { color: ${theme === 'dark' ? '#f6ad55' : '#dd6b20'}; }
        .code-tag { color: ${theme === 'dark' ? '#68d391' : '#38a169'}; }
        .code-selector { color: ${theme === 'dark' ? '#90cdf4' : '#3182ce'}; }
        .code-property { color: ${theme === 'dark' ? '#fbb6ce' : '#d53f8c'}; }
        .code-value { color: ${theme === 'dark' ? '#f6ad55' : '#dd6b20'}; }
        .code-key { color: ${theme === 'dark' ? '#90cdf4' : '#3182ce'}; }
      `}</style>
    </div>
  )
}

/**
 * CodeViewer with Custom Theme
 * 
 * Pre-configured CodeViewer with MessMass branding.
 */
export function MessMassCodeViewer(props: Omit<CodeViewerProps, 'theme'>) {
  return (
    <CodeViewer
      {...props}
      theme="dark"
      style={{
        background: 'linear-gradient(135deg, rgba(26, 32, 44, 0.95) 0%, rgba(45, 55, 72, 0.9) 100%)',
        ...props.style
      }}
    />
  )
}
