// lib/sanitize.ts
// WHAT: HTML sanitization utility for XSS protection
// WHY: Prevent XSS attacks via dangerouslySetInnerHTML while preserving formatting
// HOW: Use DOMPurify with feature flag support for zero-downtime migration

import { FEATURE_FLAGS } from './featureFlags';

/**
 * WHAT: Sanitize HTML content to prevent XSS attacks
 * WHY: All user-generated or database-stored HTML must be sanitized before rendering
 * HOW: Use DOMPurify with strict allowlist of tags and attributes
 * 
 * SECURITY: Feature flag controlled for zero-downtime migration
 * - When disabled: Returns content as-is (backward compatible)
 * - When enabled: Sanitizes HTML, removes script tags, dangerous attributes
 * 
 * @param dirty - Unsanitized HTML string
 * @param options - Optional configuration for allowed tags/attributes
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 * 
 * @example
 * sanitizeHTML('<p>Safe</p><script>alert("XSS")</script>') // '<p>Safe</p>'
 * sanitizeHTML('<a href="https://example.com">Link</a>') // '<a href="https://example.com">Link</a>'
 */
export function sanitizeHTML(
  dirty: string,
  options?: {
    allowTags?: string[];
    allowAttributes?: string[];
  }
): string {
  // WHAT: Feature flag check for zero-downtime migration
  // WHY: Allow instant rollback via environment variable
  if (!FEATURE_FLAGS.USE_SANITIZED_HTML) {
    return dirty;
  }

  // WHAT: Handle empty or non-string input
  // WHY: Prevent errors and ensure type safety
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  // WHAT: Client-side sanitization using DOMPurify
  // WHY: DOMPurify works natively in browser environment
  if (typeof window !== 'undefined') {
    // Dynamic import for client-side only
    // Note: require() is acceptable here for conditional loading
    const DOMPurify = require('dompurify');
    
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: options?.allowTags || [
        'p', 'br', 'strong', 'em', 'u', 'b', 'i',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote',
        'pre', 'code', 'del', 's', 'hr',
        'a'
      ],
      ALLOWED_ATTR: options?.allowAttributes || ['href', 'title', 'target'],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      // WHAT: Remove all script tags and event handlers
      // WHY: Prevent XSS via script injection
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
    });
  }

  // WHAT: Server-side sanitization (fallback)
  // WHY: DOMPurify requires DOM, use basic regex sanitization on server
  // NOTE: This is a basic sanitization - full DOMPurify requires jsdom
  // For production, consider using jsdom or moving sanitization to client-side only
  let sanitized = dirty;
  
  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove dangerous tags
  const dangerousTags = ['iframe', 'object', 'embed', 'form', 'input', 'button'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  return sanitized;
}

/**
 * WHAT: Sanitize HTML with markdown-specific allowlist
 * WHY: Markdown parsing produces specific HTML tags, restrict to those only
 * HOW: Use stricter allowlist for markdown-generated content
 * 
 * @param dirty - HTML from markdown parsing
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeMarkdownHTML(dirty: string): string {
  return sanitizeHTML(dirty, {
    allowTags: [
      'p', 'br', 'strong', 'em', 'u',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code', 'del', 's', 'hr',
      'a'
    ],
    allowAttributes: ['href', 'title', 'class'] // class for code blocks (future syntax highlighting)
  });
}

