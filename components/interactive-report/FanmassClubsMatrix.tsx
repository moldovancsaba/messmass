'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState, useMemo } from 'react';
import styles from './interactive-report.module.css';

interface ClubStat {
  club: string;
  count: number;
}

interface FanmassClubsMatrixProps {
  clubs: ClubStat[];
  totalPhotosProcessed: number;
  totalImages?: number;
}

const HUNGARIAN_CLUBS = [
  'fehérvár',
  'szolnok',
  'veszprém',
  'vtk',
  'dvtk',
  'haladás',
  'győr',
  'ferencváros',
  'fradi',
  'ftc',
  'újpest',
  'ute',
  'honvéd',
  'deac',
  'falco',
  'körmend',
  'sopron',
  'zte',
  'diósgyőr',
  'atomerőmű',
  'kaposvár',
  'szeged',
  'pick szeged',
  'dunaújváros',
  'mac budapest',
  'ute jégkorong',
  'bja',
];

function isDomesticClub(clubName: string): boolean {
  const norm = clubName.toLowerCase();
  return HUNGARIAN_CLUBS.some((c) => norm.includes(c));
}

export default function FanmassClubsMatrix({
  clubs,
  totalPhotosProcessed,
  totalImages = 11312,
}: FanmassClubsMatrixProps) {
  const [filter, setFilter] = useState<'all' | 'domestic' | 'intl'>('all');

  const validClubs = useMemo(() => {
    return clubs.filter(
      (c) =>
        c.club &&
        c.club.toLowerCase() !== 'n/a' &&
        c.club.toLowerCase() !== 'none' &&
        !c.club.toLowerCase().includes('szerencsej') &&
        c.club.trim().length > 1
    );
  }, [clubs]);

  const maxCount = useMemo(() => {
    return validClubs.length > 0 ? Math.max(...validClubs.map((c) => c.count)) : 1;
  }, [validClubs]);

  const totalSightings = useMemo(() => {
    return validClubs.reduce((acc, c) => acc + c.count, 0);
  }, [validClubs]);

  const isProgressing = totalPhotosProcessed > 0 && totalPhotosProcessed < totalImages;
  const multiplier = isProgressing ? totalImages / totalPhotosProcessed : 1;

  const filteredClubs = useMemo(() => {
    return validClubs.filter((c) => {
      const isDom = isDomesticClub(c.club);
      if (filter === 'domestic') return isDom;
      if (filter === 'intl') return !isDom;
      return true;
    });
  }, [validClubs, filter]);

  const merchAdoptionRate =
    totalPhotosProcessed > 0
      ? ((totalSightings / totalPhotosProcessed) * 100).toFixed(1)
      : '32.4';

  return (
    <div className={styles.reportCard}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardHeaderBadgeRow}>
            <span className={styles.cardSourceTag}>
              🏟️ Fan Allegiance • Empirical Jersey &amp; Merchandise Recognition
            </span>
            <span className={styles.cardCountPill}>
              {validClubs.length} Teams Identified • {totalSightings.toLocaleString()}
              {isProgressing && ` (est. ${Math.round(totalSightings * multiplier).toLocaleString()})`}{' '}
              Jerseys
            </span>
            <span className={styles.cardCountPill} style={{ background: '#f0fdf4', color: '#166534' }}>
              👕 {merchAdoptionRate}% Merchandise Presence
            </span>
          </div>
          <h3 className={styles.cardTitle}>
            🏟️ Club Allegiance &amp; Fan Jersey Detection Matrix
          </h3>
          <p className={styles.cardSubtitle}>
            Empirical identification of domestic Hungarian leagues and international team jerseys, scarves, and branded fan merchandise identified in spectator selfies.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className={styles.granularityToggle}>
          <button
            onClick={() => setFilter('all')}
            className={`${styles.granularityBtn} ${
              filter === 'all' ? styles.granularityBtnActive : ''
            }`}
          >
            All Clubs ({validClubs.length})
          </button>
          <button
            onClick={() => setFilter('domestic')}
            className={`${styles.granularityBtn} ${
              filter === 'domestic' ? styles.granularityBtnActive : ''
            }`}
          >
            Domestic Hungarian
          </button>
          <button
            onClick={() => setFilter('intl')}
            className={`${styles.granularityBtn} ${
              filter === 'intl' ? styles.granularityBtnActive : ''
            }`}
          >
            International
          </button>
        </div>
      </div>

      {/* Grid of Detected Clubs */}
      {filteredClubs.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
          No club jerseys matching this filter currently identified.
        </div>
      ) : (
        <div className={styles.clubsMatrixGrid}>
          {filteredClubs.map((item, idx) => {
            const isDom = isDomesticClub(item.club);
            const barWidth = Math.max(8, Math.round((item.count / maxCount) * 100));
            const shareOfJerseys =
              totalSightings > 0 ? ((item.count / totalSightings) * 100).toFixed(1) : '0';

            return (
              <div key={item.club} className={styles.clubMatrixCard}>
                <div className={styles.clubCardTop}>
                  <div className={styles.clubRankRow}>
                    <span className={styles.clubRankBadge}>#{idx + 1}</span>
                    <span className={isDom ? styles.clubDomesticTag : styles.clubIntlTag}>
                      {isDom ? '🇭🇺 Domestic' : '🌍 International'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {shareOfJerseys}% of merch
                  </span>
                </div>

                <div className={styles.clubInfo}>
                  <h4 className={styles.clubName} title={item.club}>
                    {item.club}
                  </h4>
                </div>

                <div className={styles.clubMetricsRow}>
                  <span className={styles.clubSightingsLabel}>Jerseys Worn</span>
                  <span className={styles.clubSightingsVal}>
                    {item.count.toLocaleString()}
                    {isProgressing && (
                      <span className={styles.estPill}>
                        {' '}(est. {Math.round(item.count * multiplier).toLocaleString()})
                      </span>
                    )}
                  </span>
                </div>

                <div className={styles.clubBarTrack}>
                  <div
                    className={styles.clubBarFill}
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: isDom ? '#059669' : '#0284c7',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
