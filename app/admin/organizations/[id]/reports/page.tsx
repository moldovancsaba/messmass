'use client';

// app/admin/organizations/[id]/reports/page.tsx
// WHAT: Reports workspace for one organization.
// WHY: The page body moved to components/reports/ReportsWorkspace (messmass#244
//     Phase B) — it was near-identical to the partner version, and hashtags and
//     filters needed the same surface. What stays here is only what makes this
//     route an organization: where its name comes from and what its URLs are.

import { useParams } from 'next/navigation';
import ReportsWorkspace, { type OwnerConfig } from '@/components/reports/ReportsWorkspace';

const CONFIG: OwnerConfig = {
  ownerType: 'organization',
  eyebrow: 'Organization Reports',
  pageType: 'organization-report',
  loadOwner: async (id) => {
    const res = await fetch(`/api/admin/organizations/${id}`, { cache: 'no-store' });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load organization');
    return { name: data.organization.name };
  },
  reportHref: (id, slug) =>
    slug ? `/organization-report/${id}?variant=${encodeURIComponent(slug)}` : `/organization-report/${id}`,
  editorHref: (id, slug) =>
    slug ? `/organization-edit/${id}?variant=${encodeURIComponent(slug)}` : `/organization-edit/${id}`,
};

export default function OrganizationReportsWorkspacePage() {
  const params = useParams();
  return <ReportsWorkspace id={(params?.id as string) || ''} config={CONFIG} />;
}
