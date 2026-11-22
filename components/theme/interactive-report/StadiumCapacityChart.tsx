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
    <div className={`${styles.executiveCard} ${styles.gdsStack}`}>
      <div className={styles.gdsRowBetween}>
        <div>
          <div className={styles.gdsEyebrow}>Stadium Footprint & Attendance Utilization</div>
          <h3 className={styles.gdsCardTitle}>Venue Capacity vs. Gate Turnout</h3>
        </div>
        <div className={styles.gdsRow}>
          <div className={styles.gdsRight}>
            <div className={styles.gdsEyebrow}>Avg Fill Rate</div>
            <div className={`${styles.gdsSectionKpi} ${styles.gdsPrimaryText}`}>{avgFill}%</div>
          </div>
          <div className={styles.gdsRight}>
            <div className={styles.gdsEyebrow}>Total Footprint</div>
            <div className={styles.gdsSectionKpi}>{totalCap.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Venues Bar Leaderboard */}
      <div className={styles.gdsStackSm}>
        {venueLeaderboard.map((v) => {
          const cumulativeCap = v.cumulativeCapacity;
          const fillRate = cumulativeCap > 0 ? Math.round((v.totalAttendance / cumulativeCap) * 1000) / 10 : 0;
          return (
            <div key={v.name} className={styles.gdsSubCard}>
              <div className={styles.gdsRowBetween}>
                <div className={styles.gdsRow}>
                  <span>{v.isIndoor ? '🏟️' : '⚽'}</span>
                  <span className={styles.gdsBody}>{v.name}</span>
                  {v.isIndoor && (
                    <span className={`${styles.gdsPill} ${styles.gdsPillAccent}`}>Indoor Arena</span>
                  )}
                  {v.eventsCount > 1 && (
                    <span className={styles.gdsCaption}>
                      ({v.eventsCount} events • {cumulativeCap.toLocaleString()} total cap)
                    </span>
                  )}
                </div>

                <div className={styles.gdsRow}>
                  {v.sampleWeather && (
                    <span
                      title={`Kickoff Weather: ${v.sampleWeather.tempC}°C, ${v.sampleWeather.condition}`}
                      className={styles.gdsPill}
                    >
                      {v.isIndoor ? `Outside: ${v.sampleWeather.tempC}°C · Indoor 🏟️` : `${v.sampleWeather.tempC}°C ${v.sampleWeather.condition}`}
                    </span>
                  )}
                  <span className={`${styles.gdsBody} ${styles.gdsNum} ${styles.gdsPrimaryText}`}>
                    {v.totalAttendance.toLocaleString()} fans ({fillRate}% fill)
                  </span>
                </div>
              </div>

              <div className={styles.suiteTrack}>
                <div
                  className={styles.suiteTrackFill}
                  style={{ width: `${Math.min(100, fillRate)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
