// components/UnifiedAdminPage.tsx
// WHAT: Master wrapper component combining hero, search, view toggle, and data views
// WHY: Complete admin page solution with minimal boilerplate
// DESIGN SYSTEM: Orchestrates all unified components for consistent UX

'use client';

import React, { useState, useMemo } from 'react';
import { AdminPageAdapter, clientSideSearch, clientSideSort } from '@/lib/adminDataAdapters';
import { useViewModeWithUrlSync } from '@/lib/adminViewState';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import UnifiedAdminHeroWithSearch from './UnifiedAdminHeroWithSearch';
import UnifiedListView from './UnifiedListView';
import UnifiedCardView from './UnifiedCardView';

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'info';
  icon?: string;
  disabled?: boolean;
  title?: string;
}

interface UnifiedAdminPageProps<T extends { _id: string }> {
  /** Adapter configuration for the page */
  adapter: AdminPageAdapter<T>;
  /** Array of items to display */
  items: T[];
  /** Loading state */
  isLoading?: boolean;
  /** Page title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Optional back link */
  backLink?: string;
  /** Optional action buttons */
  actionButtons?: ActionButton[];
  /** Optional CSS class */
  className?: string;
  /** Enable client-side search (default: true) */
  enableSearch?: boolean;
  /** Enable client-side sorting (default: true) */
  enableSort?: boolean;
  /** Sync view mode to URL (default: true) */
  syncViewToUrl?: boolean;
  /** Optional accent color for card view */
  accentColor?: string;
  /** External search value (for server-side search) */
  externalSearchValue?: string;
  /** External search change handler (for server-side search) */
  onExternalSearchChange?: (value: string) => void;
  /** Search placeholder override */
  searchPlaceholder?: string;
  /** Total matched items (for server-side pagination info) */
  totalMatched?: number;
  /** Show pagination stats */
  showPaginationStats?: boolean;
  /** External sort field (for server-side sorting) */
  sortField?: string | null;
  /** External sort order (for server-side sorting) */
  sortOrder?: 'asc' | 'desc' | null;
  /** External sort change handler (for server-side sorting) */
  onSortChange?: (field: string) => void;
}

/**
 * WHAT: Complete admin page wrapper with search, view toggle, and data display
 * WHY: Reduces boilerplate by handling common patterns (search, sort, view switching)
 * 
 * @example
 * <UnifiedAdminPage
 *   adapter={partnersAdapter}
 *   items={partners}
 *   isLoading={loading}
 *   title="Partners"
 *   subtitle="Manage organizations"
 *   actionButtons={[{ label: 'Add Partner', onClick: handleAdd }]}
 * />
 */
export default function UnifiedAdminPage<T extends { _id: string }>({
  adapter,
  items,
  isLoading = false,
  title,
  subtitle,
  backLink,
  actionButtons = [],
  className = '',
  enableSearch = true,
  enableSort = true,
  syncViewToUrl = true,
  accentColor,
  externalSearchValue,
  onExternalSearchChange,
  searchPlaceholder,
  totalMatched,
  showPaginationStats = false,
  sortField: externalSortField,
  sortOrder: externalSortOrder,
  onSortChange: externalOnSortChange,
}: UnifiedAdminPageProps<T>) {
  
  // WHAT: View mode state with persistence
  // WHY: Remember user's view preference per page
  const [viewMode, setViewMode] = useViewModeWithUrlSync(
    adapter.pageName,
    adapter.defaultView || 'list',
    syncViewToUrl
  );

  // WHAT: Search state with debouncing
  // WHY: Prevent excessive filtering during typing
  // Use external search if provided (server-side), otherwise internal (client-side)
  const isServerSideSearch = externalSearchValue !== undefined && onExternalSearchChange !== undefined;
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const searchTerm = isServerSideSearch ? externalSearchValue : internalSearchTerm;
  const setSearchTerm = isServerSideSearch ? onExternalSearchChange : setInternalSearchTerm;
  // WHAT: Always call useDebouncedValue (React Hooks rules)
  // WHY: Hooks must be called unconditionally, then decide whether to use result
  const clientDebouncedSearch = useDebouncedValue(searchTerm, 300);
  const debouncedSearchTerm = isServerSideSearch ? searchTerm : clientDebouncedSearch;

  // WHAT: Sort state (internal or external)
  // WHY: Support both client-side and server-side sorting
  const isServerSideSort = externalSortField !== undefined && externalSortOrder !== undefined && externalOnSortChange !== undefined;
  const [internalSortField, setInternalSortField] = useState<string | null>(null);
  const [internalSortOrder, setInternalSortOrder] = useState<'asc' | 'desc' | null>(null);
  
  const sortField = isServerSideSort ? externalSortField : internalSortField;
  const sortOrder = isServerSideSort ? externalSortOrder : internalSortOrder;

  // WHAT: Handle sort column click
  // WHY: Three-state cycle: null → asc → desc → null
  const handleSortChange = (field: string) => {
    if (isServerSideSort && externalOnSortChange) {
      // Server-side: delegate to parent
      externalOnSortChange(field);
    } else {
      // Client-side: manage internally
      if (internalSortField === field) {
        // Cycle through: asc → desc → null
        if (internalSortOrder === 'asc') {
          setInternalSortOrder('desc');
        } else if (internalSortOrder === 'desc') {
          setInternalSortField(null);
          setInternalSortOrder(null);
        }
      } else {
        setInternalSortField(field);
        setInternalSortOrder('asc');
      }
    }
  };

  // WHAT: Apply client-side filtering and sorting (only if not using server-side)
  // WHY: Reduce prop drilling, handle common patterns centrally
  const processedItems = useMemo(() => {
    let result = items;

    // Apply search filter if enabled AND not using server-side search
    if (enableSearch && !isServerSideSearch && debouncedSearchTerm) {
      result = clientSideSearch(result, debouncedSearchTerm, adapter.searchFields);
    }

    // WHAT: Apply sorting if enabled AND not using server-side sorting
    // WHY: Server-side sorting already sorted the data - don't re-sort client-side
    if (enableSort && !isServerSideSort && sortField && sortOrder) {
      result = clientSideSort(result, sortField, sortOrder);
    }

    return result;
  }, [items, debouncedSearchTerm, sortField, sortOrder, enableSearch, enableSort, adapter.searchFields, isServerSideSearch, isServerSideSort]);

  return (
    <div className={`page-container ${className}`}>
      {/* WHAT: Hero section with search and view toggle */}
      <UnifiedAdminHeroWithSearch
        title={title}
        subtitle={subtitle}
        backLink={backLink}
        showSearch={enableSearch}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={searchPlaceholder || `Search ${adapter.pageName}...`}
        actionButtons={actionButtons}
        showViewToggle
        currentView={viewMode}
        onViewChange={setViewMode}
      />
      
      {/* WHAT: Pagination stats for server-side search/pagination */}
      {showPaginationStats && !isLoading && items.length > 0 && (
        <div className="pagination-stats-row">
          <div className="pagination-stats-text">
            Showing {items.length} of {totalMatched || items.length} {adapter.pageName}
          </div>
        </div>
      )}

      {/* WHAT: Conditional view renderer */}
      {/* WHY: Show list or card view based on user preference */}
      {viewMode === 'list' ? (
        <UnifiedListView
          items={processedItems}
          config={adapter.listConfig}
          sortField={sortField}
          sortOrder={sortOrder}
          onSortChange={enableSort ? handleSortChange : undefined}
          isLoading={isLoading}
          emptyMessage={adapter.emptyStateMessage || `No ${adapter.pageName} found`}
          emptyIcon={adapter.emptyStateIcon || '📋'}
        />
      ) : (
        <UnifiedCardView
          items={processedItems}
          config={adapter.cardConfig}
          isLoading={isLoading}
          emptyMessage={adapter.emptyStateMessage || `No ${adapter.pageName} found`}
          emptyIcon={adapter.emptyStateIcon || '📋'}
          accentColor={accentColor}
        />
      )}
    </div>
  );
}
