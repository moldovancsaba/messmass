import React from 'react';

interface StandardStateProps {
  variant: 'loading' | 'empty' | 'error';
  title?: string;
  message?: string;
  icon?: string; // emoji/icon string
  children?: React.ReactNode;
}

// WHAT: Unified error/empty/loading state component for consistent UX across pages
// WHY: Standardize visuals and behavior per project documentation
export default function StandardState({ variant, title, message, icon, children }: StandardStateProps) {
  const palette = {
    loading: { bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.2)', color: '#4f46e5' },
    empty: { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.3)', color: '#475569' },
    error: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', color: '#ef4444' },
  }[variant];

  return (
    <div className="admin-card" style={{
      padding: '2rem',
      textAlign: 'center',
      background: palette.bg,
      border: `1px solid ${palette.border}`,
      color: palette.color,
      borderRadius: '12px'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon || (variant === 'error' ? '❌' : variant === 'empty' ? '📭' : '⏳')}</div>
      {title && <h2 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>{title}</h2>}
      {message && <p style={{ margin: 0, color: '#6b7280' }}>{message}</p>}
      {children}
    </div>
  );
}
