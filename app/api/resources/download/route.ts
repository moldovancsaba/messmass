// app/api/resources/download/route.ts
// WHAT: Read-only public asset attachment download endpoint for `/resources/{brands,partners,icons}`.
// WHY: Cross-origin R2 links ignore `<a download>` in browsers and CSP restricts client `connect-src`.
//      Looking up assets server-side by canonical slug guarantees zero SSRF exposure and clean
//      human-readable filenames (`ferencvarosi-tc.svg`, `adidas.svg`, `sports_soccer.svg`).

import fs from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { downloadLogo, logoExtension } from '@/lib/logoStorage';
import {
  loadPublicBrandsCatalog,
  loadPublicIconsCatalog,
  loadPublicPartnersCatalog,
} from '@/lib/publicResourcesCatalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIME_BY_EXT: Record<string, string> = {
  svg: 'image/svg+xml; charset=utf-8',
  png: 'image/png',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  gif: 'image/gif',
};

function sanitizeFilenameBase(raw: string): string {
  const clean = String(raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return clean || 'messmass-asset';
}

async function fetchMaterialSymbolSvg(iconName: string): Promise<Buffer | null> {
  if (!/^[a-z0-9_]{2,48}$/.test(iconName)) return null;
  const candidates = [
    `https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/${iconName}/default/24px.svg`,
    `https://fonts.gstatic.com/s/i/materialiconsoutlined/${iconName}/v1/24px.svg`,
  ];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) continue;
      const text = await res.text();
      if (text.includes('<svg')) {
        return Buffer.from(text, 'utf8');
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * GET /api/resources/download?kind=brand|partner|competition|icon&slug=<slug>&variant=light|dark&icon=<material_icon>
 * Public-by-design read-only download stream for official logos and Material Symbol vector icons.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const kind = (searchParams.get('kind') || '').trim().toLowerCase();
  const slug = (searchParams.get('slug') || '').trim().toLowerCase();
  const variant = (searchParams.get('variant') || 'light').trim().toLowerCase();
  const iconParam = (searchParams.get('icon') || '').trim().toLowerCase();

  if (kind === 'icon') {
    const svgBuf = await fetchMaterialSymbolSvg(iconParam);
    if (!svgBuf) {
      return NextResponse.json({ success: false, error: 'Icon vector not found' }, { status: 404 });
    }
    const fileBase = sanitizeFilenameBase(slug || iconParam);
    return new NextResponse(new Uint8Array(svgBuf), {
      status: 200,
      headers: {
        'Content-Type': MIME_BY_EXT.svg,
        'Content-Disposition': `attachment; filename="${fileBase}.svg"`,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  let targetUrl = '';
  let filenameBase = sanitizeFilenameBase(slug);

  if (kind === 'brand') {
    const brands = await loadPublicBrandsCatalog();
    const match = brands.find((b) => b.slug.toLowerCase() === slug);
    if (!match) {
      return NextResponse.json({ success: false, error: 'Brand asset not found' }, { status: 404 });
    }
    targetUrl = variant === 'dark' && match.darkLogoUrl ? match.darkLogoUrl : match.logoUrl;
    filenameBase = sanitizeFilenameBase(variant === 'dark' ? `${match.slug}-dark` : match.slug);
  } else if (kind === 'partner') {
    const partners = await loadPublicPartnersCatalog();
    const match = partners.find((p) => p.slug.toLowerCase() === slug);
    if (!match) {
      return NextResponse.json({ success: false, error: 'Partner asset not found' }, { status: 404 });
    }
    targetUrl = variant === 'dark' && match.darkLogoUrl ? match.darkLogoUrl : match.logoUrl;
    filenameBase = sanitizeFilenameBase(variant === 'dark' ? `${match.slug}-dark` : match.slug);
  } else if (kind === 'competition') {
    const icons = await loadPublicIconsCatalog();
    const match = icons.find((i) => i.domain === 'competition' && i.slug.toLowerCase() === slug && i.logoUrl);
    if (!match?.logoUrl) {
      return NextResponse.json({ success: false, error: 'Competition logo not found' }, { status: 404 });
    }
    targetUrl = match.logoUrl;
    filenameBase = sanitizeFilenameBase(match.slug);
  } else {
    return NextResponse.json({ success: false, error: 'Invalid resource kind' }, { status: 400 });
  }

  // Handle data:image/* inline URIs safely if any exist
  if (targetUrl.startsWith('data:image/')) {
    const commaIdx = targetUrl.indexOf(',');
    if (commaIdx === -1) {
      return NextResponse.json({ success: false, error: 'Malformed inline asset' }, { status: 500 });
    }
    const header = targetUrl.slice(0, commaIdx).toLowerCase();
    const isBase64 = header.includes(';base64');
    const rawPayload = targetUrl.slice(commaIdx + 1);
    const bytes = isBase64
      ? Buffer.from(rawPayload, 'base64')
      : Buffer.from(decodeURIComponent(rawPayload), 'utf8');
    const ext = header.includes('svg') ? 'svg' : header.includes('png') ? 'png' : 'jpg';
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': MIME_BY_EXT[ext] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filenameBase}.${ext}"`,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  // Handle same-origin `/public/*` static image paths safely
  if (targetUrl.startsWith('/') && !targetUrl.startsWith('//')) {
    const publicRoot = path.resolve(process.cwd(), 'public');
    const resolvedPath = path.resolve(publicRoot, `.${targetUrl.split('?')[0]}`);
    if (!resolvedPath.startsWith(`${publicRoot}${path.sep}`)) {
      return NextResponse.json({ success: false, error: 'Invalid static asset path' }, { status: 400 });
    }
    try {
      const localBytes = await fs.readFile(resolvedPath);
      const ext = (await logoExtension(localBytes)) || 'png';
      return new NextResponse(new Uint8Array(localBytes), {
        status: 200,
        headers: {
          'Content-Type': MIME_BY_EXT[ext] || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filenameBase}.${ext}"`,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch {
      return NextResponse.json({ success: false, error: 'Static asset not found' }, { status: 404 });
    }
  }

  const bytes = await downloadLogo(targetUrl);
  if (!bytes) {
    return NextResponse.json({ success: false, error: 'Asset could not be downloaded from storage' }, { status: 502 });
  }
  const ext = (await logoExtension(bytes)) || 'png';
  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      'Content-Type': MIME_BY_EXT[ext] || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filenameBase}.${ext}"`,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
