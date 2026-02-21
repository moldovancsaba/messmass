'use client';

/**
 * SSO dashboard: Hashtag analytics (#47).
 * WHAT: Single-hashtag view at /dashboard/hashtag/[hashtag]; SSO required.
 * HOW: Redirects to filter dashboard (filter-by-slug treats slug as direct hashtag when no UUID).
 */
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardHashtagPage() {
  const params = useParams();
  const router = useRouter();
  const hashtag = (params?.hashtag as string) ?? '';
  const filterSlug = decodeURIComponent(hashtag);

  useEffect(() => {
    if (filterSlug) {
      router.replace(`/dashboard/filter/${encodeURIComponent(filterSlug)}`);
    }
  }, [filterSlug, router]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Loading hashtag view…</p>
    </div>
  );
}
