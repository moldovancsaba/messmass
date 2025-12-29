// lib/tableMarkdownUtils.ts
// WHAT: Markdown table parsing utilities for table charts
// WHY: Enable markdown table rendering with styling support
// HOW: Use marked library with GFM (GitHub Flavored Markdown) enabled for tables

import { marked } from 'marked';
import { sanitizeHTML } from './sanitize';

/**
 * WHAT: Configure marked with GFM enabled for table support
 * WHY: Tables require GitHub Flavored Markdown (GFM) extension
 * HOW: Enable GFM - marked will automatically render tables
 */
marked.setOptions({
  breaks: true,        // Convert \n to <br> (natural line breaks)
  gfm: true,           // Enable GitHub Flavored Markdown (includes tables)
});

/**
 * parseTableMarkdown
 * WHAT: Convert markdown table string to safe HTML
 * WHY: Render markdown tables in TableChart while preventing XSS
 * HOW: Use marked.parse() with GFM enabled for table support
 * 
 * SECURITY: Admin-controlled content only (authenticated users)
 * - Tables are sanitized via DOMPurify
 * - Supports markdown table syntax with alignment
 * 
 * @param markdown - Raw markdown table string from database
 * @returns Safe HTML string ready for dangerouslySetInnerHTML
 * 
 * @example
 * parseTableMarkdown('| Header 1 | Header 2 |\n|---------|------------|\n| Cell 1  | Cell 2     |')
 * // Returns: '<table class="markdown-table">...</table>'
 */
export function parseTableMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }
  
  try {
    // WHAT: Parse markdown to HTML using marked with GFM
    // WHY: Convert markdown table syntax to renderable HTML
    const html = marked.parse(markdown, {
      async: false, // Synchronous parsing for simplicity
    }) as string;
    
    // WHAT: Sanitize parsed HTML to prevent XSS
    // WHY: Even though marked is safe, additional sanitization provides defense in depth
    // HOW: Use DOMPurify with table-specific allowlist
    return sanitizeHTML(html, {
      allowTags: [
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'p', 'br', 'strong', 'em', 'u', 'b', 'i',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'a'
      ],
      allowAttributes: ['class', 'style', 'href', 'title', 'target']
    });
  } catch (error) {
    console.error('Table markdown parsing error:', error);
    // WHAT: Fallback to plain text on parse error
    // WHY: Graceful degradation ensures content always displays
    return `<p>Table parsing error: ${escapeHtml(markdown)}</p>`;
  }
}

/**
 * escapeHtml
 * WHAT: Escape HTML special characters for safe display
 * WHY: Fallback sanitization when markdown parsing fails
 * HOW: Replace <, >, &, ', " with HTML entities
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

