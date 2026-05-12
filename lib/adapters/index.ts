// lib/adapters/index.ts
// WHAT: Central export file for all admin page adapters
// WHY: Single import point for all adapters
// USAGE: import { partnersAdapter, projectsAdapter } from '@/lib/adapters';

export { partnersAdapter, partnersEntityConfig } from './partnersAdapter';
export { projectsAdapter, projectsEntityConfig } from './projectsAdapter';
export { hashtagsAdapter } from './hashtagsAdapter';
export { categoriesAdapter } from './categoriesAdapter';
export { usersAdapter } from './usersAdapter';
export { chartsAdapter } from './chartsAdapter';
export { filterAdapter } from './filterAdapter';
export { clickerAdapter } from './clickerAdapter';
export { insightsAdapter } from './insightsAdapter';
export { kycAdapter } from './kycAdapter';
export { organizationsAdapter, organizationsEntityConfig } from './organizationsAdapter';
