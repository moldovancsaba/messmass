'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState, useMemo } from 'react';
import BrandLogo from './BrandLogo';
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
  totalImages?: number;
}

function getBrandCategory(brand: string): { label: string; tagClass: string; isSponsor: boolean } {
  const norm = brand.toLowerCase();
  if (norm.includes('tippmix')) {
    return { label: 'Title Sponsor', tagClass: styles.brandTagSponsor, isSponsor: true };
  }
  if (norm.includes('szerencsejáték') || norm.includes('szerencsejatek') || norm.includes('szrt')) {
    return { label: 'Official Partner', tagClass: styles.brandTagSponsor, isSponsor: true };
  }
  if (norm.includes('novomatic') || norm.includes('veolia') || norm.includes('mvm')) {
    return { label: 'Venue & Energy Sponsor', tagClass: styles.brandTagVenue, isSponsor: true };
  }
  if (norm === 'veo') {
    return { label: 'Broadcast Tech', tagClass: styles.brandTagTech, isSponsor: true };
  }
  return { label: 'Kit & Apparel', tagClass: styles.brandTagApparel, isSponsor: false };
}

export default function FanmassBrandsMatrix({
  brands,
  totalPhotosProcessed,
  totalImages = 11312,
}: FanmassBrandsMatrixProps) {
  const [filter, setFilter] = useState<'all' | 'sponsors' | 'apparel'>('all');

  const maxCount = useMemo(() => {
    return brands.length > 0 ? Math.max(...brands.map((b) => b.count)) : 1;
  }, [brands]);

  const totalSightings = useMemo(() => {
    return brands.reduce((acc, b) => acc + b.count, 0);
  }, [brands]);

  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      const cat = getBrandCategory(b.brand);
      if (filter === 'sponsors') return cat.isSponsor;
      if (filter === 'apparel') return !cat.isSponsor;
      return true;
    });
  }, [brands, filter]);

  return (
    <div className={styles.reportCard}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardHeaderBadgeRow}>
            <span className={styles.cardSourceTag}>
              🔍 Computer Vision Results • Visual Sightings
            </span>
            <span className={styles.cardCountPill}>
              {brands.length} Distinct Brands Detected
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
            🏷️ Brand Exposure & Sponsor Recognition Matrix
          </h3>
          <p className={styles.cardSubtitle}>
            Empirical identification of sponsor emblems, jerseys, apparel, and venue signage extracted from fan selfies.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className={styles.granularityToggle}>
          <button
            onClick={() => setFilter('all')}
            className={`${styles.granularityBtn} ${
              filter === 'all' ? styles.granularityBtnActive : ''
            }`}
          >
            All Brands ({brands.length})
          </button>
          <button
            onClick={() => setFilter('sponsors')}
            className={`${styles.granularityBtn} ${
              filter === 'sponsors' ? styles.granularityBtnActive : ''
            }`}
          >
            Sponsors & Partners
          </button>
          <button
            onClick={() => setFilter('apparel')}
            className={`${styles.granularityBtn} ${
              filter === 'apparel' ? styles.granularityBtnActive : ''
            }`}
          >
            Kit & Apparel
          </button>
        </div>
      </div>

      {/* Brands Cards Grid */}
      <div className={styles.brandsMatrixGrid}>
        {filteredBrands.map((item, idx) => {
          const category = getBrandCategory(item.brand);
          const sharePercent = totalSightings > 0 ? ((item.count / totalSightings) * 100).toFixed(1) : '0';
          const exposureRate =
            totalPhotosProcessed > 0
              ? ((item.count / totalPhotosProcessed) * 100).toFixed(1)
              : '0';
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
                    <span className={category.tagClass}>{category.label}</span>
                  </div>
                  <h4 className={styles.brandName}>{item.brand}</h4>
                </div>
              </div>

              {/* Metrics */}
              <div className={styles.brandMetricsRow}>
                <div className={styles.brandMetricItem}>
                  <span className={styles.brandMetricLabel}>Sightings</span>
                  <span className={styles.brandMetricVal}>
                    {item.count.toLocaleString()}
                    {totalPhotosProcessed > 0 && totalPhotosProcessed < totalImages && (
                      <span className={styles.estPill}>
                        {' '}(est. {Math.round(item.count * (totalImages / totalPhotosProcessed)).toLocaleString()})
                      </span>
                    )}
                  </span>
                </div>
                <div className={styles.brandMetricItem}>
                  <span className={styles.brandMetricLabel}>Share of Voice</span>
                  <span className={styles.brandMetricVal}>{sharePercent}%</span>
                </div>
                <div className={styles.brandMetricItem}>
                  <span className={styles.brandMetricLabel}>Photo Presence</span>
                  <span className={styles.brandMetricVal}>{exposureRate}%</span>
                </div>
              </div>

              {/* Progress Relative Visual Bar */}
              <div className={styles.brandBarTrack}>
                <div
                  className={styles.brandBarFill}
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: category.isSponsor ? '#88ca45' : '#0284c7',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
