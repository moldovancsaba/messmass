// app/interactive-report/[partnerSlug]/territory/page.tsx
// Alias route for territory analytics map

import InteractiveReportMapPage, { generateMetadata } from '../map/page';

export const dynamic = 'force-dynamic';

export { generateMetadata };
export default InteractiveReportMapPage;
