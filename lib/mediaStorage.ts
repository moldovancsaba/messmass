// lib/mediaStorage.ts
// WHAT: Stores report images, media, and assets in Cloudflare R2 bucket `messmass-logos` under their SHA-256.
// WHY: ImgBB links are unreliable, slow, or return 404 "image not found". R2 with immutable caching provides high reliability and fast delivery.
// HOW: Cloudflare R2 REST API authorized by MESSMASS_R2_API_TOKEN. Server-side only.

import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import sharp from 'sharp';

const MAX_MEDIA_BYTES = 25 * 1024 * 1024; // 25 MB
const TIMEOUT_MS = 25_000;
const MAX_REDIRECTS = 3;
const EXTENSIONS: Record<string, string> = { png: 'png', jpeg: 'jpg', jpg: 'jpg', webp: 'webp', gif: 'gif', svg: 'svg' };
const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };

type Fetcher = typeof fetch;

export interface MediaStorageConfig {
  accountId: string;
  apiToken: string;
  bucket: string;
  publicBaseUrl: string;
}

export function mediaStorageConfig(env: NodeJS.ProcessEnv = process.env): MediaStorageConfig | null {
  const accountId = (env.MESSMASS_R2_ACCOUNT_ID || env.R2_ACCOUNT_ID)?.trim();
  const apiToken = (env.MESSMASS_R2_API_TOKEN || env.R2_API_TOKEN)?.trim();
  const bucket = (env.MESSMASS_R2_LOGOS_BUCKET || env.R2_BUCKET)?.trim();
  let base: URL | null = null;
  const rawBase = (env.MESSMASS_R2_LOGOS_PUBLIC_BASE_URL || env.R2_PUBLIC_BASE_URL)?.trim();
  try {
    base = rawBase ? new URL(rawBase) : null;
  } catch {
    base = null;
  }
  if (!accountId || !/^[a-f0-9]{32}$/i.test(accountId) || !apiToken || !bucket || !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket)) return null;
  if (!base || base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) return null;
  return { accountId, apiToken, bucket, publicBaseUrl: base.toString().replace(/\/$/, '') };
}

export function isMediaStorageConfigured(): boolean {
  return mediaStorageConfig() !== null;
}

/** True when the link already points into the R2 bucket (logos/ or reports/ or media/). */
export function isStoredMediaUrl(url: string | null | undefined, config: MediaStorageConfig | null = mediaStorageConfig()): boolean {
  if (!url || !config) return false;
  return (
    url.startsWith(`${config.publicBaseUrl}/reports/`) ||
    url.startsWith(`${config.publicBaseUrl}/logos/`) ||
    url.startsWith(`${config.publicBaseUrl}/media/`)
  );
}

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  const v6 = address.toLowerCase();
  return v6 === '::1' || v6 === '::' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe8') || v6.startsWith('fe9') || v6.startsWith('fea') || v6.startsWith('feb') || v6.startsWith('::ffff:');
}

export async function isFetchableMediaUrl(
  raw: string,
  resolve: (host: string) => Promise<string[]> = async (host) => (await lookup(host, { all: true })).map((a) => a.address)
): Promise<boolean> {
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

export async function downloadMedia(
  url: string,
  fetcher: Fetcher = fetch,
  resolve?: Parameters<typeof isFetchableMediaUrl>[1]
): Promise<Buffer | null> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!(await isFetchableMediaUrl(current, resolve))) return null;
    let res: Response;
    try {
      res = await fetcher(current, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS), headers: { Accept: 'image/*,*/*' } });
    } catch {
      return null;
    }
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get('location');
      if (!next) return null;
      current = new URL(next, current).toString();
      continue;
    }
    if (!res.ok || Number(res.headers.get('content-length') ?? 0) > MAX_MEDIA_BYTES) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return bytes.length > 0 && bytes.length <= MAX_MEDIA_BYTES ? bytes : null;
  }
  return null;
}

export async function mediaExtension(bytes: Buffer): Promise<string | null> {
  if (/^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(bytes.subarray(0, 2048).toString('utf8'))) return 'svg';
  try {
    const format = (await sharp(bytes, { failOn: 'none' }).metadata()).format;
    return format ? EXTENSIONS[format] ?? null : null;
  } catch {
    return null;
  }
}

export async function storeMedia(
  bytes: Buffer,
  options: { folder?: string; fetcher?: Fetcher; config?: MediaStorageConfig | null } = {}
): Promise<{ url: string; key: string; sha256: string; extension: string } | null> {
  const { folder = 'reports', fetcher = fetch } = options;
  const config = options.config !== undefined ? options.config : mediaStorageConfig();
  if (!config || bytes.length === 0 || bytes.length > MAX_MEDIA_BYTES) return null;

  const extension = await mediaExtension(bytes);
  if (!extension) return null;
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const key = `${folder}/${sha256}.${extension}`;

  try {
    const res = await fetcher(`https://api.cloudflare.com/client/v4/accounts/${config.accountId}/r2/buckets/${encodeURIComponent(config.bucket)}/objects/${key}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        'Content-Type': MIME[extension] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
      body: new Uint8Array(bytes),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const result = (await res.json().catch(() => null)) as { success?: boolean; result?: { size?: number; key?: string } } | null;
    if (result?.success !== true || Number(result.result?.size) !== bytes.length || result.result?.key !== key) return null;
  } catch {
    return null;
  }
  return { url: `${config.publicBaseUrl}/${key}`, key, sha256, extension };
}

export async function rehostMedia(
  url: string | null | undefined,
  options: { folder?: string; fetcher?: Fetcher } = {}
): Promise<string | null | undefined> {
  const config = mediaStorageConfig();
  if (!url || !config || isStoredMediaUrl(url, config)) return url;
  const bytes = await downloadMedia(url, options.fetcher);
  const stored = bytes ? await storeMedia(bytes, { folder: options.folder, fetcher: options.fetcher, config }) : null;
  if (!stored) console.warn(`Media not moved to R2 bucket, link kept as it is: ${url.slice(0, 60)}`);
  return stored?.url ?? url;
}
