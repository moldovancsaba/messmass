// app/resources/page.tsx
// WHAT: Public read-only Asset & Brand Resources hub (`/resources`) linking to the 3 independent
//       download-only collections (`/resources/brands`, `/resources/partners`, `/resources/icons`).
// WHY: Shareable entry point for external partners verifying their logos and internal teams downloading assets.

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { loadPublicResourcesSummary } from '@/lib/publicResourcesCatalog';
import ResourcesNav from './ResourcesNav';
import styles from './resources.module.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Asset & Brand Resources | {messmass}',
  description: 'Public read-only downloadable directory of official brand logos, partner & club crests, and system icons.',
};

export default async function PublicResourcesHubPage() {
  const summary = await loadPublicResourcesSummary();

  return (
    <div className={styles.pageShell}>
      <ResourcesNav active="hub" />
      <main className={styles.container}>
        <div className={styles.hero}>
          <div>
            <h1 className={styles.heroTitle}>messmass Public Asset &amp; Icon Resources</h1>
            <p className={styles.heroSubtitle}>
              Three independent, read-only public collections for partners checking their official logos and team members downloading verified brand marks, club crests, and system icons.
            </p>
          </div>
        </div>

        <div className={styles.hubGrid}>
          <Link href="/resources/brands" className={styles.hubCard}>
            <div>
              <div className={styles.hubCardEyebrow}>Collection 01 • Commercial Sponsors</div>
              <h2 className={styles.hubCardTitle}>Brand Logos</h2>
              <p className={styles.hubCardDesc}>
                Official commercial brand and sponsor logos ({summary.brandsSvgCount} vector SVGs, {summary.brandsCount - summary.brandsSvgCount} PNG/JPG) with light/dark surface preview and instant file download.
              </p>
            </div>
            <div className={styles.hubCardFooter}>
              <code className={styles.urlCode}>/resources/brands</code>
              <span>Browse {summary.brandsCount} Brands →</span>
            </div>
          </Link>

          <Link href="/resources/partners" className={styles.hubCard}>
            <div>
              <div className={styles.hubCardEyebrow}>Collection 02 • Clubs, Nations &amp; Federations</div>
              <h2 className={styles.hubCardTitle}>Partners &amp; Team Logos</h2>
              <p className={styles.hubCardDesc}>
                Official sports club crests, national team emblems, and federation logos ({summary.partnersSvgCount} vector SVGs, {summary.partnersCount - summary.partnersSvgCount} raster) ready for partner review and download.
              </p>
            </div>
            <div className={styles.hubCardFooter}>
              <code className={styles.urlCode}>/resources/partners</code>
              <span>Browse {summary.partnersCount} Partners →</span>
            </div>
          </Link>

          <Link href="/resources/icons" className={styles.hubCard}>
            <div>
              <div className={styles.hubCardEyebrow}>Collection 03 • Sports, Charts &amp; Properties</div>
              <h2 className={styles.hubCardTitle}>System Icons</h2>
              <p className={styles.hubCardDesc}>
                Complete directory of Material Symbols and domain emojis across sports, competitions, charts, KYC properties, variable groups, clicker sets, and categories with downloadable vector SVGs.
              </p>
            </div>
            <div className={styles.hubCardFooter}>
              <code className={styles.urlCode}>/resources/icons</code>
              <span>Browse {summary.iconsCount} Icons →</span>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
