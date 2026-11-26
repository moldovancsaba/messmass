// app/resources/partners/page.tsx
// WHAT: Standalone public read-only Partners, Clubs, National Teams & Federations logo directory (`/resources/partners`).
// WHY: Shareable directly with partner clubs, federations, and team members to check crests and download official files.

import React from 'react';
import type { Metadata } from 'next';
import { loadPublicPartnersCatalog } from '@/lib/publicResourcesCatalog';
import ResourcesNav from '../ResourcesNav';
import PartnersGalleryClient from './PartnersGalleryClient';
import styles from '../resources.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Partner & Club Logos | {messmass} Resources',
  description: 'Read-only downloadable collection of official sports club crests, national teams, and federation logos.',
};

export default async function PublicPartnersResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [partners, sp] = await Promise.all([loadPublicPartnersCatalog(), searchParams]);

  return (
    <div className={styles.pageShell}>
      <ResourcesNav active="partners" />
      <PartnersGalleryClient partners={partners} initialQuery={typeof sp?.q === 'string' ? sp.q : ''} />
    </div>
  );
}
