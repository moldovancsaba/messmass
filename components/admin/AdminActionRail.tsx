// components/admin/AdminActionRail.tsx
// WHAT: Shared admin action surface for list rows, cards, and custom mobile stacks
// WHY: Guarantees visible, accessible actions in mobile portrait without per-page button drift

'use client';

import React from 'react';
import type { AdminSurfaceAction } from '@/lib/adminDataAdapters';
import MaterialIcon from '@/components/MaterialIcon';
import styles from './AdminActionRail.module.css';

type AdminActionRailMode = 'card' | 'list-row' | 'header' | 'inline';

interface AdminActionRailProps<T> {
  actions?: AdminSurfaceAction<T>[];
  item: T;
  mode?: AdminActionRailMode;
  maxVisibleActions?: number;
  emptyStateLabel?: string;
  className?: string;
}

function resolveValue<T, V>(
  value: V | ((item: T) => V) | undefined,
  item: T
): V | undefined {
  return typeof value === 'function' ? (value as (item: T) => V)(item) : value;
}

function isMaterialIconName(icon: string): boolean {
  return /^[a-z0-9_]+$/.test(icon);
}

// Takes the already-resolved icon string, not the possibly-function field.
function renderIcon(icon: string | undefined) {
  if (!icon) return null;

  return isMaterialIconName(icon) ? (
    <MaterialIcon name={icon} variant="outlined" className={styles.icon} />
  ) : (
    <span className={styles.emojiIcon} aria-hidden="true">
      {icon}
    </span>
  );
}

function getPriority<T>(action: AdminSurfaceAction<T>) {
  if (action.priority) return action.priority;
  if (action.variant === 'danger') return 'danger';
  if (action.variant === 'primary') return 'primary';
  return 'secondary';
}

function orderActions<T>(actions: AdminSurfaceAction<T>[]) {
  const rank = {
    primary: 0,
    secondary: 1,
    overflow: 2,
    danger: 3,
  } as const;

  return [...actions].sort((a, b) => rank[getPriority(a)] - rank[getPriority(b)]);
}

export default function AdminActionRail<T>({
  actions = [],
  item,
  mode = 'inline',
  maxVisibleActions = mode === 'header' ? 3 : 2,
  emptyStateLabel,
  className = '',
}: AdminActionRailProps<T>) {
  const orderedActions = orderActions(actions);
  const preferredVisible = orderedActions.filter((action) => {
    const priority = getPriority(action);
    return priority === 'primary' || priority === 'secondary';
  });

  const visibleActions = preferredVisible.slice(0, maxVisibleActions);
  const overflowActions = orderedActions.filter((action) => !visibleActions.includes(action));
  const fallbackVisibleActions = visibleActions.length > 0
    ? visibleActions
    : orderedActions.slice(0, Math.min(1, maxVisibleActions));
  const fallbackOverflowActions = visibleActions.length > 0
    ? overflowActions
    : orderedActions.slice(fallbackVisibleActions.length);

  if (orderedActions.length === 0) {
    return emptyStateLabel ? (
      <div className={`${styles.emptyState} ${className}`} aria-live="polite">
        {emptyStateLabel}
      </div>
    ) : null;
  }

  const renderButton = (action: AdminSurfaceAction<T>, location: 'visible' | 'overflow') => {
    const disabled = Boolean(resolveValue(action.disabled, item));
    // Every per-row field must be resolved before it reaches the DOM: a raw
    // function renders as nothing, which is what made these buttons look blank.
    const label = resolveValue(action.label, item);
    const mobileLabel = resolveValue(action.mobileLabel, item);
    const title = resolveValue(action.title, item);
    const icon = resolveValue(action.icon, item);
    const variant = resolveValue(action.variant, item) || 'secondary';
    const ariaLabel = resolveValue(action.ariaLabel, item) || title || label;
    const priority = getPriority(action);

    return (
      <button
        key={`${location}-${label}`}
        type="button"
        className={`
          ${styles.actionButton}
          ${styles[`variant-${variant}`]}
          ${styles[`priority-${priority}`]}
          ${action.className || ''}
        `}
        title={title || label}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          if (!disabled) {
            action.handler(item);
          }
        }}
      >
        {renderIcon(icon)}
        <span className={styles.label}>{mobileLabel || label}</span>
      </button>
    );
  };

  return (
    <div
      className={`${styles.rail} ${styles[`mode-${mode}`]} ${className}`}
      data-admin-action-rail={mode}
    >
      <div className={styles.visibleActions}>
        {fallbackVisibleActions.map((action) => renderButton(action, 'visible'))}
      </div>

      {fallbackOverflowActions.length > 0 && (
        <details className={styles.overflow}>
          <summary className={styles.overflowSummary} aria-label="Show more actions">
            <MaterialIcon name="more_horiz" variant="outlined" className={styles.icon} />
            <span>More</span>
          </summary>
          <div className={styles.overflowMenu}>
            {fallbackOverflowActions.map((action) => renderButton(action, 'overflow'))}
          </div>
        </details>
      )}
    </div>
  );
}
