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
  /** Optional inline styles */
  style?: React.CSSProperties;
}

export default function ColoredCard({
  accentColor,
  className = '',
  children,
  onClick,
  hoverable = true,
  style
}: ColoredCardProps) {
  const combinedStyle = {
    ...style,
    ...(accentColor ? { borderLeftColor: accentColor } : {})
  };

  return (
    <div
      className={`${styles.coloredCard} ${hoverable ? styles.hoverable : ''} ${className}`}
      style={combinedStyle}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
