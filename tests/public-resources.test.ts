import fs from 'node:fs';
import path from 'node:path';
import { detectAssetFormat } from '@/lib/publicResourcesCatalog';

describe('public /resources pages and catalog helpers', () => {
  it('detects vector SVG and raster formats accurately', () => {
    expect(detectAssetFormat('https://pub-example.r2.dev/logos/abc123.svg')).toBe('SVG');
    expect(detectAssetFormat('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=')).toBe('SVG');
    expect(detectAssetFormat('https://pub-example.r2.dev/logos/abc123.png?v=1')).toBe('PNG');
    expect(detectAssetFormat('https://pub-example.r2.dev/logos/abc123.webp')).toBe('WEBP');
    expect(detectAssetFormat('https://pub-example.r2.dev/logos/abc123.jpg')).toBe('JPG');
    expect(detectAssetFormat('')).toBe('MISSING');
    expect(detectAssetFormat(null)).toBe('MISSING');
  });

  it('keeps all /resources pages and download endpoint strictly read-only with zero mutation controls', () => {
    const root = process.cwd();
    const resourceUiFiles = [
      'app/resources/page.tsx',
      'app/resources/ResourcesNav.tsx',
      'app/resources/brands/page.tsx',
      'app/resources/brands/BrandsGalleryClient.tsx',
      'app/resources/partners/page.tsx',
      'app/resources/partners/PartnersGalleryClient.tsx',
      'app/resources/icons/page.tsx',
      'app/resources/icons/IconsGalleryClient.tsx',
    ];

    for (const rel of resourceUiFiles) {
      const src = fs.readFileSync(path.join(root, rel), 'utf8');
      expect(src).toBeTruthy();
      // Must never expose file upload inputs or mutating API calls
      expect(src).not.toMatch(/type=["']file["']/i);
      expect(src).not.toMatch(/method:\s*["'](POST|PUT|PATCH|DELETE)["']/i);
      expect(src).not.toMatch(/\b(apiPost|apiPut|apiDelete)\b/);
    }

    const downloadRouteSrc = fs.readFileSync(
      path.join(root, 'app/api/resources/download/route.ts'),
      'utf8'
    );
    expect(downloadRouteSrc).toMatch(/export\s+async\s+function\s+GET\b/);
    expect(downloadRouteSrc).not.toMatch(/export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\b/);
  });
});
