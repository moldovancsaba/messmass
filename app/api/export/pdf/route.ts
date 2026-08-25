// app/api/export/pdf/route.ts
// WHAT: Server-side A4 PDF export for report pages, via a real headless browser.
// WHY: The previous client-side approach (html2canvas rasterizing the live DOM, jsPDF
//     hand-assembling pages, a JS re-implementation of "does this block fit on the
//     current page" pagination math) was fighting a losing battle: html2canvas is an
//     approximation of a browser, not a real one, and every gap in its CSS support
//     (aspect-ratio, object-fit, CSS Grid track sizing) turned into a visible export
//     bug — see the v12.2.4 fix for the squashed-promo-image case, itself the second
//     such fix (v9.3.0 was the first). It was also fundamentally unreliable on mobile:
//     generating a multi-megabyte canvas client-side and downloading it via a blob URL
//     is a known-flaky pattern on memory-constrained mobile Safari.
//     This route replaces all of that with the thing every browser already does
//     correctly and consistently: real page.pdf() from a real Chromium, driven by real
//     print CSS (@page in app/globals.css, break-inside:avoid on .block/.row in
//     ReportContent.module.css). "Browser independent" here means the opposite of what
//     it sounds like — the CLIENT's browser stops being involved in rendering at all;
//     it just downloads a file the server already finished generating. That is also
//     what makes this reliable on mobile: a GET request and a native file download,
//     nothing else.
// HOW: Launch headless Chromium (production: @sparticuz/chromium-min, which downloads
//     its Chromium binary from a GitHub Release at runtime instead of bundling it — see
//     the comment on CHROMIUM_PACK_URL below for why the full, self-contained
//     @sparticuz/chromium package does not work here; local dev: the full `puppeteer`
//     package, which bundles its own Chromium for the dev machine's OS). Navigate to
//     the report page itself with ?pdfExport=1, wait for it to finish loading by its
//     own existing readiness contract (#report-content only mounts once the page's own
//     `loading` state flips false — see app/report/[slug]/page.tsx), then call the
//     browser's native print pipeline.

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { error as logError } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 60;

// WHAT: Same-origin path allowlist for what this route will render.
// WHY: `path` becomes part of a server-side navigation target. Without this it is an
// open SSRF proxy — accept only the app's own report routes, not query params, not a
// scheme, not `..`.
// WHAT: '/hashtag/' is kept even though next.config.js permanently redirects it to
// '/filter/' — Puppeteer follows that redirect like any browser would, so it still
// resolves to a real, correctly-rendered page. '/filter/' is the one users actually
// reach; it was missing here entirely until this was caught by testing the export
// button on that page specifically, not just /report/.
const ALLOWED_PATH_PREFIXES = ['/report/', '/hashtag/', '/filter/'];

function validatePath(path: string): string | null {
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  if (path.includes('..') || path.includes('\\')) return null;
  // A path only, never a full URL smuggled in via a path-like string.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) return null;
  if (!ALLOWED_PATH_PREFIXES.some((p) => path.startsWith(p))) return null;
  return path;
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9 _.-]/g, '_').trim();
  return cleaned || 'report';
}

// WHAT: A4 LANDSCAPE page-box width at 96 CSS px/in — 297mm ≈ 1123px (app/globals.css
// @page is landscape; see that comment for why).
// WHY: page.pdf()'s print pass reflows the DOM against the @page box width for
// width-based media queries, NOT page.setViewport() — confirmed by direct
// reproduction. Two separate systems key off width, and both must land on "desktop"
// AND at close to the same pixel width as the print pass, or they disagree:
// (1) the CSS `(max-width: 768px)` breakpoint (ReportContent/ReportChart/ReportHero
// .module.css) picks single-column-mobile vs the designed grid; (2) ResponsiveRow's
// own `isMobileViewport` (window.innerWidth <= 768) and its ResizeObserver-measured
// `--block-height` (app/report/[slug]/ReportContent.tsx) bake per-block heights into
// inline styles from whatever width was live when they last fired. Setting this
// viewport to ~680px (portrait content width, the previous value) put the live page
// in single-column-mobile mode while the print pass reflowed to the desktop grid (or
// vice versa) — same bug either way: heights computed for one width get applied to a
// visibly different one, which is what "images are broken, mobile layout on desktop"
// actually was. Matching this to the landscape page-box width means the live page is
// already laid out, and already measured, exactly as the print pass will render it —
// no mode switch and no width jump left to race.
const PRINT_VIEWPORT_WIDTH = 1123;
const PRINT_VIEWPORT_HEIGHT = 1400;

// WHAT: the exact GitHub Release asset @sparticuz/chromium-min downloads and extracts
// (cached to /tmp for warm starts) instead of shipping the binary in the function
// bundle.
// WHY: @sparticuz/chromium (the full package, bundled binary) failed on the very first
// real production request with "input directory .../bin does not exist" — confirmed via
// Vercel's own runtime logs. Two different next.config.js outputFileTracingIncludes
// configurations, including one matching a community-confirmed working pattern for this
// exact package/platform combination, made no difference; the identical error persisted.
// -min sidesteps the whole class of problem rather than continuing to fight it: nothing
// large needs to be traced or bundled, since the ~66MB pack downloads over the network
// at runtime instead. This is the package author's own documented answer to "your
// bundler won't cooperate" (README, "-min Package" section), not a workaround improvised
// here. Bump CHROMIUM_PACK_VERSION and package.json's @sparticuz/chromium-min version
// together when upgrading.
const CHROMIUM_PACK_VERSION = '149.0.0';
const CHROMIUM_PACK_URL = `https://github.com/Sparticuz/chromium/releases/download/v${CHROMIUM_PACK_VERSION}/chromium-v${CHROMIUM_PACK_VERSION}-pack.x64.tar`;

async function launchBrowser() {
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isServerless) {
    const [{ default: chromium }, puppeteer] = await Promise.all([
      import('@sparticuz/chromium-min'),
      import('puppeteer-core'),
    ]);
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
      headless: true,
      defaultViewport: null,
    });
  }

  // WHAT: Local dev only. `puppeteer` is a devDependency, never present in the
  // production bundle (next.config.js excludes it from serverless function tracing).
  const puppeteer = await import('puppeteer');
  return puppeteer.launch({ headless: true });
}

export async function GET(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const identifier = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
  const rl = checkRateLimit(`export-pdf:${identifier}`, RATE_LIMITS.EXPORT);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: RATE_LIMITS.EXPORT.message }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const rawPath = searchParams.get('path');
  const filenameParam = searchParams.get('filename');

  if (!rawPath) {
    return NextResponse.json({ success: false, error: 'path is required' }, { status: 400 });
  }

  const path = validatePath(rawPath);
  if (!path) {
    return NextResponse.json({ success: false, error: 'invalid path' }, { status: 400 });
  }

  const host = request.headers.get('host');
  if (!host) {
    return NextResponse.json({ success: false, error: 'missing host' }, { status: 400 });
  }
  const protocol = request.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');

  const targetUrl = new URL(path, `${protocol}://${host}`);
  targetUrl.searchParams.set('pdfExport', '1');

  // WHAT: Forward the caller's admin session, if any.
  // WHY: Some report variants (e.g. hashtag aggregate reports) are gated by a
  // page-password UI check stored in the browser's own sessionStorage, which a
  // server-side navigation has no access to at all — that gate is out of scope for
  // this pass (see docs). Admin sessions are the one auth path here that IS a real
  // cookie, so forwarding it lets an admin export a PDF of anything they can already
  // view, matching what they'd see if they screenshotted the page themselves.
  const adminSessionCookie = request.cookies.get('admin-session');

  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    if (adminSessionCookie) {
      await page.setCookie({
        name: 'admin-session',
        value: adminSessionCookie.value,
        domain: host.split(':')[0],
        path: '/',
      });
    }

    await page.setViewport({
      width: PRINT_VIEWPORT_WIDTH,
      height: PRINT_VIEWPORT_HEIGHT,
      deviceScaleFactor: 2, // WHAT: crisper raster content (chart canvases, images) in the PDF.
    });

    await page.goto(targetUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 25000 });

    // WHAT: #report-content only mounts once the page's own `loading` state flips
    // false (app/report/[slug]/page.tsx) — the app's own existing readiness contract,
    // not a new one invented for this route.
    await page.waitForSelector('#report-content', { timeout: 20000 });

    // WHAT: Best-effort settle for anything that started loading after that mount
    // point (e.g. an image fetched only once real content renders).
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 15000 }).catch(() => {});

    // WHAT: Wait for every chart <canvas> to stop resizing before printing.
    // WHY: Confirmed by direct reproduction against real report data — the pie/donut
    // chart canvas rendered oversized, spilling out of its card and over the next
    // card's title, in the first version of this route. Root cause: Chart.js
    // (react-chartjs-2, responsive:true + maintainAspectRatio:false) attaches its OWN
    // ResizeObserver to each canvas, separate from and downstream of ResponsiveRow's
    // --block-height calculation. That makes it a SECOND, chained resize reaction —
    // canvas ResizeObserver fires only after the row's own resize settles and React
    // re-renders with the new CSS var — which can still be in flight after
    // waitForNetworkIdle (a fixed-width height calculation, not a network event) and a
    // short fixed buffer. Polling each canvas's own rendered size until it holds
    // steady across consecutive checks is the general fix: it does not depend on
    // knowing how many resize hops are chained, just on when they stop.
    await page
      .waitForFunction(
        () => {
          const canvases = Array.from(document.querySelectorAll('#report-content canvas'));
          if (canvases.length === 0) return true;
          const w = window as unknown as { __pdfCanvasSizes?: string };
          const current = canvases.map((c) => `${c.clientWidth}x${c.clientHeight}`).join(',');
          const stable = w.__pdfCanvasSizes === current;
          w.__pdfCanvasSizes = current;
          return stable;
        },
        { timeout: 8000, polling: 200 }
      )
      .catch(() => {}); // best-effort: a chart that never settles should not hang the whole export

    await new Promise((resolve) => setTimeout(resolve, 250));

    await page.emulateMediaType('print');

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true, // WHAT: use the @page rule in app/globals.css (size + margin), not a JS-side duplicate of it.
    });

    const filename = sanitizeFilename(filenameParam || 'report') + '.pdf';

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    logError('PDF export failed', { path, error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { success: false, error: 'PDF generation failed. Please try again.' },
      { status: 502 }
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
