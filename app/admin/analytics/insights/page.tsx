import { redirect } from 'next/navigation';

// app/admin/analytics/insights/page.tsx
// WHAT: Redirects to the combined feed.
// WHY: messmass#414. This page's entire content was the analytics-insights.ts
//     pipeline's filtered feed, no other unique section -- once
//     /admin/analytics/combined-insights matched its filter/sort/search
//     capability (and added the executive pipeline's insights on top), there
//     was nothing left this page did that the combined one doesn't. Same
//     pattern already used once before for /admin/insights -> here.
export default function LegacyAnalyticsInsightsRedirectPage() {
  redirect('/admin/analytics/combined-insights');
}
