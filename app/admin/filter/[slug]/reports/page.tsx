'use client';

// app/admin/filter/[slug]/reports/page.tsx
// WHAT: Reports workspace for one saved hashtag filter (messmass#244 Phase B).
// WHY: Same gap as hashtags — resolveReportVariantBaseSource resolves a filter's
//     name and style from its slug via findHashtagsByFilterSlug, and the API
//     accepted the owner type, but nothing let an admin manage the variants.
// NOTE: No `editorHref`: a filter report is an aggregate over whatever events
//     match its hashtags, with no content of its own to edit.

import { useParams } from 'next/navigation';
import ReportsWorkspace, { type OwnerConfig } from '@/components/reports/ReportsWorkspace';

const CONFIG: OwnerConfig = {
  ownerType: 'filter',
  eyebrow: 'Filter Reports',
  pageType: 'filter',
  reportHref: (slug, variant) =>
    variant
      ? `/filter/${encodeURIComponent(slug)}?variant=${encodeURIComponent(variant)}`
      : `/filter/${encodeURIComponent(slug)}`,
};

export default function FilterReportsWorkspacePage() {
  const params = useParams();
  return <ReportsWorkspace id={(params?.slug as string) || ''} config={CONFIG} />;
}
