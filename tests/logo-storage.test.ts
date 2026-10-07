// tests/logo-storage.test.ts
// WHAT: lib/logoStorage.ts keeps partner logos in the Cloudflare R2 logo bucket under their SHA-256 and never lets a save fail.
// HOW: fetch and DNS are injected; sharp makes a real one-pixel PNG so the file-type check is the real one.

import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { downloadLogo, isFetchableLogoUrl, isStoredLogoUrl, logoExtension, logoStorageConfig, rehostLogo, storeLogo } from '@/lib/logoStorage';

const ENV = {
  MESSMASS_R2_ACCOUNT_ID: 'a'.repeat(32),
  MESSMASS_R2_API_TOKEN: 'token-value',
  MESSMASS_R2_LOGOS_BUCKET: 'messmass-logos',
  MESSMASS_R2_LOGOS_PUBLIC_BASE_URL: 'https://logos.test.example/',
};
const publicDns = async () => ['93.184.216.34'];

async function png(): Promise<Buffer> {
  return sharp({ create: { width: 2, height: 2, channels: 3, background: { r: 10, g: 20, b: 30 } } }).png().toBuffer();
}

describe('logoStorageConfig', () => {
  it('needs all four settings, an https base address without credentials, and a valid account id and bucket name', () => {
    expect(logoStorageConfig(ENV as any)).toEqual({ accountId: 'a'.repeat(32), apiToken: 'token-value', bucket: 'messmass-logos', publicBaseUrl: 'https://logos.test.example' });
    for (const key of Object.keys(ENV)) expect(logoStorageConfig({ ...ENV, [key]: '' } as any)).toBeNull();
    expect(logoStorageConfig({ ...ENV, MESSMASS_R2_LOGOS_PUBLIC_BASE_URL: 'http://logos.test.example' } as any)).toBeNull();
    expect(logoStorageConfig({ ...ENV, MESSMASS_R2_LOGOS_PUBLIC_BASE_URL: 'https://user:pw@logos.test.example' } as any)).toBeNull();
    expect(logoStorageConfig({ ...ENV, MESSMASS_R2_ACCOUNT_ID: 'short' } as any)).toBeNull();
    expect(logoStorageConfig({ ...ENV, MESSMASS_R2_LOGOS_BUCKET: 'Bad Bucket' } as any)).toBeNull();
  });
});

describe('isFetchableLogoUrl', () => {
  it('accepts a public https name and refuses everything that could reach the inside', async () => {
    expect(await isFetchableLogoUrl('https://i.ibb.co/x/logo.png', publicDns)).toBe(true);
    for (const bad of ['http://i.ibb.co/x.png', 'https://user:pw@i.ibb.co/x.png', 'https://127.0.0.1/x.png', 'https://[::1]/x.png', 'https://localhost/x.png', 'not a url', 'file:///etc/passwd']) {
      expect(await isFetchableLogoUrl(bad, publicDns)).toBe(false);
    }
    for (const address of ['10.0.0.5', '127.0.0.1', '169.254.169.254', '172.16.0.1', '192.168.1.1', '100.64.0.1', '::1', 'fd00::1', '::ffff:10.0.0.1']) {
      expect(await isFetchableLogoUrl('https://rebinding.example/x.png', async () => [address])).toBe(false);
    }
    expect(await isFetchableLogoUrl('https://mixed.example/x.png', async () => ['93.184.216.34', '10.0.0.5'])).toBe(false);
    expect(await isFetchableLogoUrl('https://gone.example/x.png', async () => { throw new Error('ENOTFOUND'); })).toBe(false);
  });
});

describe('logoExtension', () => {
  it('tells an image from anything else, and SVG by its root element', async () => {
    expect(await logoExtension(await png())).toBe('png');
    expect(await logoExtension(Buffer.from('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBe('svg');
    expect(await logoExtension(Buffer.from('<html><body>not found</body></html>'))).toBeNull();
    expect(await logoExtension(Buffer.from('plain text'))).toBeNull();
  });
});

describe('storeLogo', () => {
  it('writes the file under its hash with a long cache and confirms size and key', async () => {
    const bytes = await png();
    const sha = createHash('sha256').update(bytes).digest('hex');
    const calls: any[] = [];
    const fetcher = (async (url: string, init: any) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ success: true, result: { size: bytes.length, key: `logos/${sha}.png` } }), { status: 200 });
    }) as unknown as typeof fetch;
    const stored = await storeLogo(bytes, fetcher, logoStorageConfig(ENV as any));
    expect(stored).toEqual({ url: `https://logos.test.example/logos/${sha}.png`, key: `logos/${sha}.png`, sha256: sha });
    expect(calls[0].url).toBe(`https://api.cloudflare.com/client/v4/accounts/${'a'.repeat(32)}/r2/buckets/messmass-logos/objects/logos/${sha}.png`);
    expect(calls[0].init.method).toBe('PUT');
    expect(calls[0].init.headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect(calls[0].init.headers.Authorization).toBe('Bearer token-value');
  });

  it('stores nothing that is not an image, or when the bucket refuses or answers wrongly', async () => {
    const config = logoStorageConfig(ENV as any);
    const never = (async () => { throw new Error('must not be called'); }) as unknown as typeof fetch;
    expect(await storeLogo(Buffer.from('<html></html>'), never, config)).toBeNull();
    expect(await storeLogo(Buffer.alloc(0), never, config)).toBeNull();
    expect(await storeLogo(await png(), never, null)).toBeNull();
    const bytes = await png();
    expect(await storeLogo(bytes, (async () => new Response('{}', { status: 403 })) as unknown as typeof fetch, config)).toBeNull();
    expect(await storeLogo(bytes, (async () => new Response(JSON.stringify({ success: true, result: { size: 1, key: 'other' } }), { status: 200 })) as unknown as typeof fetch, config)).toBeNull();
    expect(await storeLogo(bytes, (async () => { throw new Error('network'); }) as unknown as typeof fetch, config)).toBeNull();
  });
});

describe('downloadLogo', () => {
  it('follows a few redirects, checking every address, and refuses a redirect to the inside', async () => {
    const bytes = await png();
    const fetcher = (async (url: string) => {
      if (url === 'https://a.example/x.png') return new Response(null, { status: 302, headers: { location: 'https://b.example/y.png' } });
      if (url === 'https://b.example/y.png') return new Response(new Uint8Array(bytes), { status: 200 });
      return new Response(null, { status: 404 });
    }) as unknown as typeof fetch;
    expect((await downloadLogo('https://a.example/x.png', fetcher, publicDns))?.length).toBe(bytes.length);
    const inside = (async () => new Response(null, { status: 302, headers: { location: 'https://127.0.0.1/secret' } })) as unknown as typeof fetch;
    expect(await downloadLogo('https://a.example/x.png', inside, publicDns)).toBeNull();
    const loop = (async () => new Response(null, { status: 302, headers: { location: 'https://a.example/x.png' } })) as unknown as typeof fetch;
    expect(await downloadLogo('https://a.example/x.png', loop, publicDns)).toBeNull();
  });

  it('refuses a missing file and a file that is too big', async () => {
    expect(await downloadLogo('https://a.example/x.png', (async () => new Response(null, { status: 404 })) as unknown as typeof fetch, publicDns)).toBeNull();
    expect(await downloadLogo('https://a.example/x.png', (async () => new Response(new Uint8Array(6 * 1024 * 1024), { status: 200 })) as unknown as typeof fetch, publicDns)).toBeNull();
  });
});

describe('rehostLogo', () => {
  const realEnv = { ...process.env };
  afterEach(() => {
    process.env = { ...realEnv };
  });

  it('keeps the link as it is when the bucket is not set up, the link is already stored, or the logo cannot be moved', async () => {
    const never = (async () => { throw new Error('must not be called'); }) as unknown as typeof fetch;
    for (const key of Object.keys(ENV)) delete process.env[key];
    expect(await rehostLogo('https://i.ibb.co/x/logo.png', never)).toBe('https://i.ibb.co/x/logo.png');
    Object.assign(process.env, ENV);
    expect(await rehostLogo('https://logos.test.example/logos/abc.png', never)).toBe('https://logos.test.example/logos/abc.png');
    expect(await rehostLogo('', never)).toBe('');
    expect(await rehostLogo(undefined, never)).toBeUndefined();
    expect(await rehostLogo('https://127.0.0.1/x.png', never)).toBe('https://127.0.0.1/x.png');
    expect(isStoredLogoUrl('https://logos.test.example/logos/abc.png')).toBe(true);
    expect(isStoredLogoUrl('https://i.ibb.co/x.png')).toBe(false);
  });
});
