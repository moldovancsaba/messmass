// app/resources/icons/page.tsx
// WHAT: Standalone public read-only System Icons directory (`/resources/icons`).
// WHY: Shareable directly with partners and internal product/ops teams to inspect and download vector icons across sports, charts, and properties.

import React from 'react';
import type { Metadata } from 'next';
import { loadPublicIconsCatalog } from '@/lib/publicResourcesCatalog';
import ResourcesNav from '../ResourcesNav';
import IconsGalleryClient from './IconsGalleryClient';
import styles from '../resources.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'System Icons | {messmass} Resources',
  description: 'Read-only downloadable collection of sports, chart, property, and category icons.',
};

export default async function PublicIconsResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [icons, sp] = await Promise.all([loadPublicIconsCatalog(), searchParams]);

  return (
    <div className={styles.pageShell}>
      <ResourcesNav active="icons" />
      <IconsGalleryClient icons={icons} initialQuery={typeof sp?.q === 'string' ? sp.q : ''} />
    </div>
  );
}
