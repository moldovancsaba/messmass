// lib/adapters/insightsAdapter.tsx
// WHAT: Adapter configuration for Insights admin page
// WHY: Defines list/card view for analytics insights data
// USAGE: Import and pass to UnifiedAdminPage component

import React from 'react';
import { AdminPageAdapter } from '../adminDataAdapters';

// WHAT: Insight data type (placeholder - adjust based on actual schema)
interface InsightDTO {
  _id: string;
  projectId: string;
  projectName: string;
  category: string;
  priority: string;
  message: string;
  confidence: number;
  createdAt: string;
}

/**
 * WHAT: Adapter for Insights page
 * WHY: Display AI-generated insights for events
 */
export const insightsAdapter: AdminPageAdapter<InsightDTO> = {
  pageName: 'insights',
  defaultView: 'card',
  
  listConfig: {
    columns: [
      {
        key: 'projectName',
        label: 'Project',
        sortable: true,
        minWidth: '180px',
        render: (insight) => (
          <span style={{ fontWeight: 600 }}>{insight.projectName}</span>
        ),
      },
      {
        key: 'category',
        label: 'Category',
        sortable: true,
        width: '120px',
        render: (insight) => (
          <span
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.875rem',
              backgroundColor: '#f3f4f6',
            }}
          >
            {insight.category}
          </span>
        ),
      },
      {
        key: 'priority',
        label: 'Priority',
        sortable: true,
        width: '100px',
        render: (insight) => {
          const colors = {
            critical: { bg: '#fee2e2', color: '#991b1b' },
            high: { bg: '#fed7aa', color: '#9a3412' },
            medium: { bg: '#fef3c7', color: '#92400e' },
            low: { bg: '#dbeafe', color: '#1e40af' },
          };
          const style = colors[insight.priority as keyof typeof colors] || colors.low;
          return (
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: 500,
                backgroundColor: style.bg,
                color: style.color,
              }}
            >
              {insight.priority}
            </span>
          );
        },
      },
      {
        key: 'message',
        label: 'Insight',
        minWidth: '300px',
        render: (insight) => (
          <span style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
            {insight.message.substring(0, 100)}
            {insight.message.length > 100 ? '...' : ''}
          </span>
        ),
      },
      {
        key: 'confidence',
        label: 'Confidence',
        sortable: true,
        width: '100px',
        render: (insight) => (
          <span style={{ fontWeight: 600 }}>{Math.round(insight.confidence * 100)}%</span>
        ),
      },
    ],
    rowActions: [
      {
        label: 'View',
        icon: '👁️',
        variant: 'primary',
        handler: (insight) => {
          console.log('View insight:', insight._id);
        },
      },
    ],
  },

  cardConfig: {
    primaryField: 'projectName',
    secondaryField: (insight) => `${insight.category} • ${insight.priority} priority`,
    metaFields: [
      {
        key: 'message',
        label: 'Insight',
        icon: '💡',
        render: (insight) =>
          insight.message.substring(0, 120) + (insight.message.length > 120 ? '...' : ''),
      },
      {
        key: 'confidence',
        label: 'Confidence',
        icon: '📊',
        render: (insight) => `${Math.round(insight.confidence * 100)}%`,
      },
      {
        key: 'createdAt',
        label: 'Generated',
        icon: '📅',
        render: (insight) => new Date(insight.createdAt).toLocaleDateString(),
      },
    ],
    cardActions: [
      {
        label: 'View Details',
        icon: '👁️',
        variant: 'primary',
        handler: (insight) => {
          console.log('View insight:', insight._id);
        },
      },
    ],
  },

  searchFields: ['projectName', 'category', 'message'],
  emptyStateMessage: 'No insights generated yet. Insights are created automatically for events with sufficient data.',
  emptyStateIcon: '💡',
};
