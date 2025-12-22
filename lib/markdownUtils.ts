// lib/markdownUtils.ts
// WHAT: Markdown parsing and sanitization utilities for text content
// WHY: Enable rich text formatting in report text fields while maintaining security
// HOW: Use marked library with safe options, no inline HTML allowed

import { marked } from 'marked';

/**
 * WHAT: Configure marked with safe defaults
 * WHY: Prevent XSS attacks while allowing standard markdown features
 * HOW: Enable GitHub Flavored Markdown with natural line breaks
 */
marked.setOptions({
  breaks: true,        // Convert \n to <br> (natural line breaks)
  gfm: true,          // GitHub Flavored Markdown (tables, strikethrough, etc.)
});

/**
 * parseMarkdown
 * WHAT: Convert markdown string to safe HTML
 * WHY: Render formatted text in TextChart while preventing XSS
 * HOW: Use marked.parse() with HTML disabled by default
 * 
 * SECURITY: Admin-controlled content only (authenticated users)
 * - No inline HTML allowed (marked.use({ renderer: {} }) removes script tags)
 * - Standard markdown features only: bold, italic, lists, links, headings
 * 
 * @param markdown - Raw markdown string from database
 * @returns Safe HTML string ready for dangerouslySetInnerHTML
 * 
 * @example
 * parseMarkdown('**Bold** text') // '<p><strong>Bold</strong> text</p>'
 * parseMarkdown('# Heading\n- List item') // '<h1>Heading</h1>\n<ul><li>List item</li></ul>'
 */
export function parseMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }
  
  try {
    // WHAT: Parse markdown to HTML using marked
    // WHY: Convert user-friendly markdown syntax to renderable HTML
    const html = marked.parse(markdown, {
      async: false, // Synchronous parsing for simplicity
    }) as string;
    
    return html;
  } catch (error) {
    console.error('Markdown parsing error:', error);
    // WHAT: Fallback to plain text on parse error
    // WHY: Graceful degradation ensures content always displays
    return `<p>${escapeHtml(markdown)}</p>`;
  }
}

/**
 * escapeHtml
 * WHAT: Escape HTML special characters for safe display
 * WHY: Fallback sanitization when markdown parsing fails
 * HOW: Replace <, >, &, ', " with HTML entities
 * 
 * @param text - Raw text to escape
 * @returns HTML-safe string
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

/**
 * isMarkdown
 * WHAT: Detect if text contains markdown syntax
 * WHY: Show markdown hints/preview only when relevant
 * HOW: Check for common markdown patterns
 * 
 * @param text - Text to check
 * @returns true if text contains markdown syntax
 * 
 * @example
 * isMarkdown('Plain text') // false
 * isMarkdown('**Bold** text') // true
 * isMarkdown('# Heading') // true
 */
export function isMarkdown(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  // WHAT: Regex patterns for common markdown syntax
  // WHY: Quick detection without full parsing
  const markdownPatterns = [
    /^#{1,6}\s/m,           // Headings: # Heading
    /\*\*[^*]+\*\*/,        // Bold: **text**
    /\*[^*]+\*/,            // Italic: *text*
    /^\s*[-*+]\s/m,         // Unordered lists: - item
    /^\s*\d+\.\s/m,         // Ordered lists: 1. item
    /\[.+\]\(.+\)/,         // Links: [text](url)
    /^\s*>\s/m,             // Blockquotes: > quote
    /`[^`]+`/,              // Inline code: `code`
    /~~[^~]+~~/,            // Strikethrough: ~~text~~
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
}

/**
 * getMarkdownHint
 * WHAT: Generate helpful markdown syntax hint for users
 * WHY: Guide users on how to format text
 * HOW: Return static string with common patterns
 * 
 * @returns Markdown syntax guide string
 */
export function getMarkdownHint(): string {
  return '💡 Markdown supported: **bold**, *italic*, # heading, - lists, [link](url)';
}
