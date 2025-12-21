// lib/adapters/clickerAdapter.tsx
// WHAT: Adapter configuration for Clicker Manager admin page
// WHY: Defines list/card view for variable button configurations
// USAGE: Import and pass to UnifiedAdminPage component

import React from 'react';
import { AdminPageAdapter } from '../adminDataAdapters';

// WHAT: Variable/button config type (placeholder)
interface ClickerVariableDTO {
  _id: string;
  name: string;
  alias: string;
  type: string;
  category: string;
  visibleInClicker: boolean;
  clickerOrder?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * WHAT: Adapter for Clicker Manager page
 * WHY: Manage which variables appear in the clicker UI
 */
export const clickerAdapter: AdminPageAdapter<ClickerVariableDTO> = {
  pageName: 'clicker-manager',
  defaultView: 'list',
  
  listConfig: {
    columns: [
      {
        key: 'alias',
        label: 'Display Name',
        sortable: true,
        minWidth: '200px',
        render: (variable) => (
          <span className="adapter-primary-field">{variable.alias}</span>
        ),
      },
      {
        key: 'name',
        label: 'Field Name',
        sortable: true,
        minWidth: '150px',
        render: (variable) => (
          <span className="adapter-meta-text font-mono">
            {variable.name}
          </span>
        ),
      },
      {
        key: 'category',
        label: 'Category',
        sortable: true,
        width: '150px',
        render: (variable) => (
          <span className="adapter-badge">
            {variable.category}
          </span>
        ),
      },
      {
        key: 'visibleInClicker',
        label: 'Visible',
        sortable: true,
        width: '100px',
        render: (variable) => (
          <span>{variable.visibleInClicker ? '✅ Yes' : '❌ No'}</span>
        ),
      },
      {
        key: 'clickerOrder',
        label: 'Order',
        sortable: true,
        width: '80px',
        render: (variable) => <span>{variable.clickerOrder || '—'}</span>,
      },
    ],
    rowActions: [
      {
        label: 'Edit',
        icon: '✏️',
        variant: 'primary',
        handler: (variable) => {
          console.log('Edit variable:', variable._id);
        },
      },
    ],
  },

  cardConfig: {
    primaryField: 'alias',
    secondaryField: (variable) => `${variable.category} • ${variable.name}`,
    metaFields: [
      {
        key: 'visibleInClicker',
        label: 'Visible in Clicker',
        icon: '👁️',
        render: (variable) => (variable.visibleInClicker ? 'Yes' : 'No'),
      },
      {
        key: 'clickerOrder',
        label: 'Display Order',
        icon: '#️⃣',
        render: (variable) => String(variable.clickerOrder || 'N/A'),
      },
      {
        key: 'type',
        label: 'Type',
        icon: '🔤',
        render: (variable) => variable.type,
      },
    ],
    cardActions: [
      {
        label: 'Edit',
        icon: '✏️',
        variant: 'primary',
        handler: (variable) => {
          console.log('Edit variable:', variable._id);
        },
      },
    ],
  },

  searchFields: ['name', 'alias', 'category'],
  emptyStateMessage: 'No variables configured. Variables are managed in KYC settings.',
  emptyStateIcon: '↔️',
};
