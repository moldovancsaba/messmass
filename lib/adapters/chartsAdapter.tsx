// lib/adapters/chartsAdapter.tsx
// WHAT: Adapter configuration for Charts admin page
// WHY: Defines list/card view structure for chart configurations
// USAGE: Import and pass to UnifiedAdminPage component

import React from 'react';
import { AdminPageAdapter } from '../adminDataAdapters';

// WHAT: Chart config data type (placeholder)
interface ChartDTO {
  _id: string;
  name: string;
  type: string;
  formula?: string;
  enabled: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * WHAT: Complete adapter configuration for Charts page
 * WHY: Single source of truth for how chart configs are displayed
 */
export const chartsAdapter: AdminPageAdapter<ChartDTO> = {
  pageName: 'charts',
  defaultView: 'list',
  
  listConfig: {
    columns: [
      {
        key: 'name',
        label: 'Chart Name',
        sortable: true,
        minWidth: '200px',
        render: (chart) => (
          <span className="adapter-primary-field">{chart.name}</span>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        sortable: true,
        width: '150px',
        render: (chart) => (
          <span className="adapter-badge">
            {chart.type}
          </span>
        ),
      },
      {
        key: 'enabled',
        label: 'Status',
        sortable: true,
        width: '100px',
        render: (chart) => {
          // WHAT: Dynamic status badge color based on enabled state
          // WHY: Background/text color computed from chart.enabled boolean
          return (
            <span
              // eslint-disable-next-line react/forbid-dom-props
              style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: 500,
                backgroundColor: chart.enabled ? '#d1fae5' : '#fee2e2',
                color: chart.enabled ? '#065f46' : '#991b1b',
              }}
            >
              {chart.enabled ? 'Active' : 'Disabled'}
            </span>
          );
        },
      },
      {
        key: 'order',
        label: 'Order',
        sortable: true,
        width: '80px',
        render: (chart) => <span>{chart.order}</span>,
      },
    ],
    rowActions: [
      {
        label: 'Edit',
        icon: '✏️',
        variant: 'primary',
        handler: (chart) => {
          console.log('Edit chart:', chart._id);
        },
      },
      {
        label: 'Delete',
        icon: '🗑️',
        variant: 'danger',
        handler: (chart) => {
          if (confirm(`Delete chart "${chart.name}"?`)) {
            console.log('Delete chart:', chart._id);
          }
        },
      },
    ],
  },

  cardConfig: {
    primaryField: 'name',
    secondaryField: 'type',
    metaFields: [
      {
        key: 'enabled',
        label: 'Status',
        icon: '🔌',
        render: (chart) => (chart.enabled ? 'Active' : 'Disabled'),
      },
      {
        key: 'order',
        label: 'Display Order',
        icon: '#️⃣',
        render: (chart) => String(chart.order),
      },
      {
        key: 'updatedAt',
        label: 'Last Updated',
        icon: '📅',
        render: (chart) => new Date(chart.updatedAt).toLocaleDateString(),
      },
    ],
    cardActions: [
      {
        label: 'Edit',
        icon: '✏️',
        variant: 'primary',
        handler: (chart) => {
          console.log('Edit chart:', chart._id);
        },
      },
    ],
  },

  searchFields: ['name', 'type'],
  emptyStateMessage: 'No charts configured. Click "Add Chart" to create your first chart configuration.',
  emptyStateIcon: '📈',
};
