// components/UnifiedCardView.tsx
// WHAT: Generic card view component for grid-based data display
// WHY: Reusable card grid with actions, badges, and configurable layouts
// DESIGN SYSTEM: Uses ColoredCard component and theme.css tokens

'use client';

import React from 'react';
import { CardViewConfig, getNestedValue } from '@/lib/adminDataAdapters';
import ColoredCard from './ColoredCard';
import MaterialIcon from './MaterialIcon';
import styles from './UnifiedCardView.module.css';

interface UnifiedCardViewProps<T> {
  /** Array of items to display */
  items: T[];
  /** Card view configuration */
  config: CardViewConfig<T>;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state icon */
  emptyIcon?: string;
  /** Optional CSS class */
  className?: string;
  /** Optional accent color for all cards */
  accentColor?: string;
}

/**
 * WHAT: Generic grid-based card view component
 * WHY: Consistent card UI across all admin pages with configurable layouts
 * 
 * @example
 * <UnifiedCardView
 *   items={partners}
 *   config={partnersAdapter.cardConfig}
 *   isLoading={loading}
 * />
 */
export default function UnifiedCardView<T extends { _id: string }>({
  items,
  config,
  isLoading = false,
  emptyMessage = 'No items found',
  emptyIcon = '📋',
  className = '',
  accentColor = '#3b82f6',
}: UnifiedCardViewProps<T>) {
  
  // WHAT: Render field value or custom render function
  // WHY: Support both simple field access and complex render functions
  const renderField = (item: T, field: keyof T | ((item: T) => React.ReactNode)): React.ReactNode => {
    if (typeof field === 'function') {
      return field(item);
    }
    return getNestedValue(item, field as string);
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
    <div className={`${styles.cardGrid} ${className}`}>
      {isLoading ? (
        // WHAT: Loading skeleton cards
        // WHY: Visual feedback during data fetch
        Array.from({ length: 6 }).map((_, i) => (
          <ColoredCard
            key={`skeleton-${i}`}
            accentColor={accentColor}
            hoverable={false}
          >
            <div className={styles.skeletonCard}>
              <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
              <div className={`${styles.skeleton} ${styles.skeletonSubtitle}`} />
              <div className={`${styles.skeleton} ${styles.skeletonMeta}`} />
              <div className={`${styles.skeleton} ${styles.skeletonMeta}`} />
            </div>
          </ColoredCard>
        ))
      ) : (
        items.map((item) => {
          const customCardClass = config.cardClassName ? config.cardClassName(item) : '';
          const isClickable = config.isCardClickable ? config.isCardClickable(item) : false;
          
          return (
            <ColoredCard
              key={item._id}
              accentColor={accentColor}
              hoverable={isClickable}
              onClick={() => {
                if (isClickable && config.onCardClick) {
                  config.onCardClick(item);
                }
              }}
              className={`${styles.card} ${customCardClass} ${isClickable ? styles.clickable : ''}`}
            >
              <div className={styles.cardContent}>
                {/* WHAT: Optional image/icon at top */}
                {config.imageField && getNestedValue(item, config.imageField as string) && (
                  <div className={styles.cardImage}>
                    <img
                      src={getNestedValue(item, config.imageField as string)}
                      alt=""
                      className={styles.image}
                    />
                  </div>
                )}
                
                {config.iconField && !config.imageField && (
                  <div className={styles.cardIcon}>
                    {getNestedValue(item, config.iconField as string)}
                  </div>
                )}

                {/* WHAT: Primary title */}
                <div className={styles.cardTitle}>
                  {renderField(item, config.primaryField)}
                </div>

                {/* WHAT: Optional secondary subtitle */}
                {config.secondaryField && (
                  <div className={styles.cardSubtitle}>
                    {renderField(item, config.secondaryField)}
                  </div>
                )}

                {/* WHAT: Optional badge/tag */}
                {config.renderBadge && (
                  <div className={styles.cardBadge}>
                    {config.renderBadge(item)}
                  </div>
                )}

                {/* WHAT: Metadata fields */}
                {config.metaFields && config.metaFields.length > 0 && (
                  <div className={styles.cardMeta}>
                    {config.metaFields.map((meta) => (
                      <div key={meta.key as string} className={`${styles.metaField} ${meta.className || ''}`}>
                        {meta.icon && <span className={styles.metaIcon}>{meta.icon}</span>}
                        <span className={styles.metaLabel}>{meta.label}:</span>
                        <span className={styles.metaValue}>
                          {meta.render ? meta.render(item) : getNestedValue(item, meta.key as string)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* WHAT: Card actions */}
                {config.cardActions && config.cardActions.length > 0 && (
                  <div className={styles.cardActions}>
                    {config.cardActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          action.handler(item);
                        }}
                        className={`
                          ${styles.actionButton}
                          ${action.variant ? styles[`variant-${action.variant}`] : styles['variant-primary']}
                          ${action.className || ''}
                        `}
                        title={action.title}
                      >
                        {action.icon && (
                          <MaterialIcon 
                            name={action.icon} 
                            variant="outlined" 
                            style={{ fontSize: '1rem', marginRight: '0.25rem' }} 
                          />
                        )}
                        <span className={styles.actionLabel}>{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ColoredCard>
          );
        })
      )}
    </div>
  );
}
