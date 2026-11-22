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
    <div className={styles.executiveCard} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div className={styles.cardSubtitle}>Stadium Footprint & Attendance Utilization</div>
          <h3 className={styles.cardTitle}>Venue Capacity vs. Gate Turnout</h3>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Avg Fill Rate</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--report-primary, #059669)', fontVariantNumeric: 'tabular-nums' }}>{avgFill}%</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Total Footprint</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{totalCap.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Venues Bar Leaderboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {venueLeaderboard.map((v) => {
          const cumulativeCap = v.cumulativeCapacity;
          const fillRate = cumulativeCap > 0 ? Math.round((v.totalAttendance / cumulativeCap) * 1000) / 10 : 0;
          return (
            <div
              key={v.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#f9fafb',
                border: '1px solid #f3f4f6',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{v.isIndoor ? '🏟️' : '⚽'}</span>
                  <span style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>{v.name}</span>
                  {v.isIndoor && (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        fontWeight: 600,
                      }}
                    >
                      Indoor Arena
                    </span>
                  )}
                  {v.eventsCount > 1 && (
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      ({v.eventsCount} events • {cumulativeCap.toLocaleString()} total cap)
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {v.sampleWeather && (
                    <span
                      title={`Kickoff Weather: ${v.sampleWeather.tempC}°C, ${v.sampleWeather.condition}`}
                      style={{
                        fontSize: '12px',
                        color: '#4b5563',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#ffffff',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      {v.isIndoor ? `Outside: ${v.sampleWeather.tempC}°C · Indoor 🏟️` : `${v.sampleWeather.tempC}°C ${v.sampleWeather.condition}`}
                    </span>
                  )}
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--report-primary, #1d4ed8)' }}>
                    {v.totalAttendance.toLocaleString()} fans ({fillRate}% fill)
                  </span>
                </div>
              </div>

              {/* Capacity Fill Progress Bar */}
              <div
                style={{
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: '#e5e7eb',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, fillRate)}%`,
                    backgroundColor: fillRate > 75 ? 'var(--report-primary, #1d4ed8)' : fillRate > 40 ? 'var(--report-accent, #3b82f6)' : '#f59e0b',
                    borderRadius: '4px',
                    transition: 'width 0.4s ease',
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
