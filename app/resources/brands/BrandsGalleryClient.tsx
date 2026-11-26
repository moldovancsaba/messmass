'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useMemo, useState } from 'react';
import type { PublicBrandResource } from '@/lib/publicResourcesCatalog';
import styles from '../resources.module.css';

interface BrandsGalleryClientProps {
  brands: PublicBrandResource[];
  initialQuery?: string;
}

export default function BrandsGalleryClient({ brands, initialQuery = '' }: BrandsGalleryClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState<'all' | 'svg' | 'raster'>('all');
  const [backdrop, setBackdrop] = useState<'split' | 'light' | 'dark'>('split');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const b of brands) {
      if (b.category) set.add(b.category);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [brands]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return brands.filter((b) => {
      if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;
      if (formatFilter === 'svg' && b.format !== 'SVG') return false;
      if (formatFilter === 'raster' && b.format === 'SVG') return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.aliases.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [brands, query, categoryFilter, formatFilter]);

  const svgCount = useMemo(() => brands.filter((b) => b.format === 'SVG').length, [brands]);

  const copyAssetUrl = (slug: string, url: string) => {
    if (typeof window === 'undefined') return;
    const absolute = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(absolute);
    setCopiedSlug(slug);
    window.setTimeout(() => setCopiedSlug(null), 1800);
  };

  const exportCatalogJson = () => {
    const payload = filtered.map((b) => ({
      name: b.name,
      slug: b.slug,
      category: b.category,
      format: b.format,
      logoUrl: b.logoUrl,
      darkLogoUrl: b.darkLogoUrl || null,
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'messmass-brand-logos.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const previewClass =
    backdrop === 'light'
      ? styles.previewLight
      : backdrop === 'dark'
        ? styles.previewDark
        : styles.previewSplit;

  return (
    <main className={styles.container}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>Brand Logos Directory</h1>
          <p className={styles.heroSubtitle}>
            Official commercial brand and sponsor logos used across messmass reports. Read-only public library — inspect light/dark contrast and download original vector SVG or PNG files directly.
          </p>
        </div>
        <div className={styles.heroActions}>
          <button type="button" onClick={exportCatalogJson} className={styles.secondaryBtn}>
            ⬇ Export Manifest (.json)
          </button>
        </div>
      </div>

      <div className={styles.statsRow}>
        <span className={styles.statPill}>
          Total Brands: <span className={styles.statPillStrong}>{brands.length}</span>
        </span>
        <span className={styles.statPill}>
          Vector SVG: <span className={styles.statPillStrong}>{svgCount}</span>
        </span>
        <span className={styles.statPill}>
          Raster (PNG/JPG): <span className={styles.statPillStrong}>{brands.length - svgCount}</span>
        </span>
        <span className={styles.statPill}>
          Showing: <span className={styles.statPillStrong}>{filtered.length}</span>
        </span>
      </div>

      <div className={styles.controlsBar}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search brand name, category, or alias..."
          className={styles.searchInput}
          aria-label="Search brands"
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={styles.selectInput}
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value as 'all' | 'svg' | 'raster')}
          className={styles.selectInput}
          aria-label="Filter by format"
        >
          <option value="all">All Formats</option>
          <option value="svg">Vector SVG Only</option>
          <option value="raster">PNG / Raster Only</option>
        </select>

        <div className={styles.backdropToggle} role="group" aria-label="Preview background">
          <button
            type="button"
            onClick={() => setBackdrop('split')}
            className={`${styles.backdropBtn} ${backdrop === 'split' ? styles.backdropBtnActive : ''}`}
          >
            Split
          </button>
          <button
            type="button"
            onClick={() => setBackdrop('light')}
            className={`${styles.backdropBtn} ${backdrop === 'light' ? styles.backdropBtnActive : ''}`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => setBackdrop('dark')}
            className={`${styles.backdropBtn} ${backdrop === 'dark' ? styles.backdropBtnActive : ''}`}
          >
            Dark
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>No brands match your current filter.</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((b) => {
            const displayLogo = backdrop === 'dark' && b.darkLogoUrl ? b.darkLogoUrl : b.logoUrl;
            const downloadHref = `/api/resources/download?kind=brand&slug=${encodeURIComponent(b.slug)}`;
            return (
              <article key={b.slug} className={styles.card}>
                <div>
                  <div className={`${styles.previewBox} ${previewClass}`}>
                    <img src={displayLogo} alt={`${b.name} logo`} className={styles.logoImage} loading="lazy" />
                  </div>
                  <div className={styles.cardHeaderRow}>
                    <div>
                      <h2 className={styles.cardTitle}>{b.name}</h2>
                      <p className={styles.cardMeta}>{b.category}</p>
                    </div>
                    <span className={b.format === 'SVG' ? styles.badgeSvg : styles.badgeRaster}>{b.format}</span>
                  </div>
                </div>

                <div className={styles.actionsRow}>
                  <a href={downloadHref} download className={styles.downloadBtn}>
                    ⬇ Download {b.format}
                  </a>
                  {b.darkLogoUrl && b.darkLogoUrl !== b.logoUrl && (
                    <a
                      href={`${downloadHref}&variant=dark`}
                      download
                      className={styles.secondaryBtn}
                      title="Download dark-surface variant"
                    >
                      ⬇ Dark
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => copyAssetUrl(b.slug, b.logoUrl)}
                    className={styles.secondaryBtn}
                    title="Copy direct CDN asset URL"
                  >
                    {copiedSlug === b.slug ? '✓ Copied' : 'Copy URL'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
