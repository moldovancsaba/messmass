'use client';
/* eslint-disable react/forbid-dom-props */

import React from 'react';
import { MatchItem } from './types';
import styles from './interactive-report.module.css';

interface StadiumCapacityChartProps {
  matches: MatchItem[];
  analytics?: {
    totalVenueCapacity: number;
    totalGateAttendance: number;
    avgCapacityUtilization: number;
  };
}

export default function StadiumCapacityChart({ matches, analytics }: StadiumCapacityChartProps) {
  // Aggregate venues by unique name
  const { venueLeaderboard, allCap, allAtt } = React.useMemo(() => {
    const map = new Map<string, {
      name: string;
      capacity: number;
      cumulativeCapacity: number;
      isIndoor: boolean;
      totalAttendance: number;
      totalPhotos: number;
      eventsCount: number;
      sampleWeather?: MatchItem['weather'];
    }>();

    for (const m of matches) {
      const vName = m.venue || 'Városi Stadion';
      if (!m.venueCapacity || m.venueCapacity <= 0) continue;

      const existing = map.get(vName);
      if (existing) {
        existing.cumulativeCapacity += m.venueCapacity;
        existing.totalAttendance += m.attendance || 0;
        existing.totalPhotos += m.submitted || 0;
        existing.eventsCount += 1;
        if (!existing.sampleWeather && m.weather) existing.sampleWeather = m.weather;
      } else {
        map.set(vName, {
          name: vName,
          capacity: m.venueCapacity,
          cumulativeCapacity: m.venueCapacity,
          isIndoor: Boolean(m.weather?.isIndoor),
          totalAttendance: m.attendance || 0,
          totalPhotos: m.submitted || 0,
          eventsCount: 1,
          sampleWeather: m.weather,
        });
      }
    }

    const allVenues = Array.from(map.values());
    return {
      venueLeaderboard: allVenues.sort((a, b) => b.capacity - a.capacity).slice(0, 8),
      allCap: allVenues.reduce((a, b) => a + b.cumulativeCapacity, 0),
      allAtt: allVenues.reduce((a, b) => a + b.totalAttendance, 0),
    };
  }, [matches]);

  if (venueLeaderboard.length === 0) return null;

  const totalCap = analytics?.totalVenueCapacity ?? allCap;
  const totalAtt = analytics?.totalGateAttendance ?? allAtt;
  const avgFill = analytics?.avgCapacityUtilization ?? (totalCap > 0 ? Math.round((totalAtt / totalCap) * 1000) / 10 : 0);

  return (
    <article className={styles.bentoPanel}>
      <header className={styles.bentoPanelHeader}>
        <div className={styles.bentoPanelTitle}>
          <span className={styles.bentoPanelIcon} aria-hidden="true">🏟️</span>
          <h2 className={styles.gdsCardTitle}>Venue capacity vs. gate turnout</h2>
        </div>
        <span className={styles.bentoPanelStatus}>
          Avg fill {avgFill}% · {totalCap.toLocaleString()} seats
        </span>
      </header>

      <div className={styles.bentoPanelBody}>
        <div className={styles.bentoBarList}>
          {venueLeaderboard.map((v) => {
            const cumulativeCap = v.cumulativeCapacity;
            const fillRate = cumulativeCap > 0 ? Math.round((v.totalAttendance / cumulativeCap) * 1000) / 10 : 0;
            return (
              <div key={v.name} className={styles.bentoVenueRow}>
                <div className={styles.bentoVenueHead}>
                  <span className={styles.gdsBody}>
                    {v.isIndoor ? '🏟️' : '⚽'} <strong>{v.name}</strong>
                    {v.eventsCount > 1 && (
                      <span className={styles.gdsCaption}> · {v.eventsCount} events</span>
                    )}
                  </span>
                  <span className={`${styles.gdsCaption} ${styles.gdsNum}`}>
                    {v.totalAttendance.toLocaleString()} / {cumulativeCap.toLocaleString()} ({fillRate}%)
                  </span>
                </div>
                <div className={styles.bentoBarTrackWrap}>
                  <svg viewBox="0 0 100 8" preserveAspectRatio="none" className={styles.bentoBarSvg} aria-hidden="true">
                    <rect x="0" y="0" width={Math.max(2, Math.min(100, fillRate))} height="8" rx="0" className={styles.bentoBarFillRect} />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
