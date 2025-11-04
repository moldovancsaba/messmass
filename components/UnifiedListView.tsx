// components/UnifiedListView.tsx
// WHAT: Generic list view component for table-based data display
// WHY: Reusable table component with sorting, actions, and configurable columns
// DESIGN SYSTEM: Uses theme.css tokens, follows existing table patterns from /admin/partners

'use client';

import React from 'react';
import { ListViewConfig } from '@/lib/adminDataAdapters';
import MaterialIcon from '@/components/MaterialIcon';
import styles from './UnifiedListView.module.css';

interface UnifiedListViewProps<T> {
  /** Array of items to display */
  items: T[];
  /** List view configuration */
  config: ListViewConfig<T>;
  /** Current sort field */
  sortField?: string | null;
  /** Current sort order */
  sortOrder?: 'asc' | 'desc' | null;
  /** Sort change handler */
  onSortChange?: (field: string) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state icon */
  emptyIcon?: string;
  /** Optional CSS class */
  className?: string;
}

/**
 * WHAT: Generic table-based list view component
 * WHY: Consistent table UI across all admin pages with configurable columns
 * 
 * @example
 * <UnifiedListView
 *   items={partners}
 *   config={partnersAdapter.listConfig}
 *   sortField={sortField}
 *   sortOrder={sortOrder}
 *   onSortChange={handleSort}
 * />
 */
export default function UnifiedListView<T extends { _id: string }>({
  items,
  config,
  sortField,
  sortOrder,
  onSortChange,
  isLoading = false,
  emptyMessage = 'No items found',
  emptyIcon = '📋',
  className = '',
}: UnifiedListViewProps<T>) {
  
  // WHAT: Handle column header click for sorting
  // WHY: Three-state cycle: null → asc → desc → null
  const handleColumnClick = (column: typeof config.columns[0]) => {
    if (!column.sortable || !onSortChange) return;
    const field = column.sortField || column.key;
    onSortChange(field);
  };

  // WHAT: Render empty state
  // WHY: User feedback when no data available
  if (!isLoading && items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>{emptyIcon}</div>
        <div className={styles.emptyTitle}>No Items Yet</div>
        <div className={styles.emptyMessage}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={`${styles.listContainer} ${className}`}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {config.columns.map((column) => {
                const field = column.sortField || column.key;
                const isSorted = sortField === field;
                const isSortable = column.sortable && onSortChange;
                
                return (
                  <th
                    key={column.key}
                    className={`
                      ${column.headerClassName || ''}
                      ${isSortable ? styles.sortable : ''}
                      ${isSorted ? styles.sorted : ''}
                    `}
                    onClick={() => isSortable && handleColumnClick(column)}
                    style={{
                      width: column.width,
                      minWidth: column.minWidth,
                    }}
                  >
                    <div className={styles.headerContent}>
                      <span>{column.label}</span>
                      {isSorted && (
                        <span className={styles.sortIndicator}>
                          {sortOrder === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
              {config.rowActions && config.rowActions.length > 0 && (
                <th>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // WHAT: Loading skeleton rows
              // WHY: Visual feedback during data fetch
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className={styles.skeletonRow}>
                  {config.columns.map((column) => (
                    <td key={column.key}>
                      <div className={styles.skeleton} />
                    </td>
                  ))}
                  {config.rowActions && <td><div className={styles.skeleton} /></td>}
                </tr>
              ))
            ) : (
              items.map((item) => {
                const customRowClass = config.rowClassName ? config.rowClassName(item) : '';
                const isClickable = config.isRowClickable ? config.isRowClickable(item) : false;
                
                return (
                  <tr
                    key={item._id}
                    className={`
                      ${styles.row}
                      ${customRowClass}
                      ${isClickable ? styles.clickable : ''}
                    `}
                    onClick={() => {
                      if (isClickable && config.onRowClick) {
                        config.onRowClick(item);
                      }
                    }}
                  >
                    {config.columns.map((column) => (
                      <td
                        key={column.key}
                        className={column.className || ''}
                      >
                        {column.render ? column.render(item) : String((item as any)[column.key] || '')}
                      </td>
                    ))}
                    {config.rowActions && config.rowActions.length > 0 && (
                      <td className="actions-cell">
                        {config.rowActions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.handler(item);
                            }}
                            className={`btn btn-small btn-${action.variant || 'primary'} ${action.className || ''}`}
                            title={action.title}
                            aria-label={action.label}
                          >
                            {action.icon && (
                              typeof action.icon === 'string' ? (
                                <MaterialIcon name={action.icon} variant="outlined" style={{ fontSize: '1rem', marginRight: '0.25rem' }} />
                              ) : (
                                action.icon
                              )
                            )}
                            {action.label}
                          </button>
                        ))}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
