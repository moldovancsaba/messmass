'use client';

// app/admin/global/reports/page.tsx
// WHAT: Reports workspace for the global report: everything Messmass collects, in the same interactive report as a
//     hashtag, partner or event. Next to organization, partner, hashtag and filter, it is one more owner of the shared
//     ReportsWorkspace: its variants, its page password and Share, its link to open the report.
// WHY: One implementation, many consumers. What stays here is only what makes this route the global owner.

import ReportsWorkspace, { type OwnerConfig } from '@/components/reports/ReportsWorkspace';

const CONFIG: OwnerConfig = {
  ownerType: 'global',
  eyebrow: 'Global Report',
  pageType: 'global-report',
  loadOwner: async () => ({ name: 'All data', publicSlug: 'all' }),
  reportHref: (_id, slug) => (slug ? `/report/global?variant=${encodeURIComponent(slug)}` : '/report/global'),
};

export default function GlobalReportsWorkspacePage() {
  return <ReportsWorkspace id="all" config={CONFIG} />;
}
