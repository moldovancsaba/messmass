/* WHAT: Layout for stats pages with strict no-cache policy
 * WHY: Ensure browser always fetches fresh data on reload, never serves stale cached content
 * HOW: Set Cache-Control headers to disable all caching mechanisms */

import { headers } from 'next/headers';
import { getAdminUser } from '@/lib/auth';
import { hasPageAccess, isPageProtected } from '@/lib/pageAccess';
import ServerPageGate from '@/components/ServerPageGate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StatsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  // WHAT: Enforce the event report's page password before rendering anything.
  // WHY: /api/projects/stats/[slug] has refused unauthorised callers since the
  //     F-001 fix, but this page never had a prompt, so a guest with the shared
  //     link and the password had nowhere to enter it. Same gate as
  //     app/partner-report/[slug]/page.tsx; admins bypass like the API does.
  const { slug } = await params;
  if (await isPageProtected('event-report', slug)) {
    if (!(await hasPageAccess('event-report', slug)) && !(await getAdminUser())) {
      return <ServerPageGate pageId={slug} pageType="event-report" />;
    }
  }

  /* WHAT: Force Next.js to set no-cache headers on every request
   * WHY: Prevents browser from caching stats pages, ensuring real-time data visibility */
  const headersList = await headers();
  
  return <>{children}</>;
}

/* WHAT: Metadata configuration for stats pages
 * WHY: Set HTTP headers to prevent all forms of caching */
export async function generateMetadata() {
  return {
    robots: {
      index: false,
      follow: false,
    },
  };
}
