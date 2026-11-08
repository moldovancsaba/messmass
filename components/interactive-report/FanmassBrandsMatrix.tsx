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

type BrandCategoryType = 'sponsor' | 'apparel' | 'consumer';

function getBrandCategory(brand: string): {
  label: string;
  tagClass: string;
  isSponsor: boolean;
  type: BrandCategoryType;
} {
  const norm = brand.toLowerCase();
  if (norm.includes('tippmix')) {
    return { label: 'Title Sponsor', tagClass: styles.brandTagSponsor, isSponsor: true, type: 'sponsor' };
  }
  if (norm.includes('szerencsejáték') || norm.includes('szerencsejatek') || norm.includes('szrt')) {
    return { label: 'Official Partner', tagClass: styles.brandTagSponsor, isSponsor: true, type: 'sponsor' };
  }
  if (
    norm.includes('novomatic') ||
    norm.includes('veolia') ||
    norm.includes('mvm') ||
    norm.includes('mol') ||
    norm.includes('audi') ||
    norm.includes('suzuki') ||
    norm.includes('otp bank') ||
    norm.includes('hydro') ||
    norm.includes('mercedes') ||
    norm.includes('opel') ||
    norm.includes('hyundai') ||
    norm.includes('mbh') ||
    norm.includes('grand hotel')
  ) {
    return { label: 'Corporate & Venue Sponsor', tagClass: styles.brandTagVenue, isSponsor: true, type: 'sponsor' };
  }
  if (
    norm.includes('coca-cola') ||
    norm.includes('pepsi') ||
    norm.includes('lay') ||
    norm.includes('dreher') ||
    norm.includes('pilsner') ||
    norm.includes('mizo')
  ) {
    return { label: 'Beverage & Consumer', tagClass: styles.brandTagTech, isSponsor: true, type: 'consumer' };
  }
  if (norm === 'veo' || norm.includes('sportfive') || norm.includes('foxconn') || norm.includes('pwc')) {
    return { label: 'Tech & Media Partner', tagClass: styles.brandTagTech, isSponsor: true, type: 'sponsor' };
  }
  return { label: 'Kit & Apparel', tagClass: styles.brandTagApparel, isSponsor: false, type: 'apparel' };
}

export default function FanmassBrandsMatrix({
  brands,
  totalPhotosProcessed,
  totalImages = 11312,
}: FanmassBrandsMatrixProps) {
  const [filter, setFilter] = useState<'all' | 'sponsors' | 'apparel' | 'consumer'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const maxCount = useMemo(() => {
    return brands.length > 0 ? Math.max(...brands.map((b) => b.count)) : 1;
  }, [brands]);

  const totalSightings = useMemo(() => {
    return brands.reduce((acc, b) => acc + b.count, 0);
  }, [brands]);

  const categoryCounts = useMemo(() => {
    let sponsors = 0;
    let apparel = 0;
    let consumer = 0;
    for (const b of brands) {
      const cat = getBrandCategory(b.brand);
      if (cat.type === 'sponsor') sponsors++;
      else if (cat.type === 'consumer') consumer++;
      else apparel++;
    }
    return { sponsors, apparel, consumer };
  }, [brands]);

  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      const cat = getBrandCategory(b.brand);

      if (filter === 'sponsors' && !cat.isSponsor) return false;
      if (filter === 'apparel' && cat.type !== 'apparel') return false;
      if (filter === 'consumer' && cat.type !== 'consumer') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (!b.brand.toLowerCase().includes(q)) return false;
      }

      return true;
    });
  }, [brands, filter, searchQuery]);

  const visibleBrands = useMemo(() => {
    if (isExpanded || searchQuery.trim().length > 0) {
      return filteredBrands;
    }
    return filteredBrands.slice(0, 24);
  }, [filteredBrands, isExpanded, searchQuery]);

  const isProgressing = totalPhotosProcessed > 0 && totalPhotosProcessed < totalImages;
  const multiplier = isProgressing ? totalImages / totalPhotosProcessed : 1;

  return (
    <div className={styles.reportCard}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardHeaderBadgeRow}>
            <span className={styles.cardSourceTag}>
              🔍 Computer Vision Results • Visual Sightings
            </span>
            <span className={styles.cardCountPill}>
              {brands.length} Distinct Brands Detected ({totalSightings.toLocaleString()} sightings)
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
            🏷️ Brand Exposure &amp; Sponsor Recognition Matrix
          </h3>
          <p className={styles.cardSubtitle}>
            Exhaustive empirical identification of corporate sponsors, official partners, kit apparel, beverage brands, and arena signage extracted from fan selfies.
          </p>
        </div>

        {/* Search and Category Filter Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
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
              Sponsors ({categoryCounts.sponsors})
            </button>
            <button
              onClick={() => setFilter('apparel')}
              className={`${styles.granularityBtn} ${
                filter === 'apparel' ? styles.granularityBtnActive : ''
              }`}
            >
              Kit &amp; Apparel ({categoryCounts.apparel})
            </button>
            <button
              onClick={() => setFilter('consumer')}
              className={`${styles.granularityBtn} ${
                filter === 'consumer' ? styles.granularityBtnActive : ''
              }`}
            >
              Beverage &amp; Consumer ({categoryCounts.consumer})
            </button>
          </div>

          {/* Quick Search Input */}
          <div style={{ position: 'relative', width: '240px' }}>
            <input
              type="text"
              placeholder="Search brand (e.g. Audi, Nike, MOL)..."
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
                  right: '6px',
                  top: '5px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#94a3b8',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Brands Cards Grid */}
      <div className={styles.brandsMatrixGrid}>
        {visibleBrands.map((item, idx) => {
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
                    {isProgressing && (
                      <span className={styles.estPill}>
                        {' '}(est. {Math.round(item.count * multiplier).toLocaleString()})
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

      {/* Expand / Collapse Button if more brands are available */}
      {filteredBrands.length > 24 && !searchQuery && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '10px 24px',
              borderRadius: '9999px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              color: '#1e293b',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isExpanded
              ? 'Collapse to Top 24 Brands ▲'
              : `View All ${filteredBrands.length} Detected Brands (${filteredBrands.length - 24} more) ▼`}
          </button>
        </div>
      )}
    </div>
  );
}
