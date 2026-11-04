// tests/media-storage.test.ts
// WHAT: lib/mediaStorage.ts keeps report images and media in the Cloudflare R2 bucket under their SHA-256.

import sharp from 'sharp';
import { createHash } from 'node:crypto';
import {
  downloadMedia,
  isFetchableMediaUrl,
  isStoredMediaUrl,
  mediaExtension,
  mediaStorageConfig,
  rehostMedia,
  storeMedia,
} from '@/lib/mediaStorage';

const ENV = {
  MESSMASS_R2_ACCOUNT_ID: 'a'.repeat(32),
  MESSMASS_R2_API_TOKEN: 'token-value',
  MESSMASS_R2_LOGOS_BUCKET: 'messmass-logos',
  MESSMASS_R2_LOGOS_PUBLIC_BASE_URL: 'https://pub-b52ac4e9cc2b4199acd3a3b997ffdb0f.r2.dev',
};
const publicDns = async () => ['93.184.216.34'];

async function png(): Promise<Buffer> {
  return sharp({ create: { width: 2, height: 2, channels: 3, background: { r: 10, g: 20, b: 30 } } }).png().toBuffer();
}

describe('mediaStorageConfig', () => {
  it('needs all required settings, an https base address, and a valid account id and bucket name', () => {
    expect(mediaStorageConfig(ENV as any)).toEqual({
      accountId: 'a'.repeat(32),
      apiToken: 'token-value',
      bucket: 'messmass-logos',
      publicBaseUrl: 'https://pub-b52ac4e9cc2b4199acd3a3b997ffdb0f.r2.dev',
    });
    for (const key of Object.keys(ENV)) {
      expect(mediaStorageConfig({ ...ENV, [key]: '' } as any)).toBeNull();
    }
  });
});

describe('isFetchableMediaUrl', () => {
  it('accepts public https and rejects internal/private IP targets', async () => {
    expect(await isFetchableMediaUrl('https://i.ibb.co/x/photo.png', publicDns)).toBe(true);
    for (const bad of [
      'http://i.ibb.co/x.png',
      'https://127.0.0.1/x.png',
      'https://[::1]/x.png',
      'https://localhost/x.png',
      'file:///etc/passwd',
    ]) {
      expect(await isFetchableMediaUrl(bad, publicDns)).toBe(false);
    }
  });
});

describe('mediaExtension', () => {
  it('detects image types and SVG correctly', async () => {
    expect(await mediaExtension(await png())).toBe('png');
    expect(await mediaExtension(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBe('svg');
    expect(await mediaExtension(Buffer.from('not an image'))).toBeNull();
  });
});

describe('storeMedia', () => {
  it('uploads bytes with sha256 and immutable cache-control headers', async () => {
    const bytes = await png();
    const sha = createHash('sha256').update(bytes).digest('hex');
    const calls: any[] = [];
    const fetcher = (async (url: string, init: any) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ success: true, result: { size: bytes.length, key: `reports/${sha}.png` } }), {
        status: 200,
      });
    }) as unknown as typeof fetch;

    const stored = await storeMedia(bytes, { folder: 'reports', fetcher, config: mediaStorageConfig(ENV as any) });
    expect(stored).toEqual({
      url: `https://pub-b52ac4e9cc2b4199acd3a3b997ffdb0f.r2.dev/reports/${sha}.png`,
      key: `reports/${sha}.png`,
      sha256: sha,
      extension: 'png',
    });
    expect(calls[0].url).toContain(`/objects/reports/${sha}.png`);
    expect(calls[0].init.headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
  });
});

describe('isStoredMediaUrl', () => {
  it('correctly identifies stored URLs', () => {
    const config = mediaStorageConfig(ENV as any);
    expect(isStoredMediaUrl('https://pub-b52ac4e9cc2b4199acd3a3b997ffdb0f.r2.dev/reports/abc.png', config)).toBe(true);
    expect(isStoredMediaUrl('https://pub-b52ac4e9cc2b4199acd3a3b997ffdb0f.r2.dev/logos/abc.png', config)).toBe(true);
    expect(isStoredMediaUrl('https://i.ibb.co/abc/image.png', config)).toBe(false);
  });
});
