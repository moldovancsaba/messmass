// lib/logoStorage.ts
// WHAT: Stores partner logos in the public Cloudflare R2 bucket `messmass-logos`, under their SHA-256 (docs/operations/logo-storage.md).
// WHY: imgbb links turn slow, time out or become the "image not found" picture, and every guest page of camera shows a broken logo then.
//     A file stored under its hash is stored once, its link never changes content and can be cached for good.
// HOW: Cloudflare's R2 REST API (not the S3-compatible one), authorised by MESSMASS_R2_API_TOKEN, server-side only. Anything that cannot be
//     stored (not configured, not an image, too big, not a public https address) leaves the caller with the link it had: a save never fails.

import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import sharp from 'sharp';

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 3;
const EXTENSIONS: Record<string, string> = { png: 'png', jpeg: 'jpg', webp: 'webp', gif: 'gif', svg: 'svg' };
const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };

type Fetcher = typeof fetch;

export interface LogoStorageConfig {
  accountId: string;
  apiToken: string;
  bucket: string;
  publicBaseUrl: string;
}

/** The settings, or null when any of the four is missing or malformed (the caller then keeps the link as it is). */
export function logoStorageConfig(env: NodeJS.ProcessEnv = process.env): LogoStorageConfig | null {
  const accountId = env.MESSMASS_R2_ACCOUNT_ID?.trim();
  const apiToken = env.MESSMASS_R2_API_TOKEN?.trim();
  const bucket = env.MESSMASS_R2_LOGOS_BUCKET?.trim();
  let base: URL | null = null;
  try {
    base = env.MESSMASS_R2_LOGOS_PUBLIC_BASE_URL ? new URL(env.MESSMASS_R2_LOGOS_PUBLIC_BASE_URL.trim()) : null;
  } catch {
    base = null;
  }
  if (!accountId || !/^[a-f0-9]{32}$/i.test(accountId) || !apiToken || !bucket || !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket)) return null;
  if (!base || base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) return null;
  return { accountId, apiToken, bucket, publicBaseUrl: base.toString().replace(/\/$/, '') };
}

export function isLogoStorageConfigured(): boolean {
  return logoStorageConfig() !== null;
}

/** True when the link already points into the logo bucket (nothing to move). */
export function isStoredLogoUrl(url: string | null | undefined, config: LogoStorageConfig | null = logoStorageConfig()): boolean {
  if (!url || !config) return false;
  return url.startsWith(`${config.publicBaseUrl}/logos/`);
}

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  const v6 = address.toLowerCase();
  return v6 === '::1' || v6 === '::' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe8') || v6.startsWith('fe9') || v6.startsWith('fea') || v6.startsWith('feb') || v6.startsWith('::ffff:');
}

/** A logo link is fetched only when it is https, has no credentials and its host is a name that resolves to public addresses only. */
export async function isFetchableLogoUrl(raw: string, resolve: (host: string) => Promise<string[]> = async (host) => (await lookup(host, { all: true })).map((a) => a.address)): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password || isIP(url.hostname.replace(/^\[|\]$/g, '')) !== 0 || url.hostname === 'localhost') return false;
  try {
    const addresses = await resolve(url.hostname);
    return addresses.length > 0 && addresses.every((address) => !isPrivateAddress(address));
  } catch {
    return false;
  }
}

/** The bytes of a public logo link, or null when it is not fetchable, does not answer, is too big or is not an image. */
export async function downloadLogo(url: string, fetcher: Fetcher = fetch, resolve?: Parameters<typeof isFetchableLogoUrl>[1]): Promise<Buffer | null> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!(await isFetchableLogoUrl(current, resolve))) return null;
    let res: Response;
    try {
      res = await fetcher(current, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS), headers: { Accept: 'image/*' } });
    } catch {
      return null;
    }
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get('location');
      if (!next) return null;
      current = new URL(next, current).toString();
      continue;
    }
    if (!res.ok || Number(res.headers.get('content-length') ?? 0) > MAX_LOGO_BYTES) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return bytes.length > 0 && bytes.length <= MAX_LOGO_BYTES ? bytes : null;
  }
  return null;
}

/** The file type of the bytes when they are a logo image, else null. SVG is taken by its root element. */
export async function logoExtension(bytes: Buffer): Promise<string | null> {
  if (/^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(bytes.subarray(0, 2048).toString('utf8'))) return 'svg';
  try {
    const format = (await sharp(bytes, { failOn: 'none' }).metadata()).format;
    return format ? EXTENSIONS[format] ?? null : null;
  } catch {
    return null;
  }
}

/** Stores the bytes under `logos/<sha256>.<ext>` and returns the public link; null when they are not an image or the bucket refuses them. */
export async function storeLogo(bytes: Buffer, fetcher: Fetcher = fetch, config: LogoStorageConfig | null = logoStorageConfig()): Promise<{ url: string; key: string; sha256: string } | null> {
  if (!config || bytes.length === 0 || bytes.length > MAX_LOGO_BYTES) return null;
  const extension = await logoExtension(bytes);
  if (!extension) return null;
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const key = `logos/${sha256}.${extension}`;
  try {
    const res = await fetcher(`https://api.cloudflare.com/client/v4/accounts/${config.accountId}/r2/buckets/${encodeURIComponent(config.bucket)}/objects/${key}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${config.apiToken}`, 'Content-Type': MIME[extension], 'Cache-Control': 'public, max-age=31536000, immutable' },
      body: new Uint8Array(bytes),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const result = (await res.json().catch(() => null)) as { success?: boolean; result?: { size?: number; key?: string } } | null;
    if (result?.success !== true || Number(result.result?.size) !== bytes.length || result.result?.key !== key) return null;
  } catch {
    return null;
  }
  return { url: `${config.publicBaseUrl}/${key}`, key, sha256 };
}

/**
 * The link to keep for a logo: the stored copy when the link can be moved, else the link as it was. Called wherever a partner's logo is saved,
 * so a logo from imgbb, Vercel Blob, TheSportsDB or anywhere public ends up in the bucket whichever screen it was entered on.
 */
export async function rehostLogo(url: string | null | undefined, fetcher: Fetcher = fetch): Promise<string | null | undefined> {
  const config = logoStorageConfig();
  if (!url || !config || isStoredLogoUrl(url, config)) return url;
  const bytes = await downloadLogo(url, fetcher);
  const stored = bytes ? await storeLogo(bytes, fetcher, config) : null;
  if (!stored) console.warn(`Logo not moved to the logo bucket, link kept as it is: ${url.slice(0, 60)}`);
  return stored?.url ?? url;
}
