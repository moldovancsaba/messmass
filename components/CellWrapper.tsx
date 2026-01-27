// components/CellWrapper.tsx
// WHAT: Enforce 3-zone cell structure per Report Layout Spec v2.0
// WHY: Titles, subtitles, and body zones must be distinct and aligned across block

import React, { ReactNode, useEffect, useRef } from 'react';
import styles from './CellWrapper.module.css';

export interface CellWrapperProps {
  title?: string;
  subtitle?: string;
  // WHAT: P1 1.5 Phase 3 - Removed titleFontSize and subtitleFontSize props
  // WHY: CSS now uses --block-base-font-size and --block-subtitle-font-size directly (Phase 2)
  titleHeight?: number; // px, fixed per block
  subtitleHeight?: number; // px, fixed per block
  blockHeight?: number; // px, calculated block height (Phase 3)
  children: ReactNode; // Body zone content
  className?: string;
}

/**
 * WHAT: 3-zone cell wrapper (title | subtitle | body)
 * WHY: Spec requires titles/subtitles to align horizontally; body fills remaining space
 * HOW: CSS Grid with fixed title/subtitle rows, body row flexes
 */
export default function CellWrapper({
  title,
  subtitle,
  // WHAT: P1 1.5 Phase 3 - Removed titleFontSize and subtitleFontSize parameters
  // WHY: CSS now uses --block-base-font-size and --block-subtitle-font-size directly (Phase 2)
  titleHeight,
  subtitleHeight,
  blockHeight,
  children,
  className = ''
}: CellWrapperProps) {
  const titleZoneRef = useRef<HTMLDivElement>(null);
  const subtitleZoneRef = useRef<HTMLDivElement>(null);
  const cellWrapperRef = useRef<HTMLDivElement>(null);

  // WHAT: Enhanced measurement and font size reduction for CellWrapper titles
  // WHY: Titles must fit within allocated space per Layout Grammar, with better accuracy
  // HOW: Use more accurate measurements and smarter font size reduction
  useEffect(() => {
    if (title && titleZoneRef.current && typeof window !== 'undefined') {
      const measureAndReduceFontSize = () => {
        try {
          const titleZone = titleZoneRef.current;
          const titleElement = titleZone?.querySelector(`.${styles.title}`) as HTMLElement;
          if (!titleZone || !titleElement) return;

          const zoneHeight = titleZone.offsetHeight;
          if (zoneHeight <= 0) return;

          // WHAT: More accurate height measurement accounting for line-height
          // WHY: Need to consider actual text rendering, not just element height
          // HOW: Use scrollHeight for actual content height, account for line-height
          const actualTitleHeight = titleElement.scrollHeight;
          const computedStyle = window.getComputedStyle(titleZone);
          const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
          const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
          const availableTitleHeight = zoneHeight - paddingTop - paddingBottom;

          // WHAT: Tighter tolerance for better fit
          // WHY: Reduce chance of overflow while allowing natural text flow
          const tolerance = 1;
          if (actualTitleHeight > availableTitleHeight + tolerance && availableTitleHeight > 0) {
            const titleComputedStyle = window.getComputedStyle(titleElement);
            const currentFontSize = parseFloat(titleComputedStyle.fontSize) || 16;

            // WHAT: More conservative scaling with better minimum
            // WHY: Prevent text from becoming too small while ensuring fit
            // HOW: Use 0.9 safety margin and higher minimum font size
            const safetyMargin = 0.9;
            const scaleFactor = (availableTitleHeight / actualTitleHeight) * safetyMargin;
            const newFontSize = currentFontSize * scaleFactor;

            // WHAT: Higher minimum font size for better readability
            // WHY: 8px is too small, 10px is more readable
            const minFontSize = 10;
            if (scaleFactor < 0.95 && newFontSize >= minFontSize) {
              titleElement.style.setProperty('font-size', `${Math.max(minFontSize, newFontSize)}px`, 'important');
              
              // WHAT: Log when font size reduction occurs for debugging
              // WHY: Help identify problematic titles that need attention
              console.log(`[CellWrapper] Title font reduced: "${title}" from ${currentFontSize}px to ${Math.max(minFontSize, newFontSize)}px`);
            }
          }
        } catch (error) {
          console.error('[CellWrapper] Unexpected error during title font size reduction:', error);
        }
      };

      // WHAT: Immediate measurement plus delayed measurement for layout stability
      // WHY: Some layouts need time to stabilize before accurate measurement
      measureAndReduceFontSize();
      const timeoutId = setTimeout(measureAndReduceFontSize, 100);

      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(measureAndReduceFontSize);
      });

      if (titleZoneRef.current) {
        resizeObserver.observe(titleZoneRef.current);
      }

      const mutationObserver = new MutationObserver(() => {
        requestAnimationFrame(measureAndReduceFontSize);
      });

      if (titleZoneRef.current) {
        mutationObserver.observe(titleZoneRef.current, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }

      return () => {
        clearTimeout(timeoutId);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    }
  }, [title]);

  // WHAT: Enhanced measurement and font size reduction for CellWrapper subtitles
  // WHY: Subtitles must fit within allocated space per Layout Grammar, with better accuracy
  // HOW: Use more accurate measurements and smarter font size reduction
  useEffect(() => {
    if (subtitle && subtitleZoneRef.current && typeof window !== 'undefined') {
      const measureAndReduceFontSize = () => {
        try {
          const subtitleZone = subtitleZoneRef.current;
          const subtitleElement = subtitleZone?.querySelector(`.${styles.subtitle}`) as HTMLElement;
          if (!subtitleZone || !subtitleElement) return;

          const zoneHeight = subtitleZone.offsetHeight;
          if (zoneHeight <= 0) return;

          // WHAT: More accurate height measurement accounting for line-height
          // WHY: Need to consider actual text rendering, not just element height
          // HOW: Use scrollHeight for actual content height, account for line-height
          const actualSubtitleHeight = subtitleElement.scrollHeight;
          const computedStyle = window.getComputedStyle(subtitleZone);
          const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
          const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
          const availableSubtitleHeight = zoneHeight - paddingTop - paddingBottom;

          // WHAT: Tighter tolerance for better fit
          // WHY: Reduce chance of overflow while allowing natural text flow
          const tolerance = 1;
          if (actualSubtitleHeight > availableSubtitleHeight + tolerance && availableSubtitleHeight > 0) {
            const subtitleComputedStyle = window.getComputedStyle(subtitleElement);
            const currentFontSize = parseFloat(subtitleComputedStyle.fontSize) || 16;

            // WHAT: More conservative scaling with better minimum
            // WHY: Prevent text from becoming too small while ensuring fit
            // HOW: Use 0.9 safety margin and higher minimum font size
            const safetyMargin = 0.9;
            const scaleFactor = (availableSubtitleHeight / actualSubtitleHeight) * safetyMargin;
            const newFontSize = currentFontSize * scaleFactor;

            // WHAT: Higher minimum font size for better readability
            // WHY: 8px is too small, 9px is more readable for subtitles
            const minFontSize = 9;
            if (scaleFactor < 0.95 && newFontSize >= minFontSize) {
              subtitleElement.style.setProperty('font-size', `${Math.max(minFontSize, newFontSize)}px`, 'important');
              
              // WHAT: Log when font size reduction occurs for debugging
              // WHY: Help identify problematic subtitles that need attention
              console.log(`[CellWrapper] Subtitle font reduced: "${subtitle}" from ${currentFontSize}px to ${Math.max(minFontSize, newFontSize)}px`);
            }
          }
        } catch (error) {
          console.error('[CellWrapper] Unexpected error during subtitle font size reduction:', error);
        }
      };

      // WHAT: Immediate measurement plus delayed measurement for layout stability
      // WHY: Some layouts need time to stabilize before accurate measurement
      measureAndReduceFontSize();
      const timeoutId = setTimeout(measureAndReduceFontSize, 100);

      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(measureAndReduceFontSize);
      });

      if (subtitleZoneRef.current) {
        resizeObserver.observe(subtitleZoneRef.current);
      }

      const mutationObserver = new MutationObserver(() => {
        requestAnimationFrame(measureAndReduceFontSize);
      });

      if (subtitleZoneRef.current) {
        mutationObserver.observe(subtitleZoneRef.current, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }

      return () => {
        clearTimeout(timeoutId);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    }
  }, [subtitle]);

  return (
    <div 
      ref={cellWrapperRef}
      className={`${styles.cellWrapper} ${className}`}
      // WHAT: Set CSS custom properties for dynamic values (blockHeight now centrally managed at row level)
      // WHY: CSS variables are meant to be set dynamically, eliminates direct property inline styles
      // HOW: CSS modules reference these custom properties - block-height inherited from parent row
      // WHAT: P1 1.5 Phase 3 - Removed --title-font-size and --subtitle-font-size CSS custom properties
      // WHY: CSS now uses --block-base-font-size and --block-subtitle-font-size directly (Phase 2)
      // eslint-disable-next-line react/forbid-dom-props
      style={{
        '--title-height': titleHeight ? `${titleHeight}px` : undefined,
        '--subtitle-height': subtitleHeight ? `${subtitleHeight}px` : undefined
      } as React.CSSProperties}
    >
      {/* Title Zone - max 2 lines, synced font size */}
      {title && (
        <div ref={titleZoneRef} className={styles.titleZone}>
          <h3 className={styles.title}>{title}</h3>
        </div>
      )}

      {/* Subtitle Zone - max 2 lines, synced font size */}
      {subtitle && (
        <div ref={subtitleZoneRef} className={styles.subtitleZone}>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      )}

      {/* Body Zone - chart/content fills remaining space */}
      <div className={styles.bodyZone}>
        {children}
      </div>
    </div>
  );
}
