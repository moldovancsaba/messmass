'use client';

// Google Analytics component for {messmass}
// Handles client-side initialization of Google Analytics tracking
// Uses the provided GA measurement ID: G-19NWMWNH18

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const GA_MEASUREMENT_ID = 'G-19NWMWNH18';

// WHAT: The window flag gtag.js checks before it sends anything or sets a
//     cookie; true stops all measurement for this property on this page.
const GA_DISABLE_FLAG = `ga-disable-${GA_MEASUREMENT_ID}`;

// WHAT: Editor routes, whose second path segment identifies what they edit.
// WHY: /edit/<editSlug> is a write credential: GET /api/projects/edit/<slug>
//     issues an edit grant to whoever opens an editor that has no password
//     (lib/pageAccess.ts isBearerSlug), which is why the slug was taken out of
//     every /api/public/* payload. gtag sends the full page location with every
//     page view, so every editor visit put a working edit link into the
//     analytics property, readable by anyone given access to it. The partner
//     and organization editors are excluded with it: an editor URL carries
//     nothing worth measuring, and the partner editor's ?variant= names report
//     variants that are not public.
const EDITOR_PATH = /^\/(edit|partner-edit|organization-edit)(\/|$)/;

export function isAnalyticsExcludedPath(pathname: string | null | undefined): boolean {
  return typeof pathname === 'string' && EDITOR_PATH.test(pathname);
}

// WHAT: The page location as analytics may see it: an editor URL cut down to
//     its route pattern ('/edit/[slug]'), with no query string or fragment.
// WHY: Defence in depth for the moments measurement is not already switched
//     off: a page_location set here is what later events carry.
export function redactAnalyticsLocation(href: string): string {
  try {
    const url = new URL(href);
    const match = url.pathname.match(EDITOR_PATH);
    if (!match) return href;
    return `${url.origin}/${match[1]}/[slug]`;
  } catch {
    return href;
  }
}

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void } & Record<string, unknown>;

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const excluded = isAnalyticsExcludedPath(pathname);

  // WHAT: Switch measurement off while an editor is shown, on in every other
  //     page, before the navigation's page view can go out.
  // WHY: The tag stays loaded across client-side navigation (the admin events
  //     list links into /edit/<editSlug> with next/link), and GA4 sends a page
  //     view on every history change by itself. Next.js updates the address
  //     bar when it commits the new route, after this render, so the flag has
  //     to be set here rather than in an effect, which runs after that. The
  //     assignment is idempotent: a render that is thrown away only switches
  //     measurement off (or on) for a moment early.
  if (typeof window !== 'undefined') {
    (window as unknown as GtagWindow)[GA_DISABLE_FLAG] = excluded;
  }

  // Keep the location later events report in step with the route, redacted.
  useEffect(() => {
    const w = window as unknown as GtagWindow;
    w[GA_DISABLE_FLAG] = excluded;
    if (typeof w.gtag === 'function') {
      w.gtag('set', { page_location: redactAnalyticsLocation(window.location.href) });
    }
  }, [pathname, excluded]);

  // A page opened directly on an editor never loads the tag at all.
  if (excluded) return null;

  return (
    <>
      {/* Google Analytics Script - async loading for performance */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_location: (function (href) {
                var match = window.location.pathname.match(${EDITOR_PATH.toString()});
                return match ? window.location.origin + '/' + match[1] + '/[slug]' : href;
              })(window.location.href)
            });
          `,
        }}
      />
    </>
  );
}
