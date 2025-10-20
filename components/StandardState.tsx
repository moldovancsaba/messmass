import React from 'react';
import ColoredCard from './ColoredCard';
import styles from './StandardState.module.css';

interface StandardStateProps {
  variant: 'loading' | 'empty' | 'error';
  title?: string;
  message?: string;
  icon?: string; // emoji/icon string
  children?: React.ReactNode;
}

// WHAT: Unified error/empty/loading state component for consistent UX across pages
// WHY: Standardize visuals and behavior per project documentation
// REFACTORED: Now uses ColoredCard component instead of CSS classes
export default function StandardState({ variant, title, message, icon, children }: StandardStateProps) {
  // Map variant to accent color for ColoredCard
  const accentColor = {
    loading: '#6366f1', // Indigo
    empty: '#94a3b8',   // Slate
    error: '#ef4444',   // Red
  }[variant];

  return (
    <ColoredCard accentColor={accentColor} className={styles.stateCard}>
      <div className={styles.stateIcon}>{icon || (variant === 'error' ? '❌' : variant === 'empty' ? '📭' : '⏳')}</div>
      {title && <h2 className={styles.stateTitle}>{title}</h2>}
      {message && <p className={styles.stateMessage}>{message}</p>}
      {children}
    </ColoredCard>
  );
}
