/* WHAT: Centralized colored card component with left border accent
 * WHY: Single source of truth for all admin cards with colored borders
 * HOW: Reusable component used by dashboard, categories, hashtags, and any future cards
 */

import React from 'react';
import styles from './ColoredCard.module.css';

interface ColoredCardProps {
  /** Optional color for the left border accent (default: transparent/no accent) */
  accentColor?: string;
  /** Optional CSS class names */
  className?: string;
  /** Card content */
  children: React.ReactNode;
  /** Optional click handler */
  onClick?: () => void;
  /** Optional hover effect */
  hoverable?: boolean;
  /** Optional data attributes (e.g., data-pdf-block) */
  [key: string]: any;
}

export default function ColoredCard({
  accentColor,
  className = '',
  children,
  onClick,
  hoverable = true,
  ...rest
}: ColoredCardProps) {
  // WHAT: Only use CSS variables for dynamic styling (ESLint compliant)
  // WHY: Avoid inline style props while supporting dynamic accent colors
  // CRITICAL: Validate accentColor is a non-empty string before setting CSS variable
  // BUG FIX: React calls .trim() on CSS variable values, crashes if undefined/null
  const cssVars = (accentColor && typeof accentColor === 'string' && accentColor.trim()) 
    ? { '--accent-color': accentColor } as React.CSSProperties 
    : undefined;

  // WHAT: Filter out data attributes from rest props
  // WHY: Pass through data-* attributes for PDF export and other purposes
  const dataAttrs = Object.keys(rest)
    .filter(key => key.startsWith('data-'))
    .reduce((obj, key) => ({ ...obj, [key]: rest[key] }), {});

  return (
    // WHAT: Dynamic accent color via CSS variable (legitimate inline style)
    // WHY: accentColor prop is data-driven, must be set at runtime
    <div
      className={`${styles.coloredCard} ${hoverable ? styles.hoverable : ''} ${className}`}
      style={cssVars} // eslint-disable-line react/forbid-dom-props
      onClick={onClick}
      {...dataAttrs}
    >
      {children}
    </div>
  );
}
