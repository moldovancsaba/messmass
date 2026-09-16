'use client';

// app/admin/hashtags/[hashtag]/reports/page.tsx
// WHAT: Reports workspace for one hashtag (messmass#244 Phase B).
// WHY: The variant backend already supported hashtags — resolveReportVariantBaseSource
//     handles the owner type and /api/report-variants lists it in
//     ALLOWED_OWNER_TYPES — but there was no admin surface to create or manage
//     them, so the capability was unreachable.
// NOTE: No `loadOwner`: a hashtag's id IS its name, so there is nothing to look
//     up. No `editorHref` either — hashtag reports aggregate across events and
//     have no editable content of their own, so the workspace renders no Edit
//     action rather than linking at a page that does not exist.

import { useParams } from 'next/navigation';
import ReportsWorkspace, { type OwnerConfig } from '@/components/reports/ReportsWorkspace';

const CONFIG: OwnerConfig = {
  ownerType: 'hashtag',
  eyebrow: 'Hashtag Reports',
  pageType: 'hashtag',
  reportHref: (tag, slug) =>
    slug
      ? `/hashtag/${encodeURIComponent(tag)}?variant=${encodeURIComponent(slug)}`
      : `/hashtag/${encodeURIComponent(tag)}`,
};

export default function HashtagReportsWorkspacePage() {
  const params = useParams();
  const hashtag = decodeURIComponent((params?.hashtag as string) || '');
  return <ReportsWorkspace id={hashtag} config={CONFIG} />;
}
