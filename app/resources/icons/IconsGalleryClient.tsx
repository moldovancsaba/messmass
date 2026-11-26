'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useMemo, useState } from 'react';
import MaterialIcon from '@/components/MaterialIcon';
import type { PublicIconDomain, PublicIconResource } from '@/lib/publicResourcesCatalog';
import styles from '../resources.module.css';

interface IconsGalleryClientProps {
  icons: PublicIconResource[];
  initialQuery?: string;
}

const DOMAIN_LABELS: Record<PublicIconDomain, string> = {
  sport: 'Sports',
  competition: 'Competitions',
  chart: 'Charts',
  property: 'KYC Properties',
  group: 'Variable Groups',
  clicker: 'Clicker Sets',
  category: 'Hashtag Categories',
  navigation: 'Navigation',
};

export default function IconsGalleryClient({ icons, initialQuery = '' }: IconsGalleryClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [domainFilter, setDomainFilter] = useState<'all' | PublicIconDomain>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return icons.filter((item) => {
      if (domainFilter !== 'all' && item.domain !== domainFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.subtitle || '').toLowerCase().includes(q) ||
        (item.icon || '').toLowerCase().includes(q) ||
        (item.emoji || '').toLowerCase().includes(q)
      );
    });
  }, [icons, query, domainFilter]);

  const copyText = (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1600);
  };

  const exportCatalog = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'messmass-icons-catalog.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    }
    const rows = [
      ['id', 'domain', 'title', 'subtitle', 'material_icon', 'emoji'].join(','),
      ...filtered.map((i) =>
        [i.id, i.domain, i.title, i.subtitle || '', i.icon || '', i.emoji || '']
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'messmass-icons-catalog.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main className={styles.container}>
      <div className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>System Icons, Sports, Charts &amp; Properties</h1>
          <p className={styles.heroSubtitle}>
            Complete read-only directory of Material Symbols and domain emojis mapped across sports, competitions, charts, KYC properties, clicker groups, categories, and navigation. Download official vector SVGs or copy icon tokens directly.
          </p>
        </div>
        <div className={styles.heroActions}>
          <button type="button" onClick={() => exportCatalog('json')} className={styles.secondaryBtn}>
            ⬇ Export JSON
          </button>
          <button type="button" onClick={() => exportCatalog('csv')} className={styles.secondaryBtn}>
            ⬇ Export CSV
          </button>
        </div>
      </div>

      <div className={styles.statsRow}>
        <span className={styles.statPill}>
          Total Mapped Items: <span className={styles.statPillStrong}>{icons.length}</span>
        </span>
        {(Object.keys(DOMAIN_LABELS) as PublicIconDomain[]).map((dom) => {
          const count = icons.filter((x) => x.domain === dom).length;
          return (
            <span key={dom} className={styles.statPill}>
              {DOMAIN_LABELS[dom]}: <span className={styles.statPillStrong}>{count}</span>
            </span>
          );
        })}
      </div>

      <div className={styles.controlsBar}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sport, chart, KYC variable, Material icon name, or emoji..."
          className={styles.searchInput}
          aria-label="Search icons"
        />

        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value as 'all' | PublicIconDomain)}
          className={styles.selectInput}
          aria-label="Filter by icon domain"
        >
          <option value="all">All Domains ({icons.length})</option>
          {(Object.keys(DOMAIN_LABELS) as PublicIconDomain[]).map((dom) => (
            <option key={dom} value={dom}>
              {DOMAIN_LABELS[dom]}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>No icons match your current filter.</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((item) => {
            const svgDownloadHref = item.icon
              ? `/api/resources/download?kind=icon&icon=${encodeURIComponent(item.icon)}&slug=${encodeURIComponent(item.slug)}`
              : null;
            const compLogoDownloadHref =
              item.domain === 'competition' && item.logoUrl
                ? `/api/resources/download?kind=competition&slug=${encodeURIComponent(item.slug)}`
                : null;

            return (
              <article key={item.id} className={styles.card}>
                <div>
                  <div className={styles.iconStage}>
                    {item.logoUrl && (
                      <img src={item.logoUrl} alt={item.title} className={styles.compLogoThumb} loading="lazy" />
                    )}
                    {item.icon && (
                      <span className={styles.iconGlyph} title={`Material Symbol: ${item.icon}`}>
                        <MaterialIcon name={item.icon} variant="outlined" />
                      </span>
                    )}
                    {item.emoji && (
                      <span className={styles.emojiGlyph} title={`Emoji: ${item.emoji}`}>
                        {item.emoji}
                      </span>
                    )}
                  </div>

                  <div className={styles.cardHeaderRow}>
                    <div>
                      <h2 className={styles.cardTitle}>{item.title}</h2>
                      {item.subtitle && <p className={styles.cardMeta}>{item.subtitle}</p>}
                    </div>
                    <span className={styles.badgeRaster}>{DOMAIN_LABELS[item.domain]}</span>
                  </div>

                  <div className={styles.actionsRow}>
                    {item.icon && <code className={styles.tokenCode}>{item.icon}</code>}
                    {item.emoji && <code className={styles.tokenCode}>{item.emoji}</code>}
                  </div>
                </div>

                <div className={styles.actionsRow}>
                  {svgDownloadHref && (
                    <a href={svgDownloadHref} download className={styles.downloadBtn}>
                      ⬇ Icon SVG
                    </a>
                  )}
                  {compLogoDownloadHref && (
                    <a href={compLogoDownloadHref} download className={styles.secondaryBtn}>
                      ⬇ League Logo
                    </a>
                  )}
                  {item.icon && (
                    <button
                      type="button"
                      onClick={() => copyText(`${item.id}:icon`, item.icon!)}
                      className={styles.secondaryBtn}
                    >
                      {copiedKey === `${item.id}:icon` ? '✓ Copied' : 'Copy Token'}
                    </button>
                  )}
                  {item.emoji && (
                    <button
                      type="button"
                      onClick={() => copyText(`${item.id}:emoji`, item.emoji!)}
                      className={styles.secondaryBtn}
                    >
                      {copiedKey === `${item.id}:emoji` ? '✓ Copied' : `Copy ${item.emoji}`}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
