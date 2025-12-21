// components/CellWrapper.tsx
// WHAT: Enforce 3-zone cell structure per Report Layout Spec v2.0
// WHY: Titles, subtitles, and body zones must be distinct and aligned across block

import React, { ReactNode } from 'react';
import styles from './CellWrapper.module.css';

export interface CellWrapperProps {
  title?: string;
  subtitle?: string;
  titleFontSize?: number; // px, synced at block level
  subtitleFontSize?: number; // px, synced at block level
  titleHeight?: number; // px, fixed per block
  subtitleHeight?: number; // px, fixed per block
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
  titleFontSize,
  subtitleFontSize,
  titleHeight,
  subtitleHeight,
  children,
  className = ''
}: CellWrapperProps) {
  return (
    <div className={`${styles.cellWrapper} ${className}`}>
      {/* Title Zone - max 2 lines, synced font size */}
      {title && (
        <div 
          className={styles.titleZone}
          // WHAT: Dynamic fontSize and height from block-level props
          // WHY: Report Layout Spec v2.0 requires synchronized title sizing across cells
          // eslint-disable-next-line react/forbid-dom-props
          style={{
            fontSize: titleFontSize ? `${titleFontSize}px` : undefined,
            height: titleHeight ? `${titleHeight}px` : undefined
          }}
        >
          <h3 className={styles.title}>{title}</h3>
        </div>
      )}

      {/* Subtitle Zone - max 2 lines, synced font size */}
      {subtitle && (
        <div 
          className={styles.subtitleZone}
          // WHAT: Dynamic fontSize and height from block-level props
          // WHY: Report Layout Spec v2.0 requires synchronized subtitle sizing across cells
          // eslint-disable-next-line react/forbid-dom-props
          style={{
            fontSize: subtitleFontSize ? `${subtitleFontSize}px` : undefined,
            height: subtitleHeight ? `${subtitleHeight}px` : undefined
          }}
        >
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
