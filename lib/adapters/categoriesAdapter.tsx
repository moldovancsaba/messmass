// lib/adapters/categoriesAdapter.tsx
// WHAT: Adapter configuration for Categories admin page
// WHY: Defines list/card view structure for hashtag categories
// USAGE: Import and pass to UnifiedAdminPage component

import React from 'react';
import { AdminPageAdapter } from '../adminDataAdapters';
import { CategoryDTO } from '../types/api';

/**
 * WHAT: Complete adapter configuration for Categories page
 * WHY: Single source of truth for how hashtag categories are displayed
 * 
 * @example
 * <UnifiedAdminPage
 *   adapter={categoriesAdapter}
 *   items={categories}
 *   title="Categories"
 * />
 */
export const categoriesAdapter: AdminPageAdapter<CategoryDTO> = {
  pageName: 'categories',
  defaultView: 'list',
  
  listConfig: {
    columns: [
      {
        key: 'name',
        label: 'Category Name',
        sortable: true,
        minWidth: '200px',
        render: (category) => (
          <span style={{ fontWeight: 600 }}>{category.name}</span>
        ),
      },
      {
        key: 'color',
        label: 'Color',
        width: '150px',
        render: (category) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '24px',
                backgroundColor: category.color,
                borderRadius: '4px',
                border: '1px solid #e5e7eb',
              }}
            />
            <span style={{ fontSize: '0.875rem', color: '#6b7280', fontFamily: 'monospace' }}>
              {category.color}
            </span>
          </div>
        ),
      },
      {
        key: 'order',
        label: 'Order',
        sortable: true,
        width: '100px',
        render: (category) => <span>{category.order}</span>,
      },
      {
        key: 'createdAt',
        label: 'Created',
        sortable: true,
        width: '120px',
        render: (category) => (
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {new Date(category.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    rowActions: [
      {
        label: 'Edit',
        icon: 'edit',
        variant: 'primary',
        handler: (category) => {
          console.log('Edit category:', category._id);
        },
        title: 'Edit category',
      },
      {
        label: 'Delete',
        icon: 'delete',
        variant: 'danger',
        handler: (category) => {
          if (confirm(`Delete category "${category.name}"?`)) {
            console.log('Delete category:', category._id);
          }
        },
        title: 'Delete category',
      },
    ],
  },

  cardConfig: {
    primaryField: 'name',
    secondaryField: (category) => `Order: ${category.order}`,
    metaFields: [
      {
        key: 'color',
        label: 'Color',
        icon: '🎨',
        render: (category) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                backgroundColor: category.color,
                borderRadius: '4px',
                border: '1px solid #e5e7eb',
              }}
            />
            <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {category.color}
            </span>
          </div>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created',
        icon: '📅',
        render: (category) => new Date(category.createdAt).toLocaleDateString(),
      },
    ],
    cardActions: [
      {
        label: 'Edit',
        icon: 'edit',
        variant: 'primary',
        handler: (category) => {
          console.log('Edit category:', category._id);
        },
      },
      {
        label: 'Delete',
        icon: 'delete',
        variant: 'danger',
        handler: (category) => {
          if (confirm(`Delete "${category.name}"?`)) {
            console.log('Delete category:', category._id);
          }
        },
      },
    ],
  },

  searchFields: ['name'],
  emptyStateMessage: 'No categories found. Click "Add Category" to create your first hashtag category.',
  emptyStateIcon: '🌍',
};
