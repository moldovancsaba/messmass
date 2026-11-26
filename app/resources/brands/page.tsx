// app/resources/brands/page.tsx
// WHAT: Standalone public read-only Brand Logos directory (`/resources/brands`).
// WHY: Shareable directly with sponsors and internal design/ops teams to inspect and download official brand logos.

import React from 'react';
import type { Metadata } from 'next';
import { loadPublicBrandsCatalog } from '@/lib/publicResourcesCatalog';
import ResourcesNav from '../ResourcesNav';
import BrandsGalleryClient from './BrandsGalleryClient';
import styles from '../resources.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Brand Logos | {messmass} Resources',
  description: 'Read-only downloadable collection of official brand and sponsor logos.',
};

export default async function PublicBrandsResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [brands, sp] = await Promise.all([loadPublicBrandsCatalog(), searchParams]);

  return (
    <div className={styles.pageShell}>
      <ResourcesNav active="brands" />
      <BrandsGalleryClient brands={brands} initialQuery={typeof sp?.q === 'string' ? sp.q : ''} />
    </div>
  );
}
