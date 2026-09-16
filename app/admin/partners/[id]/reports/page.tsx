'use client';

// app/admin/partners/[id]/reports/page.tsx
// WHAT: Reports workspace for one partner.
// WHY: Shares components/reports/ReportsWorkspace with the other three owner
//     types (messmass#244 Phase B).
// NOTE: Partners are the reason OwnerConfig has a `publicSlug` at all — their
//     public report URLs are keyed on viewSlug, not the admin id.

import { useParams } from 'next/navigation';
import ReportsWorkspace, { type OwnerConfig } from '@/components/reports/ReportsWorkspace';

const CONFIG: OwnerConfig = {
  ownerType: 'partner',
  eyebrow: 'Partner Reports',
  pageType: 'partner-report',
  loadOwner: async (id) => {
    const res = await fetch(`/api/partners/edit/${id}`, { cache: 'no-store' });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load partner');
    return {
      name: data.partner.name,
      publicSlug: data.partner.viewSlug || data.partner._id || id,
    };
  },
  reportHref: (slug, variant) =>
    variant ? `/partner-report/${slug}?variant=${encodeURIComponent(variant)}` : `/partner-report/${slug}`,
  editorHref: (slug, variant) =>
    variant ? `/partner-edit/${slug}?variant=${encodeURIComponent(variant)}` : `/partner-edit/${slug}`,
};

export default function PartnerReportsWorkspacePage() {
  const params = useParams();
  return <ReportsWorkspace id={(params?.id as string) || ''} config={CONFIG} />;
}
