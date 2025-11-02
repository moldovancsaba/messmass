// lib/adapters/index.ts
// WHAT: Central export file for all admin page adapters
// WHY: Single import point for all adapters
// USAGE: import { partnersAdapter, projectsAdapter } from '@/lib/adapters';

export { partnersAdapter } from './partnersAdapter';
export { projectsAdapter } from './projectsAdapter';
export { hashtagsAdapter } from './hashtagsAdapter';
export { categoriesAdapter } from './categoriesAdapter';
export { usersAdapter } from './usersAdapter';
export { chartsAdapter } from './chartsAdapter';
export { filterAdapter } from './filterAdapter';
export { clickerAdapter } from './clickerAdapter';
// TODO: Add missing adapters when implemented
// export { insightsAdapter } from './insightsAdapter';
// export { kycAdapter } from './kycAdapter';
