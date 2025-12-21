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
          <span className="adapter-primary-field">{category.name}</span>
        ),
      },
      {
        key: 'color',
        label: 'Color',
        width: '150px',
        render: (category) => (
          <div className="adapter-color-row">
            {/* WHAT: Dynamic background color from category
                WHY: Color is data-driven from database */}
            <div className="adapter-color-preview" style={{ backgroundColor: category.color }} /> {/* eslint-disable-line react/forbid-dom-props */}
            <span className="adapter-hex-label adapter-meta-text">
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
          <span className="adapter-meta-text">
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
          <div className="adapter-color-row-sm">
            {/* WHAT: Dynamic background color from category
                WHY: Color is data-driven from database */}
            <div className="adapter-color-preview-sm" style={{ backgroundColor: category.color }} /> {/* eslint-disable-line react/forbid-dom-props */}
            <span className="adapter-hex-label">
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
