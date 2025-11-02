// components/UnifiedAdminHeroWithSearch.tsx
// WHAT: Enhanced admin hero with integrated search and view toggle
// WHY: Unified header component for all admin pages with dual view support
// DESIGN SYSTEM: Extends AdminHero with view toggle integration

'use client';

import React from 'react';
import Link from 'next/link';
import UnifiedAdminViewToggle, { ViewMode } from './UnifiedAdminViewToggle';
import styles from './UnifiedAdminHeroWithSearch.module.css';

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'info';
  icon?: string;
  disabled?: boolean;
  title?: string;
}

interface UnifiedAdminHeroWithSearchProps {
  /** Page title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional back link URL */
  backLink?: string;
  /** Show search input */
  showSearch?: boolean;
  /** Search input value */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Optional action buttons */
  actionButtons?: ActionButton[];
  /** Show view toggle */
  showViewToggle?: boolean;
  /** Current view mode */
  currentView?: ViewMode;
  /** View change handler */
  onViewChange?: (view: ViewMode) => void;
  /** Optional CSS class */
  className?: string;
}

/**
 * WHAT: Enhanced admin hero with search and view toggle
 * WHY: Consistent header across all admin pages with dual-view support
 * 
 * @example
 * <UnifiedAdminHeroWithSearch
 *   title="Partners"
 *   showSearch
 *   searchValue={searchTerm}
 *   onSearchChange={setSearchTerm}
 *   showViewToggle
 *   currentView={viewMode}
 *   onViewChange={setViewMode}
 *   actionButtons={[{ label: 'Add Partner', onClick: handleAdd }]}
 * />
 */
export default function UnifiedAdminHeroWithSearch({
  title,
  subtitle,
  backLink,
  showSearch = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  actionButtons = [],
  showViewToggle = false,
  currentView = 'list',
  onViewChange,
  className = '',
}: UnifiedAdminHeroWithSearchProps) {
  return (
    <div className={`${styles.heroContainer} ${className}`}>
      <div className={styles.heroContent}>
        {/* WHAT: Left section - Title, subtitle, and search */}
        <div className={styles.heroLeft}>
          <div className={styles.heroTitleGroup}>
            <h1 className={styles.heroTitle}>{title}</h1>
            {subtitle && (
              <p className={styles.heroSubtitle}>{subtitle}</p>
            )}
          </div>

          {/* WHAT: Search input with debouncing handled by parent */}
          {showSearch && onSearchChange && (
            <div className={styles.searchContainer}>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className={styles.searchInput}
                aria-label="Search"
              />
              <span className={styles.searchIcon} aria-hidden="true">🔍</span>
            </div>
          )}
        </div>

        {/* WHAT: Right section - View toggle, actions, back link */}
        <div className={styles.heroRight}>
          {/* WHAT: View toggle for list/card switching */}
          {showViewToggle && onViewChange && (
            <div className={styles.viewToggleWrapper}>
              <UnifiedAdminViewToggle
                currentView={currentView}
                onViewChange={onViewChange}
              />
            </div>
          )}

          {/* WHAT: Action buttons (e.g., "Add New") */}
          {actionButtons.length > 0 && (
            <div className={styles.actionButtons}>
              {actionButtons.map((btn, idx) => {
                const variantClass = `btn-${btn.variant || 'primary'}`;
                return (
                  <button
                    key={idx}
                    onClick={btn.onClick}
                    disabled={!!btn.disabled}
                    title={btn.title}
                    className={`btn btn-small ${variantClass}`}
                  >
                    {btn.icon ? `${btn.icon} ${btn.label}` : btn.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* WHAT: Back link to parent page */}
          {backLink && (
            <Link href={backLink} className="btn btn-small btn-secondary">
              ← Back
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
