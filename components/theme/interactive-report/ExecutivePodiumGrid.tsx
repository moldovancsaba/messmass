'use client';
/* eslint-disable react/forbid-dom-props */
/* eslint-disable @next/next/no-img-element */

import React, { useMemo } from 'react';
import styles from './executive-view.module.css';

export interface CommercialBrandStat {
  brand: string;
  count: number;
  logoUrl?: string;
  darkLogoUrl?: string;
  category?: string;
  accentColor?: string;
  totalImpressions?: number;
  avgSurfaceAreaPct?: number;
  primaryBrandRate?: number;
  avgShareOfVoicePct?: number;
  weightedExposureScore?: number;
}

export interface ClubPodiumStat {
  club: string;
  count: number;
  logoUrl?: string;
  partnerId?: string;
  partnerSlug?: string;
  partnerName?: string;
  sport?: string;
  homeVenue?: string;
  venueCapacity?: number;
  website?: string;
}

interface ExecutivePodiumGridProps {
  brands: CommercialBrandStat[];
  clubs: ClubPodiumStat[];
  totalPhotosProcessed: number;
  onSelectClub: (club: ClubPodiumStat) => void;
  onSelectBrand?: (brand: CommercialBrandStat) => void;
  onViewAllBrands?: () => void;
  onViewAllClubs?: () => void;
}

export default function ExecutivePodiumGrid({
  brands,
  clubs,
  totalPhotosProcessed,
  onSelectClub,
  onSelectBrand,
  onViewAllBrands,
  onViewAllClubs,
}: ExecutivePodiumGridProps) {
  // Take top commercial brands (filter out nulls/empties)
  const sortedBrands = brands.filter((b) => b.brand && b.count > 0).slice(0, 20);
  const hasBrandPodium = sortedBrands.length >= 3;
  const brand1 = sortedBrands[0];
  const brand2 = sortedBrands[1];
  const brand3 = sortedBrands[2];
  // If top 3 are featured on the Olympic podium, continue the list below from Rank 4
  const remainingBrands = hasBrandPodium ? sortedBrands.slice(3, 11) : sortedBrands;
  const maxBrandCount = brand1?.count || 1;

  // Take top clubs (filter out nulls/empties and consolidate identical display names)
  const consolidatedClubs = useMemo(() => {
    const map = new Map<string, ClubPodiumStat>();
    for (const c of clubs) {
      if (!c.club || c.count <= 0) continue;
      const key = (c.partnerName || c.club).toLowerCase().trim();
      const existing = map.get(key);
      if (existing) {
        existing.count += c.count;
        if (!existing.logoUrl && c.logoUrl) existing.logoUrl = c.logoUrl;
      } else {
        map.set(key, { ...c });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [clubs]);

  const sortedClubs = consolidatedClubs.slice(0, 20);
  const hasClubPodium = sortedClubs.length >= 3;
  const club1 = sortedClubs[0];
  const club2 = sortedClubs[1];
  const club3 = sortedClubs[2];
  // If top 3 are featured on the Olympic podium, continue the list below from Rank 4
  const remainingClubs = hasClubPodium ? sortedClubs.slice(3, 11) : sortedClubs;
  const maxClubCount = club1?.count || 1;

  return (
    <div className={styles.podiumGrid}>
      {/* 1. Left Card: Commercial Brand Visibility */}
      <div className={styles.podiumCard}>
        <div className={styles.podiumHeader}>
          <div>
            <h3 className={styles.podiumTitle}>
              <span>🏷️ Commercial Brand Visibility</span>
            </h3>
            <p className={styles.podiumSubtitle}>
              Commercial & apparel brands identified on stadium fans through computer vision
            </p>
          </div>
          <div className={styles.podiumHeaderActions}>
            <span className={styles.podiumBadge}>
              Visual Exposure
            </span>
            {onViewAllBrands && (
              <button
                type="button"
                onClick={onViewAllBrands}
                className={styles.exploreAllBtn}
                title={`Explore all ${brands.length} detected brands`}
              >
                View All ({brands.length}) →
              </button>
            )}
          </div>
        </div>

        {/* Brand Olympic Pedestal Stage (#2 Left, #1 Center Gold, #3 Right) */}
        {sortedBrands.length >= 3 ? (
          <div className={styles.stageContainer}>
            {/* Rank #2: Silver */}
            {brand2 && (
              <div
                className={styles.pedestalColumn}
                onClick={() => onSelectBrand?.(brand2)}
                title={`Rank #2: ${brand2.brand} (${brand2.count} appearances) - Click for marketing value breakdown`}
              >
                <div className={styles.pedestalLogoCircle}>
                  {brand2.logoUrl ? (
                    <img
                      src={brand2.logoUrl}
                      alt={brand2.brand}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '20px' }}>🥈</span>
                  )}
                </div>
                <span className={styles.pedestalName}>{brand2.brand}</span>
                <span className={styles.pedestalCount}>{brand2.count.toLocaleString()}</span>
                {brand2.weightedExposureScore !== undefined && (
                  <span style={{ fontSize: '10px', color: '#475569', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', margin: '2px 0', fontWeight: 600 }}>
                    ⚖️ {brand2.weightedExposureScore} pts • {brand2.avgShareOfVoicePct}% SOV
                  </span>
                )}
                <div className={`${styles.pedestalBlock} ${styles.blockSilver}`}>
                  2
                </div>
              </div>
            )}

            {/* Rank #1: Gold (Center Elevated) */}
            {brand1 && (
              <div
                className={styles.pedestalColumn}
                onClick={() => onSelectBrand?.(brand1)}
                title={`Rank #1: ${brand1.brand} (${brand1.count} appearances) - Click for marketing value breakdown`}
              >
                <div
                  className={styles.pedestalLogoCircle}
                  style={{
                    borderColor: '#f59e0b',
                    boxShadow: '0 0 12px rgba(245, 158, 11, 0.35)',
                  }}
                >
                  {brand1.logoUrl ? (
                    <img
                      src={brand1.logoUrl}
                      alt={brand1.brand}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '22px' }}>👑</span>
                  )}
                </div>
                <span className={styles.pedestalName} style={{ fontWeight: 800, color: '#92400e' }}>
                  {brand1.brand}
                </span>
                <span className={styles.pedestalCount} style={{ color: '#b45309', fontWeight: 700 }}>
                  {brand1.count.toLocaleString()}
                </span>
                {brand1.weightedExposureScore !== undefined && (
                  <span style={{ fontSize: '10px', color: '#78350f', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px', margin: '2px 0', fontWeight: 700 }}>
                    ⚖️ {brand1.weightedExposureScore} pts • {brand1.avgShareOfVoicePct}% SOV
                  </span>
                )}
                <div className={`${styles.pedestalBlock} ${styles.blockGold}`}>
                  1
                </div>
              </div>
            )}

            {/* Rank #3: Bronze */}
            {brand3 && (
              <div
                className={styles.pedestalColumn}
                onClick={() => onSelectBrand?.(brand3)}
                title={`Rank #3: ${brand3.brand} (${brand3.count} appearances) - Click for marketing value breakdown`}
              >
                <div className={styles.pedestalLogoCircle}>
                  {brand3.logoUrl ? (
                    <img
                      src={brand3.logoUrl}
                      alt={brand3.brand}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '20px' }}>🥉</span>
                  )}
                </div>
                <span className={styles.pedestalName}>{brand3.brand}</span>
                <span className={styles.pedestalCount}>{brand3.count.toLocaleString()}</span>
                {brand3.weightedExposureScore !== undefined && (
                  <span style={{ fontSize: '10px', color: '#7c2d12', background: '#ffedd5', padding: '1px 6px', borderRadius: '4px', margin: '2px 0', fontWeight: 600 }}>
                    ⚖️ {brand3.weightedExposureScore} pts • {brand3.avgShareOfVoicePct}% SOV
                  </span>
                )}
                <div className={`${styles.pedestalBlock} ${styles.blockBronze}`}>
                  3
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            Analyzing commercial partner brand appearances...
          </div>
        )}

        {/* Ranked List Below Podium */}
        <div className={styles.rankedList}>
          {remainingBrands.map((b, idx) => {
            const pct =
              totalPhotosProcessed > 0
                ? Math.min(100, Math.round((b.count / totalPhotosProcessed) * 1000) / 10)
                : Math.round((b.count / maxBrandCount) * 100);
            const fillWidth = Math.max(4, Math.round((b.count / maxBrandCount) * 100));

            return (
              <div
                key={b.brand}
                className={styles.rankedRow}
                onClick={() => onSelectBrand?.(b)}
                title={`${b.brand}: ${b.count} appearances (${pct}%) - Click for marketing value breakdown`}
              >
                <span className={styles.rankNumber}>{hasBrandPodium ? idx + 4 : idx + 1}</span>
                <div className={styles.rowLogoWrap}>
                  {b.logoUrl ? (
                    <img
                      src={b.logoUrl}
                      alt={b.brand}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '12px' }}>🏷️</span>
                  )}
                </div>
                <span className={styles.rowName}>{b.brand}</span>
                <div className={styles.rowBarContainer}>
                  <div className={styles.rowBarTrack}>
                    <div
                      className={styles.rowBarFill}
                      style={{ width: `${fillWidth}%`, background: '#3b82f6' }}
                    />
                  </div>
                </div>
                <span className={styles.rowPercent}>{pct}%</span>
                <span className={styles.rowCount}>
                  {b.count.toLocaleString()}
                  {b.weightedExposureScore !== undefined && (
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 500, display: 'block' }}>
                      {b.weightedExposureScore} pts
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Right Card: Top Clubs & Competitions */}
      <div className={styles.podiumCard}>
        <div className={styles.podiumHeader}>
          <div>
            <h3 className={styles.podiumTitle}>
              <span>🛡️ Sports Clubs & Team Gear</span>
            </h3>
            <p className={styles.podiumSubtitle}>
              Sports clubs & federation merch worn by attending fans (click to inspect fan selfies)
            </p>
          </div>
          <div className={styles.podiumHeaderActions}>
            <span
              className={styles.podiumBadge}
              style={{ background: '#dbeafe', color: '#1e40af' }}
            >
              Club Gear & Merch
            </span>
            {onViewAllClubs && (
              <button
                type="button"
                onClick={onViewAllClubs}
                className={styles.exploreAllBtn}
                title={`Explore all ${clubs.length} detected sports teams`}
              >
                View All ({clubs.length}) →
              </button>
            )}
          </div>
        </div>

        {/* Club Olympic Pedestal Stage (#2 Left, #1 Center Gold, #3 Right) */}
        {sortedClubs.length >= 3 ? (
          <div className={styles.stageContainer}>
            {/* Rank #2: Silver */}
            {club2 && (
              <div
                className={styles.pedestalColumn}
                onClick={() => onSelectClub(club2)}
                title={`Rank #2: ${club2.partnerName || club2.club} (Click to inspect selfies)`}
              >
                <div className={styles.pedestalLogoCircle}>
                  {club2.logoUrl ? (
                    <img
                      src={club2.logoUrl}
                      alt={club2.club}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '20px' }}>🥈</span>
                  )}
                </div>
                <span className={styles.pedestalName}>{club2.partnerName || club2.club}</span>
                <span className={styles.pedestalCount}>{club2.count.toLocaleString()}</span>
                <div className={`${styles.pedestalBlock} ${styles.blockSilver}`}>
                  2
                </div>
              </div>
            )}

            {/* Rank #1: Gold (Center Elevated) */}
            {club1 && (
              <div
                className={styles.pedestalColumn}
                onClick={() => onSelectClub(club1)}
                title={`Rank #1: ${club1.partnerName || club1.club} (Click to inspect selfies)`}
              >
                <div
                  className={styles.pedestalLogoCircle}
                  style={{
                    borderColor: '#f59e0b',
                    boxShadow: '0 0 12px rgba(245, 158, 11, 0.35)',
                  }}
                >
                  {club1.logoUrl ? (
                    <img
                      src={club1.logoUrl}
                      alt={club1.club}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '22px' }}>👑</span>
                  )}
                </div>
                <span className={styles.pedestalName} style={{ fontWeight: 800, color: '#92400e' }}>
                  {club1.partnerName || club1.club}
                </span>
                <span className={styles.pedestalCount} style={{ color: '#b45309', fontWeight: 700 }}>
                  {club1.count.toLocaleString()}
                </span>
                <div className={`${styles.pedestalBlock} ${styles.blockGold}`}>
                  1
                </div>
              </div>
            )}

            {/* Rank #3: Bronze */}
            {club3 && (
              <div
                className={styles.pedestalColumn}
                onClick={() => onSelectClub(club3)}
                title={`Rank #3: ${club3.partnerName || club3.club} (Click to inspect selfies)`}
              >
                <div className={styles.pedestalLogoCircle}>
                  {club3.logoUrl ? (
                    <img
                      src={club3.logoUrl}
                      alt={club3.club}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '20px' }}>🥉</span>
                  )}
                </div>
                <span className={styles.pedestalName}>{club3.partnerName || club3.club}</span>
                <span className={styles.pedestalCount}>{club3.count.toLocaleString()}</span>
                <div className={`${styles.pedestalBlock} ${styles.blockBronze}`}>
                  3
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            Analyzing sport club & franchise appearances...
          </div>
        )}

        {/* Ranked List Below Podium */}
        <div className={styles.rankedList}>
          {remainingClubs.map((c: ClubPodiumStat, idx: number) => {
            const pct =
              totalPhotosProcessed > 0
                ? Math.min(100, Math.round((c.count / totalPhotosProcessed) * 1000) / 10)
                : Math.round((c.count / maxClubCount) * 100);
            const fillWidth = Math.max(4, Math.round((c.count / maxClubCount) * 100));

            return (
              <div
                key={c.club}
                className={styles.rankedRow}
                onClick={() => onSelectClub(c)}
                title={`Click to view selfies for ${c.partnerName || c.club}: ${c.count} appearances (${pct}%)`}
              >
                <span className={styles.rankNumber}>{hasClubPodium ? idx + 4 : idx + 1}</span>
                <div className={styles.rowLogoWrap}>
                  {c.logoUrl ? (
                    <img
                      src={c.logoUrl}
                      alt={c.club}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: '12px' }}>🛡️</span>
                  )}
                </div>
                <span className={styles.rowName}>{c.partnerName || c.club}</span>
                <div className={styles.rowBarContainer}>
                  <div className={styles.rowBarTrack}>
                    <div
                      className={styles.rowBarFill}
                      style={{ width: `${fillWidth}%`, background: '#2563eb' }}
                    />
                  </div>
                </div>
                <span className={styles.rowPercent}>{pct}%</span>
                <span className={styles.rowCount}>{c.count.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
