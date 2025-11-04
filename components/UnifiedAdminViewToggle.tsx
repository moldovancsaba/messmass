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
      {/* WHAT: List view button with unified hero button style
           WHY: Consistency with other action buttons using btn btn-small classes */}
      <button
        type="button"
        onClick={() => onViewChange('list')}
        className={`btn btn-small ${currentView === 'list' ? 'btn-secondary' : styles.inactive}`}
        aria-label="List view"
        aria-pressed={currentView === 'list'}
        title="Switch to list view"
      >
        <span aria-hidden="true">☰</span>
        <span>List</span>
      </button>

      {/* WHAT: Card view button with unified hero button style
           WHY: Consistency with other action buttons using btn btn-small classes */}
      <button
        type="button"
        onClick={() => onViewChange('card')}
        className={`btn btn-small ${currentView === 'card' ? 'btn-secondary' : styles.inactive}`}
        aria-label="Card view"
        aria-pressed={currentView === 'card'}
        title="Switch to card view"
      >
        <span aria-hidden="true">▦</span>
        <span>Cards</span>
      </button>
    </div>
  );
}
