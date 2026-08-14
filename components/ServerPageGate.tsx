'use client';

// components/ServerPageGate.tsx
// WHAT: Password prompt for pages rendered as server components.
// WHY: PagePasswordLogin needs an `onSuccess` callback, and a server component
//     cannot pass a function to a client component. Without this wrapper the
//     prompt would render but crash the moment someone entered a correct
//     password — a gate that fails exactly when it is used is worse than none.
// HOW: On success the grant cookie has already been set by the server, so a
//     refresh is all that is needed: the server component re-runs, its
//     `hasPageAccess` check now passes, and the real page renders.

import { useRouter } from 'next/navigation';
import PagePasswordLogin from './PagePasswordLogin';
import type { PageType } from '@/lib/pagePassword';

export default function ServerPageGate({
  pageId,
  pageType,
  title,
  description,
}: {
  pageId: string;
  pageType: PageType;
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  return (
    <PagePasswordLogin
      pageId={pageId}
      pageType={pageType}
      title={title}
      description={description}
      onSuccess={() => {
        // router.refresh() re-runs the server component with the new cookie
        // rather than doing a full page load, so nothing else is re-fetched.
        router.refresh();
      }}
    />
  );
}
