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
  const venueLeaderboard = React.useMemo(() => {
    const map = new Map<string, {
      name: string;
      capacity: number;
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
        existing.totalAttendance += m.attendance || 0;
        existing.totalPhotos += m.submitted || 0;
        existing.eventsCount += 1;
        if (!existing.sampleWeather && m.weather) existing.sampleWeather = m.weather;
      } else {
        map.set(vName, {
          name: vName,
          capacity: m.venueCapacity,
          isIndoor: Boolean(m.weather?.isIndoor),
          totalAttendance: m.attendance || 0,
          totalPhotos: m.submitted || 0,
          eventsCount: 1,
          sampleWeather: m.weather,
        });
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.capacity - a.capacity)
      .slice(0, 8); // Top 8 venues
  }, [matches]);

  if (venueLeaderboard.length === 0) return null;

  const totalCap = analytics?.totalVenueCapacity || venueLeaderboard.reduce((a, b) => a + b.capacity * b.eventsCount, 0);
  const totalAtt = analytics?.totalGateAttendance || venueLeaderboard.reduce((a, b) => a + b.totalAttendance, 0);
  const avgFill = analytics?.avgCapacityUtilization || (totalCap > 0 ? Math.round((totalAtt / totalCap) * 1000) / 10 : 0);

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
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>{avgFill}%</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Total Footprint</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>{totalCap.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Venues Bar Leaderboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {venueLeaderboard.map((v) => {
          const cumulativeCap = v.capacity * v.eventsCount;
          const fillRate = cumulativeCap > 0 ? Math.min(100, Math.round((v.totalAttendance / cumulativeCap) * 1000) / 10) : 0;
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
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#059669' }}>
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
                    width: `${fillRate}%`,
                    backgroundColor: fillRate > 75 ? '#059669' : fillRate > 40 ? '#2563eb' : '#f59e0b',
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
