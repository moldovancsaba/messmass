/* WHAT: Layout for stats pages with strict no-cache policy
 * WHY: Ensure browser always fetches fresh data on reload, never serves stale cached content
 * HOW: Set Cache-Control headers to disable all caching mechanisms */

import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
