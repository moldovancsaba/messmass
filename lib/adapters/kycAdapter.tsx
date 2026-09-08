// lib/adapters/kycAdapter.tsx
// WHAT: Adapter configuration for KYC Variables admin page
// WHY: Defines list/card view for variable/metric management
// USAGE: Import and pass to UnifiedAdminPage component

import React from 'react';
import { AdminPageAdapter } from '../adminDataAdapters';

// WHAT: Variable metadata type (from variables_metadata collection)
interface KYCVariableDTO {
  _id: string;
  name: string;
  alias: string;
  type: 'number' | 'text' | 'derived';
  category: string;
  visibleInClicker: boolean;
  editableInManual: boolean;
  isSystemVariable: boolean;
  clickerOrder?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * WHAT: Adapter for KYC Variables page
 * WHY: Manage all data variables and metrics in the system
 */
export const kycAdapter: AdminPageAdapter<KYCVariableDTO> = {
  pageName: 'kyc',
  defaultView: 'list',
  
  listConfig: {
    columns: [
      {
        key: 'alias',
        label: 'Display Name (Alias)',
        sortable: true,
        minWidth: '180px',
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
          <span className="adapter-hex-label adapter-meta-text">
            {variable.name}
          </span>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        sortable: true,
        width: '100px',
        render: (variable) => (
          <span className="px-2 py-1 rounded text-sm bg-gray-100">
            {variable.type}
          </span>
        ),
      },
      {
        key: 'category',
        label: 'Category',
        sortable: true,
        width: '120px',
      },
      {
        key: 'isSystemVariable',
        label: 'Source',
        sortable: true,
        width: '100px',
        render: (variable) => (
          // WHAT: Source badge with conditional colors based on variable type
          // WHY: Colors are computed at runtime (system=blue, custom=yellow)
          <span style={{ // eslint-disable-line react/forbid-dom-props
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.875rem',
            backgroundColor: variable.isSystemVariable ? 'var(--mm-info-light)' : 'var(--mm-warning-light)',
            color: variable.isSystemVariable ? 'var(--mm-color-primary-800)' : 'var(--mantine-color-messmassAmber-8)',
          }}>
            {variable.isSystemVariable ? 'System' : 'Custom'}
          </span>
        ),
      },
      {
        key: 'visibleInClicker',
        label: 'Clicker',
        sortable: true,
        width: '80px',
        render: (variable) => (
          <span>{variable.visibleInClicker ? '✅' : '—'}</span>
        ),
      },
      {
        key: 'editableInManual',
        label: 'Editable',
        sortable: true,
        width: '80px',
        render: (variable) => (
          <span>{variable.editableInManual ? '✅' : '—'}</span>
        ),
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
      {
        label: 'Delete',
        icon: '🗑️',
        variant: 'danger',
        handler: (variable) => {
          if (variable.isSystemVariable) {
            alert('Cannot delete system variables');
            return;
          }
          if (confirm(`Delete custom variable "${variable.alias}"?`)) {
            console.log('Delete variable:', variable._id);
          }
        },
      },
    ],
  },

  cardConfig: {
    primaryField: 'alias',
    secondaryField: (variable) => `${variable.category} • ${variable.type}`,
    metaFields: [
      {
        key: 'name',
        label: 'Field Name',
        icon: '🔤',
        render: (variable) => variable.name,
      },
      {
        key: 'isSystemVariable',
        label: 'Source',
        icon: '⚙️',
        render: (variable) => (variable.isSystemVariable ? 'System' : 'Custom'),
      },
      {
        key: 'visibleInClicker',
        label: 'Visible in Clicker',
        icon: '👁️',
        render: (variable) => (variable.visibleInClicker ? 'Yes' : 'No'),
      },
      {
        key: 'editableInManual',
        label: 'Manually Editable',
        icon: '✏️',
        render: (variable) => (variable.editableInManual ? 'Yes' : 'No'),
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
  emptyStateMessage: 'No variables configured. Variables define all the metrics you can track for events.',
  emptyStateIcon: '🔐',
};
