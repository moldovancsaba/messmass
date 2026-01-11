// components/CellWrapper.tsx
// WHAT: Enforce 3-zone cell structure per Report Layout Spec v2.0
// WHY: Titles, subtitles, and body zones must be distinct and aligned across block

import React, { ReactNode } from 'react';
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
  return (
    <div 
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
        <div className={styles.titleZone}>
          <h3 className={styles.title}>{title}</h3>
        </div>
      )}

      {/* Subtitle Zone - max 2 lines, synced font size */}
      {subtitle && (
        <div className={styles.subtitleZone}>
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
