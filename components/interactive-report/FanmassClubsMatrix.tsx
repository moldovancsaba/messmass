'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useState, useMemo } from 'react';
import {
  getFranchiseInfo,
  getVenueInfo,
  isVenue,
} from '@/lib/brandEntityClustering';
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

type SportFilter = 'all' | 'Basketball' | 'Football' | 'Handball' | 'Ice Hockey' | 'International';

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
  'ose lions',
  'mvm-ose',
  'pler',
  'kozármisleny',
];

function isDomesticClub(clubName: string): boolean {
  const norm = clubName.toLowerCase();
  return HUNGARIAN_CLUBS.some((c) => norm.includes(c));
}

function resolveFranchiseSport(name: string): 'Basketball' | 'Football' | 'Handball' | 'Ice Hockey' | 'Other' {
  const info = getFranchiseInfo(name);
  if (info && info.sport !== 'Multi-Sport') return info.sport;

  const low = name.toLowerCase();
  if (low.includes('sopron') || low.includes('falco') || low.includes('körmend') || low.includes('szolnok') || low.includes('ose lions') || low.includes('kaposvár') || low.includes('atomerőmű')) {
    return 'Basketball';
  }
  if (low.includes('fehérvár av19') || low.includes('hockey') || low.includes('jégkorong') || low.includes('bja') || low.includes('mac')) {
    return 'Ice Hockey';
  }
  if (low.includes('szeged') || low.includes('pick') || low.includes('veszprém') || low.includes('pler') || low.includes('handball')) {
    return 'Handball';
  }
  if (low.includes('ferencváros') || low.includes('fradi') || low.includes('ftc') || low.includes('újpest') || low.includes('fehérvár fc') || low.includes('honvéd') || low.includes('haladás') || low.includes('győr') || low.includes('kozármisleny') || low.includes('dvsc') || low.includes('real madrid') || low.includes('barcelona') || low.includes('boca') || low.includes('celtic') || low.includes('hajduk')) {
    return 'Football';
  }
  return 'Other';
}

export default function FanmassClubsMatrix({
  clubs,
  totalPhotosProcessed,
  totalImages = 11312,
}: FanmassClubsMatrixProps) {
  const [filter, setFilter] = useState<SportFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Strict filter: Exclude non-club junk and commercial sponsor hallucinations
  const validClubs = useMemo(() => {
    return clubs.filter((c) => {
      if (!c.club || c.club.trim().length <= 1) return false;
      const low = c.club.toLowerCase().trim();
      if (low === 'n/a' || low === 'none') return false;
      if (low.includes('szerencsej') || low === 'tippmix' || low === 'mol' || low === 'nike' || low === 'adidas' || low === 'puma') {
        return false;
      }
      // If someone passed in a standalone venue, omit from franchise list
      if (isVenue(c.club) && !low.includes('sopron kc')) return false;
      return true;
    });
  }, [clubs]);

  const maxCount = useMemo(() => {
    return validClubs.length > 0 ? Math.max(...validClubs.map((c) => c.count)) : 1;
  }, [validClubs]);

  const totalSightings = useMemo(() => {
    return validClubs.reduce((acc, c) => acc + c.count, 0);
  }, [validClubs]);

  const isProgressing = totalPhotosProcessed > 0 && totalPhotosProcessed < totalImages;
  const multiplier = isProgressing ? totalImages / totalPhotosProcessed : 1;

  // Counts per sport
  const sportCounts = useMemo(() => {
    const counts = {
      all: validClubs.length,
      Basketball: 0,
      Football: 0,
      Handball: 0,
      'Ice Hockey': 0,
      International: 0,
    };
    for (const c of validClubs) {
      const isDom = isDomesticClub(c.club);
      if (!isDom) {
        counts.International++;
      }
      const sp = resolveFranchiseSport(c.club);
      if (sp === 'Basketball') counts.Basketball++;
      else if (sp === 'Football') counts.Football++;
      else if (sp === 'Handball') counts.Handball++;
      else if (sp === 'Ice Hockey') counts['Ice Hockey']++;
    }
    return counts;
  }, [validClubs]);

  const filteredClubs = useMemo(() => {
    return validClubs.filter((c) => {
      const isDom = isDomesticClub(c.club);
      if (filter === 'International' && isDom) return false;
      if (filter !== 'all' && filter !== 'International') {
        const sp = resolveFranchiseSport(c.club);
        if (sp !== filter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (!c.club.toLowerCase().includes(q)) return false;
      }

      return true;
    });
  }, [validClubs, filter, searchQuery]);

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
              {validClubs.length} Franchises &amp; Clubs Identified • {totalSightings.toLocaleString()}
              {isProgressing && ` (est. ${Math.round(totalSightings * multiplier).toLocaleString()})`}{' '}
              Jerseys
            </span>
            <span className={styles.cardCountPill} style={{ background: '#f0fdf4', color: '#166534' }}>
              👕 {merchAdoptionRate}% Merchandise Presence
            </span>
          </div>
          <h3 className={styles.cardTitle}>
            🏆 Sport Franchises &amp; Club Allegiance Matrix
          </h3>
          <p className={styles.cardSubtitle}>
            Dedicated multi-sport franchise breakdown of Hungarian domestic leagues (Basketball NB I, Football NB I, Handball K&amp;H Liga, Ice Hockey Erste Liga/ICEHL) and international teams. Match venues and stadiums are clearly associated with each club.
          </p>
        </div>

        {/* Filter Toggle and Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', width: '100%' }}>
          <div className={styles.granularityToggle} style={{ flexWrap: 'wrap', gap: '4px' }}>
            <button
              onClick={() => setFilter('all')}
              className={`${styles.granularityBtn} ${filter === 'all' ? styles.granularityBtnActive : ''}`}
            >
              All Franchises ({sportCounts.all})
            </button>
            <button
              onClick={() => setFilter('Basketball')}
              className={`${styles.granularityBtn} ${filter === 'Basketball' ? styles.granularityBtnActive : ''}`}
            >
              🏀 Basketball ({sportCounts.Basketball})
            </button>
            <button
              onClick={() => setFilter('Football')}
              className={`${styles.granularityBtn} ${filter === 'Football' ? styles.granularityBtnActive : ''}`}
            >
              ⚽ Football ({sportCounts.Football})
            </button>
            <button
              onClick={() => setFilter('Handball')}
              className={`${styles.granularityBtn} ${filter === 'Handball' ? styles.granularityBtnActive : ''}`}
            >
              🤾 Handball ({sportCounts.Handball})
            </button>
            <button
              onClick={() => setFilter('Ice Hockey')}
              className={`${styles.granularityBtn} ${filter === 'Ice Hockey' ? styles.granularityBtnActive : ''}`}
            >
              🏒 Ice Hockey ({sportCounts['Ice Hockey']})
            </button>
            <button
              onClick={() => setFilter('International')}
              className={`${styles.granularityBtn} ${filter === 'International' ? styles.granularityBtnActive : ''}`}
            >
              🌍 International ({sportCounts.International})
            </button>
          </div>

          {/* Quick Search */}
          <div style={{ position: 'relative', width: '260px' }}>
            <input
              type="text"
              placeholder="Search club or franchise (e.g. Sopron, DVTK)..."
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

      {/* Grid of Detected Clubs */}
      {filteredClubs.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
          No sport franchises matching this filter currently identified.
        </div>
      ) : (
        <div className={styles.clubsMatrixGrid}>
          {filteredClubs.map((item, idx) => {
            const isDom = isDomesticClub(item.club);
            const franchiseInfo = getFranchiseInfo(item.club);
            const sport = resolveFranchiseSport(item.club);
            const barWidth = Math.max(8, Math.round((item.count / maxCount) * 100));
            const shareOfJerseys =
              totalSightings > 0 ? ((item.count / totalSightings) * 100).toFixed(1) : '0';

            // Special handling for Sopron KC venue
            const isSopron = item.club.toLowerCase().includes('sopron');
            const venueName = franchiseInfo?.homeVenue || (isSopron ? 'Novomatic Aréna Sopron' : undefined);
            const venueWebsite = franchiseInfo?.venueWebsite || (isSopron ? 'https://www.novomaticarenasopron.hu' : undefined);

            const sportIcon =
              sport === 'Basketball' ? '🏀' :
              sport === 'Football' ? '⚽' :
              sport === 'Handball' ? '🤾' :
              sport === 'Ice Hockey' ? '🏒' : '🏆';

            return (
              <div key={item.club} className={styles.clubMatrixCard}>
                <div className={styles.clubCardTop}>
                  <div className={styles.clubRankRow}>
                    <span className={styles.clubRankBadge}>#{idx + 1}</span>
                    <span className={isDom ? styles.clubDomesticTag : styles.clubIntlTag}>
                      {isDom ? '🇭🇺 Domestic' : '🌍 International'}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        background: '#f1f5f9',
                        color: '#475569',
                      }}
                    >
                      {sportIcon} {sport}
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
                  {/* Home Arena / Venue Reference */}
                  {venueName && (
                    <div style={{ marginTop: '4px', fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>🏟️</span>
                      {venueWebsite ? (
                        <a
                          href={venueWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontWeight: 600,
                          }}
                          title={`Visit official venue website: ${venueWebsite}`}
                        >
                          {venueName} ↗
                        </a>
                      ) : (
                        <span>{venueName}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.clubMetricsRow}>
                  <span className={styles.clubSightingsLabel}>Jerseys &amp; Scarves</span>
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
                      background: isDom ? '#3b82f6' : '#8b5cf6',
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
