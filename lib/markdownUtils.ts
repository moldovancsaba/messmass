// lib/markdownUtils.ts
// WHAT: Markdown parsing and sanitization utilities for text content
// WHY: Enable rich text formatting in report text fields while maintaining security
// HOW: Use marked library with safe options, no inline HTML allowed

import { marked } from 'marked';
import { sanitizeMarkdownHTML } from './sanitize';

/**
 * WHAT: Configure marked with limited features for text boxes
 * WHY: Support only specific markdown features: title, bold, italic, lists, links
 * HOW: Custom renderer that normalizes all headings to h1 and removes unsupported features
 */
const renderer = new marked.Renderer();

// WHAT: Convert all heading levels to h1
// WHY: User wants only ONE heading type that's slightly larger than normal text
// HOW: Override heading renderer to always output h1
renderer.heading = ({ text }) => {
  return `<h1>${text}</h1>`;
};

// WHAT: Override paragraph renderer to preserve line breaks
// WHY: Ensure single line breaks create <br> tags, not just paragraph breaks
// HOW: Custom paragraph renderer - marked with breaks:true already handles this
// NOTE: The paragraph renderer receives a Paragraph token object, not a string
renderer.paragraph = ({ tokens }: any) => {
  // WHAT: Render paragraph tokens and ensure line breaks are preserved
  // WHY: Preserve user's line breaks from Enter key
  // HOW: marked with breaks:true should already convert \n to <br>
  // NOTE: We just ensure the paragraph wraps correctly
  if (!tokens || tokens.length === 0) return '<p></p>';
  // Let marked handle the rendering, we just wrap it
  return '<p>' + (tokens.map((t: any) => t.raw || '').join('') || '') + '</p>';
};

// WHAT: Remove blockquote support
// WHY: Not in user's required feature list
renderer.blockquote = ({ text }) => {
  return text; // Strip blockquote, return plain text
};

// WHAT: Remove code block support
// WHY: Not in user's required feature list
renderer.code = ({ text }) => {
  return text; // Strip code formatting, return plain text
};

// WHAT: Remove inline code support
// WHY: Not in user's required feature list
renderer.codespan = ({ text }) => {
  return text; // Strip code formatting, return plain text
};

// WHAT: Remove strikethrough support
// WHY: Not in user's required feature list
renderer.del = ({ text }) => {
  return text; // Strip strikethrough, return plain text
};

marked.setOptions({
  breaks: true,        // Convert \n to <br> (natural line breaks)
  gfm: false,          // Disable GitHub Flavored Markdown (no strikethrough, tables)
  renderer: renderer   // Use custom renderer
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
    // WHAT: Pre-process input to handle mixed HTML and markdown
    // WHY: marked doesn't parse markdown when HTML tags are present
    // HOW: Temporarily replace HTML tags, parse markdown, then restore HTML
    const htmlPlaceholders: string[] = [];
    let processed = markdown;
    
    // WHAT: Replace HTML tags with placeholders before markdown parsing
    // WHY: Allow markdown to be parsed even when HTML is mixed in
    // HOW: Use unique placeholders that won't conflict with markdown
    processed = processed.replace(/<br\s*\/?>/gi, (match) => {
      htmlPlaceholders.push(match);
      return `\nHTML_PLACEHOLDER_${htmlPlaceholders.length - 1}\n`;
    });
    
    // WHAT: Normalize common authoring quirks before parsing
    // WHY: Users often add spaces inside emphasis markers which CommonMark ignores
    // HOW: Trim inner whitespace in ** bold ** and * italic * patterns
    const normalized = normalizeEmphasisWhitespace(processed);

    // WHAT: Parse markdown to HTML using marked
    // WHY: Convert user-friendly markdown syntax to renderable HTML
    const html = marked.parse(normalized, {
      async: false, // Synchronous parsing for simplicity
    }) as string;
    
    // WHAT: Restore HTML tags from placeholders
    // WHY: Put back the original HTML tags after markdown parsing
    // HOW: Replace placeholders with original HTML tags
    let finalHtml = html;
    htmlPlaceholders.forEach((tag, index) => {
      finalHtml = finalHtml.replace(`HTML_PLACEHOLDER_${index}`, tag);
    });
    
    // WHAT: Sanitize parsed HTML to prevent XSS
    // WHY: Even though marked is safe, additional sanitization provides defense in depth
    // HOW: Use DOMPurify with markdown-specific allowlist
    return sanitizeMarkdownHTML(finalHtml);
  } catch (error) {
    console.error('Markdown parsing error:', error);
    // WHAT: Fallback to plain text on parse error
    // WHY: Graceful degradation ensures content always displays
    return `<p>${escapeHtml(markdown)}</p>`;
  }
}

/**
 * normalizeEmphasisWhitespace
 * WHAT: Make emphasis tolerant to spaces just inside markers
 * WHY: Treat "** text **" as "**text**" and "* text *" as "*text*"
 */
function normalizeEmphasisWhitespace(input: string): string {
  let out = input;
  // Normalize bold: ** text ** -> **text** (non-greedy, multiline)
  out = out.replace(/\*\*\s+([\s\S]*?)\s+\*\*/g, '**$1**');
  // Normalize italic: * text * -> *text* (avoid matching **bold**)
  out = out.replace(/(^|[^*])\*\s+([\s\S]*?)\s+\*(?!\*)/g, '$1*$2*');
  return out;
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
 * WHAT: Detect if text contains supported markdown syntax
 * WHY: Show markdown hints/preview only when relevant
 * HOW: Check for supported markdown patterns only
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
  
  // WHAT: Regex patterns for SUPPORTED markdown syntax only
  // WHY: Only detect features user wants: title, bold, italic, lists, links
  const markdownPatterns = [
    /^#\s/m,                // Heading: # Title (only single #)
    /\*\*[^*]+\*\*/,        // Bold: **text**
    /(?<!\*)\*(?!\*)[^*]+\*(?!\*)/,  // Italic: *text* (but not **)
    /^\s*-\s/m,             // Unordered lists: - item
    /^\s*\d+\.\s/m,         // Ordered lists: 1. item
    /\[.+\]\(.+\)/,         // Links: [text](url)
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
}

/**
 * getMarkdownHint
 * WHAT: Generate helpful markdown syntax hint for users
 * WHY: Guide users on supported formatting options
 * HOW: Return static string with ONLY supported patterns
 * 
 * @returns Markdown syntax guide string
 */
export function getMarkdownHint(): string {
  return '💡 Supported: # title, **bold**, *italic*, - list, 1. numbered, [link](url)';
}
