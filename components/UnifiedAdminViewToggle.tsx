// components/UnifiedAdminViewToggle.tsx
// WHAT: Toggle button component for switching between list and card views
// WHY: Provides consistent view-switching UI across all admin pages
// DESIGN SYSTEM: Uses design tokens from theme.css, accessible ARIA labels

'use client';

import React from 'react';
import { Button, Group } from '@mantine/core';
import { IconLayoutGrid, IconList } from '@tabler/icons-react';
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
  const buttonClass = (view: ViewMode) =>
    `btn btn-small ${currentView === view ? 'btn-secondary' : styles.inactive}`;

  return (
    <Group
      className={`${styles.toggleContainer} ${className}`}
      role="group"
      aria-label="View mode selector"
      gap="xs"
      wrap="nowrap"
    >
      <Button
        onClick={() => onViewChange('list')}
        className={buttonClass('list')}
        aria-label="List view"
        aria-pressed={currentView === 'list'}
        title="Switch to list view"
        variant="filled"
        size="sm"
        leftSection={<IconList size={16} stroke={1.8} />}
      >
        <span>List</span>
      </Button>

      <Button
        onClick={() => onViewChange('card')}
        className={buttonClass('card')}
        aria-label="Card view"
        aria-pressed={currentView === 'card'}
        title="Switch to card view"
        variant="filled"
        size="sm"
        leftSection={<IconLayoutGrid size={16} stroke={1.8} />}
      >
        <span>Cards</span>
      </Button>
    </Group>
  );
}
