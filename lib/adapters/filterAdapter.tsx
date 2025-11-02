// lib/adapters/filterAdapter.tsx
// WHAT: Adapter configuration for Filter admin page (same as projects but with filter context)
// WHY: Reuses project display logic for filtered results
// USAGE: Import and pass to UnifiedAdminPage component

import { projectsAdapter } from './projectsAdapter';

/**
 * WHAT: Adapter for filtered projects view
 * WHY: Reuses projects adapter since it's the same data structure
 * NOTE: The only difference is the page name for localStorage persistence
 */
export const filterAdapter = {
  ...projectsAdapter,
  pageName: 'filter',
  emptyStateMessage: 'No projects match the selected filters.',
  emptyStateIcon: '🔍',
};
