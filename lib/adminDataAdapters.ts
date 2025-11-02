// lib/adminDataAdapters.ts
// WHAT: Type definitions and utilities for unified admin list/card view system
// WHY: Provides strongly-typed configuration interfaces for adapters
// USAGE: Import types when creating page-specific adapters in lib/adapters/

import React from 'react';

/**
 * WHAT: Configuration for a single column in list view
 * WHY: Defines how data is displayed in table columns
 */
export interface ListColumnConfig<T> {
  /** Unique key for the column */
  key: string;
  /** Display label in table header */
  label: string;
  /** Optional fixed width (e.g., '150px', '20%') */
  width?: string;
  /** Optional minimum width (e.g., '100px') */
  minWidth?: string;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Sort field name (if different from key) */
  sortField?: string;
  /** Custom render function for cell content */
  render?: (item: T) => React.ReactNode;
  /** CSS class name for column */
  className?: string;
  /** CSS class name for header cell */
  headerClassName?: string;
}

/**
 * WHAT: Configuration for list view display
 * WHY: Defines table structure and row actions
 */
export interface ListViewConfig<T> {
  /** Array of column configurations */
  columns: ListColumnConfig<T>[];
  /** Optional row-level action buttons */
  rowActions?: Array<{
    label: string;
    icon?: string;
    variant?: 'primary' | 'secondary' | 'danger';
    handler: (item: T) => void;
    title?: string;
    className?: string;
  }>;
  /** Optional function to determine if row is clickable */
  isRowClickable?: (item: T) => boolean;
  /** Optional row click handler */
  onRowClick?: (item: T) => void;
  /** Optional custom row className */
  rowClassName?: (item: T) => string;
}

/**
 * WHAT: Configuration for metadata fields displayed in cards
 * WHY: Defines secondary information shown in card body
 */
export interface CardMetaFieldConfig<T> {
  /** Unique key for the field */
  key: keyof T | string;
  /** Display label */
  label: string;
  /** Custom render function */
  render?: (item: T) => React.ReactNode;
  /** Icon to show before label */
  icon?: string;
  /** CSS class name */
  className?: string;
}

/**
 * WHAT: Configuration for card view display
 * WHY: Defines card structure and actions
 */
export interface CardViewConfig<T> {
  /** Primary field for card title */
  primaryField: keyof T | ((item: T) => React.ReactNode);
  /** Optional secondary field for subtitle */
  secondaryField?: keyof T | ((item: T) => React.ReactNode);
  /** Optional image field URL */
  imageField?: keyof T;
  /** Optional icon/emoji field */
  iconField?: keyof T;
  /** Array of metadata fields to display */
  metaFields?: CardMetaFieldConfig<T>[];
  /** Optional card-level action buttons */
  cardActions?: Array<{
    label: string;
    icon?: string;
    variant?: 'primary' | 'secondary' | 'danger';
    handler: (item: T) => void;
    title?: string;
    className?: string;
  }>;
  /** Optional function to determine if card is clickable */
  isCardClickable?: (item: T) => boolean;
  /** Optional card click handler */
  onCardClick?: (item: T) => void;
  /** Optional custom card className */
  cardClassName?: (item: T) => string;
  /** Optional badge/tag renderer */
  renderBadge?: (item: T) => React.ReactNode;
}

/**
 * WHAT: Filter option configuration
 * WHY: Defines available filters for data
 */
export interface FilterOption {
  /** Unique filter key */
  key: string;
  /** Display label */
  label: string;
  /** Filter type */
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'toggle';
  /** Available options (for select/multiselect) */
  options?: Array<{ value: string; label: string }>;
  /** Default value */
  defaultValue?: any;
}

/**
 * WHAT: Sort option configuration
 * WHY: Defines available sort methods
 */
export interface SortOption {
  /** Sort field name */
  field: string;
  /** Display label */
  label: string;
  /** Default sort order */
  defaultOrder?: 'asc' | 'desc';
}

/**
 * WHAT: Complete adapter configuration for a page
 * WHY: Single configuration object per admin page
 */
export interface AdminPageAdapter<T> {
  /** Page identifier (e.g., 'partners', 'projects') */
  pageName: string;
  /** Default view mode */
  defaultView?: 'list' | 'card';
  /** List view configuration */
  listConfig: ListViewConfig<T>;
  /** Card view configuration */
  cardConfig: CardViewConfig<T>;
  /** Fields to search (for client-side filtering) */
  searchFields: Array<keyof T | string>;
  /** Optional filter configurations */
  filters?: FilterOption[];
  /** Optional sort configurations */
  sortOptions?: SortOption[];
  /** Optional empty state message */
  emptyStateMessage?: string;
  /** Optional empty state icon */
  emptyStateIcon?: string;
}

/**
 * WHAT: Helper function to extract value from nested object path
 * WHY: Support dot notation in field keys (e.g., 'sportsDb.venueName')
 * 
 * @param obj - Object to extract from
 * @param path - Dot-notation path (e.g., 'user.name')
 * @returns Extracted value or undefined
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * WHAT: Helper function to perform client-side search
 * WHY: Filter items based on search term and configured search fields
 * 
 * @param items - Array of items to search
 * @param searchTerm - Search query string
 * @param searchFields - Fields to search in
 * @returns Filtered array of items
 */
export function clientSideSearch<T>(
  items: T[],
  searchTerm: string,
  searchFields: Array<keyof T | string>
): T[] {
  if (!searchTerm.trim()) return items;
  
  const lowerTerm = searchTerm.toLowerCase();
  
  return items.filter(item => {
    return searchFields.some(field => {
      const value = getNestedValue(item, field as string);
      if (value === null || value === undefined) return false;
      
      // Handle arrays (e.g., hashtags)
      if (Array.isArray(value)) {
        return value.some(v => 
          String(v).toLowerCase().includes(lowerTerm)
        );
      }
      
      // Handle objects with categorized data
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => {
          if (Array.isArray(v)) {
            return v.some(item => String(item).toLowerCase().includes(lowerTerm));
          }
          return String(v).toLowerCase().includes(lowerTerm);
        });
      }
      
      return String(value).toLowerCase().includes(lowerTerm);
    });
  });
}

/**
 * WHAT: Helper function to apply client-side sorting
 * WHY: Sort items based on field and order
 * 
 * @param items - Array of items to sort
 * @param sortField - Field to sort by
 * @param sortOrder - Sort order
 * @returns Sorted array of items
 */
export function clientSideSort<T>(
  items: T[],
  sortField: string | null,
  sortOrder: 'asc' | 'desc' | null
): T[] {
  if (!sortField || !sortOrder) return items;
  
  return [...items].sort((a, b) => {
    const aVal = getNestedValue(a, sortField);
    const bVal = getNestedValue(b, sortField);
    
    // Handle null/undefined
    if (aVal === null || aVal === undefined) return sortOrder === 'asc' ? 1 : -1;
    if (bVal === null || bVal === undefined) return sortOrder === 'asc' ? -1 : 1;
    
    // Handle dates
    if (aVal instanceof Date || bVal instanceof Date) {
      const aTime = aVal instanceof Date ? aVal.getTime() : new Date(aVal).getTime();
      const bTime = bVal instanceof Date ? bVal.getTime() : new Date(bVal).getTime();
      return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
    }
    
    // Handle numbers
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    // Handle strings
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    if (sortOrder === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });
}
