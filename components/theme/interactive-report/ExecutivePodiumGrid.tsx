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

  // Share of analysed photos, from real counts only. Null (shown as n/a) when no photos were counted.
  const shareOfPhotos = (count: number): number | null =>
    totalPhotosProcessed > 0
      ? Math.min(100, Math.round((count / totalPhotosProcessed) * 1000) / 10)
      : null;
  const formatShare = (pct: number | null): string => (pct === null ? 'n/a' : `${pct}%`);

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
                role="button"
                tabIndex={0}
                className={styles.pedestalColumn}
                onClick={() => onSelectBrand?.(brand2)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectBrand?.(brand2); } }}
                title={`Rank #2: ${brand2.brand} (${brand2.count} appearances) - Click for details`}
              >
                <div className={styles.pedestalLogoCircle}>
                  {brand2.logoUrl ? (
                    <img src={brand2.logoUrl} alt={brand2.brand} className={styles.pedestalLogoImg} />
                  ) : (
                    <span className={styles.pedestalEmoji}>🥈</span>
                  )}
                </div>
                <span className={styles.pedestalName}>{brand2.brand}</span>
                <span className={styles.pedestalCount}>{brand2.count.toLocaleString()}</span>
                <div className={`${styles.pedestalBlock} ${styles.blockSilver}`}>
                  2
                </div>
              </div>
            )}

            {/* Rank #1: Gold (Center Elevated) */}
            {brand1 && (
              <div
                role="button"
                tabIndex={0}
                className={styles.pedestalColumn}
                onClick={() => onSelectBrand?.(brand1)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectBrand?.(brand1); } }}
                title={`Rank #1: ${brand1.brand} (${brand1.count} appearances) - Click for details`}
              >
                <div className={`${styles.pedestalLogoCircle} ${styles.pedestalLogoGold}`}>
                  {brand1.logoUrl ? (
                    <img src={brand1.logoUrl} alt={brand1.brand} className={styles.pedestalLogoImg} />
                  ) : (
                    <span className={styles.pedestalEmoji}>👑</span>
                  )}
                </div>
                <span className={`${styles.pedestalName} ${styles.pedestalNameGold}`}>
                  {brand1.brand}
                </span>
                <span className={`${styles.pedestalCount} ${styles.pedestalCountGold}`}>
                  {brand1.count.toLocaleString()}
                </span>
                <div className={`${styles.pedestalBlock} ${styles.blockGold}`}>
                  1
                </div>
              </div>
            )}

            {/* Rank #3: Bronze */}
            {brand3 && (
              <div
                role="button"
                tabIndex={0}
                className={styles.pedestalColumn}
                onClick={() => onSelectBrand?.(brand3)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectBrand?.(brand3); } }}
                title={`Rank #3: ${brand3.brand} (${brand3.count} appearances) - Click for details`}
              >
                <div className={styles.pedestalLogoCircle}>
                  {brand3.logoUrl ? (
                    <img src={brand3.logoUrl} alt={brand3.brand} className={styles.pedestalLogoImg} />
                  ) : (
                    <span className={styles.pedestalEmoji}>🥉</span>
                  )}
                </div>
                <span className={styles.pedestalName}>{brand3.brand}</span>
                <span className={styles.pedestalCount}>{brand3.count.toLocaleString()}</span>
                <div className={`${styles.pedestalBlock} ${styles.blockBronze}`}>
                  3
                </div>
              </div>
            )}
          </div>
        ) : sortedBrands.length === 0 ? (
          <div className={styles.podiumEmptyState}>
            n/a (no brand appearances counted)
          </div>
        ) : null}

        {/* Ranked List Below Podium */}
        <div className={styles.rankedList}>
          {remainingBrands.map((b, idx) => {
            const pct = shareOfPhotos(b.count);
            const fillWidth = Math.max(4, Math.round((b.count / maxBrandCount) * 100));

            return (
              <div
                key={b.brand}
                role="button"
                tabIndex={0}
                className={styles.rankedRow}
                onClick={() => onSelectBrand?.(b)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectBrand?.(b); } }}
                title={`${b.brand}: ${b.count} appearances (${formatShare(pct)}) - Click for details`}
              >
                <span className={styles.rankNumber}>{hasBrandPodium ? idx + 4 : idx + 1}</span>
                <div className={styles.rowLogoWrap}>
                  {b.logoUrl ? (
                    <img src={b.logoUrl} alt={b.brand} className={styles.pedestalLogoImg} />
                  ) : (
                    <span className={styles.rowEmoji}>🏷️</span>
                  )}
                </div>
                <span className={styles.rowName}>{b.brand}</span>
                <div className={styles.rowBarContainer}>
                  <div className={styles.rowBarTrack}>
                    <div
                      className={styles.rowBarFill}
                      style={{ width: `${fillWidth}%`, background: 'var(--report-accent, #3b82f6)' }}
                    />
                  </div>
                </div>
                <span className={styles.rowPercent}>{formatShare(pct)}</span>
                <span className={styles.rowCount}>{b.count.toLocaleString()}</span>
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
                role="button"
                tabIndex={0}
                className={styles.pedestalColumn}
                onClick={() => onSelectClub(club2)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectClub(club2); } }}
                title={`Rank #2: ${club2.partnerName || club2.club} (Click to inspect selfies)`}
              >
                <div className={styles.pedestalLogoCircle}>
                  {club2.logoUrl ? (
                    <img src={club2.logoUrl} alt={club2.club} className={styles.pedestalLogoImg} />
                  ) : (
                    <span className={styles.pedestalEmoji}>🥈</span>
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
                role="button"
                tabIndex={0}
                className={styles.pedestalColumn}
                onClick={() => onSelectClub(club1)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectClub(club1); } }}
                title={`Rank #1: ${club1.partnerName || club1.club} (Click to inspect selfies)`}
              >
                <div className={`${styles.pedestalLogoCircle} ${styles.pedestalLogoGold}`}>
                  {club1.logoUrl ? (
                    <img src={club1.logoUrl} alt={club1.club} className={styles.pedestalLogoImg} />
                  ) : (
                    <span className={styles.pedestalEmoji}>👑</span>
                  )}
                </div>
                <span className={`${styles.pedestalName} ${styles.pedestalNameGold}`}>
                  {club1.partnerName || club1.club}
                </span>
                <span className={`${styles.pedestalCount} ${styles.pedestalCountGold}`}>
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
                role="button"
                tabIndex={0}
                className={styles.pedestalColumn}
                onClick={() => onSelectClub(club3)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectClub(club3); } }}
                title={`Rank #3: ${club3.partnerName || club3.club} (Click to inspect selfies)`}
              >
                <div className={styles.pedestalLogoCircle}>
                  {club3.logoUrl ? (
                    <img src={club3.logoUrl} alt={club3.club} className={styles.pedestalLogoImg} />
                  ) : (
                    <span className={styles.pedestalEmoji}>🥉</span>
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
        ) : sortedClubs.length === 0 ? (
          <div className={styles.podiumEmptyState}>
            n/a (no club appearances counted)
          </div>
        ) : null}

        {/* Ranked List Below Podium */}
        <div className={styles.rankedList}>
          {remainingClubs.map((c: ClubPodiumStat, idx: number) => {
            const pct = shareOfPhotos(c.count);
            const fillWidth = Math.max(4, Math.round((c.count / maxClubCount) * 100));

            return (
              <div
                key={c.club}
                role="button"
                tabIndex={0}
                className={styles.rankedRow}
                onClick={() => onSelectClub(c)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectClub(c); } }}
                title={`Click to view selfies for ${c.partnerName || c.club}: ${c.count} appearances (${formatShare(pct)})`}
              >
                <span className={styles.rankNumber}>{hasClubPodium ? idx + 4 : idx + 1}</span>
                <div className={styles.rowLogoWrap}>
                  {c.logoUrl ? (
                    <img src={c.logoUrl} alt={c.club} className={styles.pedestalLogoImg} />
                  ) : (
                    <span className={styles.rowEmoji}>🛡️</span>
                  )}
                </div>
                <span className={styles.rowName}>{c.partnerName || c.club}</span>
                <div className={styles.rowBarContainer}>
                  <div className={styles.rowBarTrack}>
                    <div
                      className={styles.rowBarFill}
                      style={{ width: `${fillWidth}%`, background: 'var(--report-primary, #2563eb)' }}
                    />
                  </div>
                </div>
                <span className={styles.rowPercent}>{formatShare(pct)}</span>
                <span className={styles.rowCount}>{c.count.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
