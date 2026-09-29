// tests/security/analytics-no-edit-urls.test.tsx
// WHAT: Editor URLs never reach Google Analytics.
// WHY: /edit/<editSlug> is a write credential for an editor with no password
//     (GET /api/projects/edit/<slug> issues an edit grant to whoever opens
//     it), which is why the slug was taken out of every /api/public/*
//     payload. The GA tag is rendered from the root layout on every route and
//     sends the full page location with every page view, so anyone with read
//     access to the analytics property could copy a working edit link.
// HOW: The component is rendered with renderToStaticMarkup for a given
//     pathname (next/navigation mocked; next/script rendered as a plain
//     <script>), and the inline config script is run against a fake window
//     to see the page_location it reports.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import vm from 'vm';

let pathname = '/';
jest.mock('next/navigation', () => ({ __esModule: true, usePathname: () => pathname }));
jest.mock('next/script', () => ({
  __esModule: true,
  default: ({ id, src, dangerouslySetInnerHTML }: { id?: string; src?: string; dangerouslySetInnerHTML?: { __html: string } }) =>
    require('react').createElement('script', { id, src, dangerouslySetInnerHTML }),
}));

import GoogleAnalytics, { isAnalyticsExcludedPath, redactAnalyticsLocation } from '@/components/GoogleAnalytics';

const EDIT_SLUG = '2f1c7a4e-8b3d-4c5e-9f6a-1b2c3d4e5f60';

function render(path: string): string {
  pathname = path;
  return renderToStaticMarkup(<GoogleAnalytics />);
}

// Run the inline config script as a page at `href` would, and return what
// gtag('config') was given.
function configuredLocation(html: string, href: string): string {
  const inline = html.match(/<script id="google-analytics">([\s\S]*?)<\/script>/);
  expect(inline).not.toBeNull();
  const url = new URL(href);
  const sandbox: Record<string, any> = { window: { location: { href, pathname: url.pathname, origin: url.origin } } };
  sandbox.dataLayer = [];
  sandbox.window.dataLayer = sandbox.dataLayer;
  vm.runInNewContext(inline![1].replace(/window\.dataLayer = window\.dataLayer \|\| \[\];/, ''), sandbox);
  const config = sandbox.dataLayer.map((args: IArguments) => Array.from(args)).find((args: unknown[]) => args[0] === 'config');
  return config[2].page_location;
}

describe('GoogleAnalytics: no editor URL is measured', () => {
  afterEach(() => {
    delete (globalThis as any).window;
  });

  it.each([`/edit/${EDIT_SLUG}`, '/partner-edit/some-partner', '/organization-edit/abc', '/edit'])(
    'renders no tag at all on %s',
    (path) => {
      expect(render(path)).toBe('');
    }
  );

  it('renders the tag on other pages, with the page location as it is', () => {
    const html = render('/admin/events');
    expect(html).toContain('googletagmanager.com/gtag/js?id=G-19NWMWNH18');
    expect(configuredLocation(html, 'https://www.messmass.com/admin/events?tab=2')).toBe(
      'https://www.messmass.com/admin/events?tab=2'
    );
  });

  it('the config script itself reports an editor URL as its route pattern, never the slug', () => {
    const html = render('/admin/events');
    const reported = configuredLocation(html, `https://www.messmass.com/edit/${EDIT_SLUG}?x=1`);
    expect(reported).toBe('https://www.messmass.com/edit/[slug]');
    expect(reported).not.toContain(EDIT_SLUG);
  });

  it('switches measurement off while an editor is shown and on again elsewhere', () => {
    // Client-side navigation from the admin list into /edit/<slug> keeps the
    // tag loaded; GA4 then sends a page view on the history change by itself.
    (globalThis as any).window = {};
    render(`/edit/${EDIT_SLUG}`);
    expect((globalThis as any).window['ga-disable-G-19NWMWNH18']).toBe(true);
    render('/admin/events');
    expect((globalThis as any).window['ga-disable-G-19NWMWNH18']).toBe(false);
  });

  it('matches editor routes only', () => {
    expect(isAnalyticsExcludedPath(`/edit/${EDIT_SLUG}`)).toBe(true);
    expect(isAnalyticsExcludedPath('/editor-guide')).toBe(false);
    expect(isAnalyticsExcludedPath('/report/abc')).toBe(false);
    expect(isAnalyticsExcludedPath(null)).toBe(false);
    expect(redactAnalyticsLocation(`https://www.messmass.com/edit/${EDIT_SLUG}#top`)).toBe('https://www.messmass.com/edit/[slug]');
    expect(redactAnalyticsLocation('https://www.messmass.com/report/abc')).toBe('https://www.messmass.com/report/abc');
  });
});
