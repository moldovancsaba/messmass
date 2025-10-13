import React from 'react';
import ColoredCard from './ColoredCard';

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
    <ColoredCard accentColor={accentColor} style={{
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon || (variant === 'error' ? '❌' : variant === 'empty' ? '📭' : '⏳')}</div>
      {title && <h2 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>{title}</h2>}
      {message && <p style={{ margin: 0, color: '#6b7280' }}>{message}</p>}
      {children}
    </ColoredCard>
  );
}
