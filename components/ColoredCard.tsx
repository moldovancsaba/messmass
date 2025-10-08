/* WHAT: Centralized colored card component with left border accent
 * WHY: Single source of truth for all admin cards with colored borders
 * HOW: Reusable component used by dashboard, categories, hashtags, and any future cards
 */

import React from 'react';
import styles from './ColoredCard.module.css';

interface ColoredCardProps {
  /** Color for the left border accent */
  accentColor: string;
  /** Optional CSS class names */
  className?: string;
  /** Card content */
  children: React.ReactNode;
  /** Optional click handler */
  onClick?: () => void;
  /** Optional hover effect */
  hoverable?: boolean;
}

export default function ColoredCard({
  accentColor,
  className = '',
  children,
  onClick,
  hoverable = true
}: ColoredCardProps) {
  return (
    <div
      className={`${styles.coloredCard} ${hoverable ? styles.hoverable : ''} ${className}`}
      style={{ borderLeftColor: accentColor }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
