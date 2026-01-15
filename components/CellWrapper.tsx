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

  // WHAT: Measure and reduce font size for CellWrapper titles if they exceed available space
  // WHY: Titles must fit within allocated space per Layout Grammar
  // HOW: Measure title height and reduce font size if content exceeds space
  useEffect(() => {
    if (title && titleZoneRef.current && typeof window !== 'undefined') {
      const measureAndReduceFontSize = () => {
        try {
          const titleZone = titleZoneRef.current;
          const titleElement = titleZone?.querySelector(`.${styles.title}`) as HTMLElement;
          if (!titleZone || !titleElement) return;

          const zoneHeight = titleZone.offsetHeight;
          if (zoneHeight <= 0) return;

          const actualTitleHeight = titleElement.offsetHeight;
          const computedStyle = window.getComputedStyle(titleZone);
          const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
          const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
          const availableTitleHeight = zoneHeight - paddingTop - paddingBottom;

          const tolerance = 2;
          if (actualTitleHeight > availableTitleHeight + tolerance && availableTitleHeight > 0) {
            const titleComputedStyle = window.getComputedStyle(titleElement);
            const currentFontSize = parseFloat(titleComputedStyle.fontSize) || 16;
            const lineHeight = parseFloat(titleComputedStyle.lineHeight) || 1.25;

            const safetyMargin = 0.95;
            const scaleFactor = (availableTitleHeight / actualTitleHeight) * safetyMargin;
            const newFontSize = currentFontSize * scaleFactor;

            if (scaleFactor < 0.95 && newFontSize > 8) {
              titleElement.style.setProperty('font-size', `${newFontSize}px`, 'important');
            }
          }
        } catch (error) {
          console.error('[CellWrapper] Unexpected error during title font size reduction:', error);
        }
      };

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

  // WHAT: Measure and reduce font size for CellWrapper subtitles if they exceed available space
  // WHY: Subtitles must fit within allocated space per Layout Grammar
  // HOW: Measure subtitle height and reduce font size if content exceeds space
  useEffect(() => {
    if (subtitle && subtitleZoneRef.current && typeof window !== 'undefined') {
      const measureAndReduceFontSize = () => {
        try {
          const subtitleZone = subtitleZoneRef.current;
          const subtitleElement = subtitleZone?.querySelector(`.${styles.subtitle}`) as HTMLElement;
          if (!subtitleZone || !subtitleElement) return;

          const zoneHeight = subtitleZone.offsetHeight;
          if (zoneHeight <= 0) return;

          const actualSubtitleHeight = subtitleElement.offsetHeight;
          const computedStyle = window.getComputedStyle(subtitleZone);
          const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
          const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
          const availableSubtitleHeight = zoneHeight - paddingTop - paddingBottom;

          const tolerance = 2;
          if (actualSubtitleHeight > availableSubtitleHeight + tolerance && availableSubtitleHeight > 0) {
            const subtitleComputedStyle = window.getComputedStyle(subtitleElement);
            const currentFontSize = parseFloat(subtitleComputedStyle.fontSize) || 16;
            const lineHeight = parseFloat(subtitleComputedStyle.lineHeight) || 1.4;

            const safetyMargin = 0.95;
            const scaleFactor = (availableSubtitleHeight / actualSubtitleHeight) * safetyMargin;
            const newFontSize = currentFontSize * scaleFactor;

            if (scaleFactor < 0.95 && newFontSize > 8) {
              subtitleElement.style.setProperty('font-size', `${newFontSize}px`, 'important');
            }
          }
        } catch (error) {
          console.error('[CellWrapper] Unexpected error during subtitle font size reduction:', error);
        }
      };

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
