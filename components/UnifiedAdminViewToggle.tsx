// components/UnifiedAdminViewToggle.tsx
// WHAT: Toggle button component for switching between list and card views
// WHY: Provides consistent view-switching UI across all admin pages
// DESIGN SYSTEM: Uses design tokens from theme.css, accessible ARIA labels

'use client';

import React from 'react';
import styles from './UnifiedAdminViewToggle.module.css';

export type ViewMode = 'list' | 'card';

interface UnifiedAdminViewToggleProps {
  /** Current active view mode */
  currentView: ViewMode;
  /** Callback when view mode changes */
  onViewChange: (view: ViewMode) => void;
  /** Optional CSS class for additional styling */
  className?: string;
}

/**
 * WHAT: Accessible toggle button for switching between list and card views
 * WHY: Provides consistent UX for view mode switching across all admin pages
 * 
 * @example
 * <UnifiedAdminViewToggle
 *   currentView={viewMode}
 *   onViewChange={setViewMode}
 * />
 */
export default function UnifiedAdminViewToggle({
  currentView,
  onViewChange,
  className = '',
}: UnifiedAdminViewToggleProps) {
  return (
    <div 
      className={`${styles.toggleContainer} ${className}`}
      role="group"
      aria-label="View mode selector"
    >
      {/* WHAT: List view button */}
      {/* WHY: Activate table-based list layout */}
      <button
        type="button"
        onClick={() => onViewChange('list')}
        className={`${styles.toggleButton} ${currentView === 'list' ? styles.active : ''}`}
        aria-label="List view"
        aria-pressed={currentView === 'list'}
        title="Switch to list view"
      >
        <span className={styles.icon} aria-hidden="true">☰</span>
        <span className={styles.label}>List</span>
      </button>

      {/* WHAT: Card view button */}
      {/* WHY: Activate grid-based card layout */}
      <button
        type="button"
        onClick={() => onViewChange('card')}
        className={`${styles.toggleButton} ${currentView === 'card' ? styles.active : ''}`}
        aria-label="Card view"
        aria-pressed={currentView === 'card'}
        title="Switch to card view"
      >
        <span className={styles.icon} aria-hidden="true">▦</span>
        <span className={styles.label}>Cards</span>
      </button>
    </div>
  );
}
