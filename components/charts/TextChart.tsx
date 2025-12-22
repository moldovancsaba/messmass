// components/charts/TextChart.tsx
// WHAT: Display text content from reportText* variables with markdown support
// WHY: Partner reports need rich text display with formatting (bold, lists, links)
// HOW: Parse markdown to HTML, apply auto-scaling that works with formatted content

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { parseMarkdown } from '@/lib/markdownUtils';
import styles from './TextChart.module.css';

export interface TextChartProps {
  title: string;
  content: string;
  subtitle?: string;
  className?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1'; // WHAT: Text block aspect ratio for proper height calculation
  showTitle?: boolean; // WHAT: Controls title visibility on report page
}

export default function TextChart({ title, content, subtitle, className = '', aspectRatio = '1:1', showTitle = true }: TextChartProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null); // Changed from HTMLParagraphElement to support HTML content
  const [optimalFontSize, setOptimalFontSize] = useState('4cqh'); // Start with relative unit
  const [htmlContent, setHtmlContent] = useState(''); // Parsed markdown HTML

  /* WHAT: Calculate CSS aspect-ratio value from aspectRatio prop
     WHY: CSS aspect-ratio property requires "width / height" format
     HOW: Convert 16:9 → "16 / 9", 9:16 → "9 / 16", 1:1 → "1 / 1"
     CRITICAL: Coerce to string to prevent crashes on null/undefined/non-string */
  const safeAspectRatio = String(aspectRatio || '1:1');
  const cssAspectRatio = safeAspectRatio.replace(':', ' / ');

  // WHAT: Parse markdown on content change
  // WHY: Convert markdown to HTML for rendering
  // HOW: Use parseMarkdown utility with safe HTML output
  useEffect(() => {
    if (content) {
      const parsed = parseMarkdown(content);
      setHtmlContent(parsed);
    } else {
      setHtmlContent('');
    }
  }, [content]);

  // WHAT: Stable text scaling without flickering (works with HTML content)
  // WHY: Prevent visual flicker during font size calculations
  // HOW: Use hidden clone for measurements, apply final result once
  useEffect(() => {
    if (!contentRef.current || !textRef.current || !htmlContent) return;

    const calculateMaxFontSize = () => {
      const container = contentRef.current;
      const text = textRef.current;
      if (!container || !text) return;

      const containerRect = container.getBoundingClientRect();
      const availableWidth = containerRect.width - 16; // Account for padding
      const availableHeight = containerRect.height - 16;

      if (availableWidth <= 0 || availableHeight <= 0) return;

      // WHAT: Create hidden clone for measurements to prevent flickering
      // WHY: Avoid visual updates during binary search
      const clone = text.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.visibility = 'hidden';
      clone.style.top = '-9999px';
      clone.style.left = '-9999px';
      clone.style.width = `${availableWidth}px`;
      clone.style.whiteSpace = 'normal';
      clone.style.wordBreak = 'normal';
      clone.style.overflowWrap = 'normal';
      clone.style.hyphens = 'none';
      clone.style.lineHeight = '1.2';
      
      document.body.appendChild(clone);

      // WHAT: Binary search for maximum font size using hidden clone
      // WHY: Find largest text that fits without visual flickering
      let minSize = 8;
      let maxSize = 300;
      let optimalSize = 16;

      while (minSize <= maxSize) {
        const testSize = Math.floor((minSize + maxSize) / 2);
        clone.style.fontSize = `${testSize}px`;
        
        // Force reflow on hidden element
        clone.offsetHeight;
        
        const textHeight = clone.scrollHeight;
        const fitsHeight = textHeight <= availableHeight;
        
        if (fitsHeight) {
          optimalSize = testSize;
          minSize = testSize + 1; // Try larger
        } else {
          maxSize = testSize - 1; // Try smaller
        }
      }

      // Clean up clone
      document.body.removeChild(clone);

      // WHAT: Apply final font size once (no flickering)
      // WHY: Single update instead of multiple during search
      const containerWidth = containerRect.width;
      const relativeFontSize = (optimalSize / containerWidth) * 100;
      
      setOptimalFontSize(`${Math.min(relativeFontSize, 80)}cqw`);
    };

    // WHAT: Debounced calculation to prevent excessive updates
    // WHY: Avoid flickering from rapid resize events
    let timeoutId: NodeJS.Timeout;
    
    const debouncedCalculate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculateMaxFontSize, 150); // Longer delay for stability
    };

    // Initial calculation
    debouncedCalculate();

    // Recalculate on container resize with debouncing
    const resizeObserver = new ResizeObserver(debouncedCalculate);

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [htmlContent]); // Re-run when HTML content changes

  return (
    <div 
      className={`${styles.container} text-chart-container text-chart-override ${className}`}
      // WHAT: Dynamic aspect ratio from aspectRatio prop (16:9, 9:16, 1:1)
      // WHY: Text blocks need consistent aspect ratios for grid layout
      // eslint-disable-next-line react/forbid-dom-props
      style={{
        aspectRatio: cssAspectRatio
      } as React.CSSProperties}
    >
      {showTitle && (
        <div className={styles.header}>
          <h3 className={styles.title}>
            {title}
          </h3>
          {subtitle && (
            <p className={styles.subtitle}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div className={`${styles.content} text-chart-content`} ref={contentRef}>
        {htmlContent ? (
          <div className={styles.textWrapper}>
            {/* WHAT: Render markdown as HTML with auto-scaled font size */}
            {/* WHY: Support rich text formatting while maintaining responsive sizing */}
            {/* HOW: dangerouslySetInnerHTML with sanitized HTML from parseMarkdown */}
            <div 
              className={styles.text}
              ref={textRef}
              // WHAT: Dynamic fontSize from auto-scaling calculation
              // WHY: Text must scale to fill available space without overflow
              // HOW: Binary search finds max font size, applied as clamp for safety
              // eslint-disable-next-line react/forbid-dom-props
              style={{
                fontSize: `clamp(0.75rem, ${optimalFontSize}, 8rem)`
              }}
              // WHAT: Render parsed markdown HTML
              // WHY: Display formatted text (bold, italic, lists, links)
              // SECURITY: parseMarkdown sanitizes content (admin-controlled only)
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        ) : content ? (
          <div className={styles.textWrapper}>
            {/* WHAT: Fallback for plain text if markdown parsing fails */}
            <p className={styles.text}>{content}</p>
          </div>
        ) : (
          <p className={styles.placeholder}>
            No content available
          </p>
        )}
      </div>
    </div>
  );
}
