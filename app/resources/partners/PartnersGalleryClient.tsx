'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useMemo, useState } from 'react';
import type { PublicPartnerResource } from '@/lib/publicResourcesCatalog';
import styles from '../resources.module.css';

interface PartnersGalleryClientProps {
  partners: PublicPartnerResource[];
  initialQuery?: string;
}

const KIND_LABELS: Record<PublicPartnerResource['entityKind'], string> = {
  club: 'Club',
  national_team: 'National Team',
  federation: 'Federation / League',
};

export default function PartnersGalleryClient({ partners, initialQuery = '' }: PartnersGalleryClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [kindFilter, setKindFilter] = useState<'all' | 'club' | 'national_team' | 'federation'>('all');
  const [sportFilter, setSportFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState<'all' | 'svg' | 'raster'>('all');
  const [backdrop, setBackdrop] = useState<'split' | 'light' | 'dark'>('split');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const sports = useMemo(() => {
    const set = new Set<string>();
    for (const p of partners) {
      if (p.sport) set.add(p.sport);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [partners]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return partners.filter((p) => {
      if (kindFilter !== 'all' && p.entityKind !== kindFilter) return false;
      if (sportFilter !== 'all' && (p.sport || '').toLowerCase() !== sportFilter.toLowerCase()) return false;
      if (formatFilter === 'svg' && p.format !== 'SVG') return false;
      if (formatFilter === 'raster' && p.format === 'SVG') return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.sport || '').toLowerCase().includes(q) ||
        (p.country || '').toLowerCase().includes(q)
      );
    });
  }, [partners, query, kindFilter, sportFilter, formatFilter]);

  const svgCount = useMemo(() => partners.filter((p) => p.format === 'SVG').length, [partners]);

  const copyAssetUrl = (slug: string, url: string) => {
    if (typeof window === 'undefined') return;
    const absolute = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(absolute);
    setCopiedSlug(slug);
    window.setTimeout(() => setCopiedSlug(null), 1800);
  };

  const exportCatalogJson = () => {
    const payload = filtered.map((p) => ({
      name: p.name,
      slug: p.slug,
      entityKind: p.entityKind,
      sport: p.sport,
      country: p.country,
      format: p.format,
      logoUrl: p.logoUrl,
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'messmass-partner-logos.json';
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
          <h1 className={styles.heroTitle}>Partners, Clubs &amp; Federations Logos</h1>
          <p className={styles.heroSubtitle}>
            Official sports club crests, national team emblems, and federation logos verified for messmass events and reports. Share this page with partners to verify their crest or download vector/raster files.
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
          Total Partners &amp; Teams: <span className={styles.statPillStrong}>{partners.length}</span>
        </span>
        <span className={styles.statPill}>
          Vector SVG: <span className={styles.statPillStrong}>{svgCount}</span>
        </span>
        <span className={styles.statPill}>
          Raster (PNG/WEBP/JPG): <span className={styles.statPillStrong}>{partners.length - svgCount}</span>
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
          placeholder="Search club, partner, federation, sport, or country..."
          className={styles.searchInput}
          aria-label="Search partners and clubs"
        />

        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as 'all' | 'club' | 'national_team' | 'federation')}
          className={styles.selectInput}
          aria-label="Filter by entity type"
        >
          <option value="all">All Entity Types</option>
          <option value="club">Clubs</option>
          <option value="national_team">National Teams</option>
          <option value="federation">Federations &amp; Leagues</option>
        </select>

        <select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          className={styles.selectInput}
          aria-label="Filter by sport"
        >
          <option value="all">All Sports</option>
          {sports.map((sp) => (
            <option key={sp} value={sp}>
              {sp}
            </option>
          ))}
        </select>

        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value as 'all' | 'svg' | 'raster')}
          className={styles.selectInput}
          aria-label="Filter by file format"
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
        <div className={styles.emptyState}>No partner or club logos match your current filter.</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((p) => {
            const displayLogo = backdrop === 'dark' && p.darkLogoUrl ? p.darkLogoUrl : p.logoUrl;
            const downloadHref = `/api/resources/download?kind=partner&slug=${encodeURIComponent(p.slug)}`;
            const metaParts = [KIND_LABELS[p.entityKind], p.sport, p.country].filter(Boolean);
            return (
              <article key={p.slug} className={styles.card}>
                <div>
                  <div className={`${styles.previewBox} ${previewClass}`}>
                    <img src={displayLogo} alt={`${p.name} crest`} className={styles.logoImage} loading="lazy" />
                  </div>
                  <div className={styles.cardHeaderRow}>
                    <div>
                      <h2 className={styles.cardTitle}>
                        {p.emoji} {p.name}
                      </h2>
                      <p className={styles.cardMeta}>{metaParts.join(' • ')}</p>
                    </div>
                    <span className={p.format === 'SVG' ? styles.badgeSvg : styles.badgeRaster}>{p.format}</span>
                  </div>
                </div>

                <div className={styles.actionsRow}>
                  <a href={downloadHref} download className={styles.downloadBtn}>
                    ⬇ Download {p.format}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyAssetUrl(p.slug, p.logoUrl)}
                    className={styles.secondaryBtn}
                    title="Copy direct CDN asset URL"
                  >
                    {copiedSlug === p.slug ? '✓ Copied' : 'Copy URL'}
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
