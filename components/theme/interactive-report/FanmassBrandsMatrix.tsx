'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState, useMemo } from 'react';
import BrandLogo from './BrandLogo';
import {
  getBrandCluster,
  isSportFranchise,
  isVenue,
  mergeBrandVariants,
  BrandClusterId,
} from '@/lib/brandEntityClustering';
import styles from './interactive-report.module.css';

interface BrandStat {
  brand: string;
  count: number;
  logoUrl?: string;
  darkLogoUrl?: string;
  category?: string;
  accentColor?: string;
}

interface FanmassBrandsMatrixProps {
  brands: BrandStat[];
  totalPhotosProcessed: number;
}

type ClusterFilter = 'all' | BrandClusterId;

export default function FanmassBrandsMatrix({
  brands: rawBrands,
  totalPhotosProcessed,
}: FanmassBrandsMatrixProps) {
  const [filter, setFilter] = useState<ClusterFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Strict separation: Filter out sport franchises and arenas/venues completely
  const commercialBrands = useMemo(() => {
    const filtered = rawBrands.filter((b) => {
      if (!b.brand || b.brand.trim().length <= 1) return false;
      if (isSportFranchise(b.brand) || isVenue(b.brand)) return false;
      return true;
    });
    return mergeBrandVariants(filtered);
  }, [rawBrands]);

  const maxCount = useMemo(() => {
    return commercialBrands.length > 0 ? Math.max(...commercialBrands.map((b) => b.count)) : 1;
  }, [commercialBrands]);

  const totalSightings = useMemo(() => {
    return commercialBrands.reduce((acc, b) => acc + b.count, 0);
  }, [commercialBrands]);

  // Dynamic cluster counts
  const clusterCounts = useMemo(() => {
    const counts: Record<ClusterFilter, number> = {
      all: commercialBrands.length,
      title: 0,
      apparel: 0,
      corporate: 0,
      finance: 0,
      automotive: 0,
      fmcg: 0,
      lifestyle: 0,
      tech: 0,
    };

    for (const b of commercialBrands) {
      const cluster = getBrandCluster(b.brand);
      counts[cluster.id] = (counts[cluster.id] || 0) + 1;
    }

    return counts;
  }, [commercialBrands]);

  // Filtered brands by cluster and search query
  const filteredBrands = useMemo(() => {
    return commercialBrands.filter((b) => {
      const cluster = getBrandCluster(b.brand);
      if (filter !== 'all' && cluster.id !== filter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = b.brand.toLowerCase().includes(q);
        const matchesCluster = cluster.label.toLowerCase().includes(q);
        if (!matchesName && !matchesCluster) return false;
      }

      return true;
    });
  }, [commercialBrands, filter, searchQuery]);

  const visibleBrands = useMemo(() => {
    if (isExpanded || searchQuery.trim().length > 0 || filter !== 'all') {
      return filteredBrands;
    }
    return filteredBrands.slice(0, 24);
  }, [filteredBrands, isExpanded, searchQuery, filter]);

  return (
    <div className={styles.reportCard}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardHeaderBadgeRow}>
            <span className={styles.cardSourceTag}>
              🔍 Computer Vision Results • Visual Sightings
            </span>
            <span className={styles.cardCountPill}>
              {commercialBrands.length} Distinct Commercial Brands ({totalSightings.toLocaleString()} sightings)
            </span>
            <a
              href="/admin/brand-assets"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.brandSettingsLink}
            >
              ⚙️ Manage Original Brand Logos in Settings ➔
            </a>
          </div>
          <h3 className={styles.cardTitle}>
            🏷️ Commercial Brands &amp; Corporate Sponsor Clusters
          </h3>
          <p className={styles.cardSubtitle}>
            Corporate sponsors, title partners, kit apparel, beverage FMCG, and automotive brands identified in the analysed photos. Sport franchises and match arenas are classified separately in the Sport Franchises section.
          </p>
        </div>

        {/* Search and Category Filter Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', width: '100%' }}>
          {/* Cluster Granularity Pills */}
          <div className={styles.granularityToggle} style={{ flexWrap: 'wrap', gap: '4px' }}>
            <button
              onClick={() => setFilter('all')}
              className={`${styles.granularityBtn} ${filter === 'all' ? styles.granularityBtnActive : ''}`}
            >
              All Brands ({clusterCounts.all})
            </button>
            <button
              onClick={() => setFilter('title')}
              className={`${styles.granularityBtn} ${filter === 'title' ? styles.granularityBtnActive : ''}`}
            >
              🏆 Title &amp; Partners ({clusterCounts.title})
            </button>
            <button
              onClick={() => setFilter('apparel')}
              className={`${styles.granularityBtn} ${filter === 'apparel' ? styles.granularityBtnActive : ''}`}
            >
              🏷️ Unclassified ({clusterCounts.apparel})
            </button>
            <button
              onClick={() => setFilter('corporate')}
              className={`${styles.granularityBtn} ${filter === 'corporate' ? styles.granularityBtnActive : ''}`}
            >
              ⚡ Corporate &amp; Energy ({clusterCounts.corporate})
            </button>
            <button
              onClick={() => setFilter('finance')}
              className={`${styles.granularityBtn} ${filter === 'finance' ? styles.granularityBtnActive : ''}`}
            >
              🏦 Banking &amp; Finance ({clusterCounts.finance})
            </button>
            <button
              onClick={() => setFilter('automotive')}
              className={`${styles.granularityBtn} ${filter === 'automotive' ? styles.granularityBtnActive : ''}`}
            >
              🚗 Automotive ({clusterCounts.automotive})
            </button>
            <button
              onClick={() => setFilter('fmcg')}
              className={`${styles.granularityBtn} ${filter === 'fmcg' ? styles.granularityBtnActive : ''}`}
            >
              🥤 Beverage &amp; FMCG ({clusterCounts.fmcg})
            </button>
            <button
              onClick={() => setFilter('lifestyle')}
              className={`${styles.granularityBtn} ${filter === 'lifestyle' ? styles.granularityBtnActive : ''}`}
            >
              🧢 Lifestyle &amp; Retail ({clusterCounts.lifestyle})
            </button>
          </div>

          {/* Quick Search Input */}
          <div style={{ position: 'relative', width: '260px' }}>
            <input
              type="text"
              placeholder="Search brand cluster (e.g. Audi, MOL, Nike)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 28px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', left: '8px', top: '6px', fontSize: '12px', color: '#94a3b8' }}>
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '6px',
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Detected Brands */}
      {visibleBrands.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
          No commercial brands found matching the active cluster or search query.
        </div>
      ) : (
        <div className={styles.brandsMatrixGrid}>
          {visibleBrands.map((item, idx) => {
            const cluster = getBrandCluster(item.brand);
            const shareOfPhotos =
              totalPhotosProcessed > 0
                ? `${((item.count / totalPhotosProcessed) * 100).toFixed(1)}%`
                : 'n/a';
            const barWidth = Math.max(8, Math.round((item.count / maxCount) * 100));

            return (
              <div key={item.brand} className={styles.brandMatrixCard}>
                <div className={styles.brandCardTop}>
                  <div className={styles.brandLogoWrap}>
                    <BrandLogo
                      brand={item.brand}
                      logoUrl={item.logoUrl}
                      darkLogoUrl={item.darkLogoUrl}
                      accentColor={item.accentColor}
                      size={38}
                    />
                  </div>
                  <div className={styles.brandInfo}>
                    <div className={styles.brandRankRow}>
                      <span className={styles.brandRankBadge}>#{idx + 1}</span>
                      <span
                        className={styles.brandTagSponsor}
                        style={{
                          background: cluster.badgeBg,
                          color: cluster.badgeColor,
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          fontWeight: 700,
                        }}
                      >
                        {cluster.icon} {cluster.label}
                      </span>
                    </div>
                    <h4 className={styles.brandName} title={item.brand}>{item.brand}</h4>
                  </div>
                </div>

                {/* Metrics */}
                <div className={styles.brandMetricsRow}>
                  <div className={styles.brandMetricItem}>
                    <span className={styles.brandMetricLabel}>Sightings</span>
                    <span className={styles.brandMetricVal}>{item.count.toLocaleString()}</span>
                  </div>
                  <div className={styles.brandMetricItem} style={{ textAlign: 'right' }}>
                    <span className={styles.brandMetricLabel}>Photo Exposure</span>
                    <span className={styles.brandMetricVal}>{shareOfPhotos}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className={styles.brandBarTrack}>
                  <div
                    className={styles.brandBarFill}
                    style={{
                      width: `${barWidth}%`,
                      background: cluster.isSponsor ? '#88ca45' : '#3b82f6',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expand / Collapse Toggle if more than 24 brands */}
      {filteredBrands.length > 24 && !searchQuery.trim() && filter === 'all' && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '8px 20px',
              borderRadius: '9999px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isExpanded
              ? '▲ Show Top 24 Brands Only'
              : `▼ View All ${filteredBrands.length} Commercial Brands`}
          </button>
        </div>
      )}
    </div>
  );
}
