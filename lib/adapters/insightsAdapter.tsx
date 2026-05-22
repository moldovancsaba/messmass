// lib/adapters/insightsAdapter.tsx
// WHAT: Adapter configuration for Insights admin page
// WHY: Defines list/card view for analytics insights data
// USAGE: Import and pass to UnifiedAdminPage component

import React from 'react';
import { AdminPageAdapter } from '../adminDataAdapters';
import SemanticBadge from '@/components/SemanticBadge';

const priorityTone: Record<string, 'danger' | 'warning' | 'info'> = {
  critical: 'danger',
  high: 'warning',
  medium: 'warning',
  low: 'info',
};

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
          <span className="adapter-primary-field">{insight.projectName}</span>
        ),
      },
      {
        key: 'category',
        label: 'Category',
        sortable: true,
        width: '120px',
        render: (insight) => (
          <SemanticBadge tone="secondary" label={insight.category} />
        ),
      },
      {
        key: 'priority',
        label: 'Priority',
        sortable: true,
        width: '100px',
        render: (insight) => (
          <SemanticBadge
            tone={priorityTone[insight.priority] || 'info'}
            label={insight.priority}
          />
        ),
      },
      {
        key: 'message',
        label: 'Insight',
        minWidth: '300px',
        render: (insight) => (
          <span className="adapter-body-text">
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
          <span className="adapter-primary-field">{Math.round(insight.confidence * 100)}%</span>
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
